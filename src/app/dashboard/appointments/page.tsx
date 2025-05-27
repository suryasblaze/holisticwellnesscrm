'use client';

import { useState, useEffect, Fragment } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDateTime, formatPhone } from '@/lib/utils';
import toast from 'react-hot-toast';
import { MessagingService } from '@/lib/messaging';
import {
  FiCalendar, FiFilter, FiEdit, FiMessageSquare, FiTrash2, FiPlusCircle, FiLoader, FiSearch, FiClock, FiUserCheck, FiAlertCircle, FiCheckCircle, FiDollarSign, FiX
} from 'react-icons/fi';
import { Dialog, Transition } from '@headlessui/react';
import AppointmentsList from '@/components/appointments/AppointmentsList';

// Assuming a similar structure to Leads, but with Appointment specific fields
interface Appointment {
  id: string;
  created_at: string;
  lead_id: string; // Link to Lead
  lead_name?: string; // Denormalized for display
  lead_phone?: string; // Denormalized for display
  service_type_id: string; // Link to ServiceType
  service_name?: string; // Denormalized for display
  healer_id?: string; // Link to User (healer)
  healer_name?: string; // Denormalized for display
  date: string; // Date of appointment
  time: string; // Time of appointment
  scheduled_for?: string; // Combined datetime for sorting/filtering
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  payment_status: 'pending' | 'partial' | 'completed';
  amount_paid?: number;
  notes?: string;
  source?: 'whatsapp' | 'website' | 'crm'; // Added 'crm'
}

const appointmentStatusOptions = [
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  { value: 'no_show', label: 'No Show', color: 'bg-yellow-100 text-yellow-700' },
];

const paymentStatusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'partial', label: 'Partial', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
];

const getStatusPillStyle = (status: string, type: 'appointment' | 'payment') => {
  const options = type === 'appointment' ? appointmentStatusOptions : paymentStatusOptions;
  return options.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-700';
};

interface LeadForSelect {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface ServiceTypeForSelect {
  id: string;
  name: string;
  duration?: number;
}

interface HealerForSelect {
  id: string;
  full_name: string;
}

export default function AppointmentsPage() {
  const supabase = createClientComponentClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [messaging] = useState(MessagingService.getInstance());
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    service_type_id: '',
    healer_id: '',
    dateRange: '30', // Default to next 30 days for active appointments, or past 30 for history
    searchTerm: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [currentAppointmentForModal, setCurrentAppointmentForModal] = useState<Partial<Appointment>>({
    date: new Date().toISOString().split('T')[0], // Default to today
    time: '09:00', // Default time
    status: 'scheduled',
    payment_status: 'pending',
    source: 'crm' // Default source for new appointments
  });
  const [isEditMode, setIsEditMode] = useState(false); // Add state for edit mode
  const [availableLeads, setAvailableLeads] = useState<LeadForSelect[]>([]);
  const [availableServices, setAvailableServices] = useState<ServiceTypeForSelect[]>([]);
  const [availableHealers, setAvailableHealers] = useState<HealerForSelect[]>([]);

  useEffect(() => {
    fetchAppointments(); // Call fetchAppointments on initial mount
    fetchDropdownData(); // Fetch data for form dropdowns on component mount
  }, []); // Empty dependency array ensures this runs once on mount

  const fetchDropdownData = async () => {
    try {
      const [leadsRes, servicesRes, healersRes] = await Promise.all([
        supabase.from('leads').select('id, name, phone, email').order('name'),
        supabase.from('service_types').select('id, name, duration').order('name'),
        supabase.from('users').select('id, full_name').eq('role', 'healer').order('full_name') // Assuming healers have a 'healer' role
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (healersRes.error) throw healersRes.error;

      setAvailableLeads(leadsRes.data || []);
      setAvailableServices(servicesRes.data || []);
      setAvailableHealers(healersRes.data || []);

    } catch (error: any) {
      toast.error('Failed to load data for forms: ' + error.message);
      console.error("Error fetching dropdown data:", error)
    }
  }

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('appointments') 
        .select(`
          id, created_at, lead_id, service_type_id, healer_id, date, time, status, payment_status, notes, amount_paid, booking_source,
          leads ( name, phone ),
          service_types ( name ),
          users ( full_name ) 
        `)
        .order('date', { ascending: true }) 
        .order('time', { ascending: true });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.payment_status) query = query.eq('payment_status', filters.payment_status);
      // Add more filters for service_type_id, healer_id, searchTerm, dateRange
      // Example for dateRange (next 30 days):
      // const today = new Date();
      // const futureDate = new Date();
      // futureDate.setDate(today.getDate() + parseInt(filters.dateRange));
      // query = query.gte('date', today.toISOString().split('T')[0]);
      // query = query.lte('date', futureDate.toISOString().split('T')[0]);
      
      if (filters.searchTerm) {
        // This would ideally search across joined fields (lead name, service name, healer name)
        // Requires more complex query or view. For now, search on notes or a primary field if available.
        // query = query.or(`leads.name.ilike.%${filters.searchTerm}%,notes.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedAppointments = data?.map(app => ({
        ...app,
        source: app.booking_source, // Map booking_source from DB to source for frontend
        lead_name: app.leads?.[0]?.name,
        lead_phone: app.leads?.[0]?.phone,
        service_name: app.service_types?.[0]?.name,
        healer_name: app.users?.[0]?.full_name, 
        scheduled_for: `${app.date}T${app.time}`
      })) || [];
      
      setAppointments(formattedAppointments as Appointment[]);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast.error(`Failed to fetch appointments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Reusable FilterInput component (can be moved to a shared file)
  const FilterInput: React.FC<any> = ({ name, value, onChange, children, label }) => (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-orbitly-dark-sage">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {children}
      </select>
    </div>
  );
  
  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setCurrentAppointmentForModal(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOpenAppointmentModal = (appointmentToEdit?: Appointment) => {
    if (appointmentToEdit) {
      setCurrentAppointmentForModal({
        ...appointmentToEdit,
        // Ensure date is in 'YYYY-MM-DD' format if it's coming from DB as full timestamp
        date: appointmentToEdit.date ? new Date(appointmentToEdit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
      setIsEditMode(true);
    } else {
      setCurrentAppointmentForModal({ // Defaults for new appointment
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        status: 'scheduled',
        payment_status: 'pending',
        source: 'crm',
        lead_id: '', // Reset other fields for new appointment
        service_type_id: '',
        healer_id: '',
        notes: '',
        amount_paid: undefined
      });
      setIsEditMode(false);
    }
    setIsAppointmentModalOpen(true);
  };

  const handleCloseAppointmentModal = () => {
    setIsAppointmentModalOpen(false);
    // Optionally reset currentAppointmentForModal and isEditMode here if desired
    // For now, it will retain the last state until next open
  };

  const handleSaveAppointment = async () => {
    if (!currentAppointmentForModal.lead_id || !currentAppointmentForModal.service_type_id || !currentAppointmentForModal.date || !currentAppointmentForModal.time) {
      toast.error('Client, Service, Date, and Time are required.');
      return;
    }
    
    setIsUpdating(true);
    const toastId = toast.loading(isEditMode ? 'Updating appointment...' : 'Scheduling appointment...');
    
    try {
      const scheduled_for_timestamp = `${currentAppointmentForModal.date}T${currentAppointmentForModal.time}:00`;
      const selectedService = availableServices.find(service => service.id === currentAppointmentForModal.service_type_id);
      const appointmentDuration = selectedService?.duration;

      if (appointmentDuration === undefined || appointmentDuration === null) {
        throw new Error('Could not determine appointment duration from selected service.');
      }

      const appointmentData: Omit<Partial<Appointment>, 'id' | 'created_at' | 'lead_name' | 'lead_phone' | 'service_name' | 'healer_name' | 'scheduled_for'> & { booking_source?: string, scheduled_for: string, duration: number } = {
        lead_id: currentAppointmentForModal.lead_id,
        service_type_id: currentAppointmentForModal.service_type_id,
        healer_id: currentAppointmentForModal.healer_id || undefined,
        date: currentAppointmentForModal.date,
        time: currentAppointmentForModal.time,
        scheduled_for: scheduled_for_timestamp,
        duration: appointmentDuration,
        status: currentAppointmentForModal.status || 'scheduled',
        payment_status: currentAppointmentForModal.payment_status || 'pending',
        notes: currentAppointmentForModal.notes || undefined,
        amount_paid: currentAppointmentForModal.amount_paid || undefined,
        booking_source: currentAppointmentForModal.source || 'crm', // Ensure booking_source is set
      };

      let error;
      if (isEditMode && currentAppointmentForModal.id) {
        // Update logic
        const { error: updateError } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', currentAppointmentForModal.id);
        error = updateError;
      } else {
        // Insert logic
        const { error: insertError } = await supabase
          .from('appointments')
          .insert([appointmentData]); // Supabase expects an array for insert
        error = insertError;
      }

      if (error) throw error;
      
      toast.success(isEditMode ? 'Appointment updated successfully!' : 'Appointment scheduled successfully!', { id: toastId });
      handleCloseAppointmentModal();
      fetchAppointments(); 
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      toast.error(`Failed to save: ${error.message}`, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendAppointmentReminder = async (appointment: Appointment) => {
    if (!appointment.lead_phone || !appointment.lead_name || !appointment.service_name || !appointment.scheduled_for) {
      toast.error('Missing information to send reminder.');
      return;
    }
    setIsUpdating(true);
    const toastId = toast.loading('Sending appointment reminder...');
    try {
      await messaging.sendFollowUpReminder(
        appointment.lead_phone,
        appointment.lead_name,
        formatDateTime(appointment.scheduled_for), // Ensure date is formatted
        appointment.service_name
      );
      // Optionally, update last_contacted or add a note to the appointment
      // Example: await supabase.from('appointments').update({ last_reminder_sent_at: new Date().toISOString() }).eq('id', appointment.id);
      toast.success('Appointment reminder sent!', { id: toastId });
    } catch (error: any) {
      console.error('Error sending appointment reminder:', error);
      toast.error(`Failed to send reminder: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <DashboardLayout title="Manage Appointments">
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
          <div className="text-center">
            <FiCalendar className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary-500" />
            <p className="text-lg text-orbitly-dark-sage">Loading appointments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manage Appointments">
      <div className="space-y-6">
        {/* Header and Actions */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-white p-6 shadow-lg sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-orbitly-charcoal">Appointments Schedule</h2>
            <p className="mt-1 text-sm text-orbitly-dark-sage">View, schedule, and manage client appointments.</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border border-orbitly-soft-gray bg-white px-4 py-2 text-sm font-medium text-orbitly-charcoal shadow-sm hover:bg-orbitly-light-green focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              <FiFilter className="h-4 w-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button 
              onClick={() => handleOpenAppointmentModal()}
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              <FiPlusCircle className="h-4 w-4" />
              New Appointment
            </button>
          </div>
        </div>

        {/* Filters Section - Collapsible */}
        <Transition
          show={showFilters}
          // ... (Transition props same as LeadsPage)
        >
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* TODO: Add Appointment specific filters: Service, Healer, Date Range Picker, Status, Payment Status */}
              <div className="sm:col-span-2 lg:col-span-1">
                 <label htmlFor="searchTerm" className="block text-xs font-medium text-orbitly-dark-sage">Search</label>
                 <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><FiSearch className="h-4 w-4 text-orbitly-soft-gray" /></div>
                    <input type="text" name="searchTerm" id="searchTerm" value={filters.searchTerm} onChange={handleFilterChange} placeholder="Client, service, healer..." className="block w-full rounded-lg border-orbitly-soft-gray bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                 </div>
              </div>
              <FilterInput name="status" value={filters.status} onChange={handleFilterChange} label="Appt. Status">
                <option value="">All Statuses</option>
                {appointmentStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </FilterInput>
              <FilterInput name="payment_status" value={filters.payment_status} onChange={handleFilterChange} label="Payment Status">
                <option value="">All Payments</option>
                {paymentStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </FilterInput>
              {/* Add Date Range Picker Component here */}
            </div>
          </div>
        </Transition>

        {/* Appointments Table */}
        <div className="overflow-x-auto rounded-xl bg-white shadow-lg">
          {loading && <div className="p-4 text-center text-sm text-orbitly-dark-sage"><FiLoader className="inline-block animate-spin mr-2" /> Fetching appointments...</div>}
          {!loading && appointments.length === 0 && (
            <div className="p-12 text-center">
              <FiCalendar className="mx-auto h-16 w-16 text-orbitly-soft-gray" />
              <h3 className="mt-4 text-lg font-medium text-orbitly-charcoal">No Appointments Found</h3>
              <p className="mt-1 text-sm text-orbitly-dark-sage">Adjust filters or schedule new appointments.</p>
            </div>
          )}
          {appointments.length > 0 && (
            <AppointmentsList 
              appointments={appointments} 
              onEditAppointment={handleOpenAppointmentModal}
            />
          )}
        </div>
      </div>

      {/* New/Edit Appointment Modal */}
      <Transition appear show={isAppointmentModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseAppointmentModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-orbitly-charcoal flex justify-between items-center">
                    {isEditMode ? 'Edit Appointment' : 'Schedule New Appointment'}
                    <button onClick={handleCloseAppointmentModal} className="text-orbitly-soft-gray hover:text-orbitly-charcoal">
                       <FiX size={20}/>
                    </button>
                  </Dialog.Title>
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveAppointment(); }} className="mt-4 space-y-4">
                    {/* Lead Selector */}
                    <div>
                      <label htmlFor="lead_id" className="block text-sm font-medium text-orbitly-dark-sage">Client/Lead</label>
                      <select id="lead_id" name="lead_id" value={currentAppointmentForModal.lead_id || ''} onChange={handleModalInputChange} required
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="" disabled>Select a client</option>
                        {availableLeads.map(lead => <option key={lead.id} value={lead.id}>{lead.name} ({lead.phone})</option>)}
                      </select>
                    </div>
                    {/* Service Selector */}
                    <div>
                      <label htmlFor="service_type_id" className="block text-sm font-medium text-orbitly-dark-sage">Service</label>
                      <select id="service_type_id" name="service_type_id" value={currentAppointmentForModal.service_type_id || ''} onChange={handleModalInputChange} required
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="" disabled>Select a service</option>
                        {availableServices.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}
                      </select>
                    </div>
                    {/* Healer Selector (Optional) */}
                    <div>
                      <label htmlFor="healer_id" className="block text-sm font-medium text-orbitly-dark-sage">Healer (Optional)</label>
                      <select id="healer_id" name="healer_id" value={currentAppointmentForModal.healer_id || ''} onChange={handleModalInputChange}
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="">Assign later or no specific healer</option>
                        {availableHealers.map(healer => <option key={healer.id} value={healer.id}>{healer.full_name}</option>)}
                      </select>
                    </div>
                     {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label htmlFor="date" className="block text-sm font-medium text-orbitly-dark-sage">Date</label>
                           <input type="date" id="date" name="date" value={currentAppointmentForModal.date || ''} onChange={handleModalInputChange} required
                               className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                       </div>
                       <div>
                           <label htmlFor="time" className="block text-sm font-medium text-orbitly-dark-sage">Time</label>
                           <input type="time" id="time" name="time" value={currentAppointmentForModal.time || ''} onChange={handleModalInputChange} required
                               className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                       </div>
                    </div>
                     {/* Status & Payment Status (Defaults set, can be overridden) */}
                     {/* Notes */}
                    <div>
                       <label htmlFor="notes" className="block text-sm font-medium text-orbitly-dark-sage">Notes (Optional)</label>
                       <textarea id="notes" name="notes" value={currentAppointmentForModal.notes || ''} onChange={handleModalInputChange} rows={3}
                           className="mt-1 block w-full rounded-lg border-orbitly-soft-gray p-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" 
                           placeholder="Any specific details for the appointment..."></textarea>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button type="button" onClick={handleCloseAppointmentModal} disabled={isUpdating}
                        className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm font-medium text-orbitly-dark-sage hover:bg-orbitly-light-green focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">
                        Cancel
                      </button>
                      <button type="submit" disabled={isUpdating}
                        className="flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-70">
                        {isUpdating && <FiLoader className="animate-spin mr-2" />} 
                        {isEditMode ? 'Save Changes' : 'Schedule Appointment'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </DashboardLayout>
  );
} 
'use client';

import { useState, useEffect, Fragment } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { MessagingService } from '@/lib/messaging';
import { formatDateTime, formatPhone } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  FiUsers, FiFilter, FiEdit, FiMessageSquare, FiTrash2, FiChevronDown, FiPlusCircle, FiLoader, FiSearch,
  FiCalendar, FiInfo, FiAlertTriangle, FiCheckCircle, FiMail
} from 'react-icons/fi';
import { Dialog, Transition } from '@headlessui/react';
import AddLeadModal from '@/components/AddLeadModal';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  service_type: string;
  source_site: string;
  status: string;
  created_at: string;
  last_contact: string | null;
  next_followup: string | null;
  notes: string | null;
}

const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-700' },
  { value: 'follow_up', label: 'Follow-up', color: 'bg-pink-100 text-pink-700' }, 
  { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-700' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
];

const getStatusColor = (status: string) => {
  return statusOptions.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-700';
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    source_site: '',
    service_type: '',
    dateRange: '30', // Default to last 30 days
    searchTerm: '',
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [leadToUpdateNotes, setLeadToUpdateNotes] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);


  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.source_site) query = query.eq('source_site', filters.source_site);
      if (filters.service_type) query = query.eq('service_type', filters.service_type);
      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%`);
      }

      if (filters.dateRange) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(filters.dateRange));
        query = query.gte('created_at', daysAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setIsUpdating(true);
    const originalStatus = leads.find(lead => lead.id === leadId)?.status;
    // Optimistically update UI
    setLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? { ...lead, status: newStatus } : lead));

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) {
        // Revert optimistic update
        setLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? { ...lead, status: originalStatus || lead.status } : lead));
        throw error;
      }
      toast.success('Lead status updated!');
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendWhatsApp = async (lead: Lead) => {
    setIsUpdating(true);
    const toastId = toast.loading('Sending WhatsApp message...');
    try {
      const messaging = MessagingService.getInstance();
      // This is a placeholder, actual welcome message and PDF sending logic might be different
      await messaging.sendFollowUpReminder(lead.phone, lead.name, formatDateTime(new Date()), lead.service_type );
      // await messaging.sendWelcomePDF(lead.phone); // Assuming this is part of the flow

      const { error } = await supabase
        .from('leads')
        .update({ last_contact: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('WhatsApp message sent!', { id: toastId });
      fetchLeads(); // Refresh leads to show updated last_contact
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      toast.error(`Failed to send message: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const openNotesModal = (lead: Lead) => {
    setLeadToUpdateNotes(lead);
    setCurrentNotes(lead.notes || '');
    setIsNotesModalOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!leadToUpdateNotes) return;
    setIsUpdating(true);
    const toastId = toast.loading('Saving notes...');
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: currentNotes, updated_at: new Date().toISOString() })
        .eq('id', leadToUpdateNotes.id);

      if (error) throw error;

      setLeads(prevLeads =>
        prevLeads.map(l => l.id === leadToUpdateNotes.id ? { ...l, notes: currentNotes } : l)
      );
      toast.success('Notes updated!', { id: toastId });
      setIsNotesModalOpen(false);
      setLeadToUpdateNotes(null);
    } catch (error: any) {
      console.error('Error updating notes:', error);
      toast.error(`Failed to update notes: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
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

  if (loading && leads.length === 0) { // Show detailed loader only on initial load
    return (
      <DashboardLayout title="Manage Leads">
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
          <div className="text-center">
            <FiUsers className="mx-auto mb-4 h-12 w-12 animate-pulse text-primary-500" />
            <p className="text-lg text-orbitly-dark-sage">Loading your leads...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manage Leads">
      <div className="space-y-6">
        {/* Header and Actions */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-white p-6 shadow-lg sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-orbitly-charcoal">Leads Center</h2>
            <p className="mt-1 text-sm text-orbitly-dark-sage">View, manage, and engage with your potential clients.</p>
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
              onClick={() => setIsAddLeadModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">
              <FiPlusCircle className="h-4 w-4" />
              Add New Lead
            </button>
          </div>
        </div>

        {/* Filters Section - Collapsible */}
        <Transition
          show={showFilters}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 -translate-y-4"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 -translate-y-4"
        >
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="searchTerm" className="block text-xs font-medium text-orbitly-dark-sage">
                  Search Lead
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FiSearch className="h-4 w-4 text-orbitly-soft-gray" />
                  </div>
                  <input 
                    type="text" 
                    name="searchTerm" 
                    id="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleFilterChange}
                    placeholder="Name, email, or phone..."
                    className="block w-full rounded-lg border-orbitly-soft-gray bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <FilterInput name="status" value={filters.status} onChange={handleFilterChange} label="Status">
                <option value="">All Statuses</option>
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </FilterInput>
              <FilterInput name="source_site" value={filters.source_site} onChange={handleFilterChange} label="Source Site">
                <option value="">All Sources</option>
                <option value="website">Website</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="referral">Referral</option>
                {/* Add more sources dynamically if needed */}
              </FilterInput>
              <FilterInput name="service_type" value={filters.service_type} onChange={handleFilterChange} label="Service Type">
                <option value="">All Services</option>
                <option value="consultation">Consultation</option>
                <option value="healing">Healing Session</option>
                <option value="workshop">Workshop</option>
                <option value="course">Course Enrollment</option>
              </FilterInput>
               <FilterInput name="dateRange" value={filters.dateRange} onChange={handleFilterChange} label="Date Range">
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
                <option value="">All Time</option>
              </FilterInput>
            </div>
          </div>
        </Transition>

        {/* Leads Table / Cards */}
        <div className="overflow-x-auto rounded-xl bg-white shadow-lg">
          {loading && <div className="p-4 text-center text-sm text-orbitly-dark-sage"><FiLoader className="inline-block animate-spin mr-2" /> Fetching updated leads...</div>}
          {!loading && leads.length === 0 && (
            <div className="p-12 text-center">
              <FiUsers className="mx-auto h-16 w-16 text-orbitly-soft-gray" />
              <h3 className="mt-4 text-lg font-medium text-orbitly-charcoal">No Leads Found</h3>
              <p className="mt-1 text-sm text-orbitly-dark-sage">
                Adjust your filters or add new leads to see them here.
              </p>
            </div>
          )}
          {leads.length > 0 && (
            <table className="min-w-full divide-y divide-orbitly-light-green">
              <thead className="bg-orbitly-light-green">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-orbitly-dark-sage">Client</th>
                  <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-orbitly-dark-sage">Service & Source</th>
                  <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-orbitly-dark-sage">Status</th>
                  <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-orbitly-dark-sage">Last Contact</th>
                  <th scope="col" className="relative px-6 py-3.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orbitly-light-green bg-white">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-orbitly-light-green/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-medium text-orbitly-charcoal">{lead.name}</div>
                      <div className="text-xs text-orbitly-dark-sage">{lead.email}</div>
                      <div className="text-xs text-orbitly-dark-sage">{formatPhone(lead.phone)}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-orbitly-dark-sage">
                      <div>{lead.service_type}</div>
                      <div className="italic">via {lead.source_site}</div>
                      <div className="mt-1 text-xxs text-orbitly-soft-gray">Registered: {formatDateTime(lead.created_at)}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        disabled={isUpdating}
                        className={`rounded-md border-none py-1 pl-2 pr-7 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${getStatusColor(lead.status)}`}
                      >
                        {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-orbitly-dark-sage">
                      {lead.last_contact ? formatDateTime(lead.last_contact) : 'Never'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleSendWhatsApp(lead)} 
                          disabled={isUpdating}
                          title="Send WhatsApp Message"
                          className="rounded-md p-1.5 text-green-600 hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
                        >
                          <FiMessageSquare className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => openNotesModal(lead)} 
                          title="View/Edit Notes"
                          className="rounded-md p-1.5 text-blue-600 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                         {/* Placeholder for more actions */}
                         {/* <button title="Schedule Follow-up" className="rounded-md p-1.5 text-purple-600 hover:bg-purple-100 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"><FiCalendar className="h-4 w-4" /></button> */}
                         {/* <button title="Delete Lead" className="rounded-md p-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"><FiTrash2 className="h-4 w-4" /></button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      <Transition appear show={isNotesModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsNotesModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-orbitly-charcoal">
                    Notes for {leadToUpdateNotes?.name}
                  </Dialog.Title>
                  <div className="mt-4">
                    <textarea
                      rows={6}
                      value={currentNotes}
                      onChange={(e) => setCurrentNotes(e.target.value)}
                      placeholder="Add your notes here..."
                      className="w-full rounded-lg border-orbitly-soft-gray p-3 text-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      disabled={isUpdating}
                      className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm font-medium text-orbitly-dark-sage hover:bg-orbitly-light-green focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                      onClick={() => setIsNotesModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={isUpdating}
                      className="flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                    >
                      {isUpdating && <FiLoader className="animate-spin mr-2" />} 
                      Save Notes
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add Lead Modal */}
      <AddLeadModal 
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onLeadAdded={() => {
          fetchLeads(); // Refresh the list of leads
          // Optionally, you might want to reset filters or go to the first page if paginating
        }}
      />
    </DashboardLayout>
  );
} 
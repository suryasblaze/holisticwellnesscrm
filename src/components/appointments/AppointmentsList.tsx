import { useState } from 'react';
import { FunnelIcon, PlusIcon, ChatBubbleLeftIcon, GlobeAltIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { Appointment } from '@/types/Appointment';

interface AppointmentsListProps {
  appointments: Appointment[];
  onEditAppointment: (appointment: Appointment) => void;
}

const statusColors = {
  scheduled: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function AppointmentsList({ appointments, onEditAppointment }: AppointmentsListProps) {
  const whatsappAppointments = appointments.filter(a => a.source === 'whatsapp');
  const websiteAppointments = appointments.filter(a => a.source === 'website');
  const crmAppointments = appointments.filter(a => a.source === 'crm');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Appointments Section */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-white/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">WhatsApp Appointments</h2>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {whatsappAppointments.length} Total
              </span>
            </div>
          </div>
          
          <div className="overflow-auto max-h-[600px]">
            {whatsappAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No WhatsApp appointments found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {whatsappAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-4 hover:bg-green-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{appointment.lead_name || 'N/A'}</h3>
                        <p className="text-sm text-gray-500">{appointment.service_name || 'N/A'}</p>
                        <p className="text-xs text-gray-400 mt-1">{appointment.lead_phone || 'No phone'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status] || 'bg-gray-100 text-gray-800'}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <div className="flex-1">
                        {formatDate(appointment.date)} at {appointment.time}
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-green-600 hover:text-green-800">Message</button>
                        <button 
                          onClick={() => onEditAppointment(appointment)} 
                          className="text-gray-600 hover:text-gray-800"
                        >Edit</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Website Appointments Section */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-white/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Website Appointments</h2>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {websiteAppointments.length} Total
              </span>
            </div>
          </div>
          
          <div className="overflow-auto max-h-[600px]">
            {websiteAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No website appointments found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {websiteAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-4 hover:bg-blue-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{appointment.lead_name || 'N/A'}</h3>
                        <p className="text-sm text-gray-500">{appointment.service_name || 'N/A'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status] || 'bg-gray-100 text-gray-800'}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <div className="flex-1">
                        {formatDate(appointment.date)} at {appointment.time}
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">View</button>
                        <button 
                          onClick={() => onEditAppointment(appointment)} 
                          className="text-gray-600 hover:text-gray-800"
                        >Edit</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CRM Appointments Section */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-white/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BriefcaseIcon className="h-5 w-5 text-purple-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">CRM Appointments</h2>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {crmAppointments.length} Total
              </span>
            </div>
          </div>
          
          <div className="overflow-auto max-h-[600px]">
            {crmAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No CRM appointments found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {crmAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-4 hover:bg-purple-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{appointment.lead_name || 'N/A'}</h3>
                        <p className="text-sm text-gray-500">{appointment.service_name || 'N/A'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status] || 'bg-gray-100 text-gray-800'}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <div className="flex-1">
                        {formatDate(appointment.date)} at {appointment.time}
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-purple-600 hover:text-purple-800">View</button>
                        <button 
                          onClick={() => onEditAppointment(appointment)} 
                          className="text-gray-600 hover:text-gray-800"
                        >Edit</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
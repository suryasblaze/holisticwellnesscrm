import { useState } from 'react';
import { FunnelIcon, PlusIcon, ChatBubbleLeftIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface Appointment {
  id: string;
  clientName: string;
  date: Date;
  time: string;
  service: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  source: 'whatsapp' | 'website';
  healer?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  notes?: string;
}

interface AppointmentsListProps {
  appointments: Appointment[];
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function AppointmentsList({ appointments }: AppointmentsListProps) {
  const whatsappAppointments = appointments.filter(a => a.source === 'whatsapp');
  const websiteAppointments = appointments.filter(a => a.source === 'website');

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Appointments Schedule</h1>
          {/* <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center">
            <PlusIcon className="w-4 h-4 mr-2" />
            New Appointment
          </button> */}
        </div>
        <p className="text-sm text-gray-600">View, schedule, and manage client appointments.</p>
      </div>

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
                        <h3 className="font-medium text-gray-900">{appointment.clientName}</h3>
                        <p className="text-sm text-gray-500">{appointment.service}</p>
                        <p className="text-xs text-gray-400 mt-1">+91 85264 54931</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <div className="flex-1">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-green-600 hover:text-green-800">Message</button>
                        <button className="text-gray-600 hover:text-gray-800">Edit</button>
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
                        <h3 className="font-medium text-gray-900">{appointment.clientName}</h3>
                        <p className="text-sm text-gray-500">{appointment.service}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <div className="flex-1">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">View</button>
                        <button className="text-gray-600 hover:text-gray-800">Edit</button>
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
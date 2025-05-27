import { CalendarIcon, ClockIcon, UserIcon, ChatIcon, GlobeIcon } from '@heroicons/react/outline';
import { format } from 'date-fns';

interface AppointmentCardProps {
  id: string;
  clientName: string;
  date: Date;
  time: string;
  service: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  source: 'whatsapp' | 'website';
  notes?: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AppointmentCard({
  id,
  clientName,
  date,
  time,
  service,
  status,
  source,
  notes,
}: AppointmentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <UserIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">{clientName}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {source === 'whatsapp' ? (
            <ChatIcon className="h-5 w-5 text-green-500" title="WhatsApp Appointment" />
          ) : (
            <GlobeIcon className="h-5 w-5 text-blue-500" title="Website Appointment" />
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-gray-600">
          <CalendarIcon className="h-5 w-5" />
          <span>{format(date, 'MMMM d, yyyy')}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <ClockIcon className="h-5 w-5" />
          <span>{time}</span>
        </div>
        
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-sm font-medium text-gray-700">Service:</p>
          <p className="text-gray-600">{service}</p>
        </div>
        
        {notes && (
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm font-medium text-gray-700">Notes:</p>
            <p className="text-gray-600 text-sm">{notes}</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-end space-x-2">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
          Edit
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
          Manage
        </button>
      </div>
    </div>
  );
} 
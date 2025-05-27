import DashboardLayout from '@/components/DashboardLayout';
import { FiTool } from 'react-icons/fi';

export default function HealthMonitoringPage() {
  return (
    <DashboardLayout title="Health Monitoring">
      <div className="flex flex-col items-center justify-center h-[60vh] bg-gray-50 rounded-xl shadow-lg p-10">
        <FiTool className="w-24 h-24 text-green-400 mb-6 animate-bounce" />
        <h2 className="text-3xl font-semibold text-gray-700 mb-3">
          Health Monitoring Section - Under Construction
        </h2>
        <p className="text-gray-500 text-lg text-center max-w-md mb-8">
          We&apos;re working on a modern health monitoring dashboard for you.<br />Please check back soon!
        </p>
        <div className="w-full max-w-sm bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2.5 rounded-full" 
            style={{ width: '20%' }}
          ></div>
        </div>
        <p className="text-sm text-gray-400 mt-3">Estimated Progress: 20%</p>
      </div>
    </DashboardLayout>
  );
} 
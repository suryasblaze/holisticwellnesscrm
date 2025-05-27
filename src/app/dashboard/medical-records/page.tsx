import DashboardLayout from '@/components/DashboardLayout';
import { FiTool } from 'react-icons/fi';

export default function MedicalRecordsPage() {
  return (
    <DashboardLayout title="Medical Records">
      <div className="flex flex-col items-center justify-center h-[60vh] bg-gray-50 rounded-xl shadow-lg p-10">
        <FiTool className="w-24 h-24 text-purple-400 mb-6 animate-bounce" />
        <h2 className="text-3xl font-semibold text-gray-700 mb-3">
          Medical Records Section - Under Construction
        </h2>
        <p className="text-gray-500 text-lg text-center max-w-md mb-8">
          We&apos;re working on a secure and comprehensive medical records management experience.<br />Please check back soon!
        </p>
        <div className="w-full max-w-sm bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" 
            style={{ width: '40%' }}
          ></div>
        </div>
        <p className="text-sm text-gray-400 mt-3">Estimated Progress: 40%</p>
      </div>
    </DashboardLayout>
  );
} 
import DashboardLayout from '@/components/DashboardLayout';
import { FiTool } from 'react-icons/fi';

export default function FeedbackPage() {
  return (
    <DashboardLayout title="Feedback">
      <div className="flex flex-col items-center justify-center h-[60vh] bg-gray-50 rounded-xl shadow-lg p-10">
        <FiTool className="w-24 h-24 text-yellow-400 mb-6 animate-bounce" />
        <h2 className="text-3xl font-semibold text-gray-700 mb-3">
          Feedback Section - Under Construction
        </h2>
        <p className="text-gray-500 text-lg text-center max-w-md mb-8">
          We&apos;re building a modern feedback and testimonials experience.<br />Please check back soon!
        </p>
        <div className="w-full max-w-sm bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2.5 rounded-full" 
            style={{ width: '30%' }}
          ></div>
        </div>
        <p className="text-sm text-gray-400 mt-3">Estimated Progress: 30%</p>
      </div>
    </DashboardLayout>
  );
} 
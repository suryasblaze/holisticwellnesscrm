import DashboardLayout from '@/components/DashboardLayout';
import { FiSettings, FiZap, FiSmile } from 'react-icons/fi';

export default function SettingsPage() {
  return (
    <DashboardLayout title="Settings">
      <div className="flex flex-col items-center justify-center h-[70vh] bg-gradient-to-br from-indigo-50 to-purple-100 rounded-3xl shadow-2xl p-12 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-tr from-purple-300 to-indigo-200 rounded-full blur-2xl opacity-40 animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-300 to-purple-200 rounded-full blur-2xl opacity-40 animate-pulse" />
        <div className="flex items-center gap-4 mb-6">
          <FiSettings className="w-20 h-20 text-indigo-500 animate-spin-slow" />
          <FiZap className="w-12 h-12 text-yellow-400 animate-bounce" />
          <FiSmile className="w-12 h-12 text-pink-400 animate-wiggle" />
        </div>
        <h2 className="text-4xl font-extrabold text-indigo-700 mb-4 drop-shadow-lg">Settings Coming Soon!</h2>
        <p className="text-lg text-indigo-500 text-center max-w-xl mb-8">
          We're crafting a powerful and delightful settings experience for you.<br />
          Personalize your wellness journey soon!
        </p>
        <div className="w-full max-w-xs bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full h-3 shadow-inner">
          <div className="bg-gradient-to-r from-yellow-300 to-pink-400 h-3 rounded-full animate-progress-bar" style={{ width: '15%' }}></div>
        </div>
        <p className="text-sm text-indigo-300 mt-4 italic">Estimated Progress: 15%</p>
      </div>
    </DashboardLayout>
  );
} 
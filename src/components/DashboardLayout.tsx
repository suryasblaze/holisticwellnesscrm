'use client';

import { useAuth } from '@/app/providers';
import Sidebar from './Sidebar';
import Header from './Header';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiLoader } from 'react-icons/fi';

// Color constants to match dashboard
const COLORS = {
  primary: '#663399', // Purple from logo
  secondary: '#DAA520', // Gold from logo
  background: '#F9FAFB',
  text: '#1F2937',
};

export default function DashboardLayout({
  children,
  title = "Dashboard"
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-emerald-50">
        <div className="text-center">
          <FiLoader className="mx-auto h-12 w-12 animate-spin text-purple-600" />
          <p className="mt-4 text-lg text-gray-600">Loading Your Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 to-emerald-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} pageTitle={title} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-purple-50 to-emerald-50 p-6 md:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
} 
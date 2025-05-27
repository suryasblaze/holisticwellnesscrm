'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FiGrid, FiUsers, FiClipboard, FiCalendar, FiShoppingCart, FiSettings, FiHelpCircle, FiLogOut, FiChevronLeft, FiChevronRight, FiFileText, FiMessageSquare, FiActivity } from 'react-icons/fi';
import { useAuth } from '@/app/providers';

// Color constants to match dashboard
const COLORS = {
  primary: '#663399', // Purple from logo
  secondary: '#DAA520', // Gold from logo
  success: '#34D399', // Bright green
  gradient: {
    from: '#34D399',
    to: '#059669',
  },
  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
  },
  background: {
    white: '#FFFFFF',
    light: '#F9FAFB',
  },
  border: '#E5E7EB',
};

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: FiGrid },
  { name: 'Leads', href: '/dashboard/leads', icon: FiUsers },
  { name: 'Appointments', href: '/dashboard/appointments', icon: FiCalendar },
  { name: 'Products', href: '/dashboard/products', icon: FiShoppingCart }, 
  { name: 'Orders', href: '/dashboard/orders', icon: FiShoppingCart },
  { name: 'Medical Records', href: '/dashboard/medical-records', icon: FiFileText },
  { name: 'Feedback', href: '/dashboard/feedback', icon: FiMessageSquare },
  { name: 'Health Monitoring', href: '/dashboard/health-monitoring', icon: FiActivity },
  { name: 'Tasks', href: '/dashboard/tasks', icon: FiClipboard },
  // Add more items for other modules here later
];

const secondaryNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: FiSettings },
  { name: 'Help & Support', href: '/dashboard/support', icon: FiHelpCircle },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <div className={`fixed inset-y-0 left-0 z-50 flex transform flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64`}>
      {/* Sidebar Header */}
      <div className="flex h-20 items-center justify-between border-b border-gray-200 px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image 
            src="https://i.postimg.cc/fL5MZ1Z1/Dhruva-holistic-wellness-logo-3-01.png" 
            alt="Wellness Platform Logo" 
            width={730} 
            height={200} 
            className="h-8 w-auto"
          />
          <div className="h-6 w-[1px] bg-gray-200"></div>
          <span className="text-lg font-medium text-gray-900">CRM</span>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="rounded-md p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 md:hidden">
          <FiChevronLeft size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-gray-500">MAIN MENU</p>
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-in-out
              ${pathname === item.href
                ? 'bg-gradient-to-r from-purple-50 to-emerald-50 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <item.icon 
              className={`mr-3 h-5 w-5 transition-colors
                ${pathname === item.href ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-600'}`} 
              aria-hidden="true" 
            />
            {item.name}
          </Link>
        ))}
        
        <p className="mb-3 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-gray-500">SUPPORT</p>
        {secondaryNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-in-out
              ${pathname === item.href
                ? 'bg-gradient-to-r from-purple-50 to-emerald-50 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <item.icon 
              className={`mr-3 h-5 w-5 transition-colors
                ${pathname === item.href ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-600'}`}
              aria-hidden="true" 
            />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Sidebar Footer / Logout */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={signOut}
          className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-150 ease-in-out hover:bg-red-50 hover:text-red-700"
        >
          <FiLogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-600" aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  );
} 
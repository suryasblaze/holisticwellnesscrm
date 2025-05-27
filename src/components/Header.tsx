'use client';

import { FiMenu, FiBell, FiUser, FiChevronDown, FiSearch } from 'react-icons/fi';
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useAuth } from '@/app/providers';
import Link from 'next/link';

// Color constants to match dashboard
const COLORS = {
  primary: '#663399', // Purple from logo
  secondary: '#DAA520', // Gold from logo
  success: '#34D399', // Bright green
  background: {
    white: '#FFFFFF',
    light: '#F9FAFB',
  },
  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
  },
  border: '#E5E7EB',
};

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  pageTitle: string;
}

export default function Header({ setSidebarOpen, pageTitle }: HeaderProps) {
  const { user, signOut } = useAuth();

  const userNavigation = [
    { name: 'Your Profile', href: '/dashboard/profile' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <header className="relative z-10 flex h-20 flex-shrink-0 items-center border-b border-gray-200 bg-white shadow-sm">
      {/* Hamburger Menu Button (Mobile) */}
      <button
        type="button"
        className="border-r border-gray-200 px-4 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <FiMenu className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
        </div>

        {/* Right Side: Search, Notifications, User Menu */}
        <div className="ml-4 flex items-center space-x-4 md:space-x-6">
          {/* Search */}
          <button
            type="button"
            className="rounded-full bg-white p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <span className="sr-only">Search</span>
            <FiSearch className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            className="rounded-full bg-white p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <span className="sr-only">View notifications</span>
            <FiBell className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Profile dropdown */}
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button className="flex max-w-xs items-center rounded-full bg-white text-sm hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center">
                    {user?.user_metadata?.avatar_url ? (
                      <img className="h-8 w-8 rounded-full" src={user.user_metadata.avatar_url} alt="User avatar" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                        <FiUser className="h-5 w-5 text-purple-600" />
                      </div>
                    )}
                    <span className="ml-2 hidden text-sm font-medium text-gray-700 md:block">
                      {user?.user_metadata?.full_name || user?.email}
                    </span>
                    <FiChevronDown className="ml-1 hidden h-5 w-5 text-gray-400 md:block" />
                  </div>
                </Popover.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Popover.Panel className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {userNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                      >
                        {item.name}
                      </Link>
                    ))}
                    <button
                      onClick={signOut}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
                    >
                      Sign out
                    </button>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
        </div>
      </div>
    </header>
  );
} 
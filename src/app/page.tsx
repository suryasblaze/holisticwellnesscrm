'use client';

import Image from 'next/image';
import RegistrationForm from '@/components/RegistrationForm';
import { FiCheckCircle, FiClock, FiZap, FiStar, FiHeart, FiSmile } from 'react-icons/fi'; // Example icons

const services = [
  { id: 'consultation', name: 'General Consultation' },
  { id: 'healing', name: 'Healing Session' },
  { id: 'workshop', name: 'Workshop' },
  { id: 'course', name: 'Course Enrollment' },
];

const features = [
  {
    name: 'Personalized Approach',
    description: 'Tailored wellness programs designed for your unique needs and goals.',
    icon: FiHeart,
  },
  {
    name: 'Instant WhatsApp Support',
    description: 'Connect via WhatsApp for quick support and guidance on your wellness journey.',
    icon: FiSmile,
  },
  {
    name: 'Holistic Healing Methods',
    description: 'Comprehensive solutions addressing mind, body, and spirit for total well-being.',
    icon: FiZap,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-orbitly-light-green text-orbitly-charcoal">
      {/* Optional: A simple top navigation bar for public pages if needed */}
      {/* <header className="py-4 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Image src="/logo.png" alt="Dhruva Wellness" width={40} height={40} />
          <nav className="space-x-4">
            <a href="#features" className="text-sm font-medium text-orbitly-dark-sage hover:text-primary-500">Features</a>
            <a href="#register" className="text-sm font-medium text-orbitly-dark-sage hover:text-primary-500">Register</a>
            <a href="/login" className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600">Admin Login</a>
          </nav>
        </div>
      </header> */}
      
      <main className="pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png" // Ensure your logo is in the public folder
                alt="Dhruva Holistic Wellness"
                width={100} 
                height={100}
                className="h-24 w-auto md:h-28"
                priority // Preload hero image
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-orbitly-charcoal sm:text-5xl md:text-6xl">
              <span className="block">Transform Your Life with</span>
              <span className="block text-primary-500">Holistic Wellness</span>
            </h1>
            <p className="mt-4 max-w-md mx-auto text-lg text-orbitly-dark-sage sm:text-xl md:mt-6 md:max-w-3xl">
              Begin your journey to balance and well-being today. Register for a consultation and receive a complimentary mindfulness guide to kickstart your transformation.
            </p>
          </div>

          {/* Registration Form Section */}
          <div id="register" className="mt-16 sm:mt-20">
            <div className="bg-white shadow-xl rounded-xl max-w-2xl mx-auto overflow-hidden">
              <div className="px-6 py-8 sm:p-10">
                <h2 className="text-3xl font-semibold text-orbitly-charcoal text-center mb-8">
                  Register for Consultation
                </h2>
                <RegistrationForm
                  sourceSite={typeof window !== 'undefined' ? window.location.hostname : 'website'} // More robust source site detection
                  services={services}
                  // Pass additional props if RegistrationForm is updated to match Orbitly style
                />
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-orbitly-dark-sage">
              Already have an account or an admin? <a href="/login" className="font-medium text-primary-500 hover:text-primary-600 hover:underline">Sign in here</a>.
            </p>
          </div>

          {/* Features Section */}
          <div id="features" className="mt-24 sm:mt-32">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-orbitly-charcoal sm:text-4xl">
                    Why Choose Dhruva Wellness?
                </h2>
                <p className="mt-3 max-w-2xl mx-auto text-lg text-orbitly-dark-sage">
                    We provide a unique blend of traditional wisdom and modern techniques for holistic healing.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-lg transform transition-all hover:scale-105">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orbitly-aqua text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-orbitly-charcoal">
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-sm text-orbitly-dark-sage">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-orbitly-soft-gray">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-orbitly-dark-sage">
            &copy; {new Date().getFullYear()} Dhruva Holistic Wellness. All rights reserved.
          </p>
          {/* <p className="mt-1 text-xs text-orbitly-soft-gray">
            <a href="#" className="hover:underline">Privacy Policy</a> &middot; <a href="#" className="hover:underline">Terms of Service</a>
          </p> */}
        </div>
      </footer>
    </div>
  );
} 
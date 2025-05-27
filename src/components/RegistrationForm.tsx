'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { MessagingService } from '@/lib/messaging';
import toast from 'react-hot-toast';
import { isValidPhone } from '@/lib/utils';
import WhatsAppMessagePreview from './WhatsAppMessagePreview';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().refine(isValidPhone, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
  service_type: z.string().min(1, 'Please select a service'),
  message: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  sourceSite: string;
  services: Array<{
    id: string;
    name: string;
  }>;
}

export default function RegistrationForm({ sourceSite, services }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    const messaging = MessagingService.getInstance();

    try {
      // Create lead in Supabase
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          ...data,
          source_site: sourceSite,
          status: 'new',
        })
        .select()
        .single();

      if (error) throw error;

      // Send welcome message and PDF - catch errors but don't fail registration
      try {
        await messaging.sendWelcomeMessage(data.phone, data.name);
        await messaging.sendWelcomePDF(data.phone);
      } catch (messagingError) {
        console.error('Messaging error:', messagingError);
        // Continue with registration process even if messaging fails
      }

      // Notify admin - catch errors but don't fail registration
      try {
        const adminPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER;
        if (adminPhone) {
          await messaging.notifyAdmin(
            adminPhone,
            data.name,
            data.phone,
            data.service_type,
            sourceSite
          );
        }
      } catch (adminNotifyError) {
        console.error('Admin notification error:', adminNotifyError);
        // Continue with registration process even if admin notification fails
      }

      toast.success('Registration successful!');
      setShowPreview(true);
      reset();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Full Name
          </label>
          <div className="mt-2">
            <input
              type="text"
              id="name"
              {...register('name')}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Phone Number
          </label>
          <div className="mt-2">
            <input
              type="tel"
              id="phone"
              {...register('phone')}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            />
            {errors.phone && (
              <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Email Address
          </label>
          <div className="mt-2">
            <input
              type="email"
              id="email"
              {...register('email')}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="service_type"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Service Type
          </label>
          <div className="mt-2">
            <select
              id="service_type"
              {...register('service_type')}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            {errors.service_type && (
              <p className="mt-2 text-sm text-red-600">
                {errors.service_type.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Message (Optional)
          </label>
          <div className="mt-2">
            <textarea
              id="message"
              rows={4}
              {...register('message')}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            />
            {errors.message && (
              <p className="mt-2 text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Registering...' : 'Register Now'}
          </button>
        </div>
      </form>
      <Transition appear show={showPreview} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowPreview(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
                  >
                    ×
                  </button>
                  <WhatsAppMessagePreview />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
} 
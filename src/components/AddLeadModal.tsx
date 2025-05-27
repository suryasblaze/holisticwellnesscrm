'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { FiPlusCircle, FiX, FiLoader, FiUser, FiPhone, FiMail, FiBriefcase, FiGlobe, FiMessageSquare } from 'react-icons/fi';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import { MessagingService } from '@/lib/messaging'; // We'll uncomment and use this later

const leadSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required').regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  email: z.string().email('Valid email is required'),
  service_type: z.string().min(1, 'Service type is required'), // Can be a select later
  source_site: z.string().min(1, 'Lead source is required'), // e.g., Website, Referral, WhatsApp
  message: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: () => void; // Callback to refresh leads list
}

export default function AddLeadModal({ isOpen, onClose, onLeadAdded }: AddLeadModalProps) {
  const supabase = createClientComponentClient();
  // const messagingService = MessagingService.getInstance(); // For WhatsApp
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      service_type: '',
      source_site: '',
      message: '',
    },
  });

  const onSubmit: SubmitHandler<LeadFormData> = async (data) => {
    setIsSubmitting(true);
    const toastId = toast.loading('Adding new lead...');

    try {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert([
          {
            name: data.name,
            phone: data.phone,
            email: data.email,
            service_type: data.service_type,
            source_site: data.source_site,
            notes: data.message, // Using 'notes' field in DB for initial message
            status: 'new', // Default status
            // assigned_to: null, // Or assign to a default user/admin if needed
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (newLead) {
        // TODO: Implement WhatsApp notification to admin/healer
        // Example:
        // const adminPhoneNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER; // Store this in .env.local
        // if (adminPhoneNumber) {
        //   await messagingService.sendNewLeadNotification(adminPhoneNumber, newLead.name, newLead.phone, newLead.service_type);
        // } else {
        //   console.warn('Admin WhatsApp number not configured for new lead notification.');
        // }
        toast.success('New lead added successfully!', { id: toastId });
        onLeadAdded(); // Call callback to refresh parent list
        reset(); // Reset form fields
        onClose(); // Close modal
      } else {
        throw new Error('Failed to add lead, no data returned.');
      }

    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast.error(error.message || 'Failed to add new lead.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => { if (!isSubmitting) onClose(); }}>
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold leading-6 text-orbitly-charcoal flex justify-between items-center"
                >
                  Add New Lead
                  <button 
                    onClick={onClose} 
                    disabled={isSubmitting}
                    className="text-orbitly-soft-gray hover:text-orbitly-charcoal disabled:opacity-50"
                  >
                    <FiX size={20}/>
                  </button>
                </Dialog.Title>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                  {/* Form Fields */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-orbitly-dark-sage">Full Name</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><FiUser className="h-4 w-4 text-orbitly-soft-gray" /></div>
                        <input type="text" id="name" {...register('name')} className="block w-full rounded-lg border-orbitly-soft-gray py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" placeholder="e.g., Jane Doe" />
                    </div>
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-orbitly-dark-sage">Phone Number</label>
                     <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><FiPhone className="h-4 w-4 text-orbitly-soft-gray" /></div>
                        <input type="tel" id="phone" {...register('phone')} className="block w-full rounded-lg border-orbitly-soft-gray py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" placeholder="+1234567890" />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-orbitly-dark-sage">Email Address</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><FiMail className="h-4 w-4 text-orbitly-soft-gray" /></div>
                        <input type="email" id="email" {...register('email')} className="block w-full rounded-lg border-orbitly-soft-gray py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" placeholder="you@example.com" />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="service_type" className="block text-sm font-medium text-orbitly-dark-sage">Service Interested In</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><FiBriefcase className="h-4 w-4 text-orbitly-soft-gray" /></div>
                        <input type="text" id="service_type" {...register('service_type')} className="block w-full rounded-lg border-orbitly-soft-gray py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" placeholder="e.g., Yoga Therapy" />
                    </div>
                    {errors.service_type && <p className="mt-1 text-xs text-red-500">{errors.service_type.message}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="source_site" className="block text-sm font-medium text-orbitly-dark-sage">Lead Source</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><FiGlobe className="h-4 w-4 text-orbitly-soft-gray" /></div>
                        <input type="text" id="source_site" {...register('source_site')} className="block w-full rounded-lg border-orbitly-soft-gray py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" placeholder="e.g., Website, WhatsApp" />
                    </div>
                    {errors.source_site && <p className="mt-1 text-xs text-red-500">{errors.source_site.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-orbitly-dark-sage">Initial Message/Notes (Optional)</label>
                    <div className="relative mt-1">
                         <div className="pointer-events-none absolute inset-y-0 left-0 top-3 flex items-center pl-3"><FiMessageSquare className="h-4 w-4 text-orbitly-soft-gray" /></div>
                        <textarea id="message" {...register('message')} rows={3} className="block w-full rounded-lg border-orbitly-soft-gray py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" placeholder="Any initial details from the client..."></textarea>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm font-medium text-orbitly-dark-sage hover:bg-orbitly-light-green focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
                    >
                      {isSubmitting ? <FiLoader className="animate-spin mr-2" /> : <FiPlusCircle className="mr-2" />}
                      {isSubmitting ? 'Adding Lead...' : 'Add Lead'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 
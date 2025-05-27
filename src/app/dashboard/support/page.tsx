'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { FiHelpCircle, FiMail, FiPhone, FiMessageSquare, FiChevronDown } from 'react-icons/fi';
import { useState } from 'react';

const faqs = [
  {
    question: 'How do I reset my password?',
    answer: 'Go to your profile settings and click on "Change Password". Follow the instructions to reset your password securely.'
  },
  {
    question: 'How can I contact support?',
    answer: 'You can email us at support@dhruvaholisticwellness.com or use the contact form below. We usually respond within 24 hours.'
  },
  {
    question: 'Where can I find user guides?',
    answer: 'User guides and tutorials are available in the Resources section. More guides are coming soon!'
  },
  {
    question: 'How do I report a bug or issue?',
    answer: 'Please use the contact form below and select "Report a Bug" as the subject. Include as much detail as possible.'
  },
];

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <DashboardLayout title="Help & Support">
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="flex flex-col items-center mb-10">
          <FiHelpCircle className="w-16 h-16 text-primary-500 mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold text-primary-700 mb-2">How can we help you?</h1>
          <p className="text-lg text-gray-500 text-center max-w-xl">
            Find answers to common questions, or reach out to our support team for personalized help.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-4">
                <button
                  className="flex items-center justify-between w-full text-left text-lg font-medium text-primary-700 focus:outline-none"
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                >
                  {faq.question}
                  <FiChevronDown className={`ml-2 h-5 w-5 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
                </button>
                {openIndex === idx && (
                  <p className="mt-3 text-gray-600 text-base animate-fade-in">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Options */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Contact Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center bg-white rounded-lg shadow p-6">
              <FiMail className="w-8 h-8 text-indigo-500 mb-2" />
              <span className="font-medium text-gray-700">Email</span>
              <a href="mailto:support@dhruvaholisticwellness.com" className="text-primary-500 hover:underline mt-1 text-sm">support@dhruvaholisticwellness.com</a>
            </div>
            <div className="flex flex-col items-center bg-white rounded-lg shadow p-6">
              <FiPhone className="w-8 h-8 text-green-500 mb-2" />
              <span className="font-medium text-gray-700">Phone</span>
              <a href="tel:+919999999999" className="text-primary-500 hover:underline mt-1 text-sm">+91 99999 99999</a>
            </div>
            <div className="flex flex-col items-center bg-white rounded-lg shadow p-6">
              <FiMessageSquare className="w-8 h-8 text-emerald-500 mb-2" />
              <span className="font-medium text-gray-700">WhatsApp</span>
              <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline mt-1 text-sm">Chat on WhatsApp</a>
            </div>
          </div>
        </div>

        {/* Simple Contact Form (not functional, just UI) */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">Send us a message</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" id="name" name="name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" name="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
              <select id="subject" name="subject" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                <option>General Inquiry</option>
                <option>Report a Bug</option>
                <option>Feature Request</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
              <textarea id="message" name="message" rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"></textarea>
            </div>
            <button type="submit" className="w-full rounded-md bg-primary-600 px-4 py-2 text-white font-semibold shadow hover:bg-primary-700 transition-colors" disabled>
              Send Message (Coming Soon)
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 
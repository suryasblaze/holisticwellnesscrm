'use client';

import { useState, useEffect, Fragment } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from '@/components/DashboardLayout';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import { FiActivity, FiCalendar, FiUpload, FiDownload, FiLoader, FiPlusCircle, FiBell } from 'react-icons/fi';
import { MessagingService } from '@/lib/messaging';

interface HealthCheckupReminder {
  id: string;
  user_id: string;
  checkup_type: string;
  due_date: string;
  reminder_sent: boolean;
  last_reminder_date: string | null;
  completed: boolean;
  completion_date: string | null;
  notes: string;
  user?: {
    full_name: string;
    phone: string;
  };
}

interface HealthProgressReport {
  id: string;
  user_id: string;
  report_date: string;
  initial_condition: string;
  current_symptoms: string;
  improvement_percentage: number;
  medical_analysis: string;
  energy_analysis: string;
  recommendations: string;
  user?: {
    full_name: string;
    phone: string;
  };
}

export default function HealthMonitoringPage() {
  const supabase = createClientComponentClient();
  const [reminders, setReminders] = useState<HealthCheckupReminder[]>([]);
  const [progressReports, setProgressReports] = useState<HealthProgressReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<Partial<HealthCheckupReminder>>({});
  const [currentReport, setCurrentReport] = useState<Partial<HealthProgressReport>>({});
  const [messaging] = useState(MessagingService.getInstance());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [remindersRes, reportsRes] = await Promise.all([
        supabase
          .from('health_checkup_reminders')
          .select('*, user:users(full_name, phone)')
          .order('due_date', { ascending: true }),
        supabase
          .from('health_progress_reports')
          .select('*, user:users(full_name, phone)')
          .order('report_date', { ascending: false })
      ]);

      if (remindersRes.error) throw remindersRes.error;
      if (reportsRes.error) throw reportsRes.error;

      setReminders(remindersRes.data || []);
      setProgressReports(reportsRes.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReminder = async () => {
    const toastId = toast.loading('Saving reminder...');
    try {
      if (!currentReminder.user_id || !currentReminder.checkup_type || !currentReminder.due_date) {
        throw new Error('Please fill in all required fields');
      }

      if (currentReminder.id) {
        const { error } = await supabase
          .from('health_checkup_reminders')
          .update({
            checkup_type: currentReminder.checkup_type,
            due_date: currentReminder.due_date,
            notes: currentReminder.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentReminder.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('health_checkup_reminders')
          .insert({
            user_id: currentReminder.user_id,
            checkup_type: currentReminder.checkup_type,
            due_date: currentReminder.due_date,
            notes: currentReminder.notes,
            reminder_sent: false,
            completed: false
          });

        if (error) throw error;
      }

      toast.success('Reminder saved successfully!', { id: toastId });
      setIsReminderModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to save reminder: ' + error.message, { id: toastId });
    }
  };

  const handleSaveReport = async () => {
    const toastId = toast.loading('Saving progress report...');
    try {
      if (!currentReport.user_id || !currentReport.initial_condition || !currentReport.current_symptoms) {
        throw new Error('Please fill in all required fields');
      }

      if (currentReport.id) {
        const { error } = await supabase
          .from('health_progress_reports')
          .update({
            initial_condition: currentReport.initial_condition,
            current_symptoms: currentReport.current_symptoms,
            improvement_percentage: currentReport.improvement_percentage,
            medical_analysis: currentReport.medical_analysis,
            energy_analysis: currentReport.energy_analysis,
            recommendations: currentReport.recommendations,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentReport.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('health_progress_reports')
          .insert({
            user_id: currentReport.user_id,
            report_date: new Date().toISOString(),
            initial_condition: currentReport.initial_condition,
            current_symptoms: currentReport.current_symptoms,
            improvement_percentage: currentReport.improvement_percentage || 0,
            medical_analysis: currentReport.medical_analysis,
            energy_analysis: currentReport.energy_analysis,
            recommendations: currentReport.recommendations
          });

        if (error) throw error;
      }

      toast.success('Progress report saved successfully!', { id: toastId });
      setIsReportModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to save progress report: ' + error.message, { id: toastId });
    }
  };

  const sendCheckupReminder = async (reminder: HealthCheckupReminder) => {
    if (!reminder.user?.phone || !reminder.user?.full_name) {
      toast.error('Missing user contact information');
      return;
    }

    const toastId = toast.loading('Sending reminder...');
    try {
      await messaging.sendHealthCheckupReminder(
        reminder.user.phone,
        reminder.user.full_name,
        reminder.checkup_type,
        new Date(reminder.due_date).toLocaleDateString()
      );

      // Update reminder status
      const { error } = await supabase
        .from('health_checkup_reminders')
        .update({
          reminder_sent: true,
          last_reminder_date: new Date().toISOString()
        })
        .eq('id', reminder.id);

      if (error) throw error;

      toast.success('Reminder sent successfully!', { id: toastId });
      fetchData();
    } catch (error: any) {
      toast.error('Failed to send reminder: ' + error.message, { id: toastId });
    }
  };

  const sendProgressSummary = async (report: HealthProgressReport) => {
    if (!report.user?.phone || !report.user?.full_name) {
      toast.error('Missing user contact information');
      return;
    }

    const toastId = toast.loading('Sending progress summary...');
    try {
      await messaging.sendProgressSummary(
        report.user.phone,
        report.user.full_name,
        {
          initialCondition: report.initial_condition,
          currentSymptoms: report.current_symptoms,
          improvementPercentage: report.improvement_percentage,
          medicalAnalysis: report.medical_analysis,
          energyAnalysis: report.energy_analysis,
          recommendations: report.recommendations
        }
      );

      toast.success('Progress summary sent successfully!', { id: toastId });
    } catch (error: any) {
      toast.error('Failed to send progress summary: ' + error.message, { id: toastId });
    }
  };

  return (
    <DashboardLayout title="Health Monitoring">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-white p-6 shadow-lg sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-orbitly-charcoal">Health Monitoring</h2>
            <p className="mt-1 text-sm text-orbitly-dark-sage">Track client health progress and manage checkup reminders.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setCurrentReminder({});
                setIsReminderModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
            >
              <FiPlusCircle className="h-4 w-4" />
              New Reminder
            </button>
            <button
              onClick={() => {
                setCurrentReport({});
                setIsReportModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
            >
              <FiPlusCircle className="h-4 w-4" />
              New Progress Report
            </button>
          </div>
        </div>

        {/* Reminders Section */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-medium text-orbitly-charcoal">Upcoming Checkups</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reminders.filter(r => !r.completed).map((reminder) => (
              <div key={reminder.id} className="rounded-lg border border-orbitly-light-green p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-orbitly-charcoal">{reminder.user?.full_name}</h4>
                    <p className="text-sm text-orbitly-dark-sage">{reminder.checkup_type}</p>
                  </div>
                  <button
                    onClick={() => sendCheckupReminder(reminder)}
                    className="rounded-md p-1.5 text-primary-500 hover:bg-primary-50"
                  >
                    <FiBell className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 text-sm">
                  <p><strong>Due:</strong> {new Date(reminder.due_date).toLocaleDateString()}</p>
                  {reminder.notes && <p className="mt-1 text-orbitly-dark-sage">{reminder.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Reports Section */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-medium text-orbitly-charcoal">Progress Reports</h3>
          <div className="space-y-4">
            {progressReports.map((report) => (
              <div key={report.id} className="rounded-lg border border-orbitly-light-green p-4">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-orbitly-charcoal">{report.user?.full_name}</h4>
                    <p className="text-sm text-orbitly-dark-sage">
                      Report Date: {new Date(report.report_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => sendProgressSummary(report)}
                      className="rounded-md p-1.5 text-primary-500 hover:bg-primary-50"
                    >
                      <FiDownload className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-orbitly-dark-sage">Initial Condition</p>
                    <p className="text-sm">{report.initial_condition}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orbitly-dark-sage">Current Symptoms</p>
                    <p className="text-sm">{report.current_symptoms}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orbitly-dark-sage">Improvement</p>
                    <p className="text-sm">{report.improvement_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orbitly-dark-sage">Medical Analysis</p>
                    <p className="text-sm">{report.medical_analysis}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reminder Modal */}
        <Transition appear show={isReminderModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={() => setIsReminderModalOpen(false)}
          >
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
              <div className="flex min-h-full items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium text-orbitly-charcoal">
                    {currentReminder.id ? 'Edit Reminder' : 'New Checkup Reminder'}
                  </Dialog.Title>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-orbitly-dark-sage">
                        Checkup Type
                      </label>
                      <input
                        type="text"
                        value={currentReminder.checkup_type || ''}
                        onChange={(e) =>
                          setCurrentReminder((prev) => ({
                            ...prev,
                            checkup_type: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-orbitly-dark-sage">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={currentReminder.due_date || ''}
                        onChange={(e) =>
                          setCurrentReminder((prev) => ({
                            ...prev,
                            due_date: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-orbitly-dark-sage">
                        Notes
                      </label>
                      <textarea
                        value={currentReminder.notes || ''}
                        onChange={(e) =>
                          setCurrentReminder((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsReminderModalOpen(false)}
                      className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm font-medium text-orbitly-charcoal"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReminder}
                      className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
                    >
                      Save Reminder
                    </button>
                  </div>
                </Dialog.Panel>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Progress Report Modal */}
        <Transition appear show={isReportModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={() => setIsReportModalOpen(false)}
          >
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
              <div className="flex min-h-full items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium text-orbitly-charcoal">
                    {currentReport.id ? 'Edit Progress Report' : 'New Progress Report'}
                  </Dialog.Title>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-orbitly-dark-sage">
                        Initial Condition
                      </label>
                      <textarea
                        value={currentReport.initial_condition || ''}
                        onChange={(e) =>
                          setCurrentReport((prev) => ({
                            ...prev,
                            initial_condition: e.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-orbitly-dark-sage">
                        Current Symptoms
                      </label>
                      <textarea
                        value={currentReport.current_symptoms || ''}
                        onChange={(e) =>
                          setCurrentReport((prev) => ({
                            ...prev,
                            current_symptoms: e.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-orbitly-dark-sage">
                        Improvement Percentage
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentReport.improvement_percentage || 0}
                        onChange={(e) =>
                          setCurrentReport((prev) => ({
                            ...prev,
                            improvement_percentage: parseInt(e.target.value),
                          }))
                        }
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-orbitly-dark-sage">
                        Medical Analysis
                      </label>
                      <textarea
                        value={currentReport.medical_analysis || ''}
                        onChange={(e) =>
                          setCurrentReport((prev) => ({
                            ...prev,
                            medical_analysis: e.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-orbitly-dark-sage">
                        Energy Analysis
                      </label>
                      <textarea
                        value={currentReport.energy_analysis || ''}
                        onChange={(e) =>
                          setCurrentReport((prev) => ({
                            ...prev,
                            energy_analysis: e.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-orbitly-dark-sage">
                        Recommendations
                      </label>
                      <textarea
                        value={currentReport.recommendations || ''}
                        onChange={(e) =>
                          setCurrentReport((prev) => ({
                            ...prev,
                            recommendations: e.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(false)}
                      className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm font-medium text-orbitly-charcoal"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReport}
                      className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
                    >
                      Save Report
                    </button>
                  </div>
                </Dialog.Panel>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </DashboardLayout>
  );
} 
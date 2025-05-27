'use client';

import { useState, useEffect, Fragment } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from '@/components/DashboardLayout';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import { FiUser, FiFile, FiPlus, FiEdit, FiTrash2, FiUpload, FiDownload, FiLoader } from 'react-icons/fi';

interface MedicalRecord {
  id: string;
  user_id: string;
  condition: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  medical_history: string;
  healing_preferences: string;
  healing_notes: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  assigned_healer_id: string | null;
  last_healing_session: string | null;
  next_healing_session: string | null;
}

interface MedicalFile {
  id: string;
  medical_record_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  upload_date: string;
  notes: string;
}

export default function MedicalRecordsPage() {
  const supabase = createClientComponentClient();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<MedicalRecord>>({});
  const [files, setFiles] = useState<MedicalFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMedicalRecords();
  }, [searchTerm]);

  const fetchMedicalRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('medical_records')
        .select(`
          *,
          users (full_name, phone),
          healers:assigned_healer_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`
          condition.ilike.%${searchTerm}%,
          diagnosis.ilike.%${searchTerm}%,
          users.full_name.ilike.%${searchTerm}%
        `);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch medical records: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (recordId: string) => {
    try {
      const { data, error } = await supabase
        .from('medical_files')
        .select('*')
        .eq('medical_record_id', recordId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch files: ' + error.message);
    }
  };

  const handleFileUpload = async (recordId: string, file: File) => {
    setUploadingFile(true);
    const toastId = toast.loading('Uploading file...');
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${recordId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('medical-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('medical-files')
        .getPublicUrl(fileName);

      // Save file record
      const { error: dbError } = await supabase
        .from('medical_files')
        .insert({
          medical_record_id: recordId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          notes: 'Uploaded via dashboard'
        });

      if (dbError) throw dbError;

      toast.success('File uploaded successfully!', { id: toastId });
      fetchFiles(recordId);
    } catch (error: any) {
      toast.error('Failed to upload file: ' + error.message, { id: toastId });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveRecord = async () => {
    const toastId = toast.loading('Saving medical record...');
    try {
      if (currentRecord.id) {
        // Update existing record
        const { error } = await supabase
          .from('medical_records')
          .update({
            condition: currentRecord.condition,
            diagnosis: currentRecord.diagnosis,
            treatment: currentRecord.treatment,
            prescription: currentRecord.prescription,
            medical_history: currentRecord.medical_history,
            healing_preferences: currentRecord.healing_preferences,
            healing_notes: currentRecord.healing_notes,
            start_date: currentRecord.start_date,
            end_date: currentRecord.end_date,
            assigned_healer_id: currentRecord.assigned_healer_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('medical_records')
          .insert({
            ...currentRecord,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast.success('Medical record saved successfully!', { id: toastId });
      setIsModalOpen(false);
      fetchMedicalRecords();
    } catch (error: any) {
      toast.error('Failed to save medical record: ' + error.message, { id: toastId });
    }
  };

  return (
    <DashboardLayout title="Medical Records">
      <div className="space-y-6">
        {/* Header and Actions */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-white p-6 shadow-lg sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-orbitly-charcoal">Medical Records</h2>
            <p className="mt-1 text-sm text-orbitly-dark-sage">Manage patient medical records and files.</p>
          </div>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm"
            />
            <button
              onClick={() => {
                setCurrentRecord({});
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
            >
              <FiPlus className="h-4 w-4" />
              New Record
            </button>
          </div>
        </div>

        {/* Records List */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <div key={record.id} className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-orbitly-charcoal">{record.condition}</h3>
                  <p className="text-sm text-orbitly-dark-sage">
                    Started: {new Date(record.start_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setCurrentRecord(record);
                      setIsModalOpen(true);
                    }}
                    className="rounded-md p-1.5 text-blue-600 hover:bg-blue-100"
                  >
                    <FiEdit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => fetchFiles(record.id)}
                    className="rounded-md p-1.5 text-green-600 hover:bg-green-100"
                  >
                    <FiFile className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <p><strong>Diagnosis:</strong> {record.diagnosis}</p>
                <p><strong>Treatment:</strong> {record.treatment}</p>
                {record.prescription && (
                  <p><strong>Prescription:</strong> {record.prescription}</p>
                )}
                {record.healing_notes && (
                  <p><strong>Healing Notes:</strong> {record.healing_notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Record Modal */}
        <Transition appear show={isModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={() => setIsModalOpen(false)}
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
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-orbitly-charcoal"
                    >
                      {currentRecord.id ? 'Edit Medical Record' : 'New Medical Record'}
                    </Dialog.Title>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-orbitly-dark-sage">
                          Condition
                        </label>
                        <input
                          type="text"
                          value={currentRecord.condition || ''}
                          onChange={(e) =>
                            setCurrentRecord((prev) => ({
                              ...prev,
                              condition: e.target.value,
                            }))
                          }
                          className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-orbitly-dark-sage">
                          Diagnosis
                        </label>
                        <textarea
                          value={currentRecord.diagnosis || ''}
                          onChange={(e) =>
                            setCurrentRecord((prev) => ({
                              ...prev,
                              diagnosis: e.target.value,
                            }))
                          }
                          rows={3}
                          className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-orbitly-dark-sage">
                          Treatment
                        </label>
                        <textarea
                          value={currentRecord.treatment || ''}
                          onChange={(e) =>
                            setCurrentRecord((prev) => ({
                              ...prev,
                              treatment: e.target.value,
                            }))
                          }
                          rows={3}
                          className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-orbitly-dark-sage">
                          Prescription
                        </label>
                        <textarea
                          value={currentRecord.prescription || ''}
                          onChange={(e) =>
                            setCurrentRecord((prev) => ({
                              ...prev,
                              prescription: e.target.value,
                            }))
                          }
                          rows={2}
                          className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-orbitly-dark-sage">
                          Medical History
                        </label>
                        <textarea
                          value={currentRecord.medical_history || ''}
                          onChange={(e) =>
                            setCurrentRecord((prev) => ({
                              ...prev,
                              medical_history: e.target.value,
                            }))
                          }
                          rows={4}
                          className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-orbitly-dark-sage">
                          Healing Preferences
                        </label>
                        <textarea
                          value={currentRecord.healing_preferences || ''}
                          onChange={(e) =>
                            setCurrentRecord((prev) => ({
                              ...prev,
                              healing_preferences: e.target.value,
                            }))
                          }
                          rows={2}
                          className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-orbitly-dark-sage">
                          Healing Notes
                        </label>
                        <textarea
                          value={currentRecord.healing_notes || ''}
                          onChange={(e) =>
                            setCurrentRecord((prev) => ({
                              ...prev,
                              healing_notes: e.target.value,
                            }))
                          }
                          rows={3}
                          className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-orbitly-dark-sage">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={currentRecord.start_date || ''}
                            onChange={(e) =>
                              setCurrentRecord((prev) => ({
                                ...prev,
                                start_date: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-orbitly-dark-sage">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={currentRecord.end_date || ''}
                            onChange={(e) =>
                              setCurrentRecord((prev) => ({
                                ...prev,
                                end_date: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border-orbitly-soft-gray px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm font-medium text-orbitly-charcoal"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveRecord}
                        className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
                      >
                        Save Record
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </DashboardLayout>
  );
} 
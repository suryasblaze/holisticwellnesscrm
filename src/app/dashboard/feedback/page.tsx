'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';
import { FiMessageSquare, FiStar, FiTrendingUp, FiCalendar, FiLoader } from 'react-icons/fi';

interface FeedbackForm {
  id: string;
  healing_session_id: string;
  user_id: string;
  qualitative_feedback: string;
  quantitative_rating: number;
  improvement_notes: string;
  submission_date: string;
  user?: {
    full_name: string;
    phone: string;
  };
  healing_session?: {
    session_type: string;
    session_date: string;
  };
}

export default function FeedbackPage() {
  const supabase = createClientComponentClient();
  const [feedback, setFeedback] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: '30',
    rating: '',
    searchTerm: '',
  });

  useEffect(() => {
    fetchFeedback();
  }, [filters]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('feedback_forms')
        .select(`
          *,
          user:users(full_name, phone),
          healing_session:healing_sessions(session_type, session_date)
        `)
        .order('submission_date', { ascending: false });

      // Apply filters
      if (filters.rating) {
        query = query.eq('quantitative_rating', parseInt(filters.rating));
      }

      if (filters.dateRange) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(filters.dateRange));
        query = query.gte('submission_date', daysAgo.toISOString());
      }

      if (filters.searchTerm) {
        query = query.or(`
          qualitative_feedback.ilike.%${filters.searchTerm}%,
          improvement_notes.ilike.%${filters.searchTerm}%,
          user.full_name.ilike.%${filters.searchTerm}%
        `);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFeedback(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch feedback: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendFeedbackReminder = async (userId: string, phone: string, userName: string) => {
    try {
      // Send WhatsApp reminder using your messaging service
      // This should be implemented in your messaging service
      toast.success('Feedback reminder sent successfully!');
    } catch (error: any) {
      toast.error('Failed to send reminder: ' + error.message);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <DashboardLayout title="Feedback Management">
      <div className="space-y-6">
        {/* Header and Filters */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-orbitly-charcoal">Client Feedback</h2>
              <p className="mt-1 text-sm text-orbitly-dark-sage">Track and manage healing session feedback.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                name="dateRange"
                value={filters.dateRange}
                onChange={handleFilterChange}
                className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="">All Time</option>
              </select>
              <select
                name="rating"
                value={filters.rating}
                onChange={handleFilterChange}
                className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm"
              >
                <option value="">All Ratings</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                  <option key={rating} value={rating}>{rating} Stars</option>
                ))}
              </select>
              <input
                type="text"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                placeholder="Search feedback..."
                className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Feedback Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {feedback.map((item) => (
            <div key={item.id} className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-orbitly-charcoal">
                    {item.user?.full_name}
                  </h3>
                  <p className="text-sm text-orbitly-dark-sage">
                    {new Date(item.submission_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <FiStar className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">{item.quantitative_rating}/10</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-orbitly-dark-sage">Session Type</p>
                  <p className="text-sm">{item.healing_session?.session_type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-orbitly-dark-sage">Feedback</p>
                  <p className="text-sm">{item.qualitative_feedback}</p>
                </div>
                {item.improvement_notes && (
                  <div>
                    <p className="text-xs font-medium text-orbitly-dark-sage">Improvement Notes</p>
                    <p className="text-sm">{item.improvement_notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => sendFeedbackReminder(item.user_id, item.user?.phone || '', item.user?.full_name || '')}
                  className="flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white"
                >
                  <FiMessageSquare className="h-3 w-3" />
                  Send Reminder
                </button>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center">
            <FiLoader className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        )}

        {!loading && feedback.length === 0 && (
          <div className="flex h-40 items-center justify-center">
            <p className="text-orbitly-dark-sage">No feedback found matching your filters.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 
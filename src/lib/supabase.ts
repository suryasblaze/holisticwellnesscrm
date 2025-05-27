import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { formatDate, formatDateTime, formatPhone, isValidPhone, isValidEmail } from './utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to get user role
export async function getUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role || null;
}

// Helper function to check if user is admin
export async function isAdmin() {
  const role = await getUserRole();
  return role === 'admin';
}

// Re-export utility functions for backward compatibility
export { formatDate, formatDateTime, formatPhone, isValidPhone, isValidEmail };

export type Lead = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  service_type: string;
  message?: string;
  source_site: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  assigned_to?: string;
  last_contact?: string;
  next_followup?: string;
};

export type ServiceType = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  is_active: boolean;
};

export type Appointment = {
  id: string;
  created_at: string;
  lead_id: string;
  service_type_id: string;
  scheduled_for: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  payment_status: 'pending' | 'partial' | 'completed';
  amount_paid: number;
};

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          phone: string;
          email: string;
          service_type: string;
          message: string;
          source_site: string;
          status: 'new' | 'assigned' | 'follow_up' | 'closed';
          assigned_to: string | null;
          follow_up_date: string | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['leads']['Row']>;
      };
    };
  };
}; 
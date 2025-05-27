export interface Appointment {
  id: string;
  created_at: string;
  lead_id: string;
  lead_name?: string;
  lead_phone?: string;
  service_type_id: string;
  service_name?: string;
  healer_id?: string;
  healer_name?: string;
  date: string;
  time: string;
  scheduled_for?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  payment_status: 'pending' | 'partial' | 'completed';
  amount_paid?: number;
  notes?: string;
  source: 'whatsapp' | 'website' | 'crm';
} 
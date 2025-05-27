import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin'; // Using admin client

interface WebsiteLeadData {
  name: string;
  phone: string;
  email?: string;
  service_type?: string;
  message?: string;
  source_identifier: string; // To specify which website/form, e.g., 'main_contact_form'
}

// Basic validation
const validateLeadRequest = (data: any) => {
  if (!data.name) return 'Missing required field: name';
  if (!data.phone) return 'Missing required field: phone';
  if (!data.source_identifier) return 'Missing required field: source_identifier';
  // Add more specific validations if needed (e.g., phone format, email format)
  return null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received lead from website form:', body);

    const validationError = validateLeadRequest(body);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const {
      name,
      phone,
      email,
      service_type,
      message,
      source_identifier // e.g., 'main_website_contact_form', 'landing_page_promo_X'
    }: WebsiteLeadData = body;

    // Check if lead already exists (e.g., by phone or email)
    // This is similar to the appointment booking route, you might want to merge/update if exists
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('id')
      .or(`phone.eq.${phone},email.eq.${email || '___INVALID_EMAIL___'}`) // Avoid null email in OR
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: row not found
        console.error('Error fetching existing lead:', fetchError);
        throw new Error(`Error checking for existing lead: ${fetchError.message}`);
    }

    if (existingLead) {
      // Optionally, update existing lead with new info or notify admin
      console.log(`Lead already exists with ID: ${existingLead.id}. You might want to update it or add a note.`);
      // For now, we'll just return a success to indicate it's processed.
      // Or, you could update the lead's message, service_type, or last_contact.
      // Example update:
      // await supabase.from('leads').update({ message: message, service_type: service_type, updated_at: new Date().toISOString(), source_site: source_identifier }).eq('id', existingLead.id);
      return NextResponse.json({ success: true, message: 'Lead already exists, information noted.', lead_id: existingLead.id }, { status: 200 });
    }

    // Create new lead
    const { data: newLead, error: createError } = await supabase
      .from('leads')
      .insert({
        name,
        phone,
        email: email || null,
        service_type: service_type || 'Unknown',
        message: message || null,
        source_site: source_identifier, // Use the identifier passed in the request
        status: 'new',
        // Ensure your 'leads' table has 'source_site' and other relevant fields
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating new lead:', createError);
      throw new Error(`Error creating new lead: ${createError.message}`);
    }

    console.log('New lead created with ID:', newLead.id);

    // Optionally, send a notification (e.g., to admin via WhatsApp/email)
    // const adminPhoneNumber = process.env.ADMIN_NOTIFICATION_PHONE;
    // if (adminPhoneNumber) {
    //   try {
    //     await sendWhatsAppMessage(adminPhoneNumber, `New lead from ${source_identifier}: ${name}, ${phone}`);
    //   } catch (notifyError) {
    //     console.error('Failed to send admin notification for new lead:', notifyError);
    //   }
    // }

    return NextResponse.json({ success: true, message: 'Lead created successfully', lead_id: newLead.id }, { status: 201 });

  } catch (error: any) {
    console.error('API Error - Create Lead from Website:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return NextResponse.json({ message: 'API endpoint for creating leads from website forms. Use POST.' });
} 
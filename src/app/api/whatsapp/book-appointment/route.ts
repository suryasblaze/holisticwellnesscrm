import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin'; // Using admin client for server-side operations
import { sendWhatsAppMessage } from '@/lib/whatsapp'; // Assuming this can be used server-side

// Basic validation for required fields
const validateBookingRequest = (data: any) => {
  const requiredFields = ['customer_phone', 'customer_name', 'service_name', 'date', 'time'];
  for (const field of requiredFields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  // Add more specific validations if needed (e.g., date format, time format, phone format)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    return 'Invalid date format. Expected YYYY-MM-DD.';
  }
  if (!/^\d{2}:\d{2}$/.test(data.time)) {
    return 'Invalid time format. Expected HH:MM.';
  }
  return null; // No errors
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validationError = validateBookingRequest(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const {
      customer_phone,
      customer_name,
      customer_email, // Optional
      service_name,
      date,
      time,
      notes // Optional
    } = body;

    // 1. Find or create lead
    let leadId;
    const { data: existingLead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', customer_phone)
      .single();

    if (leadError && leadError.code !== 'PGRST116') { // PGRST116: 'single' row not found
      console.error('Error fetching lead:', leadError);
      throw new Error(`Error fetching lead: ${leadError.message}`);
    }

    if (existingLead) {
      leadId = existingLead.id;
    } else {
      const { data: newLead, error: newLeadError } = await supabase
        .from('leads')
        .insert({
          name: customer_name,
          phone: customer_phone,
          email: customer_email || null,
          source_site: 'whatsapp', // Mark source as WhatsApp
          status: 'new', // Default status for new leads
        })
        .select('id')
        .single();

      if (newLeadError) {
        console.error('Error creating new lead:', newLeadError);
        throw new Error(`Error creating new lead: ${newLeadError.message}`);
      }
      leadId = newLead.id;
    }

    // 2. Find service_type_id
    const { data: serviceType, error: serviceError } = await supabase
      .from('service_types')
      .select('id')
      // Using ilike for case-insensitive matching and trimming whitespace
      .ilike('name', `%${service_name.trim()}%`) 
      .single();

    if (serviceError || !serviceType) {
      console.error('Error fetching service type or service not found:', serviceError);
      // It might be better to inform the user that the service name is not recognized
      // rather than throwing a generic error.
      return NextResponse.json({ error: `Service "${service_name}" not found. Please ensure the service name is correct.` }, { status: 404 });
    }
    const serviceTypeId = serviceType.id;

    // 3. Create appointment
    const { data: newAppointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        lead_id: leadId,
        service_type_id: serviceTypeId,
        date: date,
        time: time,
        notes: notes || null,
        status: 'scheduled', // Default status
        payment_status: 'pending', // Default payment status
        booking_source: 'whatsapp', // Mark booking source
      })
      .select('id, date, time, leads(name), service_types(name)')
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      throw new Error(`Error creating appointment: ${appointmentError.message}`);
    }

    // 4. Send a confirmation message via WhatsApp
    try {
      const confirmationMessage = `Hi ${customer_name}, your appointment for ${service_name} on ${date} at ${time} has been successfully booked. Your booking ID is ${newAppointment.id}. We look forward to seeing you!`;
      await sendWhatsAppMessage(customer_phone, confirmationMessage);
      console.log(`WhatsApp confirmation sent to ${customer_phone}`);
    } catch (whatsappError: any) {
      // Log the error but don't let it fail the entire booking process
      console.error(`Failed to send WhatsApp confirmation to ${customer_phone}:`, whatsappError);
      // You might want to add a specific monitoring alert here if WhatsApp messages are critical
    }

    return NextResponse.json({ 
      message: 'Appointment booked successfully!', 
      appointment: {
        id: newAppointment.id,
        leadName: newAppointment.leads && Array.isArray(newAppointment.leads) && newAppointment.leads.length > 0 ? newAppointment.leads[0].name : (newAppointment.leads as any)?.name || 'N/A',
        serviceName: newAppointment.service_types && Array.isArray(newAppointment.service_types) && newAppointment.service_types.length > 0 ? newAppointment.service_types[0].name : (newAppointment.service_types as any)?.name || 'N/A',
        date: newAppointment.date,
        time: newAppointment.time,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('WhatsApp Booking API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Optional: Add a GET handler for testing or information, though not strictly necessary for a webhook
export async function GET() {
  return NextResponse.json({ message: 'WhatsApp Booking API. Use POST to create appointments.' });
} 
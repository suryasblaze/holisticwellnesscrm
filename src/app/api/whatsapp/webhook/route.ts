import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '@/lib/supabaseAdmin';
import { WhatsAppService } from '@/lib/whatsapp'; // Using WhatsAppService for replies

// TODO: Clarify and implement echt.im webhook verification for GET requests.
// const WHATSAPP_VERIFY_TOKEN = process.env.ECHT_WHATSAPP_VERIFY_TOKEN;

export async function GET(request: Request) {
  console.log('WhatsApp webhook GET request received (for verification setup)');
  // const url = new URL(request.url);
  // const mode = url.searchParams.get('hub.mode'); // Or similar params from echt.im
  // const token = url.searchParams.get('hub.verify_token');
  // const challenge = url.searchParams.get('hub.challenge');

  // if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN && challenge) {
  //   return new NextResponse(challenge, { status: 200 });
  // } else {
  //   console.error('Failed webhook verification attempt', { mode, token });
  //   return new NextResponse('Failed verification', { status: 403 });
  // }
  return NextResponse.json({ message: 'Webhook GET endpoint for echt.im is active. Configure verification as per echt.im docs.' }, { status: 200 });
}

async function getOrCreateLeadFromWhatsApp(
  phone: string,
  name: string | null,
  initialMessage: string | null,
  serviceType: string | null,
  supabase: SupabaseClient
): Promise<{ id: string; isNew: boolean }> {
  // Check if lead already exists by phone
  const { data: existingLead, error: fetchError } = await supabase
    .from('leads')
    .select('id, name, service_type, message')
    .eq('phone', phone)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: row not found
    console.error('Error fetching existing lead by phone:', fetchError);
    throw new Error(`Error checking for existing lead: ${fetchError.message}`);
  }

  if (existingLead) {
    console.log(`Lead already exists for phone ${phone} with ID: ${existingLead.id}`);
    // Optional: Update existing lead if new info is more relevant
    // For example, if the new message or service type is different and more current.
    // const updateData: any = {};
    // if (serviceType && existingLead.service_type !== serviceType) updateData.service_type = serviceType;
    // if (initialMessage && (!existingLead.message || existingLead.message.length < initialMessage.length)) updateData.message = initialMessage;
    // if (Object.keys(updateData).length > 0) {
    //   updateData.updated_at = new Date().toISOString();
    //   updateData.status = 'new'; // Re-evaluate status if re-engaging
    //   const { error: updateError } = await supabase.from('leads').update(updateData).eq('id', existingLead.id);
    //   if (updateError) console.error('Error updating existing lead:', updateError);
    // }
    return { id: existingLead.id, isNew: false };
  }

  // Create new lead
  const { data: newLead, error: createError } = await supabase
    .from('leads')
    .insert({
      name: name || 'WhatsApp User', // Use WhatsApp username or a default
      phone,
      email: null, // Email usually not available from initial WA contact
      service_type: serviceType || 'Unknown Inquiry',
      message: initialMessage || 'Initial contact via WhatsApp',
      source_site: 'WhatsApp', // Clearly mark as WhatsApp origin
      status: 'new',
    })
    .select('id')
    .single();

  if (createError) {
    console.error('Error creating new lead from WhatsApp:', createError);
    throw new Error(`Error creating new lead: ${createError.message}`);
  }

  console.log('New lead created from WhatsApp with ID:', newLead.id);
  // Optionally, send an admin notification here
  return { id: newLead.id, isNew: true };
}

// Placeholder for user session state during an order process (in-memory, per request)
// For more complex multi-turn conversations, consider a DB-backed session store.
interface UserOrderSession {
  cart: Array<{ product_id: string; name: string; quantity: number; price_per_unit: number }>;
  step: 'selecting_category' | 'selecting_product' | 'selecting_quantity' | 'confirming_order' | 'collecting_address' | null;
  current_category?: string;
  current_product_id?: string;
  // add other relevant session fields
}
const userSessions = new Map<string, UserOrderSession>(); // Key: senderPhone

export async function POST(request: Request) {
  const supabase: SupabaseClient = supabaseAdmin;
  const whatsappService = WhatsAppService.getInstance();

  try {
    const body = await request.json();
    console.log('Webhook payload:', JSON.stringify(body, null, 2));

    // TODO: Implement security verification (e.g., IP whitelisting or check for a secret if provided by echt.im)

    // Differentiate between message status update and incoming message
    if (body.status && body.statusAt) {
      // This is a Message Status Update
      console.log(`Received message status update: ID ${body.id}, Status: ${body.status}, At: ${body.statusAt}, Error: ${body.error || 'None'}`);
      // TODO: Optionally, update your database if you track message delivery statuses.
      return NextResponse.json({ message: 'Status update received' }, { status: 200 });
    }

    // This is an Incoming User Message
    const {
      id: messageId,
      imType,
      source_number: senderPhoneRaw, // User's WhatsApp E.164 number
      destination_number: businessPhone, // Your registered E.164 number
      receivedAt,
      contentType, // "text", "image", "document", "video", "button"
      text: textContent, // User's message text
      attachmentUrl,
      attachmentName,
      longitude,
      latitude,
      locationAddress,
      username: whatsappUsername,
      payload: buttonPayload, // Button code if contentType is "button"
    } = body;

    if (!senderPhoneRaw || !contentType) {
      console.warn('Webhook received an invalid or empty incoming message payload.', body);
      // As per echt.im docs, webhook should return 200 OK.
      return NextResponse.json({ status: 'error', message: 'Invalid payload received by webhook' }, { status: 200 });
    }

    const senderPhone = whatsappService.formatPhoneNumber(senderPhoneRaw);

    console.log(`Processing incoming message from ${senderPhone} (${whatsappUsername || 'N/A'}): Type: ${contentType}`);

    // --- Intent Recognition and Action Logic ---
    if (contentType === 'text' && textContent) {
      const lowerText = textContent.toLowerCase();
      let leadInfo;

      if (lowerText.includes('order') || lowerText.includes('buy')) {
        leadInfo = await getOrCreateLeadFromWhatsApp(senderPhone, whatsappUsername, textContent, 'Product Order', supabase);
        await handleOrderIntent(senderPhone, textContent, leadInfo, supabase, whatsappService);
      } else if (lowerText.includes('appointment') || lowerText.includes('book')) {
        leadInfo = await getOrCreateLeadFromWhatsApp(senderPhone, whatsappUsername, textContent, 'Appointment Request', supabase);
        await handleAppointmentIntent(senderPhone, textContent, leadInfo, supabase, whatsappService);
      } else {
        // Generic inquiry - create a lead
        leadInfo = await getOrCreateLeadFromWhatsApp(senderPhone, whatsappUsername, textContent, 'General Inquiry', supabase);
        await whatsappService.sendMessage({ 
          to: senderPhone, 
          body: `Thanks for your message, ${whatsappUsername || 'there'}! A team member will review your inquiry from source: WhatsApp, lead ID: ${leadInfo.id}. How can I assist you today? (Type "order" for products or "appointment" to book)` 
        });
      }
    } else if (contentType === 'button' && buttonPayload) {
      console.log(`Button click received from ${senderPhone}. Payload: ${buttonPayload}`);
      // TODO: Handle button payload. This might also involve getOrCreateLead if it's an initial interaction.
      // For example, if a button click is the first contact or implies a new service interest.
      // const leadInfo = await getOrCreateLeadFromWhatsApp(senderPhone, whatsappUsername, `Button: ${buttonPayload}`, 'Interactive Action', supabase);
      await whatsappService.sendMessage({ to: senderPhone, body: `You clicked a button with payload: ${buttonPayload}. We will process this!` });
    } else if (['image', 'document', 'video', 'location'].includes(contentType)) {
      console.log(`Received ${contentType} from ${senderPhone}.`);
      // Potentially create a lead for media messages too if it's an initial contact point
      // const leadInfo = await getOrCreateLeadFromWhatsApp(senderPhone, whatsappUsername, `Received ${contentType}`, 'Media Message', supabase);
      await whatsappService.sendMessage({ to: senderPhone, body: `Thanks for sending the ${contentType}. We will review it.` });
    } else {
      console.warn(`Unhandled contentType: ${contentType} from ${senderPhone}`);
      await whatsappService.sendMessage({ to: senderPhone, body: 'Sorry, I didn\'t understand that type of message.' });
    }
    // --- End Intent Recognition ---

    return NextResponse.json({ message: 'Incoming message processed' }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing WhatsApp webhook:', error);
    if (error.response && error.response.data) {
      console.error('Error details:', error.response.data);
    }
    return NextResponse.json({ status: 'error', message: 'Internal server error processing webhook' }, { status: 200 });
  }
}

// Updated helper functions to accept leadInfo
async function handleOrderIntent(
  senderPhone: string, 
  textContent: string, 
  leadInfo: {id: string, isNew: boolean}, 
  supabase: SupabaseClient, 
  whatsappService: WhatsAppService
) {
  console.log(`Order intent for lead ID: ${leadInfo.id} (isNew: ${leadInfo.isNew}). Text: ${textContent}`);

  let session = userSessions.get(senderPhone);
  if (!session) {
    session = { cart: [], step: 'selecting_category' }; // Start by selecting category
    userSessions.set(senderPhone, session);
  }

  // Main logic for handling different steps in the order process
  if (session.step === 'selecting_category') {
    const exampleCategories = ['Webinars', 'Scrolls', 'Healing Camps']; 
    await whatsappService.sendMessage({ 
      to: senderPhone, 
      body: `Welcome to our store (Lead: ${leadInfo.id})! Please choose a product category:\n${exampleCategories.map((c, i) => `${i+1}. ${c}`).join('\n')}\nType the number or name.` 
    });
    // Next step would be set based on user's response, e.g., session.step = 'selecting_product';
    // userSessions.set(senderPhone, session);
    return; 
  } else if (session.step === 'selecting_product') {
    // TODO: Implement product selection logic for session.current_category
    await whatsappService.sendMessage({ to: senderPhone, body: 'Product selection step not yet implemented.'});
    return;
  } else if (session.step === 'selecting_quantity') {
    // TODO: Implement quantity selection for session.current_product_id
    await whatsappService.sendMessage({ to: senderPhone, body: 'Quantity selection step not yet implemented.'});
    return;
  } else if (session.step === 'confirming_order') {
    // TODO: Display cart (session.cart) and ask for confirmation
    // If confirmed, call await createSupabaseOrder(...);
    // Then clear session: userSessions.delete(senderPhone);
    await whatsappService.sendMessage({ to: senderPhone, body: 'Order confirmation step not yet implemented.'});
    return;
  } else if (session.step === 'collecting_address') {
    // TODO: Ask for shipping address if needed
    await whatsappService.sendMessage({ to: senderPhone, body: 'Address collection step not yet implemented.'});
    return;
  } else {
    // Fallback for null step or unrecognized step
    await whatsappService.sendMessage({ 
        to: senderPhone, 
        body: `We were discussing an order (Lead: ${leadInfo.id}). To start over or see product categories, type "categories".`
    });
    // Optionally, reset session to a known starting point if state is truly unknown
    // session.step = 'selecting_category'; 
    // session.cart = [];
    // userSessions.set(senderPhone, session);
    return;
  }
}

async function createSupabaseOrder(
  senderPhone: string, 
  leadInfo: {id: string, isNew: boolean},
  cart: UserOrderSession['cart'], 
  shippingAddress: string | null, // Add other necessary params like payment details if collected
  supabase: SupabaseClient, 
  whatsappService: WhatsAppService
) {
  if (cart.length === 0) {
    await whatsappService.sendMessage({ to: senderPhone, body: 'Your cart is empty. Please add items to order.'});
    return;
  }

  const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.price_per_unit), 0);
  const customerName = leadInfo.isNew ? 'WhatsApp User' : (await supabase.from('leads').select('name').eq('id', leadInfo.id).single()).data?.name || 'Valued Customer';
  const customerPhone = senderPhone;

  const orderToInsert = {
    lead_id: leadInfo.id,
    customer_name: customerName,
    customer_phone: customerPhone,
    // customer_email: from lead if available
    status: 'pending',
    payment_status: 'pending', 
    total_amount: totalAmount,
    shipping_address: shippingAddress,
    source_platform: 'WhatsApp',
    notes: 'Order placed via WhatsApp chatbot.'
    // payment_method, payment_id can be added if you implement a payment flow via WA
  };

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert(orderToInsert)
    .select('id')
    .single();

  if (orderError || !newOrder) {
    console.error('Error creating order in Supabase from WhatsApp:', orderError);
    await whatsappService.sendMessage({ to: senderPhone, body: 'Sorry, there was an issue placing your order. Please try again later.'});
    return;
  }

  const itemsToInsert = cart.map(item => ({
    order_id: newOrder.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price_per_unit_at_time_of_order: item.price_per_unit,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);

  if (itemsError) {
    console.error('Error creating order items from WhatsApp:', itemsError);
    // Attempt to delete the order if items fail - basic rollback
    await supabase.from('orders').delete().eq('id', newOrder.id);
    await whatsappService.sendMessage({ to: senderPhone, body: 'Sorry, there was an issue with items in your order. Please try again.'});
    return;
  }

  await whatsappService.sendMessage({ 
    to: senderPhone, 
    body: `Thank you! Your order #${newOrder.id} for ${cart.length} item(s) (Total: ${totalAmount.toFixed(2)}) has been placed successfully. We will contact you shortly for confirmation and payment. Source: WhatsApp.` 
  });
  console.log(`WhatsApp order ${newOrder.id} created successfully for lead ${leadInfo.id}`);
}

async function handleAppointmentIntent(senderPhone: string, textContent: string, leadInfo: {id: string, isNew: boolean}, supabase: SupabaseClient, whatsappService: WhatsAppService) {
  console.log(`Appointment intent for lead ID: ${leadInfo.id} (isNew: ${leadInfo.isNew}). Text: ${textContent}`);
  await whatsappService.sendMessage({ to: senderPhone, body: `We've received your appointment request (Lead: ${leadInfo.id}). Our team will assist you soon!`});
  // TODO: Implement actual appointment logic (service selection, date/time, etc.)
} 
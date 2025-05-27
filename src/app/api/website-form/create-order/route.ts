import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
// Potentially import sendEmail or other notification services if needed for website orders

interface WebsiteOrderItemDetail {
  product_id: string; // Expecting your internal product ID from the website
  product_name?: string; // Optional, for logging or if ID lookup fails
  quantity: number;
  price_at_order: number; // Website should send the exact price per unit at time of order
}

interface WebsiteOrderData {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: WebsiteOrderItemDetail[];
  shipping_address?: string;
  billing_address?: string; // Optional
  notes?: string;
  total_amount: number; // Website should calculate and send the final total
  payment_method?: string;
  payment_transaction_id?: string;
  source_identifier: string; // e.g., 'main_website_store', 'promo_landing_page_X_store'
  website_order_id?: string; // The order ID from the source website
}

const validateWebsiteOrderRequest = (data: WebsiteOrderData) => {
  if (!data.customer_name) return 'Missing customer_name';
  if (!data.customer_phone) return 'Missing customer_phone';
  if (!data.items || data.items.length === 0) return 'Missing or empty items array';
  if (data.total_amount === undefined || data.total_amount < 0) return 'Missing or invalid total_amount';
  if (!data.source_identifier) return 'Missing source_identifier';
  for (const item of data.items) {
    if (!item.product_id || !item.quantity || item.quantity <= 0 || item.price_at_order === undefined || item.price_at_order < 0) {
      return 'Invalid item data: product_id, positive quantity, and non-negative price_at_order are required.';
    }
  }
  return null;
};

export async function POST(request: Request) {
  try {
    const body: WebsiteOrderData = await request.json();
    console.log('Received Website order:', JSON.stringify(body, null, 2));

    const validationError = validateWebsiteOrderRequest(body);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const {
      customer_name,
      customer_phone,
      customer_email,
      items,
      shipping_address,
      billing_address,
      notes,
      total_amount,
      payment_method,
      payment_transaction_id,
      source_identifier,
      website_order_id
    } = body;

    // 1. Find or create lead
    let leadId: string;
    const { data: existingLead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', customer_phone)
      .single();

    if (leadError && leadError.code !== 'PGRST116') {
      console.error('Error fetching lead for website order:', leadError);
      throw new Error(`Error fetching lead: ${leadError.message}`);
    }

    if (existingLead) {
      leadId = existingLead.id;
      await supabase.from('leads').update({ 
        name: customer_name, 
        email: customer_email || undefined,
        updated_at: new Date().toISOString(),
        source_site: source_identifier // Update source if they re-order from a different site? Or keep original?
      }).eq('id', leadId);
    } else {
      const { data: newLead, error: newLeadError } = await supabase
        .from('leads')
        .insert({
          name: customer_name,
          phone: customer_phone,
          email: customer_email || null,
          source_site: source_identifier,
          status: 'customer', // Directly a customer as they placed an order
        })
        .select('id')
        .single();
      if (newLeadError || !newLead) {
        console.error('Error creating new lead for website order:', newLeadError);
        throw new Error(`Error creating new lead: ${newLeadError?.message || 'Unknown error'}`);
      }
      leadId = newLead.id;
    }

    // 2. Verify product IDs and prepare order items (less complex than WhatsApp as website should send IDs and final prices)
    const processedOrderItems = [];
    for (const item of items) {
      // Optionally, you might still want to verify product_id exists in your DB
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name') // Select minimal fields for validation
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        console.warn(`Product ID ${item.product_id} from website order not found in DB. Item will still be added.`);
        // Decide if this is a hard failure or if you trust the website data
        // return NextResponse.json({ success: false, error: `Product ID "${item.product_id}" not found.` }, { status: 400 });
      }
      processedOrderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_time_of_order: item.price_at_order,
        subtotal: item.price_at_order * item.quantity
      });
    }
    
    // 3. Create the order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        lead_id: leadId,
        customer_name,
        customer_phone,
        customer_email,
        status: 'pending', // Or could be 'processing' if payment is confirmed by website
        payment_status: payment_transaction_id ? 'paid' : 'pending', // Assume 'paid' if payment_id provided
        total_amount: total_amount,
        shipping_address: shipping_address || null,
        billing_address: billing_address || null,
        notes: notes || null,
        payment_method: payment_method || null,
        payment_id: payment_transaction_id || null, // Storing website's payment transaction ID
        source_platform: source_identifier, 
        external_order_id: website_order_id || null, // Storing website's own order ID
      })
      .select('id')
      .single();

    if (orderError || !newOrder) {
      console.error('Error creating new order from website:', orderError);
      throw new Error(`Error creating new order: ${orderError?.message || 'Unknown error'}`);
    }

    // 4. Create order items
    const orderItemsToInsert = processedOrderItems.map(pItem => ({
      order_id: newOrder.id,
      product_id: pItem.product_id,
      quantity: pItem.quantity,
      price_per_unit_at_time_of_order: pItem.price_at_time_of_order,
      subtotal: pItem.subtotal
    }));

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (orderItemsError) {
      console.error('Error creating order items for website order:', orderItemsError);
      // Log and perhaps flag for manual review
    }

    // 5. Optionally, update stock (if your website doesn't handle this exclusively)

    // 6. Optionally, send email confirmation (different from WhatsApp)
    // try {
    //   if(customer_email) await sendOrderConfirmationEmail(customer_email, newOrder.id, body);
    // } catch (emailError) {
    //   console.error('Failed to send website order confirmation email:', emailError);
    // }

    return NextResponse.json({ 
      success: true, 
      message: 'Order created successfully from Website!', 
      crm_order_id: newOrder.id,
      website_order_id: website_order_id
    }, { status: 201 });

  } catch (error: any) {
    console.error('Website Create Order API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Website Create Order API. Use POST to create orders from website forms/webhooks.' });
} 
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin'; // Use admin client for server-side operations

// Interface for incoming order data from the client/website/external system
interface NewOrderItemData {
  product_id: string;
  quantity: number;
  price: number; // Price at the time of order, per unit
}

interface NewOrderData {
  user_id?: string; // If a registered user places the order
  lead_id?: string; // If the order originates from a lead
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  order_items: NewOrderItemData[];
  total_amount: number; // Should be validated against sum of items
  payment_method?: string;
  payment_id?: string;
  payment_status: string; // e.g., 'pending', 'paid', 'failed'
  shipping_address?: string;
  billing_address?: string;
  source_platform: string; // e.g., 'Website1', 'CRM_Manual', 'WhatsApp'
  external_order_id?: string; // ID from the source platform if any
  notes?: string;
  // shipping_provider_name and shipping_tracking_number are usually added after shipment
}

// Basic validation for required fields
const validateOrderRequest = (data: NewOrderData) => {
  const requiredFields: (keyof NewOrderData)[] = [
    'customer_name',
    'customer_phone',
    'customer_email',
    'order_items',
    'total_amount',
    'payment_status',
    'source_platform'
  ];
  for (const field of requiredFields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  if (!Array.isArray(data.order_items) || data.order_items.length === 0) {
    return 'Order must contain at least one item.';
  }
  for (const item of data.order_items) {
    if (!item.product_id || !item.quantity || item.price == null) {
      return 'Each order item must have product_id, quantity, and price.';
    }
    if (item.quantity <= 0) return 'Item quantity must be positive.';
    if (item.price < 0) return 'Item price cannot be negative.';
  }
  // Basic total validation - more robust validation should be server-side based on actual product prices if needed
  const calculatedTotal = data.order_items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  if (Math.abs(calculatedTotal - data.total_amount) > 0.01) { // Allow for small floating point differences
    // return `Total amount mismatch. Calculated: ${calculatedTotal}, Provided: ${data.total_amount}`;
    // For now, we might trust the client total or log a warning
    console.warn(`Total amount discrepancy for a new order. Calculated: ${calculatedTotal}, Provided: ${data.total_amount}. Customer: ${data.customer_name}`);
  }

  // Add more specific validations (e.g., email format, phone format, enum values for status/platform)
  return null;
};

export async function POST(request: Request) {
  try {
    const orderData: NewOrderData = await request.json();

    const validationError = validateOrderRequest(orderData);
    if (validationError) {
      return NextResponse.json({ message: validationError, error: validationError }, { status: 400 });
    }

    // Start a transaction if possible, or handle rollback manually on error
    // Supabase JS client v2 doesn't directly support multi-statement transactions in a single .rpc() call for this easily.
    // We'll insert into orders, then order_items.

    // 1. Prepare and Insert the main order record
    const { order_items, ...mainOrderData } = orderData;
    const orderToInsert = {
      ...mainOrderData,
      status: 'pending', // Default initial status
      // Ensure numeric types are correct if they come as strings
      total_amount: Number(mainOrderData.total_amount),
    };

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderToInsert)
      .select()
      .single();

    if (orderError || !newOrder) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ message: 'Error creating order', error: orderError?.message || 'Unknown error' }, { status: 500 });
    }

    // 2. Prepare and Insert order items
    const itemsToInsert = order_items.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      quantity: Number(item.quantity),
      price_per_unit_at_time_of_order: Number(item.price), // Corrected column name to match DB schema
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Attempt to delete the order if items fail - basic rollback
      await supabase.from('orders').delete().eq('id', newOrder.id);
      return NextResponse.json({ message: 'Error creating order items', error: itemsError.message }, { status: 500 });
    }

    // 3. TODO: Update product stock (could be a trigger or separate function)
    // For each item in order_items:
    //   await supabase.rpc('decrement_stock', { p_product_id: item.product_id, p_quantity: item.quantity })

    // 4. TODO: Send notifications (customer via WhatsApp/email, admin via WhatsApp)

    // Fetch the complete order with items for the response
    const { data: completeOrder, error: fetchError } = await supabase
        .from('orders')
        .select(`*, order_items(*, products(name, image_url)), users(full_name), leads(name)`)
        .eq('id', newOrder.id)
        .single();

    if (fetchError) {
        console.error('Error fetching complete order post-creation:', fetchError);
        // Non-critical, still return success but maybe with a partial response or just the newOrder ID
    }

    return NextResponse.json({
      message: 'Order created successfully!',
      order: completeOrder || newOrder, // Fallback to newOrder if complete fetch fails
    }, { status: 201 });

  } catch (error: any) {
    console.error('API - Create Order Error:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

// GET handler for simple API check
export async function GET() {
  return NextResponse.json({ message: 'Create Orders API. Use POST to create new orders.' });
} 
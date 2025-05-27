import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin'; // Using admin client
import { sendWhatsAppMessage } from '@/lib/whatsapp'; // For sending confirmations

// Define expected structure for product items in the request
interface OrderItemDetail {
  product_name: string; // Name of the product ordered
  quantity: number;
  price_at_order?: number; // Optional: price per unit if provided by echt.im, otherwise lookup
  product_external_id?: string; // Optional: if echt.im can send an ID we map to our products
}

// Define expected structure for the incoming webhook body from echt.im
interface WhatsAppOrderData {
  customer_phone: string;
  customer_name: string;
  customer_email?: string;
  items: OrderItemDetail[];
  shipping_address?: string;
  notes?: string; // Any special instructions from customer
  // Add any other fields echt.im might send, e.g., a unique transaction ID from echt.im
  echt_transaction_id?: string; 
}

// Basic validation for the incoming order data
const validateOrderRequest = (data: WhatsAppOrderData) => {
  if (!data.customer_phone) return 'Missing required field: customer_phone';
  if (!data.customer_name) return 'Missing required field: customer_name';
  if (!data.items || data.items.length === 0) return 'Missing required field: items array cannot be empty';
  for (const item of data.items) {
    if (!item.product_name || !item.quantity || item.quantity <= 0) {
      return 'Invalid item data: product_name and a positive quantity are required for all items.';
    }
  }
  return null;
};

export async function POST(request: Request) {
  try {
    const body: WhatsAppOrderData = await request.json();
    console.log('Received WhatsApp order webhook:', JSON.stringify(body, null, 2));

    const validationError = validateOrderRequest(body);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const {
      customer_phone,
      customer_name,
      customer_email,
      items,
      shipping_address,
      notes,
      echt_transaction_id
    } = body;

    // 1. Find or create lead
    let leadId: string;
    const { data: existingLead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', customer_phone)
      .single();

    if (leadError && leadError.code !== 'PGRST116') { // PGRST116: row not found
      console.error('Error fetching lead for order:', leadError);
      throw new Error(`Error fetching lead: ${leadError.message}`);
    }

    if (existingLead) {
      leadId = existingLead.id;
      // Optionally update lead details if new info is provided
      await supabase.from('leads').update({ 
        name: customer_name, 
        email: customer_email || undefined,
        updated_at: new Date().toISOString()
      }).eq('id', leadId);
    } else {
      const { data: newLead, error: newLeadError } = await supabase
        .from('leads')
        .insert({
          name: customer_name,
          phone: customer_phone,
          email: customer_email || null,
          source_site: 'WhatsApp', // Or more specific like 'WhatsApp Order'
          status: 'new', // Or 'customer' if they placed an order
        })
        .select('id')
        .single();

      if (newLeadError || !newLead) {
        console.error('Error creating new lead for order:', newLeadError);
        throw new Error(`Error creating new lead: ${newLeadError?.message || 'Unknown error'}`);
      }
      leadId = newLead.id;
    }

    // 2. Process order items and calculate total
    let totalAmount = 0;
    const processedOrderItems = [];

    for (const item of items) {
      // Find product in your database
      // Prefer matching by product_external_id if available and reliable, else by name
      let productQuery = supabase.from('products').select('id, name, price, stock');
      if (item.product_external_id) {
        // Assuming product_external_id is a unique field or in a JSONB field we can query
        // This part might need adjustment based on your 'products' schema
        productQuery = productQuery.eq('external_ids->>echt_catalog_item_id', item.product_external_id);
      } else {
        productQuery = productQuery.ilike('name', `%${item.product_name.trim()}%`);
      }
      
      const { data: product, error: productError } = await productQuery.maybeSingle();

      if (productError) {
        console.error('Error fetching product:', item.product_name, productError);
        // Decide how to handle: skip item, fail order, or use a default?
        // For now, we'll throw an error if a product isn't found by name.
        return NextResponse.json({ success: false, error: `Product "${item.product_name}" not found or multiple matches.` }, { status: 400 });
      }
      if (!product) {
         return NextResponse.json({ success: false, error: `Product "${item.product_name}" not found.` }, { status: 400 });
      }

      // Check stock (optional, based on your business logic)
      // if (product.stock < item.quantity) {
      //   return NextResponse.json({ success: false, error: `Insufficient stock for product "${product.name}". Available: ${product.stock}` }, { status: 400 });
      // }

      const priceForThisItem = item.price_at_order ?? product.price; // Use price from webhook if available, else from DB
      totalAmount += priceForThisItem * item.quantity;
      
      processedOrderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price_at_time_of_order: priceForThisItem, // Store the actual price used
        subtotal: priceForThisItem * item.quantity
      });
    }
    
    if (processedOrderItems.length === 0) {
        return NextResponse.json({ success: false, error: "No valid products could be processed for the order." }, { status: 400 });
    }


    // 3. Create the order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        lead_id: leadId,
        customer_name: customer_name, // Denormalize for easier display
        customer_phone: customer_phone, // Denormalize
        customer_email: customer_email, // Denormalize
        status: 'pending', // Default status for new orders
        payment_status: 'pending', // Default payment status
        total_amount: totalAmount,
        shipping_address: shipping_address || null,
        notes: notes || null,
        source_platform: 'WhatsApp', // Important for tracking
        external_order_id: echt_transaction_id || null, // If echt.im provides a unique ID
        // user_id: null, // If you link to a user record directly later
        // payment_method: null, // Can be updated later
      })
      .select('id, external_order_id') // Select the ID of the newly created order
      .single();

    if (orderError || !newOrder) {
      console.error('Error creating new order:', orderError);
      throw new Error(`Error creating new order: ${orderError?.message || 'Unknown error'}`);
    }

    // 4. Create order items
    const orderItemsToInsert = processedOrderItems.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_per_unit_at_time_of_order: item.price_at_time_of_order,
      subtotal: item.subtotal
    }));

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (orderItemsError) {
      console.error('Error creating order items. Order created but items failed:', orderItemsError);
      // Consider how to handle this partial failure. Maybe delete the order or flag for review.
      // For now, we'll report the main order success but log this item error.
      // throw new Error(`Error creating order items: ${orderItemsError.message}`);
       toast.error('Order created, but issue saving items. Please check manually.'); // This toast won't work server-side
    }
    
    // 5. Optionally, update product stock if you manage stock
    // for (const item of processedOrderItems) {
    //   await supabase.rpc('decrement_product_stock', { p_product_id: item.product_id, p_quantity: item.quantity });
    // }


    // 6. Send a confirmation message via WhatsApp (optional)
    try {
      const orderIdentifier = newOrder.external_order_id || newOrder.id.substring(0,8);
      const confirmationMessage = `Hi ${customer_name}, your order (#${orderIdentifier}) for ₹${totalAmount.toFixed(2)} has been received! We will process it shortly. Thank you for shopping with us.`;
      await sendWhatsAppMessage(customer_phone, confirmationMessage);
      console.log(`WhatsApp order confirmation sent to ${customer_phone} for order ${newOrder.id}`);
    } catch (whatsappError: any) {
      console.error(`Failed to send WhatsApp order confirmation to ${customer_phone}:`, whatsappError);
      // Log the error but don't let it fail the entire process
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order created successfully via WhatsApp!', 
      order_id: newOrder.id,
      total_amount: totalAmount,
      items_processed: processedOrderItems.length
    }, { status: 201 });

  } catch (error: any) {
    console.error('WhatsApp Create Order API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

// Optional: Add a GET handler for testing or information
export async function GET() {
  return NextResponse.json({ message: 'WhatsApp Create Order API. Use POST to create orders from WhatsApp webhooks.' });
} 
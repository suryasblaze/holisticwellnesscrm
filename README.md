# Dhruva Holistic Wellness Platform

A comprehensive wellness platform built with Next.js, Supabase, and WhatsApp integration.

## Features

### Module 1: WhatsApp-Based Contact & Registration
- Client registration form with WhatsApp integration
- Automated welcome messages and PDF delivery
- Admin notifications for new leads
- Multi-site integration
- Admin dashboard with lead management

### Module 2: Product Catalog & Order Management
- WhatsApp-style product catalog
- Shopping cart functionality
- Order tracking
- Payment integration (Razorpay/PhonePe)

### Module 3: Healing & Clinical Management
- Client medical data management
- Healer assignment system
- Feedback collection
- Health reminders

### Module 4: Energy Analysis & Healing Progress
- Energy assessment forms
- Progress tracking
- Weekly reports
- Personalized recommendations

### Module 5: Anniversaries & Special Dates CRM
- Important dates management
- Automated greetings
- Event scheduling
- Reminder system

### Module 6: Masterclass & LMS
- WhatsApp-based course access
- Progress tracking
- Content management
- Student engagement

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **APIs**: WhatsApp Business API, Chart.js
- **State Management**: React Context
- **Form Handling**: React Hook Form, Zod
- **Notifications**: React Hot Toast

## Prerequisites

1. Node.js 18+ and npm
2. Supabase account
3. WhatsApp Business API access
4. (Optional) Razorpay/PhonePe account for payments

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/dhruva-wellness.git
   cd dhruva-wellness
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project and set up the database:
   - Create a new project in Supabase
   - Copy the SQL from `src/lib/schema.sql` and run it in the SQL editor
   - Enable Email Auth and Phone Auth in Authentication settings

4. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in the required values:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     WHATSAPP_API_URL=https://graph.facebook.com/v17.0
     WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
     WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
     NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER=your_admin_whatsapp_number
     WELCOME_PDF_URL=https://your-cdn.com/welcome.pdf
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     ```

5. Generate TypeScript types for Supabase:
   ```bash
   npm run generate-types
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/         # React components
├── lib/               # Utilities and configurations
│   ├── supabase.ts   # Supabase client
│   ├── whatsapp.ts   # WhatsApp integration
│   ├── utils.ts      # Helper functions
│   └── schema.sql    # Database schema
├── middleware.ts     # Authentication middleware
└── providers.tsx     # Context providers
```

## Development Workflow

1. **Database Changes**:
   - Add migrations to `src/lib/schema.sql`
   - Apply changes through Supabase dashboard
   - Run `npm run generate-types` to update TypeScript types

2. **Adding New Features**:
   - Create components in `src/components`
   - Add pages in `src/app`
   - Update types and utilities as needed

3. **Testing**:
   - Test WhatsApp integration with test numbers
   - Verify database policies and RLS
   - Check responsive design

## Deployment

1. **Supabase**:
   - Review and apply all migrations
   - Set up proper backups
   - Configure proper security settings

2. **Vercel**:
   - Connect your repository
   - Set environment variables
   - Deploy the application

3. **WhatsApp**:
   - Move from test to production API
   - Update message templates
   - Configure webhook endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Tracking Order and Appointment Sources

To ensure that orders and appointments from different platforms (Website, WhatsApp) are correctly captured and attributed in the CRM/dashboard, specific configurations are required.

### 1. Website Integration

When an order is placed on the Dhruva Holistic Wellness website, the frontend application must be configured to send the order data to the backend API.

**API Endpoint:** `POST /api/website-form/create-order`

**Payload Requirements:**
The frontend should send a JSON payload containing all necessary order details. Critically, to identify the source of the order, the payload **must** include a `source_identifier` field.

**Example `source_identifier` values:**
*   `"DhruvaWebsite_Checkout"`
*   `"Website_ProductPage_QuickOrder"`

This `source_identifier` will be stored in the `orders.source_platform` column in the database, allowing the CRM/dashboard to display and filter orders by their origin.

**Example Frontend JavaScript Snippet (Conceptual):**

```javascript
async function submitOrderToBackend(orderDetails, cartItems) {
  const payload = {
    // ... other fields like user_id or guest_info, shipping_address, etc.
    lead_details: { // Or fetch/create lead separately and pass lead_id
      name: orderDetails.customerName,
      email: orderDetails.customerEmail,
      phone: orderDetails.customerPhone,
      // ... other lead fields
    },
    order_items: cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      price_per_unit_at_time_of_order: item.price // Ensure this is the price at the time of order
    })),
    total_amount: orderDetails.totalAmount,
    payment_method: orderDetails.paymentMethod,
    payment_status: 'pending', // Or as applicable
    shipping_address_id: orderDetails.shippingAddressId, // if applicable
    billing_address_id: orderDetails.billingAddressId, // if applicable
    source_identifier: "DhruvaWebsite_Checkout" // ** IMPORTANT FOR TRACKING **
  };

  try {
    const response = await fetch('/api/website-form/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Order created successfully:', result);
      // Redirect to thank you page or show success message
    } else {
      const errorResult = await response.json();
      console.error('Failed to create order:', errorResult.message);
      // Show error message to user
    }
  } catch (error) {
    console.error('Error submitting order:', error);
    // Show error message to user
  }
}
```

*(The above snippet is conceptual. Actual implementation will depend on your frontend framework and state management.)*

### 2. WhatsApp Integration (via Echt.im)

To process incoming WhatsApp messages for orders and appointments, you need to configure `echt.im` to send webhooks to your application.

**Your Webhook URL:** `https://[your-domain]/api/whatsapp/webhook`
*   Replace `[your-domain]` with your actual deployed application domain.
*   This endpoint handles `GET` requests (for webhook verification by `echt.im`) and `POST` requests (for incoming messages and status updates).

**Configuration within Echt.im:**
You will need to provide the above webhook URL to `echt.im`. The exact location for this setting in the `echt.im` dashboard needs to be confirmed with their support. It might be in a field labeled "Callback URL," "Webhook URL," or potentially the "FlowiseAI Flow-Id" field if it accepts generic URLs.

**Key Information to Request from Echt.im Support:**
To ensure a secure and reliable webhook integration, it's recommended to contact `echt.im` support with the following questions:
1.  **Webhook URL Configuration:** "Where in the `echt.im` dashboard should I configure my application's webhook URL (`https://[your-domain]/api/whatsapp/webhook`) to receive incoming WhatsApp messages?"
2.  **`GET` Request Verification:** "How does `echt.im` perform the `GET` request verification for the webhook? Do you send a specific challenge token or query parameters that my endpoint needs to handle?" (Your current webhook implementation includes a basic `GET` handler that might need adjustment based on their process).
3.  **IP Whitelisting:** "Could you provide the list of IP addresses or IP ranges that `echt.im` will use to send webhooks? This will allow us to whitelist them in our firewall for added security."
4.  **Security Measures:** "Do you support or recommend any other security measures for webhook validation, such as a shared secret token or request signature (e.g., HMAC signature in headers)?"

Once the webhook is correctly configured, your `/api/whatsapp/webhook` route will process incoming messages. The logic within this route (specifically `handleOrderIntent` and `handleAppointmentIntent`) will be responsible for creating leads (with `source_site: 'WhatsApp'`) and orders/appointments (with `source_platform: 'WhatsApp'`).

*(This section will be updated as the WhatsApp order/appointment booking flow is fully implemented.)* 
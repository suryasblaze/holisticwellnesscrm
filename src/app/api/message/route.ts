import { NextResponse } from 'next/server';
import axios from 'axios';

// echt.im API endpoint
const MESSAGING_API_URL = 'https://echt.im/api/v1/message';
const API_TOKEN = process.env.ECHT_API_TOKEN || process.env.NEXT_PUBLIC_ECHT_API_TOKEN;

export async function POST(request: Request) {
  try {
    // Check if API token is available
    if (!API_TOKEN) {
      console.error('Missing API token for echt.im');
      return NextResponse.json({
        success: false,
        error: 'API token not configured. Please add ECHT_API_TOKEN to your .env file.'
      }, { status: 500 });
    }

    // Parse the request body
    const body = await request.json();
    
    // Log the request for debugging
    console.log('Proxy API received request:', body);
    
    // Format the phone number correctly (ensure it has country code)
    let phone = body.phone;
    if (!phone.startsWith('+')) {
      phone = `+${phone}`;
    }
    
    // Build the payload
    const payload = {
      phone: phone,
      message: body.message,
      media_url: body.attachment || null,
      api_token: API_TOKEN  // Add the API token to the payload
    };
    
    console.log('Sending to echt.im API with token');
    
    // Make the request to echt.im API from the server side
    const response = await axios.post(MESSAGING_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Dhruva-Wellness-CRM/1.0',
        'Authorization': `Bearer ${API_TOKEN}`  // Also add token in Authorization header
      },
      timeout: 15000,
    });
    
    console.log('echt.im API response:', response.status, response.data);
    
    // Return the response to the client
    return NextResponse.json({
      success: true,
      status: response.status,
      data: response.data,
    });
  } catch (error: any) {
    console.error('Error in message proxy API:', error);
    
    // Log more detailed error information
    if (axios.isAxiosError(error)) {
      console.error('API request failed details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          // Don't log the full data as it may contain sensitive info
          data: 'REDACTED FOR SECURITY'
        }
      });
    }
    
    // Return error details
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data || null,
    }, { status: 500 });
  }
} 
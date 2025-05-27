import { NextResponse } from 'next/server';
import axios from 'axios';

// API endpoints to try
const ECHT_API_URL = 'https://echt.im/api/v1/message';
const API_TOKEN = process.env.ECHT_API_TOKEN || process.env.NEXT_PUBLIC_ECHT_API_TOKEN;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || '918526454931';
  const provider = searchParams.get('provider') || 'echt';
  
  try {
    console.log(`Testing message API with provider: ${provider}`);

    // Check if API token is available
    if (!API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'API token not configured. Please add ECHT_API_TOKEN to your .env file.'
      }, { status: 500 });
    }
    
    if (provider === 'echt') {
      // Try echt.im API
      const payload = {
        phone: phone.startsWith('+') ? phone : `+${phone}`,
        message: 'This is a test message from Dhruva Wellness CRM',
        media_url: null,
        api_token: API_TOKEN
      };
      
      console.log('Sending to echt.im API with token');
      
      const response = await axios.post(ECHT_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Dhruva-Wellness-CRM/1.0',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        timeout: 15000,
      });
      
      console.log('echt.im API response:', response.status, response.data);
      
      return NextResponse.json({
        success: true,
        provider: 'echt',
        phone: phone,
        status: response.status,
        data: response.data,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Unknown provider',
      });
    }
  } catch (error: any) {
    console.error('Error in test message API:', error);
    
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
          data: 'REDACTED FOR SECURITY'
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data || null,
    }, { status: 500 });
  }
} 
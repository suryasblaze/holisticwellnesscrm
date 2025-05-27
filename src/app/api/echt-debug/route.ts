import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone') || '918526454931';
  const message = searchParams.get('message') || 'Test message from Dhruva Wellness CRM';
  
  // Get API token
  const API_TOKEN = process.env.ECHT_API_TOKEN || process.env.NEXT_PUBLIC_ECHT_API_TOKEN;
  
  // Test results
  type RequestResult =
    | { type: string; status: number; data: any; success: true }
    | { type: string; error: string; response: any; success: false };
  const results: {
    environment: {
      nodeEnv: string | undefined;
      hasApiToken: boolean;
      tokenLength: number;
    };
    phoneFormat: {
      original: string;
      withPlus: string;
      validation: string;
    };
    requests: RequestResult[];
  } = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasApiToken: !!API_TOKEN,
      tokenLength: API_TOKEN ? API_TOKEN.length : 0,
    },
    phoneFormat: {
      original: phone,
      withPlus: phone.startsWith('+') ? phone : `+${phone}`,
      validation: /^\+[1-9]\d{6,14}$/.test(phone.startsWith('+') ? phone : `+${phone}`) ? 'valid' : 'invalid'
    },
    requests: []
  };
  
  try {
    if (!API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'API token not configured',
        results
      }, { status: 500 });
    }
    
    // Format phone with plus
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    // Make the first request with token in payload
    const payload1 = {
      phone: formattedPhone,
      message: `${message} (test 1 - token in payload)`,
      media_url: null,
      api_token: API_TOKEN
    };
    
    try {
      const response1 = await axios.post('https://echt.im/api/v1/message', payload1, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Dhruva-Wellness-CRM/1.0'
        },
        timeout: 15000,
      });
      
      results.requests.push({
        type: 'token_in_payload',
        status: response1.status,
        data: response1.data,
        success: true
      });
    } catch (error: any) {
      results.requests.push({
        type: 'token_in_payload',
        error: error.message,
        response: error.response?.data || null,
        success: false
      });
    }
    
    // Make the second request with token in Authorization header
    const payload2 = {
      phone: formattedPhone,
      message: `${message} (test 2 - token in header)`,
      media_url: null
    };
    
    try {
      const response2 = await axios.post('https://echt.im/api/v1/message', payload2, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Dhruva-Wellness-CRM/1.0',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        timeout: 15000,
      });
      
      results.requests.push({
        type: 'token_in_header',
        status: response2.status,
        data: response2.data,
        success: true
      });
    } catch (error: any) {
      results.requests.push({
        type: 'token_in_header',
        error: error.message,
        response: error.response?.data || null,
        success: false
      });
    }
    
    // Make the third request with token in both places
    const payload3 = {
      phone: formattedPhone,
      message: `${message} (test 3 - token in both)`,
      media_url: null,
      api_token: API_TOKEN
    };
    
    try {
      const response3 = await axios.post('https://echt.im/api/v1/message', payload3, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Dhruva-Wellness-CRM/1.0',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        timeout: 15000,
      });
      
      results.requests.push({
        type: 'token_in_both',
        status: response3.status,
        data: response3.data,
        success: true
      });
    } catch (error: any) {
      results.requests.push({
        type: 'token_in_both',
        error: error.message,
        response: error.response?.data || null,
        success: false
      });
    }
    
    return NextResponse.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error('Error in echt debug API:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }
} 
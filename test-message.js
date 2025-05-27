// Test script for sending a message via the echt.im API
const axios = require('axios');

// Replace with your phone number (including country code)
const PHONE_NUMBER = '918526454931'; // Replace with actual number

// API endpoint
const API_URL = 'https://echt.im/api/v1/message';

async function sendTestMessage() {
  try {
    console.log('Sending test message to:', PHONE_NUMBER);
    
    const payload = {
      phone: PHONE_NUMBER,
      message: 'This is a test message from Dhruva Wellness CRM',
      media_url: null,
    };
    
    console.log('Payload:', JSON.stringify(payload));
    
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    console.log('Test message sent successfully!');
  } catch (error) {
    console.error('Error sending test message:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('API error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
  }
}

// Run the test
sendTestMessage(); 
# Messaging Integration Setup Guide

## Overview
This guide explains how to set up the messaging integration for the Dhruva Holistic Wellness CRM system. The messaging system is used for:
1. Sending welcome messages to new clients
2. Sending welcome PDF documents
3. Notifying administrators about new leads

## API Endpoint
The system uses the echt.im API endpoint:
```
https://echt.im/api/v1/message
```

## Required Environment Variables
Add the following to your `.env.local` file:

```
# For PDF attachments (optional)
NEXT_PUBLIC_WELCOME_PDF_URL=https://example.com/welcome.pdf

# Admin notification number
NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER=919876543210

# Enable mock mode for development (no real messages sent)
# NEXT_PUBLIC_ENABLE_MOCK_MESSAGES=true
```

## Message Templates

The system uses the following approved message template:

### Welcome Message
```
Subject: Test Meeting Reminder - ECHT

Hi [Name],

Just a friendly reminder about our meeting today at 11.30 regarding ECHT.

See you there,
Rajan
```

### Admin Notification
```
Subject: New Lead Alert - ECHT

Hi Team,

A new lead has been registered:

Name: [Name]
Phone: [Phone]
Service: [Service]
Source: [Source]

Please follow up soon.

Regards,
ECHT System
```

## Development Mode

The application includes a mock mode for development that activates when:
1. The app is running in development mode (NODE_ENV === 'development')
2. The environment variable NEXT_PUBLIC_ENABLE_MOCK_MESSAGES is set to 'true'

In mock mode:
- Messages are logged to the console instead of being sent
- The registration process continues normally without sending real messages
- This allows development without consuming real API calls

To enable mock mode, add this to your `.env.local`:
```
NEXT_PUBLIC_ENABLE_MOCK_MESSAGES=true
```

## Troubleshooting

If you encounter issues with message integration:

1. **Check your network connection** to ensure API calls can reach the echt.im server
2. **Check the browser console** for detailed error messages
3. **Verify the formatting** of phone numbers (system will attempt to format to include country code) 
import axios from 'axios';

// Use the new echt.im API endpoint
const MESSAGING_API_URL = 'https://echt.im/api/v1/message';
const WELCOME_PDF_URL = process.env.NEXT_PUBLIC_WELCOME_PDF_URL;

// Check if we're in development mode with mock enabled
const IS_MOCK_MODE = process.env.NODE_ENV === 'development' && 
  process.env.NEXT_PUBLIC_ENABLE_MOCK_MESSAGES === 'true';

interface WhatsAppMessage {
  to: string;
  body: string;
  attachment?: string;
}

export class WhatsAppService {
  private static instance: WhatsAppService;
  private client: typeof axios;
  private mockMode: boolean;

  private constructor() {
    this.mockMode = IS_MOCK_MODE;
    
    // Set up the axios client
    this.client = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
      // Add a longer timeout since messaging APIs can be slow
      timeout: 10000,
    });
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  public formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Make sure the number starts with 91 (India country code)
    if (cleaned.startsWith('91') && cleaned.length >= 12) {
      return cleaned; // Already has country code
    } else if (cleaned.length >= 10) {
      return `91${cleaned.slice(-10)}`; // Add country code to the last 10 digits
    }
    
    // Return original if we can't format it properly
    return cleaned;
  }

  public async sendMessage(message: WhatsAppMessage): Promise<void> {
    try {
      // If in mock mode, just log the message and return
      if (this.mockMode) {
        console.log('[MOCK] Message:', message);
        return;
      }
      
      console.log('Sending message to:', message.to);
      
      // Format the data according to the echt.im API requirements
      const payload = {
        phone: message.to, // Ensure this includes country code
        message: message.body,
        media_url: message.attachment || null,
      };
      
      console.log('API payload:', JSON.stringify(payload));
      
      // Send the real API request
      const response = await this.client.post(MESSAGING_API_URL, payload);
      
      console.log('API response:', response.status, response.data);
      
      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('API error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });
      }
      
      throw new Error('Failed to send message. Check console for details.');
    }
  }

  public async sendWelcomeMessage(phone: string, name: string): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    
    if (formattedPhone.length < 12) {
      console.warn(`Phone number ${phone} seems invalid after formatting to ${formattedPhone}`);
    }
    
    const message: WhatsAppMessage = {
      to: formattedPhone,
      body: `Hi ${name},

Just a friendly reminder about our meeting today at 11.30 regarding ECHT.

See you there,
Rajan`,
    };

    await this.sendMessage(message);
  }

  public async sendWelcomePDF(phone: string): Promise<void> {
    // Skip if no PDF URL is defined
    if (!WELCOME_PDF_URL && !this.mockMode) {
      console.warn('No welcome PDF URL defined, skipping send');
      return;
    }
    
    const formattedPhone = this.formatPhoneNumber(phone);
    const message: WhatsAppMessage = {
      to: formattedPhone,
      body: 'Here is your complimentary mindfulness guide 🙏',
      attachment: WELCOME_PDF_URL || 'https://example.com/mock-welcome.pdf',
    };

    await this.sendMessage(message);
  }

  public async notifyAdmin(
    adminPhone: string,
    leadName: string,
    leadPhone: string,
    serviceType: string,
    sourceSite: string
  ): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(adminPhone);
    const message: WhatsAppMessage = {
      to: formattedPhone,
      body: `Subject: New Lead Alert - ECHT

Hi Team,

A new lead has been registered:

Name: ${leadName}
Phone: ${leadPhone}
Service: ${serviceType}
Source: ${sourceSite}

Please follow up soon.

Regards,
ECHT System`,
    };

    await this.sendMessage(message);
  }

  public async sendFollowUpReminder(
    phone: string,
    name: string,
    appointmentDate: string,
    serviceType: string
  ): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    const message: WhatsAppMessage = {
      to: formattedPhone,
      body: `Subject: Appointment Reminder - ECHT\n\nHi ${name},\n\nJust a friendly reminder about your ${serviceType} appointment on ${appointmentDate}.\n\nSee you there,\nECHT Team`,
    };

    await this.sendMessage(message);
  }
}

// Export a standalone function for generic message sending
export async function sendWhatsAppMessage(to: string, body: string, attachment?: string): Promise<void> {
  const service = WhatsAppService.getInstance();
  
  const formattedTo = service.formatPhoneNumber(to);
  const waMessage: WhatsAppMessage = {
    to: formattedTo,
    body: body,
    attachment: attachment,
  };
  await service.sendMessage(waMessage);
} 
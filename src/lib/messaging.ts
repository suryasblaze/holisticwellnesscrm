import axios from 'axios';

// Use our own Next.js API route as a proxy to avoid CORS issues
const MESSAGING_API_URL = '/api/message';
const WELCOME_PDF_URL = process.env.NEXT_PUBLIC_WELCOME_PDF_URL;

// Check if we're in development mode with mock enabled
const IS_MOCK_MODE = process.env.NODE_ENV === 'development' && 
  process.env.NEXT_PUBLIC_ENABLE_MOCK_MESSAGES === 'true';

interface Message {
  to: string;
  body: string;
  attachment?: string;
}

export class MessagingService {
  private static instance: MessagingService;
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

  public static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  private formatPhoneNumber(phone: string): string {
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

  private async sendMessage(message: Message): Promise<void> {
    try {
      // If in mock mode, just log the message and return
      if (this.mockMode) {
        console.log('[MOCK] Message:', message);
        return;
      }
      
      console.log('Sending message to:', message.to);
      
      // Format the data for our proxy API
      const payload = {
        phone: message.to, // Ensure this includes country code
        message: message.body,
        attachment: message.attachment || null,
      };
      
      console.log('API payload:', JSON.stringify(payload));
      
      // Send the request to our proxy API instead of directly to echt.im
      const response = await this.client.post(MESSAGING_API_URL, payload);
      
      console.log('API response:', response.status, response.data);
      
      if (!response.data.success) {
        throw new Error(`API request failed: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('API error details:', {
          status: error.response?.status,
          data: error.response?.data,
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
    
    const message: Message = {
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
    const message: Message = {
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
    const message: Message = {
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
    const message: Message = {
      to: formattedPhone,
      body: `Subject: Appointment Reminder - ECHT

Hi ${name},

Just a friendly reminder about your ${serviceType} appointment on ${appointmentDate}.

See you there,
ECHT Team`,
    };

    await this.sendMessage(message);
  }

  public async sendFeedbackRequest(
    phone: string,
    name: string,
    sessionType: string,
    sessionDate: string
  ): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    const message: Message = {
      to: formattedPhone,
      body: `Hi ${name},

Thank you for your ${sessionType} session on ${sessionDate}. We value your feedback to improve our services.

Please take a moment to share your experience:
1. How would you rate the session (1-10)?
2. What improvements did you notice?
3. Any additional comments?

Your feedback helps us serve you better.

Best regards,
ECHT Team`,
    };

    await this.sendMessage(message);
  }

  public async sendHealthCheckupReminder(
    phone: string,
    name: string,
    checkupType: string,
    dueDate: string
  ): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    const message: Message = {
      to: formattedPhone,
      body: `Hi ${name},

This is a reminder for your upcoming ${checkupType} checkup due on ${dueDate}.

Regular health monitoring is crucial for your well-being. Please schedule your checkup and upload the results to our platform.

Need help? Feel free to reach out.

Best regards,
ECHT Team`,
    };

    await this.sendMessage(message);
  }

  public async sendProgressSummary(
    phone: string,
    name: string,
    summary: {
      initialCondition: string;
      currentSymptoms: string;
      improvementPercentage: number;
      medicalAnalysis: string;
      energyAnalysis: string;
      recommendations: string;
    }
  ): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    const message: Message = {
      to: formattedPhone,
      body: `Hi ${name},

Here's your health progress summary:

Initial Condition:
${summary.initialCondition}

Current Symptoms:
${summary.currentSymptoms}

Improvement: ${summary.improvementPercentage}%

Medical Analysis:
${summary.medicalAnalysis}

Energy Analysis:
${summary.energyAnalysis}

Recommendations:
${summary.recommendations}

Keep up the good work! Let us know if you have any questions.

Best regards,
ECHT Team`,
    };

    await this.sendMessage(message);
  }
} 
// ESCC Core Service - Enhanced with TypeScript interfaces
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export interface WhatsAppDispatchResult {
  success: boolean;
  dispatched?: number;
  skipped?: number;
  failed?: number;
  details?: Array<{
    staffId: number;
    status: 'sent' | 'skipped' | 'failed' | 'mock-sent';
    name?: string;
    phone?: string;
    messageId?: string;
    error?: string;
  }>;
  message?: string;
  note?: string;
}

export interface AppleCalendarResult {
  success: boolean;
  events: CalendarEvent[];
  count: number;
  error?: string;
  note?: string;
}

export class ESCCCore {
  private static baseURL = typeof window !== 'undefined' ? window.location.origin : '';

  // Send WhatsApp notification via backend API
  static async sendWhatsApp(
    eventId: number,
    staffIds: number[]
  ): Promise<WhatsAppDispatchResult> {
    try {
      if (!eventId || !Array.isArray(staffIds) || staffIds.length === 0) {
        return {
          success: false,
          message: 'Invalid parameters: eventId and non-empty staffIds array required'
        };
      }

      const response = await fetch(`${this.baseURL}/api/dispatch-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, staffIds })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('WhatsApp dispatch failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send notification'
      };
    }
  }

  // Sync Apple Calendar — GET matches api/calendar/apple.js and local server.js
  static async syncAppleCalendar(calendarUrl?: string): Promise<AppleCalendarResult> {
    try {
      const params = new URLSearchParams();
      if (calendarUrl) params.set('url', calendarUrl);
      const qs = params.toString();
      const response = await fetch(
        `${this.baseURL}/api/calendar/apple${qs ? `?${qs}` : ''}`
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Apple Calendar sync failed:', error);
      return {
        success: false,
        events: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Failed to sync Apple Calendar'
      };
    }
  }

  // Run expert panel (test connectivity)
  static async runPanel(config: { title: string; description: string }): Promise<string> {
    try {
      console.log(`Running panel: ${config.title}`);
      console.log(`Description: ${config.description}`);

      const appleTest = await this.syncAppleCalendar();

      if (appleTest.success) {
        return `Panel is active and fully operational.\n\nApple Calendar: Connected (${appleTest.count} events found)`;
      }
      return `Panel active. Apple Calendar: ${appleTest.error || 'Connection issue'}`;
    } catch (error) {
      return `Panel error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Sync Google Calendar — GET matches api/calendar/google.js and local server.js
  static async syncGoogleCalendar(): Promise<AppleCalendarResult> {
    try {
      const response = await fetch(`${this.baseURL}/api/calendar/google`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Google Calendar sync failed:', error);
      return {
        success: false,
        events: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Failed to sync Google Calendar'
      };
    }
  }
}

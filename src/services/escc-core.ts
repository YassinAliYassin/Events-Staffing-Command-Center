// ESCC Core Service - Enhanced with TypeScript interfaces
import { handleAgentIntent } from '../agents/registry';

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
  source?: string;
}

export class ESCCCore {
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

      const result = await handleAgentIntent('dispatch', 'dispatch.event', { eventId, staffIds });
      return result as WhatsAppDispatchResult;
    } catch (error) {
      console.error('WhatsApp dispatch failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send notification'
      };
    }
  }

  // Sync Apple Calendar — delegates to the calendar agent (calendar.sync.apple),
  // which hits the same api/calendar/apple.js endpoint.
  static async syncAppleCalendar(): Promise<AppleCalendarResult> {
    try {
      const result = await handleAgentIntent('calendar', 'calendar.sync.apple');
      return result as AppleCalendarResult;
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

  // Sync Google Calendar — delegates to the calendar agent (calendar.sync.google),
  // which hits the same api/calendar/google.js endpoint.
  static async syncGoogleCalendar(): Promise<AppleCalendarResult> {
    try {
      const result = await handleAgentIntent('calendar', 'calendar.sync.google');
      return result as AppleCalendarResult;
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

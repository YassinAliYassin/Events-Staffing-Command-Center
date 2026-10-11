import { handleAgentIntent } from '../agents/registry';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export interface CalendarSyncResult {
  success: boolean;
  events: CalendarEvent[];
  count: number;
  error?: string;
  note?: string;
  source?: string;
}

export class ESCCCore {
  static async syncAppleCalendar(): Promise<CalendarSyncResult> {
    try {
      const result = await handleAgentIntent('calendar', 'calendar.sync.apple');
      return result as CalendarSyncResult;
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

  static async syncGoogleCalendar(): Promise<CalendarSyncResult> {
    try {
      const result = await handleAgentIntent('calendar', 'calendar.sync.google');
      return result as CalendarSyncResult;
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

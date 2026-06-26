import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface RecordEventParams {
  eventType: string;
  businessId: string;
  entityType?: string;
  entityId?: string;
  metadata?: Json;
}

export async function recordAnalyticsEvent({
  eventType,
  businessId,
  entityType,
  entityId,
  metadata = {},
}: RecordEventParams): Promise<string | null> {
  const { data, error } = await supabase.rpc('record_analytics_event', {
    p_event_type: eventType,
    p_business_id: businessId,
    p_entity_type: entityType ?? undefined,
    p_entity_id: entityId ?? undefined,
    p_metadata: metadata,
  });

  if (error) {
    console.error('Failed to record analytics event:', error);
    return null;
  }

  return data as string;
}

export const EVENT_TYPES = {
  PROFILE_VIEW: 'profile_view',
  PROFILE_SAVE: 'profile_save',
  WEBSITE_CLICK: 'website_click',
  PHONE_CLICK: 'phone_click',
  DIRECTION_REQUEST: 'direction_request',
  CHECKIN: 'checkin',
  EVENT_RSVP: 'event_rsvp',
  EVENT_VIEW: 'event_view',
  DEAL_VIEW: 'deal_view',
  DEAL_REDEMPTION: 'deal_redemption',
  PULSE_VIEW: 'pulse_view',
  JOB_VIEW: 'job_view',
  JOB_APPLY_CLICK: 'job_apply_click',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  SEARCH_APPEARANCE: 'search_appearance',
  SHARE: 'share',
} as const;

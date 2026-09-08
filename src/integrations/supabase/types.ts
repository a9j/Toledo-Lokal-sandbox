export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      address_verifications: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          parcel_id: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          parcel_id: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          parcel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "address_verifications_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: string | null
          query_details: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          query_details?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          query_details?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_chat_usage: {
        Row: {
          created_at: string
          id: string
          message_count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          business_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string | null
          business_id: string
          created_at: string
          id: string
          link_label: string | null
          link_url: string | null
          sent_at: string | null
          title: string
        }
        Insert: {
          body?: string | null
          business_id: string
          created_at?: string
          id?: string
          link_label?: string | null
          link_url?: string | null
          sent_at?: string | null
          title: string
        }
        Update: {
          body?: string | null
          business_id?: string
          created_at?: string
          id?: string
          link_label?: string | null
          link_url?: string | null
          sent_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "announcements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          active: boolean
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          owner_id: string | null
          rate_limit_per_hour: number
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          owner_id?: string | null
          rate_limit_per_hour?: number
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          owner_id?: string | null
          rate_limit_per_hour?: number
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: []
      }
      api_requests: {
        Row: {
          at: string
          id: number
          key_id: string
          resource: string
        }
        Insert: {
          at?: string
          id?: number
          key_id: string
          resource: string
        }
        Update: {
          at?: string
          id?: number
          key_id?: string
          resource?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_requests_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      autopilot_preferences: {
        Row: {
          digest_enabled: boolean
          max_per_day: number
          quiet_from: number
          quiet_until: number
          radius_miles: number
          topics: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          digest_enabled?: boolean
          max_per_day?: number
          quiet_from?: number
          quiet_until?: number
          radius_miles?: number
          topics?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          digest_enabled?: boolean
          max_per_day?: number
          quiet_from?: number
          quiet_until?: number
          radius_miles?: number
          topics?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      beta_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          platform: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          platform: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          platform?: string
          source?: string | null
        }
        Relationships: []
      }
      billing_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          name: string
          price_cents: number
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name: string
          price_cents?: number
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      boosts: {
        Row: {
          amount_paid: number
          business_id: string
          content_id: string
          content_type: string
          created_at: string
          end_date: string
          id: string
          start_date: string
        }
        Insert: {
          amount_paid: number
          business_id: string
          content_id: string
          content_type: string
          created_at?: string
          end_date: string
          id?: string
          start_date?: string
        }
        Update: {
          amount_paid?: number
          business_id?: string
          content_id?: string
          content_type?: string
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "boosts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boosts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "boosts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boosts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boosts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_admins: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["business_admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["business_admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["business_admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_admins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_admins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_admins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_admins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_admins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_categories: {
        Row: {
          business_id: string
          category_id: string
          is_primary: boolean
        }
        Insert: {
          business_id: string
          category_id: string
          is_primary?: boolean
        }
        Update: {
          business_id?: string
          category_id?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "business_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_features: {
        Row: {
          business_id: string
          created_at: string
          food_truck_enabled: boolean | null
          hiring_enabled: boolean | null
          id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          food_truck_enabled?: boolean | null
          hiring_enabled?: boolean | null
          id?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          food_truck_enabled?: boolean | null
          hiring_enabled?: boolean | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_features_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_features_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_features_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_features_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_features_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_follows: {
        Row: {
          business_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_follows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_insights: {
        Row: {
          business_id: string
          detail: string | null
          generated_at: string
          headline: string
          id: string
          kind: string
          metrics: Json
          priority: number
        }
        Insert: {
          business_id: string
          detail?: string | null
          generated_at?: string
          headline: string
          id?: string
          kind: string
          metrics?: Json
          priority?: number
        }
        Update: {
          business_id?: string
          detail?: string | null
          generated_at?: string
          headline?: string
          id?: string
          kind?: string
          metrics?: Json
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_insights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_insights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_insights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_insights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_insights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_invitations: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invited_by: string
          phone: string | null
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by: string
          phone?: string | null
          role?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          phone?: string | null
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_locations: {
        Row: {
          business_id: string
          city: string
          created_at: string
          hours: Json | null
          id: string
          is_active: boolean
          is_primary: boolean
          label: string | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          phone: string | null
          state: string
          street_address: string
          zip_code: string
        }
        Insert: {
          business_id: string
          city?: string
          created_at?: string
          hours?: Json | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          phone?: string | null
          state?: string
          street_address: string
          zip_code: string
        }
        Update: {
          business_id?: string
          city?: string
          created_at?: string
          hours?: Json | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          label?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          phone?: string | null
          state?: string
          street_address?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_loop_settings: {
        Row: {
          business_id: string
          created_at: string
          founding_50_expires_at: string | null
          founding_50_start_date: string | null
          id: string
          is_active: boolean | null
          is_founding_50: boolean | null
          is_founding_member: boolean | null
          loop_tier_id: string
          month_reset_at: string | null
          points_issued_this_month: number | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string
          wallet_frozen: boolean | null
          wallet_frozen_reason: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          founding_50_expires_at?: string | null
          founding_50_start_date?: string | null
          id?: string
          is_active?: boolean | null
          is_founding_50?: boolean | null
          is_founding_member?: boolean | null
          loop_tier_id?: string
          month_reset_at?: string | null
          points_issued_this_month?: number | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          wallet_frozen?: boolean | null
          wallet_frozen_reason?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          founding_50_expires_at?: string | null
          founding_50_start_date?: string | null
          id?: string
          is_active?: boolean | null
          is_founding_50?: boolean | null
          is_founding_member?: boolean | null
          loop_tier_id?: string
          month_reset_at?: string | null
          points_issued_this_month?: number | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          wallet_frozen?: boolean | null
          wallet_frozen_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_loop_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_loop_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_loop_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_loop_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_loop_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_loop_settings_loop_tier_id_fkey"
            columns: ["loop_tier_id"]
            isOneToOne: false
            referencedRelation: "loop_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_staff: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_staff_admin_log: {
        Row: {
          action: string
          business_id: string
          created_at: string
          id: string
          invitation_id: string | null
          note: string | null
          performed_by: string | null
          role: string | null
          staff_id: string | null
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          business_id: string
          created_at?: string
          id?: string
          invitation_id?: string | null
          note?: string | null
          performed_by?: string | null
          role?: string | null
          staff_id?: string | null
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string
          created_at?: string
          id?: string
          invitation_id?: string | null
          note?: string | null
          performed_by?: string | null
          role?: string | null
          staff_id?: string | null
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_staff_admin_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_admin_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_staff_admin_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_admin_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_staff_admin_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_supplier_spend: {
        Row: {
          monthly_spend: number | null
          supplier_link_id: string
          updated_at: string
        }
        Insert: {
          monthly_spend?: number | null
          supplier_link_id: string
          updated_at?: string
        }
        Update: {
          monthly_spend?: number | null
          supplier_link_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_supplier_spend_supplier_link_id_fkey"
            columns: ["supplier_link_id"]
            isOneToOne: true
            referencedRelation: "business_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_suppliers: {
        Row: {
          business_id: string
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          is_local: boolean
          supplier_id: string | null
          supplier_name: string | null
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_local?: boolean
          supplier_id?: string | null
          supplier_name?: string | null
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_local?: boolean
          supplier_id?: string | null
          supplier_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          average_rating: number | null
          category: Database["public"]["Enums"]["business_category"]
          category_id: string | null
          connected_by_connector_id: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          editor_pick_image: string | null
          facebook: string | null
          featured: boolean | null
          founding_number: number | null
          founding_quote: string | null
          hours: Json | null
          id: string
          instagram: string | null
          is_nonprofit: boolean
          logo_url: string | null
          name: string
          neighborhood_id: string | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          onboarding_step: number
          owner_image_url: string | null
          owner_name: string | null
          owner_user_id: string | null
          ownership_review_notes: string | null
          ownership_review_started_at: string | null
          ownership_review_status: string
          phone: string | null
          photos: string[] | null
          plan: string
          profile_modules: Json
          profile_picture_url: string | null
          referral_source: string | null
          review_count: number | null
          slug: string | null
          status: string
          story: string | null
          tier_assigned_at: string | null
          tier_assigned_by: string | null
          tier_badge_visible: boolean
          tier_revoked_at: string | null
          tier_revoked_by: string | null
          tier_status: string
          tiktok: string | null
          updated_at: string
          verified: boolean | null
          visit_link_type: Database["public"]["Enums"]["visit_link_type"] | null
          visit_link_url: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          category?: Database["public"]["Enums"]["business_category"]
          category_id?: string | null
          connected_by_connector_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          editor_pick_image?: string | null
          facebook?: string | null
          featured?: boolean | null
          founding_number?: number | null
          founding_quote?: string | null
          hours?: Json | null
          id?: string
          instagram?: string | null
          is_nonprofit?: boolean
          logo_url?: string | null
          name: string
          neighborhood_id?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          onboarding_step?: number
          owner_image_url?: string | null
          owner_name?: string | null
          owner_user_id?: string | null
          ownership_review_notes?: string | null
          ownership_review_started_at?: string | null
          ownership_review_status?: string
          phone?: string | null
          photos?: string[] | null
          plan?: string
          profile_modules?: Json
          profile_picture_url?: string | null
          referral_source?: string | null
          review_count?: number | null
          slug?: string | null
          status?: string
          story?: string | null
          tier_assigned_at?: string | null
          tier_assigned_by?: string | null
          tier_badge_visible?: boolean
          tier_revoked_at?: string | null
          tier_revoked_by?: string | null
          tier_status?: string
          tiktok?: string | null
          updated_at?: string
          verified?: boolean | null
          visit_link_type?:
            | Database["public"]["Enums"]["visit_link_type"]
            | null
          visit_link_url?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          category?: Database["public"]["Enums"]["business_category"]
          category_id?: string | null
          connected_by_connector_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          editor_pick_image?: string | null
          facebook?: string | null
          featured?: boolean | null
          founding_number?: number | null
          founding_quote?: string | null
          hours?: Json | null
          id?: string
          instagram?: string | null
          is_nonprofit?: boolean
          logo_url?: string | null
          name?: string
          neighborhood_id?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          onboarding_step?: number
          owner_image_url?: string | null
          owner_name?: string | null
          owner_user_id?: string | null
          ownership_review_notes?: string | null
          ownership_review_started_at?: string | null
          ownership_review_status?: string
          phone?: string | null
          photos?: string[] | null
          plan?: string
          profile_modules?: Json
          profile_picture_url?: string | null
          referral_source?: string | null
          review_count?: number | null
          slug?: string | null
          status?: string
          story?: string | null
          tier_assigned_at?: string | null
          tier_assigned_by?: string | null
          tier_badge_visible?: boolean
          tier_revoked_at?: string | null
          tier_revoked_by?: string | null
          tier_status?: string
          tiktok?: string | null
          updated_at?: string
          verified?: boolean | null
          visit_link_type?:
            | Database["public"]["Enums"]["visit_link_type"]
            | null
          visit_link_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_connected_by_connector_id_fkey"
            columns: ["connected_by_connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string | null
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug?: string | null
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          business_id: string
          challenge_id: string
          id: string
          user_id: string
          visited_at: string
        }
        Insert: {
          business_id: string
          challenge_id: string
          id?: string
          user_id: string
          visited_at?: string
        }
        Update: {
          business_id?: string
          challenge_id?: string
          id?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "challenge_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          badge_color: string | null
          badge_icon: string | null
          category_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          featured: boolean | null
          id: string
          required_visits: number | null
          reward_description: string | null
          start_date: string | null
          status: string | null
          target_entity_id: string | null
          title: string
        }
        Insert: {
          badge_color?: string | null
          badge_icon?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          featured?: boolean | null
          id?: string
          required_visits?: number | null
          reward_description?: string | null
          start_date?: string | null
          status?: string | null
          target_entity_id?: string | null
          title: string
        }
        Update: {
          badge_color?: string | null
          badge_icon?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          featured?: boolean | null
          id?: string
          required_visits?: number | null
          reward_description?: string | null
          start_date?: string | null
          status?: string | null
          target_entity_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "city_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          accent_color: string | null
          config: Json
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          primary_color: string | null
          region: string | null
          slug: string
          tagline: string | null
        }
        Insert: {
          accent_color?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          primary_color?: string | null
          region?: string | null
          slug: string
          tagline?: string | null
        }
        Update: {
          accent_color?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          region?: string | null
          slug?: string
          tagline?: string | null
        }
        Relationships: []
      }
      city_campaigns: {
        Row: {
          campaign_type: string
          created_at: string
          created_by: string | null
          description: string | null
          emoji: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          point_multiplier: number
          starts_at: string | null
          title: string
        }
        Insert: {
          campaign_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          point_multiplier?: number
          starts_at?: string | null
          title: string
        }
        Update: {
          campaign_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          point_multiplier?: number
          starts_at?: string | null
          title?: string
        }
        Relationships: []
      }
      city_edges: {
        Row: {
          created_at: string
          from_entity: string
          id: string
          metadata: Json
          relation: string
          to_entity: string
          weight: number
        }
        Insert: {
          created_at?: string
          from_entity: string
          id?: string
          metadata?: Json
          relation: string
          to_entity: string
          weight?: number
        }
        Update: {
          created_at?: string
          from_entity?: string
          id?: string
          metadata?: Json
          relation?: string
          to_entity?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "city_edges_from_entity_fkey"
            columns: ["from_entity"]
            isOneToOne: false
            referencedRelation: "city_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_edges_to_entity_fkey"
            columns: ["to_entity"]
            isOneToOne: false
            referencedRelation: "city_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      city_entities: {
        Row: {
          city_id: string | null
          confidence: number | null
          created_at: string
          data_source_id: string | null
          embedded_at: string | null
          embedding: string | null
          id: string
          kind: Database["public"]["Enums"]["entity_kind"]
          location: unknown
          lokal_org_id: string | null
          lokal_place_id: string | null
          name: string
          neighborhood_id: string | null
          search_blurb: string | null
          search_text: unknown
          source_id: string
          source_table: string
          updated_at: string
        }
        Insert: {
          city_id?: string | null
          confidence?: number | null
          created_at?: string
          data_source_id?: string | null
          embedded_at?: string | null
          embedding?: string | null
          id?: string
          kind: Database["public"]["Enums"]["entity_kind"]
          location?: unknown
          lokal_org_id?: string | null
          lokal_place_id?: string | null
          name: string
          neighborhood_id?: string | null
          search_blurb?: string | null
          search_text?: unknown
          source_id: string
          source_table: string
          updated_at?: string
        }
        Update: {
          city_id?: string | null
          confidence?: number | null
          created_at?: string
          data_source_id?: string | null
          embedded_at?: string | null
          embedding?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["entity_kind"]
          location?: unknown
          lokal_org_id?: string | null
          lokal_place_id?: string | null
          name?: string
          neighborhood_id?: string | null
          search_blurb?: string | null
          search_text?: unknown
          source_id?: string
          source_table?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_entities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_entities_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_entities_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_entities_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      city_events_log: {
        Row: {
          body: string | null
          created_at: string
          data_source_id: string | null
          entity_id: string
          event_type: string
          id: string
          occurs_at: string | null
          payload: Json
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data_source_id?: string | null
          entity_id: string
          event_type: string
          id?: string
          occurs_at?: string | null
          payload?: Json
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data_source_id?: string | null
          entity_id?: string
          event_type?: string
          id?: string
          occurs_at?: string | null
          payload?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_events_log_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_events_log_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "city_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      city_signals: {
        Row: {
          category: string | null
          created_at: string
          id: string
          metric: number | null
          neighborhood: string | null
          payload: Json
          reference_id: string | null
          signal_type: string
          subtitle: string | null
          title: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          metric?: number | null
          neighborhood?: string | null
          payload?: Json
          reference_id?: string | null
          signal_type: string
          subtitle?: string | null
          title: string
          valid_from?: string
          valid_until?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          metric?: number | null
          neighborhood?: string | null
          payload?: Json
          reference_id?: string | null
          signal_type?: string
          subtitle?: string | null
          title?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
          status: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          status?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_followers: {
        Row: {
          connector_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          connector_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          connector_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connector_followers_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_referrals: {
        Row: {
          business_id: string
          connector_id: string
          created_at: string
          id: string
          status: string | null
        }
        Insert: {
          business_id: string
          connector_id: string
          created_at?: string
          id?: string
          status?: string | null
        }
        Update: {
          business_id?: string
          connector_id?: string
          created_at?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connector_referrals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connector_referrals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "connector_referrals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connector_referrals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connector_referrals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connector_referrals_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      connectors: {
        Row: {
          bio: string | null
          created_at: string
          follower_count: number | null
          id: string
          is_founding: boolean | null
          profile_views: number | null
          referral_code: string | null
          referral_slug: string | null
          revenue_share_rate: number | null
          social_links: Json | null
          tier: string | null
          title: string | null
          total_earned: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          follower_count?: number | null
          id?: string
          is_founding?: boolean | null
          profile_views?: number | null
          referral_code?: string | null
          referral_slug?: string | null
          revenue_share_rate?: number | null
          social_links?: Json | null
          tier?: string | null
          title?: string | null
          total_earned?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          follower_count?: number | null
          id?: string
          is_founding?: boolean | null
          profile_views?: number | null
          referral_code?: string | null
          referral_slug?: string | null
          revenue_share_rate?: number | null
          social_links?: Json | null
          tier?: string | null
          title?: string | null
          total_earned?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_drop_highlights: {
        Row: {
          created_at: string
          daily_drop_id: string
          highlight_type: string
          icon: string | null
          id: string
          link_text: string | null
          link_url: string | null
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          daily_drop_id: string
          highlight_type: string
          icon?: string | null
          id?: string
          link_text?: string | null
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          daily_drop_id?: string
          highlight_type?: string
          icon?: string | null
          id?: string
          link_text?: string | null
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_drop_highlights_daily_drop_id_fkey"
            columns: ["daily_drop_id"]
            isOneToOne: false
            referencedRelation: "daily_drops"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_drop_moments: {
        Row: {
          created_at: string
          daily_drop_id: string
          description: string | null
          id: string
          image_url: string | null
          link_text: string | null
          link_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          daily_drop_id: string
          description?: string | null
          id?: string
          image_url?: string | null
          link_text?: string | null
          link_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          daily_drop_id?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link_text?: string | null
          link_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_drop_moments_daily_drop_id_fkey"
            columns: ["daily_drop_id"]
            isOneToOne: false
            referencedRelation: "daily_drops"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_drop_spotlights: {
        Row: {
          business_id: string | null
          created_at: string
          custom_description: string | null
          custom_headline: string | null
          daily_drop_id: string
          id: string
          sort_order: number
          spotlight_type: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          custom_description?: string | null
          custom_headline?: string | null
          daily_drop_id: string
          id?: string
          sort_order?: number
          spotlight_type: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          custom_description?: string | null
          custom_headline?: string | null
          daily_drop_id?: string
          id?: string
          sort_order?: number
          spotlight_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_drop_spotlights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_drop_spotlights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "daily_drop_spotlights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_drop_spotlights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_drop_spotlights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_drop_spotlights_daily_drop_id_fkey"
            columns: ["daily_drop_id"]
            isOneToOne: false
            referencedRelation: "daily_drops"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_drops: {
        Row: {
          created_at: string
          created_by: string | null
          drop_date: string
          id: string
          publish_time: string | null
          status: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          drop_date: string
          id?: string
          publish_time?: string | null
          status?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          drop_date?: string
          id?: string
          publish_time?: string | null
          status?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      data_source_config: {
        Row: {
          config: Json
          source_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          source_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          source_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_source_config_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: true
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          city_id: string | null
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["data_source_kind"]
          last_error: string | null
          last_run_at: string | null
          last_status: string | null
          name: string
          record_count: number
          schedule: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["data_source_kind"]
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          name: string
          record_count?: number
          schedule?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["data_source_kind"]
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          name?: string
          record_count?: number
          schedule?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_redemptions: {
        Row: {
          business_id: string
          deal_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          deal_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          deal_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "deal_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_redemptions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          business_id: string
          created_at: string
          deal_type: string
          description: string | null
          end_date: string
          featured: boolean | null
          id: string
          image_url: string | null
          redemption_limit: number | null
          redemption_method: string | null
          start_date: string
          status: string
          terms: string | null
          title: string
        }
        Insert: {
          business_id: string
          created_at?: string
          deal_type?: string
          description?: string | null
          end_date: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          redemption_limit?: number | null
          redemption_method?: string | null
          start_date?: string
          status?: string
          terms?: string | null
          title: string
        }
        Update: {
          business_id?: string
          created_at?: string
          deal_type?: string
          description?: string | null
          end_date?: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          redemption_limit?: number | null
          redemption_method?: string | null
          start_date?: string
          status?: string
          terms?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "deals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      developments: {
        Row: {
          address: string | null
          created_at: string
          developer: string | null
          documents: Json
          est_completion: string | null
          id: string
          investment_amount: number | null
          kind: string | null
          location: unknown
          name: string
          neighborhood_id: string | null
          parcel_id: string | null
          planning_case: string | null
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          developer?: string | null
          documents?: Json
          est_completion?: string | null
          id?: string
          investment_amount?: number | null
          kind?: string | null
          location?: unknown
          name: string
          neighborhood_id?: string | null
          parcel_id?: string | null
          planning_case?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          developer?: string | null
          documents?: Json
          est_completion?: string | null
          id?: string
          investment_amount?: number | null
          kind?: string | null
          location?: unknown
          name?: string
          neighborhood_id?: string | null
          parcel_id?: string | null
          planning_case?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developments_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developments_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developments_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      early_adopters: {
        Row: {
          granted_at: string
          id: string
          tier: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          tier?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      entity_follows: {
        Row: {
          created_at: string
          entity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_follows_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "city_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          name: string
          price: number
          quantity_available: number | null
          quantity_sold: number
          sales_end: string | null
          sales_start: string | null
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          name: string
          price?: number
          quantity_available?: number | null
          quantity_sold?: number
          sales_end?: string | null
          sales_start?: string | null
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          price?: number
          quantity_available?: number | null
          quantity_sold?: number
          sales_end?: string | null
          sales_start?: string | null
          stripe_price_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          business_id: string | null
          capacity: number | null
          connector_id: string | null
          created_at: string
          description: string | null
          end_date_time: string | null
          event_type: string
          featured: boolean | null
          id: string
          image_url: string | null
          is_free: boolean
          location_text: string | null
          price_cents: number | null
          pulse_post_id: string | null
          start_date_time: string
          status: string
          ticket_url: string | null
          title: string
        }
        Insert: {
          business_id?: string | null
          capacity?: number | null
          connector_id?: string | null
          created_at?: string
          description?: string | null
          end_date_time?: string | null
          event_type?: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_free?: boolean
          location_text?: string | null
          price_cents?: number | null
          pulse_post_id?: string | null
          start_date_time: string
          status?: string
          ticket_url?: string | null
          title: string
        }
        Update: {
          business_id?: string | null
          capacity?: number | null
          connector_id?: string | null
          created_at?: string
          description?: string | null
          end_date_time?: string | null
          event_type?: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          is_free?: boolean
          location_text?: string | null
          price_cents?: number | null
          pulse_post_id?: string | null
          start_date_time?: string
          status?: string
          ticket_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_pulse_post_id_fkey"
            columns: ["pulse_post_id"]
            isOneToOne: false
            referencedRelation: "pulse_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      food_truck_locations: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          end_time: string
          featured: boolean | null
          id: string
          latitude: number | null
          location_date: string
          location_name: string
          longitude: number | null
          notes: string | null
          start_time: string
          status: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          end_time: string
          featured?: boolean | null
          id?: string
          latitude?: number | null
          location_date: string
          location_name: string
          longitude?: number | null
          notes?: string | null
          start_time: string
          status?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          end_time?: string
          featured?: boolean | null
          id?: string
          latitude?: number | null
          location_date?: string
          location_name?: string
          longitude?: number | null
          notes?: string | null
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_truck_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_truck_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "food_truck_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_truck_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_truck_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      founding_5_applications: {
        Row: {
          business_name: string
          category: Database["public"]["Enums"]["founding_5_category"] | null
          created_at: string
          email: string
          id: string
          neighborhood: string | null
          owner_name: string
          phone: string | null
          why_us: string | null
        }
        Insert: {
          business_name: string
          category?: Database["public"]["Enums"]["founding_5_category"] | null
          created_at?: string
          email: string
          id?: string
          neighborhood?: string | null
          owner_name: string
          phone?: string | null
          why_us?: string | null
        }
        Update: {
          business_name?: string
          category?: Database["public"]["Enums"]["founding_5_category"] | null
          created_at?: string
          email?: string
          id?: string
          neighborhood?: string | null
          owner_name?: string
          phone?: string | null
          why_us?: string | null
        }
        Relationships: []
      }
      hire_follows: {
        Row: {
          created_at: string
          follower_org_id: string
          id: string
          subject_user_id: string
        }
        Insert: {
          created_at?: string
          follower_org_id: string
          id?: string
          subject_user_id: string
        }
        Update: {
          created_at?: string
          follower_org_id?: string
          id?: string
          subject_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hire_follows_follower_org_id_fkey"
            columns: ["follower_org_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_follows_follower_org_id_fkey"
            columns: ["follower_org_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "hire_follows_follower_org_id_fkey"
            columns: ["follower_org_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_follows_follower_org_id_fkey"
            columns: ["follower_org_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_follows_follower_org_id_fkey"
            columns: ["follower_org_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hire_references: {
        Row: {
          author_name: string
          author_org_id: string | null
          author_role: string | null
          author_user_id: string | null
          body: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["reference_status"]
          subject_user_id: string
        }
        Insert: {
          author_name: string
          author_org_id?: string | null
          author_role?: string | null
          author_user_id?: string | null
          body: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["reference_status"]
          subject_user_id: string
        }
        Update: {
          author_name?: string
          author_org_id?: string | null
          author_role?: string | null
          author_user_id?: string | null
          body?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["reference_status"]
          subject_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hire_references_author_org_id_fkey"
            columns: ["author_org_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_references_author_org_id_fkey"
            columns: ["author_org_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "hire_references_author_org_id_fkey"
            columns: ["author_org_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_references_author_org_id_fkey"
            columns: ["author_org_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_references_author_org_id_fkey"
            columns: ["author_org_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_metrics: {
        Row: {
          business_id: string
          created_at: string
          id: string
          label: string
          metric_type: string
          notes: string | null
          period_end: string | null
          period_start: string | null
          unit: string | null
          updated_at: string
          value: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          label: string
          metric_type: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          unit?: string | null
          updated_at?: string
          value?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          label?: string
          metric_type?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          unit?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "impact_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "impact_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_items: {
        Row: {
          created_at: string
          digested_at: string | null
          id: string
          log_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          digested_at?: string | null
          id?: string
          log_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          digested_at?: string | null
          id?: string
          log_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_items_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "api_changes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_items_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "city_events_log"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_pledges: {
        Row: {
          amount: number
          created_at: string
          id: string
          issue_id: string
          kind: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          issue_id: string
          kind: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          issue_id?: string
          kind?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_pledges_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_reporters: {
        Row: {
          created_at: string
          issue_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          issue_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          issue_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_reporters_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: true
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_government: boolean
          kind: string
          location: unknown
          needs: Json
          neighborhood_id: string | null
          photo_url: string | null
          progress: Json
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_government?: boolean
          kind: string
          location?: unknown
          needs?: Json
          neighborhood_id?: string | null
          photo_url?: string | null
          progress?: Json
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_government?: boolean
          kind?: string
          location?: unknown
          needs?: Json
          neighborhood_id?: string | null
          photo_url?: string | null
          progress?: Json
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          apply_contact: string
          apply_method: string
          benefits_offered: boolean
          business_id: string
          created_at: string
          deadline: string | null
          description: string | null
          evenings_nights: boolean
          featured: boolean | null
          hiring_now: boolean | null
          id: string
          job_type: string
          location_text: string | null
          no_experience_needed: boolean
          pay_max: number | null
          pay_min: number | null
          pay_type: string | null
          remote_ok: boolean
          requirements: string | null
          schedule: string | null
          second_chance: boolean
          start_date: string | null
          status: string
          teen_friendly: boolean
          title: string
          training_provided: boolean
          transit_accessible: boolean
          updated_at: string
          view_count: number | null
          weekends_only: boolean
          weekly_pay: boolean
        }
        Insert: {
          apply_contact: string
          apply_method: string
          benefits_offered?: boolean
          business_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          evenings_nights?: boolean
          featured?: boolean | null
          hiring_now?: boolean | null
          id?: string
          job_type: string
          location_text?: string | null
          no_experience_needed?: boolean
          pay_max?: number | null
          pay_min?: number | null
          pay_type?: string | null
          remote_ok?: boolean
          requirements?: string | null
          schedule?: string | null
          second_chance?: boolean
          start_date?: string | null
          status?: string
          teen_friendly?: boolean
          title: string
          training_provided?: boolean
          transit_accessible?: boolean
          updated_at?: string
          view_count?: number | null
          weekends_only?: boolean
          weekly_pay?: boolean
        }
        Update: {
          apply_contact?: string
          apply_method?: string
          benefits_offered?: boolean
          business_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          evenings_nights?: boolean
          featured?: boolean | null
          hiring_now?: boolean | null
          id?: string
          job_type?: string
          location_text?: string | null
          no_experience_needed?: boolean
          pay_max?: number | null
          pay_min?: number | null
          pay_type?: string | null
          remote_ok?: boolean
          requirements?: string | null
          schedule?: string | null
          second_chance?: boolean
          start_date?: string | null
          status?: string
          teen_friendly?: boolean
          title?: string
          training_provided?: boolean
          transit_accessible?: boolean
          updated_at?: string
          view_count?: number | null
          weekends_only?: boolean
          weekly_pay?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      known_for_tags: {
        Row: {
          business_id: string
          confidence_score: number | null
          created_at: string
          id: string
          source: string | null
          tag: string
        }
        Insert: {
          business_id: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          source?: string | null
          tag: string
        }
        Update: {
          business_id?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          source?: string | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "known_for_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "known_for_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "known_for_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "known_for_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "known_for_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          business_id: string
          contact_info: string | null
          created_at: string
          id: string
          message: string | null
          name: string | null
          request_id: string | null
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          contact_info?: string | null
          created_at?: string
          id?: string
          message?: string | null
          name?: string | null
          request_id?: string | null
          status?: string
          type: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          contact_info?: string | null
          created_at?: string
          id?: string
          message?: string | null
          name?: string | null
          request_id?: string | null
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      local_moments: {
        Row: {
          business_id: string
          created_at: string
          featured: boolean
          id: string
          photo_url: string | null
          status: string
          text: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          featured?: boolean
          id?: string
          photo_url?: string | null
          status?: string
          text: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          featured?: boolean
          id?: string
          photo_url?: string | null
          status?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_moments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_moments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "local_moments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_moments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_moments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      local_reactions: {
        Row: {
          business_id: string
          business_type: string | null
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          business_id: string
          business_type?: string | null
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          business_id?: string
          business_type?: string | null
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_reactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_reactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "local_reactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_reactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_reactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_badges: {
        Row: {
          badge_color: string | null
          badge_icon: string | null
          badge_name: string
          earned_at: string
          id: string
          mission_id: string
          user_id: string
        }
        Insert: {
          badge_color?: string | null
          badge_icon?: string | null
          badge_name: string
          earned_at?: string
          id?: string
          mission_id: string
          user_id: string
        }
        Update: {
          badge_color?: string | null
          badge_icon?: string | null
          badge_name?: string
          earned_at?: string
          id?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_badges_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "loop_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_bursts: {
        Row: {
          bonus_points: number | null
          burst_type: string
          business_id: string
          created_at: string
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          max_redemptions: number | null
          multiplier: number | null
          name: string
          recurrence: string | null
          recurrence_days: number[] | null
          recurrence_end_time: string | null
          recurrence_start_time: string | null
          starts_at: string
          total_redemptions: number
          updated_at: string
        }
        Insert: {
          bonus_points?: number | null
          burst_type: string
          business_id: string
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          multiplier?: number | null
          name: string
          recurrence?: string | null
          recurrence_days?: number[] | null
          recurrence_end_time?: string | null
          recurrence_start_time?: string | null
          starts_at: string
          total_redemptions?: number
          updated_at?: string
        }
        Update: {
          bonus_points?: number | null
          burst_type?: string
          business_id?: string
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          multiplier?: number | null
          name?: string
          recurrence?: string | null
          recurrence_days?: number[] | null
          recurrence_end_time?: string | null
          recurrence_start_time?: string | null
          starts_at?: string
          total_redemptions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_bursts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_bursts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "loop_bursts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_bursts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_bursts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_causes: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          organization_name: string | null
          points_donated: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          organization_name?: string | null
          points_donated?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          organization_name?: string | null
          points_donated?: number | null
        }
        Relationships: []
      }
      loop_daily_caps: {
        Row: {
          cap_date: string
          created_at: string
          id: string
          points_earned: number | null
          referrals_today: number | null
          user_id: string
        }
        Insert: {
          cap_date?: string
          created_at?: string
          id?: string
          points_earned?: number | null
          referrals_today?: number | null
          user_id: string
        }
        Update: {
          cap_date?: string
          created_at?: string
          id?: string
          points_earned?: number | null
          referrals_today?: number | null
          user_id?: string
        }
        Relationships: []
      }
      loop_donations: {
        Row: {
          cause_id: string
          created_at: string
          id: string
          points_amount: number
          transaction_id: string
          user_id: string
        }
        Insert: {
          cause_id: string
          created_at?: string
          id?: string
          points_amount: number
          transaction_id: string
          user_id: string
        }
        Update: {
          cause_id?: string
          created_at?: string
          id?: string
          points_amount?: number
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_donations_cause_id_fkey"
            columns: ["cause_id"]
            isOneToOne: false
            referencedRelation: "loop_causes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_donations_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "loop_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_expiration_warnings: {
        Row: {
          batch_id: string | null
          id: string
          points_at_risk: number
          sent_at: string
          wallet_id: string
          warning_type: string
        }
        Insert: {
          batch_id?: string | null
          id?: string
          points_at_risk: number
          sent_at?: string
          wallet_id: string
          warning_type: string
        }
        Update: {
          batch_id?: string | null
          id?: string
          points_at_risk?: number
          sent_at?: string
          wallet_id?: string
          warning_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_expiration_warnings_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "loop_point_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_expiration_warnings_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "loop_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_mission_progress: {
        Row: {
          businesses_visited: string[] | null
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          progress_count: number | null
          reward_claimed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          businesses_visited?: string[] | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          progress_count?: number | null
          reward_claimed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          businesses_visited?: string[] | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          progress_count?: number | null
          reward_claimed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "loop_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_missions: {
        Row: {
          badge_color: string | null
          badge_icon: string | null
          created_at: string
          current_participants: number | null
          description: string | null
          end_date: string | null
          id: string
          is_featured: boolean | null
          max_participants: number | null
          mission_type: Database["public"]["Enums"]["loop_mission_type"]
          points_reward: number
          required_count: number
          sponsor_business_id: string | null
          start_date: string | null
          status: string | null
          target_businesses: string[] | null
          target_category_id: string | null
          target_entity_id: string | null
          target_neighborhood_id: string | null
          title: string
        }
        Insert: {
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_featured?: boolean | null
          max_participants?: number | null
          mission_type: Database["public"]["Enums"]["loop_mission_type"]
          points_reward?: number
          required_count?: number
          sponsor_business_id?: string | null
          start_date?: string | null
          status?: string | null
          target_businesses?: string[] | null
          target_category_id?: string | null
          target_entity_id?: string | null
          target_neighborhood_id?: string | null
          title: string
        }
        Update: {
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_featured?: boolean | null
          max_participants?: number | null
          mission_type?: Database["public"]["Enums"]["loop_mission_type"]
          points_reward?: number
          required_count?: number
          sponsor_business_id?: string | null
          start_date?: string | null
          status?: string | null
          target_businesses?: string[] | null
          target_category_id?: string | null
          target_entity_id?: string | null
          target_neighborhood_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_missions_sponsor_business_id_fkey"
            columns: ["sponsor_business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_missions_sponsor_business_id_fkey"
            columns: ["sponsor_business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "loop_missions_sponsor_business_id_fkey"
            columns: ["sponsor_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_missions_sponsor_business_id_fkey"
            columns: ["sponsor_business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_missions_sponsor_business_id_fkey"
            columns: ["sponsor_business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_missions_target_category_id_fkey"
            columns: ["target_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_missions_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "city_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_missions_target_neighborhood_id_fkey"
            columns: ["target_neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_missions_target_neighborhood_id_fkey"
            columns: ["target_neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_point_batches: {
        Row: {
          created_at: string
          expired_at: string | null
          expires_at: string
          id: string
          original_amount: number
          remaining_amount: number
          source_business_id: string | null
          source_type: string
          status: string
          wallet_id: string
        }
        Insert: {
          created_at?: string
          expired_at?: string | null
          expires_at: string
          id?: string
          original_amount: number
          remaining_amount: number
          source_business_id?: string | null
          source_type: string
          status?: string
          wallet_id: string
        }
        Update: {
          created_at?: string
          expired_at?: string | null
          expires_at?: string
          id?: string
          original_amount?: number
          remaining_amount?: number
          source_business_id?: string | null
          source_type?: string
          status?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_point_batches_source_business_id_fkey"
            columns: ["source_business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_point_batches_source_business_id_fkey"
            columns: ["source_business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "loop_point_batches_source_business_id_fkey"
            columns: ["source_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_point_batches_source_business_id_fkey"
            columns: ["source_business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_point_batches_source_business_id_fkey"
            columns: ["source_business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_point_batches_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "loop_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_qr_codes: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean | null
          is_single_use: boolean | null
          max_scans_per_user: number | null
          name: string
          points_value: number
          qr_type: Database["public"]["Enums"]["loop_qr_type"]
          requires_staff_confirm: boolean | null
          scan_cooldown_hours: number | null
          total_scans: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_single_use?: boolean | null
          max_scans_per_user?: number | null
          name: string
          points_value: number
          qr_type?: Database["public"]["Enums"]["loop_qr_type"]
          requires_staff_confirm?: boolean | null
          scan_cooldown_hours?: number | null
          total_scans?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_single_use?: boolean | null
          max_scans_per_user?: number | null
          name?: string
          points_value?: number
          qr_type?: Database["public"]["Enums"]["loop_qr_type"]
          requires_staff_confirm?: boolean | null
          scan_cooldown_hours?: number | null
          total_scans?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loop_qr_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_qr_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "loop_qr_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_qr_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_qr_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_qr_scans: {
        Row: {
          created_at: string
          id: string
          qr_code_id: string
          staff_confirmed_at: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          qr_code_id: string
          staff_confirmed_at?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          qr_code_id?: string
          staff_confirmed_at?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_qr_scans_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "loop_qr_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_qr_scans_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "loop_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_redemption_settings: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean | null
          lp_per_dollar: number
          max_discount_percent: number
          min_spend_cents: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          lp_per_dollar?: number
          max_discount_percent?: number
          min_spend_cents?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          lp_per_dollar?: number
          max_discount_percent?: number
          min_spend_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_redemption_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_redemption_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "loop_redemption_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_redemption_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_redemption_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_redemptions: {
        Row: {
          confirmed_at: string | null
          confirmed_by_staff: string | null
          created_at: string
          id: string
          redemption_code: string
          reward_id: string
          status: string | null
          transaction_id: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by_staff?: string | null
          created_at?: string
          id?: string
          redemption_code: string
          reward_id: string
          status?: string | null
          transaction_id: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by_staff?: string | null
          created_at?: string
          id?: string
          redemption_code?: string
          reward_id?: string
          status?: string | null
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loop_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_redemptions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "loop_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_rewards: {
        Row: {
          business_id: string
          category: Database["public"]["Enums"]["loop_reward_category"]
          created_at: string
          daily_limit: number | null
          description: string | null
          id: string
          is_active: boolean | null
          monthly_limit: number | null
          name: string
          points_cost: number
          quantity_available: number | null
          quantity_redeemed: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          business_id: string
          category?: Database["public"]["Enums"]["loop_reward_category"]
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          monthly_limit?: number | null
          name: string
          points_cost: number
          quantity_available?: number | null
          quantity_redeemed?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          business_id?: string
          category?: Database["public"]["Enums"]["loop_reward_category"]
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          monthly_limit?: number | null
          name?: string
          points_cost?: number
          quantity_available?: number | null
          quantity_redeemed?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loop_rewards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_rewards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "loop_rewards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_rewards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_rewards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_supply_tracking: {
        Row: {
          created_at: string
          founding_5_issued: number | null
          founding_50_issued: number | null
          id: string
          month_year: string
          platform_pool_used: number | null
          total_expired: number | null
          total_issued: number | null
          total_redeemed: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          founding_5_issued?: number | null
          founding_50_issued?: number | null
          id?: string
          month_year: string
          platform_pool_used?: number | null
          total_expired?: number | null
          total_issued?: number | null
          total_redeemed?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          founding_5_issued?: number | null
          founding_50_issued?: number | null
          id?: string
          month_year?: string
          platform_pool_used?: number | null
          total_expired?: number | null
          total_issued?: number | null
          total_redeemed?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      loop_tiers: {
        Row: {
          can_create_missions: boolean | null
          can_sponsor_missions: boolean | null
          created_at: string
          features: string[] | null
          id: string
          name: string
          points_cap_monthly: number
          price_monthly: number
          stripe_price_id: string | null
        }
        Insert: {
          can_create_missions?: boolean | null
          can_sponsor_missions?: boolean | null
          created_at?: string
          features?: string[] | null
          id: string
          name: string
          points_cap_monthly?: number
          price_monthly?: number
          stripe_price_id?: string | null
        }
        Update: {
          can_create_missions?: boolean | null
          can_sponsor_missions?: boolean | null
          created_at?: string
          features?: string[] | null
          id?: string
          name?: string
          points_cap_monthly?: number
          price_monthly?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      loop_transactions: {
        Row: {
          business_id: string | null
          created_at: string
          description: string | null
          device_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          mission_id: string | null
          points: number
          qr_code_id: string | null
          source_event: string | null
          transaction_type: Database["public"]["Enums"]["loop_transaction_type"]
          tx_status: string | null
          wallet_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          device_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          mission_id?: string | null
          points: number
          qr_code_id?: string | null
          source_event?: string | null
          transaction_type: Database["public"]["Enums"]["loop_transaction_type"]
          tx_status?: string | null
          wallet_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          device_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          mission_id?: string | null
          points?: number
          qr_code_id?: string | null
          source_event?: string | null
          transaction_type?: Database["public"]["Enums"]["loop_transaction_type"]
          tx_status?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loop_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "loop_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loop_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "loop_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      loop_wallets: {
        Row: {
          city: string
          created_at: string
          frozen_reason: string | null
          id: string
          is_frozen: boolean | null
          last_activity_at: string | null
          lifetime_donated: number
          lifetime_earned: number
          lifetime_redeemed: number
          points_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string
          created_at?: string
          frozen_reason?: string | null
          id?: string
          is_frozen?: boolean | null
          last_activity_at?: string | null
          lifetime_donated?: number
          lifetime_earned?: number
          lifetime_redeemed?: number
          points_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          frozen_reason?: string | null
          id?: string
          is_frozen?: boolean | null
          last_activity_at?: string | null
          lifetime_donated?: number
          lifetime_earned?: number
          lifetime_redeemed?: number
          points_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          business_id: string
          created_at: string | null
          height: number
          id: string
          original_path: string
          slot: string
          sort_order: number | null
          thumb_path: string | null
          webp_path: string
          width: number
        }
        Insert: {
          business_id: string
          created_at?: string | null
          height: number
          id?: string
          original_path: string
          slot: string
          sort_order?: number | null
          thumb_path?: string | null
          webp_path: string
          width: number
        }
        Update: {
          business_id?: string
          created_at?: string | null
          height?: number
          id?: string
          original_path?: string
          slot?: string
          sort_order?: number | null
          thumb_path?: string | null
          webp_path?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "media_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_items: {
        Row: {
          approved: boolean
          body: string | null
          contributor_id: string | null
          created_at: string
          entity_id: string
          id: string
          kind: string
          media_url: string | null
          title: string
          year: number | null
        }
        Insert: {
          approved?: boolean
          body?: string | null
          contributor_id?: string | null
          created_at?: string
          entity_id: string
          id?: string
          kind: string
          media_url?: string | null
          title: string
          year?: number | null
        }
        Update: {
          approved?: boolean
          body?: string | null
          contributor_id?: string | null
          created_at?: string
          entity_id?: string
          id?: string
          kind?: string
          media_url?: string | null
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_items_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "city_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: string
          created_at: string
          id: string
          moderator_user_id: string | null
          note: string | null
          report_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          moderator_user_id?: string | null
          note?: string | null
          report_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          moderator_user_id?: string | null
          note?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhood_activity: {
        Row: {
          activity_score: number
          computed_at: string
          energy_emoji: string
          energy_level: string
          label: string | null
          neighborhood: string
        }
        Insert: {
          activity_score?: number
          computed_at?: string
          energy_emoji?: string
          energy_level?: string
          label?: string | null
          neighborhood: string
        }
        Update: {
          activity_score?: number
          computed_at?: string
          energy_emoji?: string
          energy_level?: string
          label?: string | null
          neighborhood?: string
        }
        Relationships: []
      }
      neighborhoods: {
        Row: {
          boundary_source: string | null
          created_at: string
          geometry: unknown
          id: string
          name: string
        }
        Insert: {
          boundary_source?: string | null
          created_at?: string
          geometry?: unknown
          id?: string
          name: string
        }
        Update: {
          boundary_source?: string | null
          created_at?: string
          geometry?: unknown
          id?: string
          name?: string
        }
        Relationships: []
      }
      nonprofits: {
        Row: {
          address: string | null
          cause_category: Database["public"]["Enums"]["cause_category"]
          claimed: boolean | null
          claimed_at: string | null
          claimed_by: string | null
          community_support_types:
            | Database["public"]["Enums"]["community_support_type"][]
            | null
          cover_image_url: string | null
          created_at: string
          email: string | null
          founding_community_partner: boolean | null
          human_note: string | null
          id: string
          logo_url: string | null
          mission_statement: string
          name: string
          neighborhood_id: string | null
          phone: string | null
          slug: string | null
          status: string
          updated_at: string
          website: string | null
          what_this_helps: string | null
        }
        Insert: {
          address?: string | null
          cause_category: Database["public"]["Enums"]["cause_category"]
          claimed?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          community_support_types?:
            | Database["public"]["Enums"]["community_support_type"][]
            | null
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
          founding_community_partner?: boolean | null
          human_note?: string | null
          id?: string
          logo_url?: string | null
          mission_statement: string
          name: string
          neighborhood_id?: string | null
          phone?: string | null
          slug?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          what_this_helps?: string | null
        }
        Update: {
          address?: string | null
          cause_category?: Database["public"]["Enums"]["cause_category"]
          claimed?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          community_support_types?:
            | Database["public"]["Enums"]["community_support_type"][]
            | null
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
          founding_community_partner?: boolean | null
          human_note?: string | null
          id?: string
          logo_url?: string | null
          mission_statement?: string
          name?: string
          neighborhood_id?: string | null
          phone?: string | null
          slug?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          what_this_helps?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nonprofits_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonprofits_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_outbox: {
        Row: {
          cadence: Database["public"]["Enums"]["notification_cadence"]
          channel: string
          created_at: string
          id: string
          item_count: number
          payload: Json
          send_error: string | null
          sent_at: string | null
          summary: string
          user_id: string
        }
        Insert: {
          cadence: Database["public"]["Enums"]["notification_cadence"]
          channel?: string
          created_at?: string
          id?: string
          item_count: number
          payload?: Json
          send_error?: string | null
          sent_at?: string | null
          summary: string
          user_id: string
        }
        Update: {
          cadence?: Database["public"]["Enums"]["notification_cadence"]
          channel?: string
          created_at?: string
          id?: string
          item_count?: number
          payload?: Json
          send_error?: string | null
          sent_at?: string | null
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          cadence: Database["public"]["Enums"]["notification_cadence"]
          category: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cadence?: Database["public"]["Enums"]["notification_cadence"]
          category: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cadence?: Database["public"]["Enums"]["notification_cadence"]
          category?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      open_to_work: {
        Row: {
          enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          deadline: string | null
          description: string | null
          eligibility: Json
          id: string
          life_events: string[]
          phone: string | null
          provenance: Json
          provider: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility?: Json
          id?: string
          life_events?: string[]
          phone?: string | null
          provenance?: Json
          provider?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility?: Json
          id?: string
          life_events?: string[]
          phone?: string | null
          provenance?: Json
          provider?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      org_hire_settings: {
        Row: {
          auto_trust_qr: boolean
          org_id: string
          updated_at: string
        }
        Insert: {
          auto_trust_qr?: boolean
          org_id: string
          updated_at?: string
        }
        Update: {
          auto_trust_qr?: boolean
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_hire_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_hire_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "org_hire_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_hire_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_hire_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_messages: {
        Row: {
          body: string
          business_id: string | null
          created_at: string
          emailed: boolean
          id: string
          is_broadcast: boolean
          read_at: string | null
          recipient_id: string
          sender_id: string | null
          subject: string | null
        }
        Insert: {
          body: string
          business_id?: string | null
          created_at?: string
          emailed?: boolean
          id?: string
          is_broadcast?: boolean
          read_at?: string | null
          recipient_id: string
          sender_id?: string | null
          subject?: string | null
        }
        Update: {
          body?: string
          business_id?: string | null
          created_at?: string
          emailed?: boolean
          id?: string
          is_broadcast?: boolean
          read_at?: string | null
          recipient_id?: string
          sender_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "owner_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      parcels: {
        Row: {
          address: string
          assessed_value: number | null
          confidence: number | null
          council_district: string | null
          created_at: string
          data_source_id: string | null
          id: string
          location: unknown
          neighborhood_id: string | null
          parcel_number: string | null
          precinct: string | null
          raw: Json
          recycling_week: string | null
          refuse_day: string | null
          school_district: string | null
          snow_route: string | null
          tax_year_amount: number | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address: string
          assessed_value?: number | null
          confidence?: number | null
          council_district?: string | null
          created_at?: string
          data_source_id?: string | null
          id?: string
          location?: unknown
          neighborhood_id?: string | null
          parcel_number?: string | null
          precinct?: string | null
          raw?: Json
          recycling_week?: string | null
          refuse_day?: string | null
          school_district?: string | null
          snow_route?: string | null
          tax_year_amount?: number | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string
          assessed_value?: number | null
          confidence?: number | null
          council_district?: string | null
          created_at?: string
          data_source_id?: string | null
          id?: string
          location?: unknown
          neighborhood_id?: string | null
          parcel_number?: string | null
          precinct?: string | null
          raw?: Json
          recycling_week?: string | null
          refuse_day?: string | null
          school_district?: string | null
          snow_route?: string | null
          tax_year_amount?: number | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parcels_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      passport_checkins: {
        Row: {
          business_id: string
          created_at: string
          id: string
          metadata: Json | null
          stamp_id: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          stamp_id?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          stamp_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "passport_checkins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_checkins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "passport_checkins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_checkins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_checkins_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_checkins_stamp_id_fkey"
            columns: ["stamp_id"]
            isOneToOne: false
            referencedRelation: "passport_stamps"
            referencedColumns: ["id"]
          },
        ]
      }
      passport_stamps: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          reward_description: string | null
          target_entity_id: string | null
          updated_at: string
          visits_required: number
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          reward_description?: string | null
          target_entity_id?: string | null
          updated_at?: string
          visits_required?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          reward_description?: string | null
          target_entity_id?: string | null
          updated_at?: string
          visits_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "passport_stamps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_stamps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "passport_stamps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_stamps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_stamps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_stamps_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "city_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_claims: {
        Row: {
          business_id: string | null
          claimant_user_id: string
          claimed_role: string
          created_at: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          verification_method: string
        }
        Insert: {
          business_id?: string | null
          claimant_user_id: string
          claimed_role?: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          verification_method: string
        }
        Update: {
          business_id?: string | null
          claimant_user_id?: string
          claimed_role?: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          verification_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "pending_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          boost_credits_per_month: number | null
          created_at: string
          deals_per_month: number | null
          events_per_month: number | null
          features: string[] | null
          id: string
          lead_access_level: string | null
          name: string
          price_monthly: number
        }
        Insert: {
          boost_credits_per_month?: number | null
          created_at?: string
          deals_per_month?: number | null
          events_per_month?: number | null
          features?: string[] | null
          id?: string
          lead_access_level?: string | null
          name: string
          price_monthly: number
        }
        Update: {
          boost_credits_per_month?: number | null
          created_at?: string
          deals_per_month?: number | null
          events_per_month?: number | null
          features?: string[] | null
          id?: string
          lead_access_level?: string | null
          name?: string
          price_monthly?: number
        }
        Relationships: []
      }
      plugins: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          manifest: Json
          name: string
          org_entity: string | null
          slug: string
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          manifest?: Json
          name: string
          org_entity?: string | null
          slug: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          manifest?: Json
          name?: string
          org_entity?: string | null
          slug?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plugins_org_entity_fkey"
            columns: ["org_entity"]
            isOneToOne: false
            referencedRelation: "city_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          business_id: string | null
          comments_count: number | null
          content: string
          created_at: string
          featured: boolean | null
          hashtags: string[] | null
          id: string
          images: string[] | null
          likes_count: number | null
          pinned: boolean | null
          post_type: string
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          business_id?: string | null
          comments_count?: number | null
          content: string
          created_at?: string
          featured?: boolean | null
          hashtags?: string[] | null
          id?: string
          images?: string[] | null
          likes_count?: number | null
          pinned?: boolean | null
          post_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          business_id?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string
          featured?: boolean | null
          hashtags?: string[] | null
          id?: string
          images?: string[] | null
          likes_count?: number | null
          pinned?: boolean | null
          post_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          ai_recommendations: boolean
          notification_categories: Json
          personalization: boolean
          public_activity: boolean
          public_rewards: boolean
          share_location: boolean
          store_home_address: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_recommendations?: boolean
          notification_categories?: Json
          personalization?: boolean
          public_activity?: boolean
          public_rewards?: boolean
          share_location?: boolean
          store_home_address?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_recommendations?: boolean
          notification_categories?: Json
          personalization?: boolean
          public_activity?: boolean
          public_rewards?: boolean
          share_location?: boolean
          store_home_address?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_blocks: {
        Row: {
          block_type: string
          business_id: string
          config: Json
          enabled: boolean
          id: string
          sort_order: number
        }
        Insert: {
          block_type: string
          business_id: string
          config?: Json
          enabled?: boolean
          id?: string
          sort_order?: number
        }
        Update: {
          block_type?: string
          business_id?: string
          config?: Json
          enabled?: boolean
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_blocks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_blocks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "profile_blocks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_blocks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_blocks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          favorite_categories: string[] | null
          id: string
          name: string | null
          neighborhood_id: string | null
          profile_completed: boolean
          role_selected: boolean
          updated_at: string
          user_id: string
          vibe: string[]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          favorite_categories?: string[] | null
          id?: string
          name?: string | null
          neighborhood_id?: string | null
          profile_completed?: boolean
          role_selected?: boolean
          updated_at?: string
          user_id: string
          vibe?: string[]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          favorite_categories?: string[] | null
          id?: string
          name?: string | null
          neighborhood_id?: string | null
          profile_completed?: boolean
          role_selected?: boolean
          updated_at?: string
          user_id?: string
          vibe?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      program_signups: {
        Row: {
          created_at: string
          id: string
          program_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          program_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_signups_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          benefits: string | null
          category_id: string | null
          created_at: string
          created_by_user_id: string | null
          eligibility: string | null
          featured: boolean | null
          id: string
          overview: string | null
          signup_url: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          benefits?: string | null
          category_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          eligibility?: string | null
          featured?: boolean | null
          id?: string
          overview?: string | null
          signup_url?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          benefits?: string | null
          category_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          eligibility?: string | null
          featured?: boolean | null
          id?: string
          overview?: string | null
          signup_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_feedback_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "pulse_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_post_templates: {
        Row: {
          active: boolean
          allowed_authors: string[]
          content_type: string
          default_expiration_hours: number
          description: string | null
          icon: string | null
          key: string
          label: string
          max_expiration_hours: number
          prompt: string | null
          sort_order: number
        }
        Insert: {
          active?: boolean
          allowed_authors?: string[]
          content_type: string
          default_expiration_hours?: number
          description?: string | null
          icon?: string | null
          key: string
          label: string
          max_expiration_hours?: number
          prompt?: string | null
          sort_order?: number
        }
        Update: {
          active?: boolean
          allowed_authors?: string[]
          content_type?: string
          default_expiration_hours?: number
          description?: string | null
          icon?: string | null
          key?: string
          label?: string
          max_expiration_hours?: number
          prompt?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      pulse_posts: {
        Row: {
          activity_type: string | null
          anonymous: boolean | null
          author_type: string | null
          auto_generated: boolean | null
          business_id: string | null
          business_tier: string | null
          category: Database["public"]["Enums"]["pulse_category"]
          content: string
          content_type: string
          created_at: string
          event_date: string | null
          event_end_time: string | null
          event_start_time: string | null
          expires_at: string
          flag_count: number
          full_body: string | null
          headline: string | null
          helpful_count: number
          hero_image: string | null
          id: string
          is_pinned: boolean
          location_address: string | null
          location_name: string | null
          location_text: string | null
          neighborhood: string | null
          nonprofit_id: string | null
          place_business_id: string | null
          post_type: string
          preview_text: string | null
          pulse_id: string | null
          reaction_count: number
          reaction_counts: Json
          reference_id: string | null
          resharing_allowed: boolean | null
          share_enabled: boolean | null
          status: Database["public"]["Enums"]["pulse_post_status"]
          tags: string[]
          template_data: Json
          template_key: string | null
          user_id: string | null
          why_it_matters: string | null
        }
        Insert: {
          activity_type?: string | null
          anonymous?: boolean | null
          author_type?: string | null
          auto_generated?: boolean | null
          business_id?: string | null
          business_tier?: string | null
          category: Database["public"]["Enums"]["pulse_category"]
          content: string
          content_type?: string
          created_at?: string
          event_date?: string | null
          event_end_time?: string | null
          event_start_time?: string | null
          expires_at: string
          flag_count?: number
          full_body?: string | null
          headline?: string | null
          helpful_count?: number
          hero_image?: string | null
          id?: string
          is_pinned?: boolean
          location_address?: string | null
          location_name?: string | null
          location_text?: string | null
          neighborhood?: string | null
          nonprofit_id?: string | null
          place_business_id?: string | null
          post_type?: string
          preview_text?: string | null
          pulse_id?: string | null
          reaction_count?: number
          reaction_counts?: Json
          reference_id?: string | null
          resharing_allowed?: boolean | null
          share_enabled?: boolean | null
          status?: Database["public"]["Enums"]["pulse_post_status"]
          tags?: string[]
          template_data?: Json
          template_key?: string | null
          user_id?: string | null
          why_it_matters?: string | null
        }
        Update: {
          activity_type?: string | null
          anonymous?: boolean | null
          author_type?: string | null
          auto_generated?: boolean | null
          business_id?: string | null
          business_tier?: string | null
          category?: Database["public"]["Enums"]["pulse_category"]
          content?: string
          content_type?: string
          created_at?: string
          event_date?: string | null
          event_end_time?: string | null
          event_start_time?: string | null
          expires_at?: string
          flag_count?: number
          full_body?: string | null
          headline?: string | null
          helpful_count?: number
          hero_image?: string | null
          id?: string
          is_pinned?: boolean
          location_address?: string | null
          location_name?: string | null
          location_text?: string | null
          neighborhood?: string | null
          nonprofit_id?: string | null
          place_business_id?: string | null
          post_type?: string
          preview_text?: string | null
          pulse_id?: string | null
          reaction_count?: number
          reaction_counts?: Json
          reference_id?: string | null
          resharing_allowed?: boolean | null
          share_enabled?: boolean | null
          status?: Database["public"]["Enums"]["pulse_post_status"]
          tags?: string[]
          template_data?: Json
          template_key?: string | null
          user_id?: string | null
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pulse_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "pulse_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_posts_nonprofit_id_fkey"
            columns: ["nonprofit_id"]
            isOneToOne: false
            referencedRelation: "nonprofits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_posts_nonprofit_id_fkey"
            columns: ["nonprofit_id"]
            isOneToOne: false
            referencedRelation: "nonprofits_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_posts_place_business_id_fkey"
            columns: ["place_business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_posts_place_business_id_fkey"
            columns: ["place_business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "pulse_posts_place_business_id_fkey"
            columns: ["place_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_posts_place_business_id_fkey"
            columns: ["place_business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulse_posts_place_business_id_fkey"
            columns: ["place_business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "pulse_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_reports: {
        Row: {
          created_at: string
          id: string
          moderator_note: string | null
          note: string | null
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          moderator_note?: string | null
          note?: string | null
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          moderator_note?: string | null
          note?: string | null
          post_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "pulse_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_trust_scores: {
        Row: {
          account_age_days: number
          checkins: number
          is_ambassador: boolean
          is_business_owner: boolean
          level: string
          posts: number
          profile_complete: boolean
          reports_against: number
          saves: number
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_age_days?: number
          checkins?: number
          is_ambassador?: boolean
          is_business_owner?: boolean
          level?: string
          posts?: number
          profile_complete?: boolean
          reports_against?: number
          saves?: number
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_age_days?: number
          checkins?: number
          is_ambassador?: boolean
          is_business_owner?: boolean
          level?: string
          posts?: number
          profile_complete?: boolean
          reports_against?: number
          saves?: number
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_checkins: {
        Row: {
          computed_hours: number | null
          created_at: string
          event_id: string | null
          id: string
          org_id: string
          record_item_id: string | null
          scanned_in_at: string
          scanned_out_at: string | null
          user_id: string
        }
        Insert: {
          computed_hours?: number | null
          created_at?: string
          event_id?: string | null
          id?: string
          org_id: string
          record_item_id?: string | null
          scanned_in_at?: string
          scanned_out_at?: string | null
          user_id: string
        }
        Update: {
          computed_hours?: number | null
          created_at?: string
          event_id?: string | null
          id?: string
          org_id?: string
          record_item_id?: string | null
          scanned_in_at?: string
          scanned_out_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_checkins_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_checkins_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "qr_checkins_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_checkins_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_checkins_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_checkins_record_item_id_fkey"
            columns: ["record_item_id"]
            isOneToOne: false
            referencedRelation: "record_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_tags: {
        Row: {
          confirmed_count: number
          created_at: string
          id: string
          label: string
          user_id: string
        }
        Insert: {
          confirmed_count?: number
          created_at?: string
          id?: string
          label: string
          user_id: string
        }
        Update: {
          confirmed_count?: number
          created_at?: string
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      recommendation_prompts: {
        Row: {
          business_id: string
          created_at: string
          id: string
          prompt_type: string
          response: boolean
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          prompt_type: string
          response: boolean
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          prompt_type?: string
          response?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_prompts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_prompts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "recommendation_prompts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_prompts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_prompts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      record_items: {
        Row: {
          claimed_org_id: string | null
          confirmed_at: string | null
          confirmed_by_user_id: string | null
          confirmed_org_id: string | null
          created_at: string
          detail: string | null
          hours: number | null
          id: string
          kind: Database["public"]["Enums"]["record_item_kind"]
          occurred_on: string | null
          refile_note: string | null
          source: Database["public"]["Enums"]["record_item_source"]
          status: Database["public"]["Enums"]["record_item_status"]
          title: string
          user_id: string
        }
        Insert: {
          claimed_org_id?: string | null
          confirmed_at?: string | null
          confirmed_by_user_id?: string | null
          confirmed_org_id?: string | null
          created_at?: string
          detail?: string | null
          hours?: number | null
          id?: string
          kind: Database["public"]["Enums"]["record_item_kind"]
          occurred_on?: string | null
          refile_note?: string | null
          source?: Database["public"]["Enums"]["record_item_source"]
          status?: Database["public"]["Enums"]["record_item_status"]
          title: string
          user_id: string
        }
        Update: {
          claimed_org_id?: string | null
          confirmed_at?: string | null
          confirmed_by_user_id?: string | null
          confirmed_org_id?: string | null
          created_at?: string
          detail?: string | null
          hours?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["record_item_kind"]
          occurred_on?: string | null
          refile_note?: string | null
          source?: Database["public"]["Enums"]["record_item_source"]
          status?: Database["public"]["Enums"]["record_item_status"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_items_claimed_org_id_fkey"
            columns: ["claimed_org_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_items_claimed_org_id_fkey"
            columns: ["claimed_org_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "record_items_claimed_org_id_fkey"
            columns: ["claimed_org_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_items_claimed_org_id_fkey"
            columns: ["claimed_org_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_items_claimed_org_id_fkey"
            columns: ["claimed_org_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_items_confirmed_org_id_fkey"
            columns: ["confirmed_org_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_items_confirmed_org_id_fkey"
            columns: ["confirmed_org_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "record_items_confirmed_org_id_fkey"
            columns: ["confirmed_org_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_items_confirmed_org_id_fkey"
            columns: ["confirmed_org_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_items_confirmed_org_id_fkey"
            columns: ["confirmed_org_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_user_id: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string | null
          target_label: string | null
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_user_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string | null
          target_label?: string | null
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_user_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string
        }
        Relationships: []
      }
      reputation_badges: {
        Row: {
          awarded_at: string
          badge_type: string
          business_id: string
          id: string
          source: string | null
        }
        Insert: {
          awarded_at?: string
          badge_type: string
          business_id: string
          id?: string
          source?: string | null
        }
        Update: {
          awarded_at?: string
          badge_type?: string
          business_id?: string
          id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_badges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_badges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "reputation_badges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_badges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_badges_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          contact_preference: string | null
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          is_b2b: boolean
          is_barter: boolean
          need_category: string | null
          needed_by_date_time: string | null
          neighborhood_id: string | null
          poster_entity_id: string | null
          status: string
          title: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          contact_preference?: string | null
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          is_b2b?: boolean
          is_barter?: boolean
          need_category?: string | null
          needed_by_date_time?: string | null
          neighborhood_id?: string | null
          poster_entity_id?: string | null
          status?: string
          title: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          contact_preference?: string | null
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          is_b2b?: boolean
          is_barter?: boolean
          need_category?: string | null
          needed_by_date_time?: string | null
          neighborhood_id?: string | null
          poster_entity_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_poster_entity_id_fkey"
            columns: ["poster_entity_id"]
            isOneToOne: false
            referencedRelation: "city_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_homes: {
        Row: {
          created_at: string
          parcel_id: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          parcel_id: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          parcel_id?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resident_homes_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_profiles: {
        Row: {
          business_owner: boolean | null
          has_children: boolean | null
          homeowner: boolean | null
          household_size: number | null
          income_band: string | null
          life_events: string[]
          renter: boolean | null
          senior: boolean | null
          updated_at: string
          user_id: string
          veteran: boolean | null
        }
        Insert: {
          business_owner?: boolean | null
          has_children?: boolean | null
          homeowner?: boolean | null
          household_size?: number | null
          income_band?: string | null
          life_events?: string[]
          renter?: boolean | null
          senior?: boolean | null
          updated_at?: string
          user_id: string
          veteran?: boolean | null
        }
        Update: {
          business_owner?: boolean | null
          has_children?: boolean | null
          homeowner?: boolean | null
          household_size?: number | null
          income_band?: string | null
          life_events?: string[]
          renter?: boolean | null
          senior?: boolean | null
          updated_at?: string
          user_id?: string
          veteran?: boolean | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          file_name: string | null
          file_url: string
          id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          business_id: string
          content: string | null
          created_at: string
          helpful_count: number
          id: string
          photos: string[] | null
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          content?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          photos?: string[] | null
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          content?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          photos?: string[] | null
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          note: string | null
          sort_order: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          note?: string | null
          sort_order?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          note?: string | null
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      source_records: {
        Row: {
          confidence: number
          created_at: string
          entity_id: string | null
          external_id: string
          fetched_at: string
          id: string
          payload: Json
          source_id: string
          update_frequency: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          confidence?: number
          created_at?: string
          entity_id?: string | null
          external_id: string
          fetched_at?: string
          id?: string
          payload?: Json
          source_id: string
          update_frequency?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string
          entity_id?: string | null
          external_id?: string
          fetched_at?: string
          id?: string
          payload?: Json
          source_id?: string
          update_frequency?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_records_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "city_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          address: string | null
          available_from: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          listed_by: string | null
          location: unknown
          name: string
          neighborhood_id: string | null
          parcel_id: string | null
          rent_monthly: number | null
          sqft: number | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          available_from?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          listed_by?: string | null
          location?: unknown
          name: string
          neighborhood_id?: string | null
          parcel_id?: string | null
          rent_monthly?: number | null
          sqft?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          available_from?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          listed_by?: string | null
          location?: unknown
          name?: string
          neighborhood_id?: string | null
          parcel_id?: string | null
          rent_monthly?: number | null
          sqft?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          author_id: string
          business_id: string | null
          content: string
          created_at: string
          featured: boolean | null
          id: string
          image_url: string | null
          likes_count: number | null
          neighborhood_id: string | null
          status: string | null
          story_type: string | null
          title: string
        }
        Insert: {
          author_id: string
          business_id?: string | null
          content: string
          created_at?: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          neighborhood_id?: string | null
          status?: string | null
          story_type?: string | null
          title: string
        }
        Update: {
          author_id?: string
          business_id?: string | null
          content?: string
          created_at?: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          neighborhood_id?: string | null
          status?: string | null
          story_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "stories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      story_likes: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          created_at: string
          id: string
          plan_id: string
          renewal_date: string | null
          start_date: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          plan_id: string
          renewal_date?: string | null
          start_date?: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          plan_id?: string
          renewal_date?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_purchases: {
        Row: {
          created_at: string
          id: string
          quantity: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          ticket_id: string
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          ticket_id: string
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          ticket_id?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_purchases_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_change_log: {
        Row: {
          business_id: string
          changed_by: string
          created_at: string
          id: string
          new_badge_visible: boolean
          new_tier: string
          previous_badge_visible: boolean
          previous_tier: string
          reason: string | null
        }
        Insert: {
          business_id: string
          changed_by: string
          created_at?: string
          id?: string
          new_badge_visible?: boolean
          new_tier: string
          previous_badge_visible?: boolean
          previous_tier: string
          reason?: string | null
        }
        Update: {
          business_id?: string
          changed_by?: string
          created_at?: string
          id?: string
          new_badge_visible?: boolean
          new_tier?: string
          previous_badge_visible?: boolean
          previous_tier?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tier_change_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_change_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "tier_change_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_change_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_change_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      today_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      tour_stops: {
        Row: {
          business_id: string | null
          created_at: string
          deal_text: string | null
          description: string | null
          id: string
          stop_order: number
          tip: string | null
          title: string
          tour_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          deal_text?: string | null
          description?: string | null
          id?: string
          stop_order: number
          tip?: string | null
          title: string
          tour_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          deal_text?: string | null
          description?: string | null
          id?: string
          stop_order?: number
          tip?: string | null
          title?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_stops_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_stops_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "tour_stops_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_stops_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_stops_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_stops_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          distance_miles: number | null
          duration_minutes: number | null
          featured: boolean | null
          id: string
          image_url: string | null
          neighborhood_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          distance_miles?: number | null
          duration_minutes?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          neighborhood_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          distance_miles?: number | null
          duration_minutes?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          neighborhood_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tours_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      truck_stops: {
        Row: {
          business_id: string
          checkin_code: string
          created_at: string | null
          ends_at: string
          id: string
          lat: number | null
          lng: number | null
          location_name: string
          starts_at: string
          status: string
        }
        Insert: {
          business_id: string
          checkin_code?: string
          created_at?: string | null
          ends_at: string
          id?: string
          lat?: number | null
          lng?: number | null
          location_name: string
          starts_at: string
          status?: string
        }
        Update: {
          business_id?: string
          checkin_code?: string
          created_at?: string | null
          ends_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location_name?: string
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "truck_stops_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "truck_stops_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "truck_stops_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "truck_stops_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "truck_stops_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          challenge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_collection_settings: {
        Row: {
          collection_name: string | null
          created_at: string
          id: string
          is_public: boolean | null
          public_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          collection_name?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          public_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          collection_name?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          public_slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          interests: string[] | null
          is_newcomer: boolean | null
          moved_date: string | null
          onboarding_completed: boolean | null
          preferred_neighborhoods: string[] | null
          pulse_visibility: string | null
          updated_at: string
          user_id: string
          user_pulse_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          interests?: string[] | null
          is_newcomer?: boolean | null
          moved_date?: string | null
          onboarding_completed?: boolean | null
          preferred_neighborhoods?: string[] | null
          pulse_visibility?: string | null
          updated_at?: string
          user_id: string
          user_pulse_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          interests?: string[] | null
          is_newcomer?: boolean | null
          moved_date?: string | null
          onboarding_completed?: boolean | null
          preferred_neighborhoods?: string[] | null
          pulse_visibility?: string | null
          updated_at?: string
          user_id?: string
          user_pulse_enabled?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_items: {
        Row: {
          barcode_url: string | null
          business_id: string | null
          code: string | null
          created_at: string
          expires_at: string | null
          id: string
          issuer: string | null
          kind: string
          notes: string | null
          quantity: number
          title: string
          used_at: string | null
          value_cents: number | null
          wallet_id: string
        }
        Insert: {
          barcode_url?: string | null
          business_id?: string | null
          code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issuer?: string | null
          kind: string
          notes?: string | null
          quantity?: number
          title: string
          used_at?: string | null
          value_cents?: number | null
          wallet_id: string
        }
        Update: {
          barcode_url?: string | null
          business_id?: string | null
          code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issuer?: string | null
          kind?: string
          notes?: string | null
          quantity?: number
          title?: string
          used_at?: string | null
          value_cents?: number | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "wallet_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_items_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "loop_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      api_businesses: {
        Row: {
          address: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          neighborhood: string | null
          phone: string | null
          slug: string | null
          website: string | null
        }
        Relationships: []
      }
      api_changes: {
        Row: {
          body: string | null
          entity_name: string | null
          event_type: string | null
          id: string | null
          neighborhood: string | null
          occurred_at: string | null
          source_id: string | null
          source_table: string | null
          title: string | null
        }
        Relationships: []
      }
      api_developments: {
        Row: {
          address: string | null
          developer: string | null
          est_completion: string | null
          id: string | null
          investment_amount: number | null
          kind: string | null
          name: string | null
          neighborhood: string | null
          planning_case: string | null
          status: string | null
          status_label: string | null
          summary: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      api_events: {
        Row: {
          business_id: string | null
          business_name: string | null
          description: string | null
          end_date_time: string | null
          id: string | null
          is_free: boolean | null
          location_text: string | null
          neighborhood: string | null
          price_cents: number | null
          start_date_time: string | null
          ticket_url: string | null
          title: string | null
        }
        Relationships: []
      }
      api_neighborhoods: {
        Row: {
          business_count: number | null
          development_count: number | null
          id: string | null
          name: string | null
        }
        Insert: {
          business_count?: never
          development_count?: never
          id?: string | null
          name?: string | null
        }
        Update: {
          business_count?: never
          development_count?: never
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      api_spaces: {
        Row: {
          address: string | null
          available_from: string | null
          description: string | null
          id: string | null
          kind: string | null
          name: string | null
          neighborhood: string | null
          rent_monthly: number | null
          sqft: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      beta_signups_admin: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          platform: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          platform?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          platform?: string | null
          source?: string | null
        }
        Relationships: []
      }
      businesses_public: {
        Row: {
          address: string | null
          average_rating: number | null
          category: Database["public"]["Enums"]["business_category"] | null
          category_id: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          editor_pick_image: string | null
          facebook: string | null
          featured: boolean | null
          hours: Json | null
          id: string | null
          instagram: string | null
          logo_url: string | null
          name: string | null
          neighborhood_id: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          owner_user_id: string | null
          ownership_review_status: string | null
          phone: string | null
          photos: string[] | null
          profile_modules: Json | null
          profile_picture_url: string | null
          review_count: number | null
          slug: string | null
          status: string | null
          story: string | null
          tier_assigned_at: string | null
          tier_badge_visible: boolean | null
          tier_status: string | null
          tiktok: string | null
          updated_at: string | null
          verified: boolean | null
          visit_link_type: Database["public"]["Enums"]["visit_link_type"] | null
          visit_link_url: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          category?: Database["public"]["Enums"]["business_category"] | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          editor_pick_image?: string | null
          facebook?: string | null
          featured?: boolean | null
          hours?: Json | null
          id?: string | null
          instagram?: string | null
          logo_url?: string | null
          name?: string | null
          neighborhood_id?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_user_id?: string | null
          ownership_review_status?: string | null
          phone?: string | null
          photos?: string[] | null
          profile_modules?: Json | null
          profile_picture_url?: string | null
          review_count?: number | null
          slug?: string | null
          status?: string | null
          story?: string | null
          tier_assigned_at?: string | null
          tier_badge_visible?: boolean | null
          tier_status?: string | null
          tiktok?: string | null
          updated_at?: string | null
          verified?: boolean | null
          visit_link_type?:
            | Database["public"]["Enums"]["visit_link_type"]
            | null
          visit_link_url?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          category?: Database["public"]["Enums"]["business_category"] | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          editor_pick_image?: string | null
          facebook?: string | null
          featured?: boolean | null
          hours?: Json | null
          id?: string | null
          instagram?: string | null
          logo_url?: string | null
          name?: string | null
          neighborhood_id?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_user_id?: string | null
          ownership_review_status?: string | null
          phone?: string | null
          photos?: string[] | null
          profile_modules?: Json | null
          profile_picture_url?: string | null
          review_count?: number | null
          slug?: string | null
          status?: string | null
          story?: string | null
          tier_assigned_at?: string | null
          tier_badge_visible?: boolean | null
          tier_status?: string | null
          tiktok?: string | null
          updated_at?: string | null
          verified?: boolean | null
          visit_link_type?:
            | Database["public"]["Enums"]["visit_link_type"]
            | null
          visit_link_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      city_change_log: {
        Row: {
          change_count: number | null
          day: string | null
          event_type: string | null
          latest_at: string | null
          neighborhood_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_entities_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_entities_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      city_changes_daily: {
        Row: {
          change_count: number | null
          day: string | null
          entity_count: number | null
          event_type: string | null
          last_change_at: string | null
          neighborhood_count: number | null
        }
        Relationships: []
      }
      founding_members_public: {
        Row: {
          cover_image_url: string | null
          founding_number: number | null
          founding_quote: string | null
          id: string | null
          name: string | null
          neighborhood_id: string | null
          neighborhood_name: string | null
          owner_image_url: string | null
          owner_name: string | null
          slug: string | null
          tier_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_safe: {
        Row: {
          business_id: string | null
          contact_info: string | null
          created_at: string | null
          id: string | null
          message_preview: string | null
          name: string | null
          request_id: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          contact_info?: never
          created_at?: string | null
          id?: string | null
          message_preview?: never
          name?: never
          request_id?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          contact_info?: never
          created_at?: string | null
          id?: string | null
          message_preview?: never
          name?: never
          request_id?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "api_events"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "founding_members_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      nonprofits_public: {
        Row: {
          address: string | null
          cause_category: Database["public"]["Enums"]["cause_category"] | null
          claimed: boolean | null
          claimed_at: string | null
          claimed_by: string | null
          community_support_types:
            | Database["public"]["Enums"]["community_support_type"][]
            | null
          cover_image_url: string | null
          created_at: string | null
          founding_community_partner: boolean | null
          human_note: string | null
          id: string | null
          logo_url: string | null
          mission_statement: string | null
          name: string | null
          neighborhood_id: string | null
          slug: string | null
          status: string | null
          updated_at: string | null
          website: string | null
          what_this_helps: string | null
        }
        Insert: {
          address?: string | null
          cause_category?: Database["public"]["Enums"]["cause_category"] | null
          claimed?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          community_support_types?:
            | Database["public"]["Enums"]["community_support_type"][]
            | null
          cover_image_url?: string | null
          created_at?: string | null
          founding_community_partner?: boolean | null
          human_note?: string | null
          id?: string | null
          logo_url?: string | null
          mission_statement?: string | null
          name?: string | null
          neighborhood_id?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
          what_this_helps?: string | null
        }
        Update: {
          address?: string | null
          cause_category?: Database["public"]["Enums"]["cause_category"] | null
          claimed?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          community_support_types?:
            | Database["public"]["Enums"]["community_support_type"][]
            | null
          cover_image_url?: string | null
          created_at?: string | null
          founding_community_partner?: boolean | null
          human_note?: string | null
          id?: string | null
          logo_url?: string | null
          mission_statement?: string | null
          name?: string | null
          neighborhood_id?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
          what_this_helps?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nonprofits_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "api_neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonprofits_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_business_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      admin_attach_business_staff: {
        Args: {
          p_business_id: string
          p_note?: string
          p_role: string
          p_target_email?: string
          p_target_user_id?: string
        }
        Returns: Json
      }
      admin_cancel_business_invitation: {
        Args: { p_invitation_id: string; p_note?: string }
        Returns: Json
      }
      admin_get_all_profiles: {
        Args: never
        Returns: {
          avatar_url: string | null
          created_at: string
          favorite_categories: string[] | null
          id: string
          name: string | null
          neighborhood_id: string | null
          profile_completed: boolean
          role_selected: boolean
          updated_at: string
          user_id: string
          vibe: string[]
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_remove_business_staff: {
        Args: { p_note?: string; p_staff_id: string }
        Returns: Json
      }
      api_authenticate: {
        Args: { p_key: string; p_resource: string }
        Returns: Json
      }
      approve_business_claim: {
        Args: { p_claim_id: string }
        Returns: undefined
      }
      approve_claim:
        | { Args: { p_approve?: boolean; p_claim_id: string }; Returns: Json }
        | { Args: { p_claim_id: string; p_role?: string }; Returns: undefined }
      autopilot_digest: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          body: string
          distance_miles: number
          entity_id: string
          entity_name: string
          event_type: string
          log_id: string
          occurred_at: string
          reason: string
          score: number
          source_id: string
          source_table: string
          title: string
          topic: string
        }[]
      }
      autopilot_topic: { Args: { p_event_type: string }; Returns: string }
      autopilot_topics: {
        Args: never
        Returns: {
          label: string
          topic: string
        }[]
      }
      b2b_requests: {
        Args: { p_barter_only?: boolean; p_limit?: number }
        Returns: {
          budget_max: number
          budget_min: number
          created_at: string
          description: string
          id: string
          is_barter: boolean
          need_category: string
          needed_by: string
          neighborhood_name: string
          poster_business_id: string
          poster_entity_id: string
          poster_name: string
          title: string
        }[]
      }
      beta_phase: { Args: never; Returns: string }
      beta_signup_count: { Args: never; Returns: number }
      beta_signup_counts: {
        Args: never
        Returns: {
          android: number
          apple: number
          spots_left: number
          total: number
        }[]
      }
      build_notification_digests: {
        Args: { p_cadence: string }
        Returns: number
      }
      business_command_center: {
        Args: { p_business_id: string; p_days?: number }
        Returns: Json
      }
      business_follower_count: {
        Args: { _business_id: string }
        Returns: number
      }
      business_missing_fields: {
        Args: { b: Database["public"]["Tables"]["businesses"]["Row"] }
        Returns: string[]
      }
      business_role_rank: { Args: { _role: string }; Returns: number }
      can_confirm_for_business: {
        Args: { p_business_id: string; p_user?: string }
        Returns: boolean
      }
      can_moderate: { Args: { _user_id: string }; Returns: boolean }
      can_view_lead: {
        Args: { _business_id: string; _user_id?: string }
        Returns: boolean
      }
      charter_100_seat_count: { Args: never; Returns: number }
      check_ai_rate_limit: { Args: { _user_id: string }; Returns: boolean }
      check_ask_toledo_rate_limit: {
        Args: { _user_id: string }
        Returns: boolean
      }
      check_first_review_cooldown: {
        Args: { _user_id: string }
        Returns: boolean
      }
      check_global_lead_rate_limit: {
        Args: { _user_id: string }
        Returns: boolean
      }
      check_lead_rate_limit: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      check_post_rate_limit: { Args: { _user_id: string }; Returns: boolean }
      check_review_rate_limit: { Args: { _user_id: string }; Returns: boolean }
      city_changed_recently: {
        Args: { p_days?: number }
        Returns: {
          change_count: number
          event_type: string
          latest_at: string
          latest_title: string
        }[]
      }
      city_config: {
        Args: { p_slug?: string }
        Returns: {
          accent_color: string
          center_lat: number
          center_lng: number
          data_source_ids: Json
          default_radius_miles: number
          feature_flags: Json
          id: string
          is_active: boolean
          logo_url: string
          name: string
          primary_color: string
          region: string
          slug: string
          tagline: string
          timezone: string
          units: string
        }[]
      }
      city_feed: {
        Args: {
          p_limit?: number
          p_neighborhood_id?: string
          p_radius_miles?: number
          p_scope?: string
        }
        Returns: {
          body: string
          distance_miles: number
          entity_id: string
          image_url: string
          item_id: string
          kind: string
          neighborhood_id: string
          neighborhood_name: string
          occurred_at: string
          source: string
          source_id: string
          source_table: string
          title: string
        }[]
      }
      city_scoping_audit: {
        Args: never
        Returns: {
          has_city_id: boolean
          row_count: number
          table_name: string
        }[]
      }
      city_search: {
        Args: { p_limit?: number; p_query: string; p_user_id?: string }
        Returns: {
          blurb: string
          distance_miles: number
          entity_id: string
          kind: string
          match_kind: string
          name: string
          neighborhood: string
          neighborhood_id: string
          rank: number
          source_id: string
          source_table: string
        }[]
      }
      citygraph_business_point: {
        Args: { p_business_id: string }
        Returns: unknown
      }
      citygraph_entity_id: {
        Args: { p_source_id: string; p_source_table: string }
        Returns: string
      }
      citygraph_kind_matches: {
        Args: {
          p_kind: Database["public"]["Enums"]["entity_kind"]
          p_wanted: string[]
        }
        Returns: boolean
      }
      citygraph_search: { Args: { p_spec: Json }; Returns: Json }
      citygraph_upsert_entity: {
        Args: {
          p_blurb?: string
          p_kind: Database["public"]["Enums"]["entity_kind"]
          p_location: unknown
          p_name: string
          p_neighborhood_id: string
          p_source_id: string
          p_source_table: string
        }
        Returns: string
      }
      citylog_delta: {
        Args: { p_after: unknown; p_before: unknown; p_field: string }
        Returns: Json
      }
      citylog_write: {
        Args: {
          p_body?: string
          p_event_type: string
          p_payload?: Json
          p_source_id: string
          p_source_table: string
          p_title: string
        }
        Returns: undefined
      }
      claim_ownership: {
        Args: { p_business_id: string; p_verification_method?: string }
        Returns: Json
      }
      compute_neighborhood_activity: { Args: never; Returns: undefined }
      confirm_address_verification: { Args: { p_code: string }; Returns: Json }
      confirm_record_item: {
        Args: { p_item_id: string }
        Returns: {
          claimed_org_id: string | null
          confirmed_at: string | null
          confirmed_by_user_id: string | null
          confirmed_org_id: string | null
          created_at: string
          detail: string | null
          hours: number | null
          id: string
          kind: Database["public"]["Enums"]["record_item_kind"]
          occurred_on: string | null
          refile_note: string | null
          source: Database["public"]["Enums"]["record_item_source"]
          status: Database["public"]["Enums"]["record_item_status"]
          title: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "record_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_api_key: {
        Args: { p_name: string; p_rate_limit?: number }
        Returns: {
          api_key: string
          id: string
          key_prefix: string
        }[]
      }
      create_managed_business: {
        Args: { p_category_id?: string; p_description?: string; p_name: string }
        Returns: string
      }
      decline_business_claim: {
        Args: { p_claim_id: string }
        Returns: undefined
      }
      deny_record_item: {
        Args: { p_item_id: string }
        Returns: {
          claimed_org_id: string | null
          confirmed_at: string | null
          confirmed_by_user_id: string | null
          confirmed_org_id: string | null
          created_at: string
          detail: string | null
          hours: number | null
          id: string
          kind: Database["public"]["Enums"]["record_item_kind"]
          occurred_on: string | null
          refile_note: string | null
          source: Database["public"]["Enums"]["record_item_source"]
          status: Database["public"]["Enums"]["record_item_status"]
          title: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "record_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      development_radar: {
        Args: {
          p_kinds?: string[]
          p_limit?: number
          p_radius_miles?: number
          p_statuses?: string[]
        }
        Returns: {
          address: string
          developer: string
          distance_miles: number
          documents: Json
          entity_id: string
          est_completion: string
          id: string
          investment_amount: number
          kind: string
          latitude: number
          longitude: number
          name: string
          neighborhood_id: string
          neighborhood_name: string
          planning_case: string
          status: string
          summary: string
          updated_at: string
        }[]
      }
      development_status_label: { Args: { p_status: string }; Returns: string }
      effective_business_role: {
        Args: { p_business_id: string; p_user?: string }
        Returns: string
      }
      entities_needing_embeddings: {
        Args: { p_limit?: number }
        Returns: {
          blurb: string
          entity_id: string
          kind: string
          name: string
        }[]
      }
      entity_follower_count: { Args: { _entity_id: string }; Returns: number }
      entity_memory: {
        Args: { p_entity_id: string; p_limit?: number }
        Returns: {
          body: string
          contributor: string
          created_at: string
          id: string
          kind: string
          media_url: string
          title: string
          year: number
        }[]
      }
      entity_provenance: {
        Args: { p_entity_id: string }
        Returns: {
          confidence: number
          fetched_at: string
          is_seed: boolean
          last_run_at: string
          source_kind: string
          source_name: string
          verified_at: string
        }[]
      }
      expire_pulse_posts: { Args: never; Returns: undefined }
      file_claim: {
        Args: {
          p_claimed_org_id: string
          p_detail?: string
          p_hours?: number
          p_kind: Database["public"]["Enums"]["record_item_kind"]
          p_occurred_on?: string
          p_title: string
        }
        Returns: {
          claimed_org_id: string | null
          confirmed_at: string | null
          confirmed_by_user_id: string | null
          confirmed_org_id: string | null
          created_at: string
          detail: string | null
          hours: number | null
          id: string
          kind: Database["public"]["Enums"]["record_item_kind"]
          occurred_on: string | null
          refile_note: string | null
          source: Database["public"]["Enums"]["record_item_source"]
          status: Database["public"]["Enums"]["record_item_status"]
          title: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "record_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      find_duplicate_business: {
        Args: { p_name: string; p_street?: string }
        Returns: {
          address: string
          has_manager: boolean
          has_owner: boolean
          id: string
          name: string
          status: string
          street_address: string
        }[]
      }
      generate_business_slug: {
        Args: { business_name: string }
        Returns: string
      }
      generate_city_signals: { Args: never; Returns: undefined }
      generate_collection_slug: { Args: { user_name: string }; Returns: string }
      generate_user_pulse: {
        Args: {
          p_activity_type: string
          p_business_id?: string
          p_content?: string
          p_reference_id: string
          p_user_id: string
        }
        Returns: string
      }
      get_business_by_id: {
        Args: { business_id: string }
        Returns: {
          address: string
          average_rating: number
          category_id: string
          created_at: string
          description: string
          editor_pick_image: string
          featured: boolean
          hours: Json
          id: string
          instagram: string
          is_owner: boolean
          logo_url: string
          name: string
          neighborhood_id: string
          phone: string
          photos: string[]
          review_count: number
          status: string
          story: string
          updated_at: string
          verified: boolean
          website: string
        }[]
      }
      get_business_saved_count: {
        Args: { business_id: string }
        Returns: number
      }
      get_neighborhood_popularity: {
        Args: { neighborhood_id: string }
        Returns: number
      }
      get_or_create_loop_wallet: {
        Args: { p_city?: string; p_user_id: string }
        Returns: string
      }
      get_public_businesses: {
        Args: never
        Returns: {
          address: string
          average_rating: number
          category_id: string
          created_at: string
          description: string
          editor_pick_image: string
          featured: boolean
          hours: Json
          id: string
          instagram: string
          is_owner: boolean
          logo_url: string
          name: string
          neighborhood_id: string
          phone: string
          photos: string[]
          review_count: number
          status: string
          story: string
          updated_at: string
          verified: boolean
          website: string
        }[]
      }
      get_user_business_id: { Args: { _user_id: string }; Returns: string }
      grant_business_owner: {
        Args: { p_business_id: string; p_user: string }
        Returns: undefined
      }
      has_business_permission: {
        Args: {
          check_business_id: string
          required_role: Database["public"]["Enums"]["business_admin_role"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_verification_code: { Args: { p_code: string }; Returns: string }
      hire_qr_checkin: {
        Args: { p_event_id?: string; p_org_id: string }
        Returns: {
          computed_hours: number | null
          created_at: string
          event_id: string | null
          id: string
          org_id: string
          record_item_id: string | null
          scanned_in_at: string
          scanned_out_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "qr_checkins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      hire_qr_checkout: {
        Args: { p_checkin_id: string }
        Returns: {
          computed_hours: number | null
          created_at: string
          event_id: string | null
          id: string
          org_id: string
          record_item_id: string | null
          scanned_in_at: string
          scanned_out_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "qr_checkins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      in_quiet_hours: { Args: never; Returns: boolean }
      inbox_unread_count: { Args: never; Returns: number }
      is_beta_eligible: { Args: { p_user?: string }; Returns: boolean }
      is_business_admin: {
        Args: { check_business_id: string }
        Returns: boolean
      }
      is_business_manager: { Args: { _business_id: string }; Returns: boolean }
      is_business_staff: {
        Args: { check_business_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      issue_loop_points: {
        Args: {
          p_business_id: string
          p_description?: string
          p_mission_id?: string
          p_points: number
          p_qr_code_id?: string
          p_transaction_type: Database["public"]["Enums"]["loop_transaction_type"]
          p_user_id: string
        }
        Returns: string
      }
      jobs_near_home: {
        Args: {
          p_filters?: string[]
          p_limit?: number
          p_radius_miles?: number
        }
        Returns: {
          bus_minutes: number
          business_id: string
          business_name: string
          created_at: string
          distance_miles: number
          drive_minutes: number
          flags: string[]
          hiring_now: boolean
          id: string
          job_type: string
          neighborhood_name: string
          pay_max: number
          pay_min: number
          pay_type: string
          schedule: string
          title: string
          walk_minutes: number
        }[]
      }
      local_economic_loop: { Args: { p_months?: number }; Returns: Json }
      mark_notification_sent: {
        Args: { p_channel: string; p_error?: string; p_id: string }
        Returns: undefined
      }
      mark_wallet_item_used: { Args: { p_item_id: string }; Returns: undefined }
      mask_phone: { Args: { phone_number: string }; Returns: string }
      match_opportunities: {
        Args: { p_limit?: number }
        Returns: {
          category: string
          deadline: string
          description: string
          eligibility: Json
          id: string
          life_events: string[]
          matched_on: string[]
          missing_info: boolean
          phone: string
          provenance: Json
          provider: string
          title: string
          url: string
        }[]
      }
      my_api_keys: {
        Args: never
        Returns: {
          active: boolean
          calls_last_hour: number
          calls_total: number
          created_at: string
          id: string
          key_prefix: string
          last_used_at: string
          name: string
          rate_limit_per_hour: number
        }[]
      }
      my_city_near_me: {
        Args: { p_limit?: number; p_radius_miles?: number }
        Returns: {
          body: string
          distance_miles: number
          entity_id: string
          entity_name: string
          event_type: string
          log_id: string
          occurs_at: string
          scope: string
          source_id: string
          source_table: string
          title: string
        }[]
      }
      my_city_nearby_businesses: {
        Args: { p_limit?: number; p_radius_miles?: number }
        Returns: {
          address: string
          business_id: string
          category: string
          created_at: string
          distance_miles: number
          name: string
        }[]
      }
      my_home: {
        Args: never
        Returns: {
          address: string
          assessed_value: number
          council_district: string
          neighborhood_id: string
          neighborhood_name: string
          parcel_id: string
          precinct: string
          recycling_week: string
          refuse_day: string
          school_district: string
          snow_route: string
          source: string
          tax_year_amount: number
          verified_at: string
        }[]
      }
      my_local_spend_share: { Args: { p_business_id: string }; Returns: Json }
      my_notification_preferences: {
        Args: never
        Returns: {
          cadence: string
          category: string
          description: string
          label: string
        }[]
      }
      my_privacy_settings: {
        Args: never
        Returns: {
          ai_recommendations: boolean
          notification_categories: Json
          personalization: boolean
          public_activity: boolean
          public_rewards: boolean
          share_location: boolean
          store_home_address: boolean
        }[]
      }
      my_reported_issues: { Args: never; Returns: string[] }
      my_suppliers: {
        Args: { p_business_id: string }
        Returns: {
          category: string
          id: string
          is_local: boolean
          monthly_spend: number
          supplier_id: string
          supplier_name: string
        }[]
      }
      my_toledo_year: { Args: { p_year?: number }; Returns: Json }
      my_wallet_items: {
        Args: { p_include_used?: boolean }
        Returns: {
          business_id: string
          business_name: string
          code: string
          expired: boolean
          expires_at: string
          id: string
          issuer: string
          kind: string
          notes: string
          quantity: number
          title: string
          used_at: string
          value_cents: number
        }[]
      }
      nearby: {
        Args: {
          p_entity_id: string
          p_kinds?: string[]
          p_limit?: number
          p_radius_miles?: number
        }
        Returns: {
          distance_miles: number
          entity_id: string
          kind: string
          name: string
          neighborhood_id: string
          source_id: string
          source_table: string
        }[]
      }
      neighborhood_for_point: { Args: { p_point: unknown }; Returns: string }
      neighborhood_stats: {
        Args: { p_neighborhood_id?: string }
        Returns: {
          businesses: number
          changes_30d: number
          developments: number
          events_upcoming: number
          issues_completed: number
          issues_open: number
          jobs_open: number
          memories: number
          neighborhood_id: string
          neighborhood_name: string
          nonprofits: number
          parcels: number
          spaces_available: number
          under_construction: number
        }[]
      }
      notification_categories: {
        Args: never
        Returns: {
          category: string
          description: string
          label: string
        }[]
      }
      notification_category:
        | { Args: { p_event_type: string }; Returns: string }
        | {
            Args: { p_entity_kind?: string; p_event_type: string }
            Returns: string
          }
      pending_notifications: {
        Args: { p_limit?: number }
        Returns: {
          cadence: string
          created_at: string
          id: string
          item_count: number
          payload: Json
          summary: string
          user_id: string
        }[]
      }
      pledge_to_issue: {
        Args: {
          p_amount: number
          p_issue_id: string
          p_kind: string
          p_note?: string
        }
        Returns: undefined
      }
      post_b2b_request: {
        Args: {
          p_budget_max?: number
          p_budget_min?: number
          p_business_id: string
          p_description?: string
          p_is_barter?: boolean
          p_need_category?: string
          p_needed_by?: string
          p_title: string
        }
        Returns: string
      }
      privacy_allows: {
        Args: { p_setting: string; p_user_id: string }
        Returns: boolean
      }
      published_plugins: {
        Args: never
        Returns: {
          id: string
          manifest: Json
          name: string
          org_entity: string
          org_name: string
          slug: string
          summary: string
        }[]
      }
      pulse_recount_reactions: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      recompute_pulse_trust: { Args: { p_user_id: string }; Returns: undefined }
      record_analytics_event: {
        Args: {
          p_business_id: string
          p_entity_id?: string
          p_entity_type?: string
          p_event_type: string
          p_metadata?: Json
        }
        Returns: string
      }
      record_source_run: {
        Args: {
          p_count?: number
          p_error?: string
          p_source_id: string
          p_status: string
        }
        Returns: undefined
      }
      redeem_loop_points: {
        Args: { p_reward_id: string; p_user_id: string }
        Returns: Json
      }
      refresh_business_insights: {
        Args: { p_business_id: string }
        Returns: number
      }
      refresh_city_changes_daily: { Args: never; Returns: undefined }
      report_issue: {
        Args: {
          p_description?: string
          p_is_government?: boolean
          p_kind: string
          p_lat?: number
          p_lng?: number
          p_needs?: Json
          p_neighborhood_id?: string
          p_photo_url?: string
          p_title: string
        }
        Returns: string
      }
      reset_monthly_loop_caps: { Args: never; Returns: undefined }
      resolve_address: {
        Args: { p_query: string }
        Returns: {
          address: string
          confidence: number
          latitude: number
          longitude: number
          match: string
          neighborhood_id: string
          neighborhood_name: string
          parcel_id: string
        }[]
      }
      revoke_api_key: { Args: { p_key_id: string }; Returns: undefined }
      save_autopilot_preferences: {
        Args: { p_patch: Json }
        Returns: undefined
      }
      save_resident_profile: { Args: { p_patch: Json }; Returns: undefined }
      search_parcels: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          address: string
          id: string
          neighborhood_id: string
          neighborhood_name: string
        }[]
      }
      semantic_search: {
        Args: { p_embedding: string; p_limit?: number; p_user_id?: string }
        Returns: {
          blurb: string
          distance_miles: number
          entity_id: string
          kind: string
          match_kind: string
          name: string
          neighborhood: string
          neighborhood_id: string
          rank: number
          source_id: string
          source_table: string
        }[]
      }
      set_home_parcel: { Args: { p_parcel_id: string }; Returns: undefined }
      set_notification_preference: {
        Args: { p_cadence: string; p_category: string }
        Returns: undefined
      }
      set_privacy_setting: {
        Args: { p_setting: string; p_value: boolean }
        Returns: undefined
      }
      set_supplier_spend: {
        Args: { p_link_id: string; p_monthly_spend?: number }
        Returns: undefined
      }
      transfer_ownership: {
        Args: { p_business_id: string; p_new_owner_user_id: string }
        Returns: Json
      }
      update_ticket_purchase_from_webhook: {
        Args: {
          _new_status: string
          _payment_intent_id: string
          _purchase_id: string
          _session_id: string
        }
        Returns: undefined
      }
      user_owns_business: { Args: { biz_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "resident"
        | "business"
        | "admin"
        | "organizer"
        | "nonprofit"
        | "partner"
        | "connector"
        | "super_admin"
        | "city_admin"
        | "moderator"
        | "ambassador"
        | "support_staff"
        | "charter_100"
      business_admin_role:
        | "owner"
        | "manager"
        | "marketing"
        | "event_manager"
        | "hiring_manager"
        | "viewer"
      business_category:
        | "restaurant"
        | "food_truck"
        | "retail"
        | "salon_barber"
        | "gym_fitness"
        | "contractor_service"
        | "nonprofit"
        | "childcare"
        | "artist_maker"
        | "event_venue"
        | "professional_service"
        | "community_org"
      cause_category:
        | "food_insecurity"
        | "housing"
        | "youth"
        | "health"
        | "arts_culture"
        | "education"
        | "community_support"
        | "environment"
        | "animal_welfare"
        | "veterans"
        | "seniors"
        | "disability_services"
      community_support_type:
        | "volunteers"
        | "donations"
        | "supplies"
        | "events"
        | "awareness"
      data_source_kind: "api" | "gis" | "rss" | "ical" | "csv" | "manual"
      entity_kind:
        | "person"
        | "place"
        | "organization"
        | "event"
        | "resource"
        | "transaction"
        | "issue"
        | "business"
        | "property"
        | "neighborhood"
        | "job"
        | "deal"
        | "project"
        | "government_action"
        | "opportunity"
        | "content"
      founding_5_category:
        | "morning"
        | "evening"
        | "retail"
        | "experience"
        | "other"
      loop_mission_type:
        | "visits"
        | "category"
        | "neighborhood"
        | "mwbe"
        | "tourism"
        | "event"
        | "donation"
      loop_qr_type: "visit" | "job_complete" | "referral" | "event" | "campaign"
      loop_reward_category: "perk" | "experience" | "service_credit"
      loop_transaction_type:
        | "earn"
        | "redeem"
        | "donate"
        | "bonus"
        | "refund"
        | "expire"
      notification_cadence: "immediate" | "daily" | "weekly" | "off"
      pulse_category:
        | "right_now"
        | "heads_up"
        | "energy_check"
        | "community_ask"
        | "good_stuff"
      pulse_post_status: "active" | "hidden" | "removed" | "expired"
      record_item_kind:
        | "employment"
        | "volunteer_hours"
        | "certification"
        | "endorsement"
        | "quality_tag"
      record_item_source: "self_claim" | "qr_checkin" | "org_issued"
      record_item_status: "pending" | "verified" | "denied"
      reference_status: "pending" | "verified"
      visit_link_type:
        | "website"
        | "facebook"
        | "instagram"
        | "google_maps"
        | "phone"
        | "menu"
        | "booking"
        | "order_online"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "resident",
        "business",
        "admin",
        "organizer",
        "nonprofit",
        "partner",
        "connector",
        "super_admin",
        "city_admin",
        "moderator",
        "ambassador",
        "support_staff",
        "charter_100",
      ],
      business_admin_role: [
        "owner",
        "manager",
        "marketing",
        "event_manager",
        "hiring_manager",
        "viewer",
      ],
      business_category: [
        "restaurant",
        "food_truck",
        "retail",
        "salon_barber",
        "gym_fitness",
        "contractor_service",
        "nonprofit",
        "childcare",
        "artist_maker",
        "event_venue",
        "professional_service",
        "community_org",
      ],
      cause_category: [
        "food_insecurity",
        "housing",
        "youth",
        "health",
        "arts_culture",
        "education",
        "community_support",
        "environment",
        "animal_welfare",
        "veterans",
        "seniors",
        "disability_services",
      ],
      community_support_type: [
        "volunteers",
        "donations",
        "supplies",
        "events",
        "awareness",
      ],
      data_source_kind: ["api", "gis", "rss", "ical", "csv", "manual"],
      entity_kind: [
        "person",
        "place",
        "organization",
        "event",
        "resource",
        "transaction",
        "issue",
        "business",
        "property",
        "neighborhood",
        "job",
        "deal",
        "project",
        "government_action",
        "opportunity",
        "content",
      ],
      founding_5_category: [
        "morning",
        "evening",
        "retail",
        "experience",
        "other",
      ],
      loop_mission_type: [
        "visits",
        "category",
        "neighborhood",
        "mwbe",
        "tourism",
        "event",
        "donation",
      ],
      loop_qr_type: ["visit", "job_complete", "referral", "event", "campaign"],
      loop_reward_category: ["perk", "experience", "service_credit"],
      loop_transaction_type: [
        "earn",
        "redeem",
        "donate",
        "bonus",
        "refund",
        "expire",
      ],
      notification_cadence: ["immediate", "daily", "weekly", "off"],
      pulse_category: [
        "right_now",
        "heads_up",
        "energy_check",
        "community_ask",
        "good_stuff",
      ],
      pulse_post_status: ["active", "hidden", "removed", "expired"],
      record_item_kind: [
        "employment",
        "volunteer_hours",
        "certification",
        "endorsement",
        "quality_tag",
      ],
      record_item_source: ["self_claim", "qr_checkin", "org_issued"],
      record_item_status: ["pending", "verified", "denied"],
      reference_status: ["pending", "verified"],
      visit_link_type: [
        "website",
        "facebook",
        "instagram",
        "google_maps",
        "phone",
        "menu",
        "booking",
        "order_online",
      ],
    },
  },
} as const

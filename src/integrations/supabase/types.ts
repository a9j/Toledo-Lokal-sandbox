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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
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
        ]
      }
      businesses: {
        Row: {
          address: string | null
          average_rating: number | null
          category_id: string | null
          connected_by_connector_id: string | null
          created_at: string
          description: string | null
          editor_pick_image: string | null
          facebook: string | null
          featured: boolean | null
          hours: Json | null
          id: string
          instagram: string | null
          logo_url: string | null
          name: string
          neighborhood_id: string | null
          owner_user_id: string
          phone: string | null
          photos: string[] | null
          referral_source: string | null
          review_count: number | null
          slug: string | null
          status: string
          story: string | null
          tiktok: string | null
          updated_at: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          category_id?: string | null
          connected_by_connector_id?: string | null
          created_at?: string
          description?: string | null
          editor_pick_image?: string | null
          facebook?: string | null
          featured?: boolean | null
          hours?: Json | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name: string
          neighborhood_id?: string | null
          owner_user_id: string
          phone?: string | null
          photos?: string[] | null
          referral_source?: string | null
          review_count?: number | null
          slug?: string | null
          status?: string
          story?: string | null
          tiktok?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          category_id?: string | null
          connected_by_connector_id?: string | null
          created_at?: string
          description?: string | null
          editor_pick_image?: string | null
          facebook?: string | null
          featured?: boolean | null
          hours?: Json | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          neighborhood_id?: string | null
          owner_user_id?: string
          phone?: string | null
          photos?: string[] | null
          referral_source?: string | null
          review_count?: number | null
          slug?: string | null
          status?: string
          story?: string | null
          tiktok?: string | null
          updated_at?: string
          verified?: boolean | null
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
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
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
        ]
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
      deals: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          end_date: string
          featured: boolean | null
          id: string
          image_url: string | null
          redemption_method: string | null
          start_date: string
          status: string
          title: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          end_date: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          redemption_method?: string | null
          start_date?: string
          status?: string
          title: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          featured?: boolean | null
          id?: string
          image_url?: string | null
          redemption_method?: string | null
          start_date?: string
          status?: string
          title?: string
        }
        Relationships: [
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
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          business_id: string | null
          connector_id: string | null
          created_at: string
          description: string | null
          end_date_time: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          location_text: string | null
          start_date_time: string
          status: string
          ticket_url: string | null
          title: string
        }
        Insert: {
          business_id?: string | null
          connector_id?: string | null
          created_at?: string
          description?: string | null
          end_date_time?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          location_text?: string | null
          start_date_time: string
          status?: string
          ticket_url?: string | null
          title: string
        }
        Update: {
          business_id?: string | null
          connector_id?: string | null
          created_at?: string
          description?: string | null
          end_date_time?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          location_text?: string | null
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
            foreignKeyName: "events_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
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
        ]
      }
      jobs: {
        Row: {
          apply_contact: string
          apply_method: string
          business_id: string
          created_at: string
          description: string | null
          featured: boolean | null
          hiring_now: boolean | null
          id: string
          job_type: string
          pay_max: number | null
          pay_min: number | null
          pay_type: string | null
          schedule: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          apply_contact: string
          apply_method: string
          business_id: string
          created_at?: string
          description?: string | null
          featured?: boolean | null
          hiring_now?: boolean | null
          id?: string
          job_type: string
          pay_max?: number | null
          pay_min?: number | null
          pay_type?: string | null
          schedule?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          apply_contact?: string
          apply_method?: string
          business_id?: string
          created_at?: string
          description?: string | null
          featured?: boolean | null
          hiring_now?: boolean | null
          id?: string
          job_type?: string
          pay_max?: number | null
          pay_min?: number | null
          pay_type?: string | null
          schedule?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
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
            foreignKeyName: "leads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
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
          target_neighborhood_id?: string | null
          title?: string
        }
        Relationships: [
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
            foreignKeyName: "loop_missions_target_category_id_fkey"
            columns: ["target_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      neighborhoods: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
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
            referencedRelation: "neighborhoods"
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
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          neighborhood_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          neighborhood_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          neighborhood_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
          created_at: string
          expires_at: string
          flag_count: number
          full_body: string | null
          headline: string | null
          helpful_count: number
          hero_image: string | null
          id: string
          is_pinned: boolean
          location_text: string | null
          nonprofit_id: string | null
          preview_text: string | null
          pulse_id: string | null
          reference_id: string | null
          resharing_allowed: boolean | null
          share_enabled: boolean | null
          status: Database["public"]["Enums"]["pulse_post_status"]
          user_id: string | null
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
          created_at?: string
          expires_at: string
          flag_count?: number
          full_body?: string | null
          headline?: string | null
          helpful_count?: number
          hero_image?: string | null
          id?: string
          is_pinned?: boolean
          location_text?: string | null
          nonprofit_id?: string | null
          preview_text?: string | null
          pulse_id?: string | null
          reference_id?: string | null
          resharing_allowed?: boolean | null
          share_enabled?: boolean | null
          status?: Database["public"]["Enums"]["pulse_post_status"]
          user_id?: string | null
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
          created_at?: string
          expires_at?: string
          flag_count?: number
          full_body?: string | null
          headline?: string | null
          helpful_count?: number
          hero_image?: string | null
          id?: string
          is_pinned?: boolean
          location_text?: string | null
          nonprofit_id?: string | null
          preview_text?: string | null
          pulse_id?: string | null
          reference_id?: string | null
          resharing_allowed?: boolean | null
          share_enabled?: boolean | null
          status?: Database["public"]["Enums"]["pulse_post_status"]
          user_id?: string | null
        }
        Relationships: [
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
            foreignKeyName: "pulse_posts_nonprofit_id_fkey"
            columns: ["nonprofit_id"]
            isOneToOne: false
            referencedRelation: "nonprofits"
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
          needed_by_date_time: string | null
          neighborhood_id: string | null
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
          needed_by_date_time?: string | null
          neighborhood_id?: string | null
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
          needed_by_date_time?: string | null
          neighborhood_id?: string | null
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
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "neighborhoods"
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
    }
    Views: {
      businesses_public: {
        Row: {
          address: string | null
          average_rating: number | null
          category_id: string | null
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
          owner_user_id: string | null
          phone: string | null
          photos: string[] | null
          review_count: number | null
          slug: string | null
          status: string | null
          story: string | null
          tiktok: string | null
          updated_at: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          category_id?: string | null
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
          owner_user_id?: never
          phone?: never
          photos?: string[] | null
          review_count?: number | null
          slug?: string | null
          status?: string | null
          story?: string | null
          tiktok?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          category_id?: string | null
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
          owner_user_id?: never
          phone?: never
          photos?: string[] | null
          review_count?: number | null
          slug?: string | null
          status?: string | null
          story?: string | null
          tiktok?: string | null
          updated_at?: string | null
          verified?: boolean | null
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
            foreignKeyName: "leads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
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
      admin_get_all_profiles: {
        Args: never
        Returns: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          neighborhood_id: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      can_view_lead: {
        Args: { _business_id: string; _user_id?: string }
        Returns: boolean
      }
      check_ai_rate_limit: { Args: { _user_id: string }; Returns: boolean }
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
      expire_pulse_posts: { Args: never; Returns: undefined }
      generate_business_slug: {
        Args: { business_name: string }
        Returns: string
      }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_business_staff: {
        Args: { check_business_id: string }
        Returns: boolean
      }
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
      mask_phone: { Args: { phone_number: string }; Returns: string }
      redeem_loop_points: {
        Args: { p_reward_id: string; p_user_id: string }
        Returns: Json
      }
      reset_monthly_loop_caps: { Args: never; Returns: undefined }
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
      pulse_category:
        | "right_now"
        | "heads_up"
        | "energy_check"
        | "community_ask"
        | "good_stuff"
      pulse_post_status: "active" | "hidden" | "removed" | "expired"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      pulse_category: [
        "right_now",
        "heads_up",
        "energy_check",
        "community_ask",
        "good_stuff",
      ],
      pulse_post_status: ["active", "hidden", "removed", "expired"],
    },
  },
} as const

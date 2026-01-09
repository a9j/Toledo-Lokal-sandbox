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
      businesses: {
        Row: {
          address: string | null
          average_rating: number | null
          category_id: string | null
          created_at: string
          description: string | null
          editor_pick_image: string | null
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
          review_count: number | null
          status: string
          story: string | null
          updated_at: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          editor_pick_image?: string | null
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
          review_count?: number | null
          status?: string
          story?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          editor_pick_image?: string | null
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
          review_count?: number | null
          status?: string
          story?: string | null
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
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
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
      user_preferences: {
        Row: {
          created_at: string
          id: string
          interests: string[] | null
          is_newcomer: boolean | null
          moved_date: string | null
          onboarding_completed: boolean | null
          preferred_neighborhoods: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interests?: string[] | null
          is_newcomer?: boolean | null
          moved_date?: string | null
          onboarding_completed?: boolean | null
          preferred_neighborhoods?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interests?: string[] | null
          is_newcomer?: boolean | null
          moved_date?: string | null
          onboarding_completed?: boolean | null
          preferred_neighborhoods?: string[] | null
          updated_at?: string
          user_id?: string
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
          status: string | null
          story: string | null
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
          featured?: boolean | null
          hours?: Json | null
          id?: string | null
          instagram?: string | null
          logo_url?: string | null
          name?: string | null
          neighborhood_id?: string | null
          owner_user_id?: never
          phone?: string | null
          photos?: string[] | null
          review_count?: number | null
          status?: string | null
          story?: string | null
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
          featured?: boolean | null
          hours?: Json | null
          id?: string | null
          instagram?: string | null
          logo_url?: string | null
          name?: string | null
          neighborhood_id?: string | null
          owner_user_id?: never
          phone?: string | null
          photos?: string[] | null
          review_count?: number | null
          status?: string | null
          story?: string | null
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
          contact_info_masked: string | null
          created_at: string | null
          id: string | null
          message: string | null
          name: string | null
          request_id: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          contact_info?: string | null
          contact_info_masked?: never
          created_at?: string | null
          id?: string | null
          message?: string | null
          name?: string | null
          request_id?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          contact_info?: string | null
          contact_info_masked?: never
          created_at?: string | null
          id?: string | null
          message?: string | null
          name?: string | null
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
    }
    Functions: {
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
      update_ticket_purchase_from_webhook: {
        Args: {
          _new_status: string
          _payment_intent_id: string
          _purchase_id: string
          _session_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "resident"
        | "business"
        | "admin"
        | "organizer"
        | "nonprofit"
        | "partner"
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
      ],
    },
  },
} as const

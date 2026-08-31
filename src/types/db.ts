// Generated via Supabase MCP (generate_typescript_types) for project nunhadtrkklyumtojjxc.
// Regenerate after schema changes.

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
      ai_recognition_edits: {
        Row: {
          ai_recognition_id: string
          created_at: string
          edited_by: string | null
          field: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          ai_recognition_id: string
          created_at?: string
          edited_by?: string | null
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          ai_recognition_id?: string
          created_at?: string
          edited_by?: string | null
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recognition_edits_ai_recognition_id_fkey"
            columns: ["ai_recognition_id"]
            isOneToOne: false
            referencedRelation: "ai_recognitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recognition_edits_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recognitions: {
        Row: {
          confidence: number | null
          created_at: string
          detected_attributes: Json
          detected_brand: string | null
          detected_category_id: string | null
          detected_condition:
            | Database["public"]["Enums"]["product_condition"]
            | null
          detected_model: string | null
          id: string
          missing_shots: Json
          model: string
          model_version: string | null
          prompt_version: string
          raw_response: Json
          value_check_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          detected_attributes?: Json
          detected_brand?: string | null
          detected_category_id?: string | null
          detected_condition?:
            | Database["public"]["Enums"]["product_condition"]
            | null
          detected_model?: string | null
          id?: string
          missing_shots?: Json
          model: string
          model_version?: string | null
          prompt_version: string
          raw_response: Json
          value_check_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          detected_attributes?: Json
          detected_brand?: string | null
          detected_category_id?: string | null
          detected_condition?:
            | Database["public"]["Enums"]["product_condition"]
            | null
          detected_model?: string | null
          id?: string
          missing_shots?: Json
          model?: string
          model_version?: string | null
          prompt_version?: string
          raw_response?: Json
          value_check_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recognitions_detected_category_id_fkey"
            columns: ["detected_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recognitions_value_check_id_fkey"
            columns: ["value_check_id"]
            isOneToOne: false
            referencedRelation: "value_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name_en: string
          name_ko: string
          name_my: string
          name_zh: string
          sort: number
          township: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name_en: string
          name_ko: string
          name_my: string
          name_zh: string
          sort?: number
          township: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name_en?: string
          name_ko?: string
          name_my?: string
          name_zh?: string
          sort?: number
          township?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name_en: string
          name_ko: string
          name_my: string
          name_zh: string
          parent_id: string | null
          slug: string
          sort: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name_en: string
          name_ko: string
          name_my: string
          name_zh: string
          parent_id?: string | null
          slug: string
          sort?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name_en?: string
          name_ko?: string
          name_my?: string
          name_zh?: string
          parent_id?: string | null
          slug?: string
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          product_id: string
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          product_id: string
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          product_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_comparisons: {
        Row: {
          computed_from: Json
          created_at: string
          data_sufficiency: Database["public"]["Enums"]["data_sufficiency"]
          desired_price: number | null
          id: string
          price_max: number | null
          price_median: number | null
          price_min: number | null
          price_p25: number | null
          price_p75: number | null
          product_id: string | null
          sample_size: number
          target_brand: string | null
          target_category_id: string | null
          target_model: string | null
          value_check_id: string | null
          verdict: Database["public"]["Enums"]["price_verdict"]
        }
        Insert: {
          computed_from?: Json
          created_at?: string
          data_sufficiency?: Database["public"]["Enums"]["data_sufficiency"]
          desired_price?: number | null
          id?: string
          price_max?: number | null
          price_median?: number | null
          price_min?: number | null
          price_p25?: number | null
          price_p75?: number | null
          product_id?: string | null
          sample_size?: number
          target_brand?: string | null
          target_category_id?: string | null
          target_model?: string | null
          value_check_id?: string | null
          verdict?: Database["public"]["Enums"]["price_verdict"]
        }
        Update: {
          computed_from?: Json
          created_at?: string
          data_sufficiency?: Database["public"]["Enums"]["data_sufficiency"]
          desired_price?: number | null
          id?: string
          price_max?: number | null
          price_median?: number | null
          price_min?: number | null
          price_p25?: number | null
          price_p75?: number | null
          product_id?: string | null
          sample_size?: number
          target_brand?: string | null
          target_category_id?: string | null
          target_model?: string | null
          value_check_id?: string | null
          verdict?: Database["public"]["Enums"]["price_verdict"]
        }
        Relationships: [
          {
            foreignKeyName: "market_comparisons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_comparisons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_comparisons_target_category_id_fkey"
            columns: ["target_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_comparisons_value_check_id_fkey"
            columns: ["value_check_id"]
            isOneToOne: false
            referencedRelation: "value_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          ai_ordinal: number
          bytes: number | null
          created_at: string
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          storage_path: string
          value_check_id: string
          width: number | null
        }
        Insert: {
          ai_ordinal?: number
          bytes?: number | null
          created_at?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          storage_path: string
          value_check_id: string
          width?: number | null
        }
        Update: {
          ai_ordinal?: number
          bytes?: number | null
          created_at?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          storage_path?: string
          value_check_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_value_check_id_fkey"
            columns: ["value_check_id"]
            isOneToOne: false
            referencedRelation: "value_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      meet_checkins: {
        Row: {
          actor_id: string
          checked_in_at: string
          id: string
          meet_location_id: string | null
          transaction_id: string
        }
        Insert: {
          actor_id: string
          checked_in_at?: string
          id?: string
          meet_location_id?: string | null
          transaction_id: string
        }
        Update: {
          actor_id?: string
          checked_in_at?: string
          id?: string
          meet_location_id?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meet_checkins_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meet_checkins_meet_location_id_fkey"
            columns: ["meet_location_id"]
            isOneToOne: false
            referencedRelation: "meet_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meet_checkins_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      meet_locations: {
        Row: {
          area_id: string | null
          attributes: Json
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
        }
        Insert: {
          area_id?: string | null
          attributes?: Json
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
        }
        Update: {
          area_id?: string | null
          attributes?: Json
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "meet_locations_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          amount_mmk: number
          buyer_id: string
          created_at: string
          id: string
          product_id: string
          status: string
        }
        Insert: {
          amount_mmk: number
          buyer_id: string
          created_at?: string
          id?: string
          product_id: string
          status?: string
        }
        Update: {
          amount_mmk?: number
          buyer_id?: string
          created_at?: string
          id?: string
          product_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      price_events: {
        Row: {
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["price_event_source"]
          amount_mmk: number
          context: Json
          created_at: string
          event_type: Database["public"]["Enums"]["price_event_type"]
          id: string
          product_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["price_event_source"]
          amount_mmk: number
          context?: Json
          created_at?: string
          event_type: Database["public"]["Enums"]["price_event_type"]
          id?: string
          product_id: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["price_event_source"]
          amount_mmk?: number
          context?: Json
          created_at?: string
          event_type?: Database["public"]["Enums"]["price_event_type"]
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          product_id: string
          redaction: Json
          sort: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          product_id: string
          redaction?: Json
          sort?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          product_id?: string
          redaction?: Json
          sort?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_msrp_cache: {
        Row: {
          ai_model: string | null
          as_of: string | null
          brand_key: string
          category_slug: string | null
          checked_at: string
          expires_at: string
          found: boolean
          fx_rate_to_mmk: number | null
          id: string
          model_key: string
          msrp_mmk: number | null
          note: string | null
          source_amount: number | null
          source_currency: string | null
          source_title: string | null
          source_url: string | null
        }
        Insert: {
          ai_model?: string | null
          as_of?: string | null
          brand_key: string
          category_slug?: string | null
          checked_at?: string
          expires_at: string
          found?: boolean
          fx_rate_to_mmk?: number | null
          id?: string
          model_key: string
          msrp_mmk?: number | null
          note?: string | null
          source_amount?: number | null
          source_currency?: string | null
          source_title?: string | null
          source_url?: string | null
        }
        Update: {
          ai_model?: string | null
          as_of?: string | null
          brand_key?: string
          category_slug?: string | null
          checked_at?: string
          expires_at?: string
          found?: boolean
          fx_rate_to_mmk?: number | null
          id?: string
          model_key?: string
          msrp_mmk?: number | null
          note?: string | null
          source_amount?: number | null
          source_currency?: string | null
          source_title?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          ai_generated: boolean
          area_id: string | null
          brand: string | null
          category_id: string | null
          checked: Json
          condition: Database["public"]["Enums"]["product_condition"]
          created_at: string
          current_price_mmk: number
          description: string
          has_purchase_proof: boolean
          has_video: boolean
          id: string
          model: string | null
          purchase_period: string | null
          search_tsv: unknown
          seller_id: string
          status: Database["public"]["Enums"]["product_status"]
          title: string
          updated_at: string
          value_check_id: string | null
          view_count: number
        }
        Insert: {
          ai_generated?: boolean
          area_id?: string | null
          brand?: string | null
          category_id?: string | null
          checked?: Json
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          current_price_mmk: number
          description?: string
          has_purchase_proof?: boolean
          has_video?: boolean
          id?: string
          model?: string | null
          purchase_period?: string | null
          search_tsv?: unknown
          seller_id: string
          status?: Database["public"]["Enums"]["product_status"]
          title: string
          updated_at?: string
          value_check_id?: string | null
          view_count?: number
        }
        Update: {
          ai_generated?: boolean
          area_id?: string | null
          brand?: string | null
          category_id?: string | null
          checked?: Json
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          current_price_mmk?: number
          description?: string
          has_purchase_proof?: boolean
          has_video?: boolean
          id?: string
          model?: string | null
          purchase_period?: string | null
          search_tsv?: unknown
          seller_id?: string
          status?: Database["public"]["Enums"]["product_status"]
          title?: string
          updated_at?: string
          value_check_id?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_value_check_id_fkey"
            columns: ["value_check_id"]
            isOneToOne: false
            referencedRelation: "value_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          locale: string
          onboarded_at: string | null
          phone: string | null
          primary_area_id: string | null
          trust_level: Database["public"]["Enums"]["trust_level"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          onboarded_at?: string | null
          phone?: string | null
          primary_area_id?: string | null
          trust_level?: Database["public"]["Enums"]["trust_level"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          onboarded_at?: string | null
          phone?: string | null
          primary_area_id?: string | null
          trust_level?: Database["public"]["Enums"]["trust_level"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_area_id_fkey"
            columns: ["primary_area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_confirmations: {
        Row: {
          actor_id: string
          actor_role: Database["public"]["Enums"]["price_event_source"]
          actual_price_mmk: number | null
          completed: boolean
          created_at: string
          id: string
          rating: number | null
          transaction_id: string
        }
        Insert: {
          actor_id: string
          actor_role: Database["public"]["Enums"]["price_event_source"]
          actual_price_mmk?: number | null
          completed: boolean
          created_at?: string
          id?: string
          rating?: number | null
          transaction_id: string
        }
        Update: {
          actor_id?: string
          actor_role?: Database["public"]["Enums"]["price_event_source"]
          actual_price_mmk?: number | null
          completed?: boolean
          created_at?: string
          id?: string
          rating?: number | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_confirmations_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_confirmations_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          product_id: string
          seller_id: string
          status: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          product_id: string
          seller_id: string
          status?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          product_id?: string
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_events: {
        Row: {
          context: Json
          created_at: string
          event_type: string
          id: string
          profile_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          event_type: string
          id?: string
          profile_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          event_type?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      value_checks: {
        Row: {
          anon_token: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["value_check_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anon_token?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["value_check_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anon_token?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["value_check_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "value_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      web_search_ledger: {
        Row: {
          brand: string | null
          cost_usd: number
          created_at: string
          id: string
          input_tokens: number
          model: string | null
          output_tokens: number
          purpose: string
          searches: number
        }
        Insert: {
          brand?: string | null
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number
          model?: string | null
          output_tokens?: number
          purpose?: string
          searches?: number
        }
        Update: {
          brand?: string | null
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number
          model?: string | null
          output_tokens?: number
          purpose?: string
          searches?: number
        }
        Relationships: []
      }
    }
    Views: {
      public_products: {
        Row: {
          ai_generated: boolean | null
          area_city: string | null
          area_name_en: string | null
          area_name_ko: string | null
          area_name_my: string | null
          area_name_zh: string | null
          area_township: string | null
          brand: string | null
          category_id: string | null
          category_slug: string | null
          checked: Json | null
          condition: Database["public"]["Enums"]["product_condition"] | null
          cover_path: string | null
          created_at: string | null
          current_price_mmk: number | null
          description: string | null
          has_purchase_proof: boolean | null
          has_video: boolean | null
          id: string | null
          model: string | null
          purchase_period: string | null
          seller_name: string | null
          seller_trust_level: Database["public"]["Enums"]["trust_level"] | null
          status: Database["public"]["Enums"]["product_status"] | null
          title: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bump_product_view: { Args: { p_product_id: string }; Returns: undefined }
      get_price_range: {
        Args: {
          p_brand?: string
          p_category_id: string
          p_country?: string
          p_desired?: number
          p_model?: string
          p_months?: number
        }
        Returns: {
          data_sufficiency: Database["public"]["Enums"]["data_sufficiency"]
          price_max: number
          price_median: number
          price_min: number
          price_p25: number
          price_p75: number
          sample_size: number
          verdict: Database["public"]["Enums"]["price_verdict"]
        }[]
      }
      owns_value_check: {
        Args: { vc: Database["public"]["Tables"]["value_checks"]["Row"] }
        Returns: boolean
      }
      web_search_spend_mtd: { Args: never; Returns: number }
    }
    Enums: {
      data_sufficiency: "sufficient" | "low" | "none"
      media_kind: "photo" | "video"
      price_event_source: "seller" | "buyer" | "system"
      price_event_type:
        | "initial_listing"
        | "price_change"
        | "offer"
        | "counter_offer"
        | "agreed"
        | "confirmed_actual"
      price_verdict: "high" | "within_range" | "low" | "insufficient_data"
      product_condition: "new" | "like_new" | "good" | "fair" | "poor"
      product_status: "draft" | "selling" | "reserved" | "completed"
      trust_level: "new" | "active" | "trusted"
      value_check_status:
        | "draft"
        | "recognized"
        | "priced"
        | "listed"
        | "abandoned"
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
      data_sufficiency: ["sufficient", "low", "none"],
      media_kind: ["photo", "video"],
      price_event_source: ["seller", "buyer", "system"],
      price_event_type: [
        "initial_listing",
        "price_change",
        "offer",
        "counter_offer",
        "agreed",
        "confirmed_actual",
      ],
      price_verdict: ["high", "within_range", "low", "insufficient_data"],
      product_condition: ["new", "like_new", "good", "fair", "poor"],
      product_status: ["draft", "selling", "reserved", "completed"],
      trust_level: ["new", "active", "trusted"],
      value_check_status: [
        "draft",
        "recognized",
        "priced",
        "listed",
        "abandoned",
      ],
    },
  },
} as const

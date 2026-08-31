// Generated via Supabase MCP (generate_typescript_types) for project rbespiuqjpetwtabuqjl.
// Regenerate after schema changes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      ai_recognition_edits: {
        Row: {
          ai_recognition_id: string;
          created_at: string;
          edited_by: string | null;
          field: string;
          id: string;
          new_value: string | null;
          old_value: string | null;
        };
        Insert: {
          ai_recognition_id: string;
          created_at?: string;
          edited_by?: string | null;
          field: string;
          id?: string;
          new_value?: string | null;
          old_value?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ai_recognition_edits"]["Insert"]>;
        Relationships: [];
      };
      ai_recognitions: {
        Row: {
          confidence: number | null;
          created_at: string;
          detected_attributes: Json;
          detected_brand: string | null;
          detected_category_id: string | null;
          detected_condition: Database["public"]["Enums"]["product_condition"] | null;
          detected_model: string | null;
          id: string;
          missing_shots: Json;
          model: string;
          model_version: string | null;
          prompt_version: string;
          raw_response: Json;
          value_check_id: string;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string;
          detected_attributes?: Json;
          detected_brand?: string | null;
          detected_category_id?: string | null;
          detected_condition?: Database["public"]["Enums"]["product_condition"] | null;
          detected_model?: string | null;
          id?: string;
          missing_shots?: Json;
          model: string;
          model_version?: string | null;
          prompt_version: string;
          raw_response: Json;
          value_check_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_recognitions"]["Insert"]>;
        Relationships: [];
      };
      areas: {
        Row: {
          city: string;
          country: string;
          created_at: string;
          id: string;
          lat: number | null;
          lng: number | null;
          name_en: string;
          name_ko: string;
          name_my: string;
          name_zh: string;
          sort: number;
          township: string;
        };
        Insert: {
          city: string;
          country?: string;
          created_at?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          name_en: string;
          name_ko: string;
          name_my: string;
          name_zh: string;
          sort?: number;
          township: string;
        };
        Update: Partial<Database["public"]["Tables"]["areas"]["Insert"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          diff: Json;
          entity: string;
          entity_id: string | null;
          id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          diff?: Json;
          entity: string;
          entity_id?: string | null;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          icon: string | null;
          id: string;
          name_en: string;
          name_ko: string;
          name_my: string;
          name_zh: string;
          parent_id: string | null;
          slug: string;
          sort: number;
        };
        Insert: {
          created_at?: string;
          icon?: string | null;
          id?: string;
          name_en: string;
          name_ko: string;
          name_my: string;
          name_zh: string;
          parent_id?: string | null;
          slug: string;
          sort?: number;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      media: {
        Row: {
          ai_ordinal: number;
          bytes: number | null;
          created_at: string;
          height: number | null;
          id: string;
          kind: Database["public"]["Enums"]["media_kind"];
          storage_path: string;
          value_check_id: string;
          width: number | null;
        };
        Insert: {
          ai_ordinal?: number;
          bytes?: number | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          kind?: Database["public"]["Enums"]["media_kind"];
          storage_path: string;
          value_check_id: string;
          width?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["media"]["Insert"]>;
        Relationships: [];
      };
      market_comparisons: {
        Row: {
          computed_from: Json;
          created_at: string;
          data_sufficiency: Database["public"]["Enums"]["data_sufficiency"];
          desired_price: number | null;
          id: string;
          price_max: number | null;
          price_median: number | null;
          price_min: number | null;
          price_p25: number | null;
          price_p75: number | null;
          product_id: string | null;
          sample_size: number;
          target_brand: string | null;
          target_category_id: string | null;
          target_model: string | null;
          value_check_id: string | null;
          verdict: Database["public"]["Enums"]["price_verdict"];
        };
        Insert: {
          computed_from?: Json;
          created_at?: string;
          data_sufficiency?: Database["public"]["Enums"]["data_sufficiency"];
          desired_price?: number | null;
          id?: string;
          price_max?: number | null;
          price_median?: number | null;
          price_min?: number | null;
          price_p25?: number | null;
          price_p75?: number | null;
          product_id?: string | null;
          sample_size?: number;
          target_brand?: string | null;
          target_category_id?: string | null;
          target_model?: string | null;
          value_check_id?: string | null;
          verdict?: Database["public"]["Enums"]["price_verdict"];
        };
        Update: Partial<Database["public"]["Tables"]["market_comparisons"]["Insert"]>;
        Relationships: [];
      };
      phone_otps: {
        Row: {
          attempts: number;
          code_hash: string;
          consumed_at: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          phone: string;
        };
        Insert: {
          attempts?: number;
          code_hash: string;
          consumed_at?: string | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["phone_otps"]["Insert"]>;
        Relationships: [];
      };
      price_events: {
        Row: {
          actor_id: string | null;
          actor_role: Database["public"]["Enums"]["price_event_source"];
          amount_mmk: number;
          context: Json;
          created_at: string;
          event_type: Database["public"]["Enums"]["price_event_type"];
          id: string;
          product_id: string;
        };
        Insert: {
          actor_id?: string | null;
          actor_role?: Database["public"]["Enums"]["price_event_source"];
          amount_mmk: number;
          context?: Json;
          created_at?: string;
          event_type: Database["public"]["Enums"]["price_event_type"];
          id?: string;
          product_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["price_events"]["Insert"]>;
        Relationships: [];
      };
      product_media: {
        Row: {
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["media_kind"];
          product_id: string;
          redaction: Json;
          sort: number;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["media_kind"];
          product_id: string;
          redaction?: Json;
          sort?: number;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_media"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          ai_generated: boolean;
          area_id: string | null;
          brand: string | null;
          category_id: string | null;
          checked: Json;
          condition: Database["public"]["Enums"]["product_condition"];
          created_at: string;
          current_price_mmk: number;
          description: string;
          has_purchase_proof: boolean;
          has_video: boolean;
          id: string;
          model: string | null;
          purchase_period: string | null;
          seller_id: string;
          status: Database["public"]["Enums"]["product_status"];
          title: string;
          updated_at: string;
          value_check_id: string | null;
          view_count: number;
        };
        Insert: {
          ai_generated?: boolean;
          area_id?: string | null;
          brand?: string | null;
          category_id?: string | null;
          checked?: Json;
          condition?: Database["public"]["Enums"]["product_condition"];
          created_at?: string;
          current_price_mmk: number;
          description?: string;
          has_purchase_proof?: boolean;
          has_video?: boolean;
          id?: string;
          model?: string | null;
          purchase_period?: string | null;
          seller_id: string;
          status?: Database["public"]["Enums"]["product_status"];
          title: string;
          updated_at?: string;
          value_check_id?: string | null;
          view_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          locale: string;
          onboarded_at: string | null;
          phone: string | null;
          primary_area_id: string | null;
          trust_level: Database["public"]["Enums"]["trust_level"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          locale?: string;
          onboarded_at?: string | null;
          phone?: string | null;
          primary_area_id?: string | null;
          trust_level?: Database["public"]["Enums"]["trust_level"];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      value_checks: {
        Row: {
          anon_token: string | null;
          created_at: string;
          id: string;
          status: Database["public"]["Enums"]["value_check_status"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          anon_token?: string | null;
          created_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["value_check_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["value_checks"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      public_products: {
        Row: {
          ai_generated: boolean | null;
          area_city: string | null;
          area_name_en: string | null;
          area_name_ko: string | null;
          area_name_my: string | null;
          area_name_zh: string | null;
          area_township: string | null;
          brand: string | null;
          category_id: string | null;
          category_slug: string | null;
          checked: Json | null;
          condition: Database["public"]["Enums"]["product_condition"] | null;
          cover_path: string | null;
          created_at: string | null;
          current_price_mmk: number | null;
          description: string | null;
          has_purchase_proof: boolean | null;
          has_video: boolean | null;
          id: string | null;
          model: string | null;
          purchase_period: string | null;
          seller_name: string | null;
          seller_trust_level: Database["public"]["Enums"]["trust_level"] | null;
          status: Database["public"]["Enums"]["product_status"] | null;
          title: string | null;
          view_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      bump_product_view: { Args: { p_product_id: string }; Returns: undefined };
      get_price_range: {
        Args: {
          p_brand?: string;
          p_category_id: string;
          p_country?: string;
          p_desired?: number;
          p_model?: string;
          p_months?: number;
        };
        Returns: {
          data_sufficiency: Database["public"]["Enums"]["data_sufficiency"];
          price_max: number;
          price_median: number;
          price_min: number;
          price_p25: number;
          price_p75: number;
          sample_size: number;
          verdict: Database["public"]["Enums"]["price_verdict"];
        }[];
      };
      insert_market_comparison: {
        Args: {
          p_computed_from?: Json;
          p_data_sufficiency: Database["public"]["Enums"]["data_sufficiency"];
          p_desired_price: number;
          p_price_max: number;
          p_price_median: number;
          p_price_min: number;
          p_price_p25: number;
          p_price_p75: number;
          p_product_id: string;
          p_sample_size: number;
          p_target_brand: string;
          p_target_category_id: string;
          p_target_model: string;
          p_value_check_id: string;
          p_verdict: Database["public"]["Enums"]["price_verdict"];
        };
        Returns: string;
      };
      insert_price_event: {
        Args: {
          p_actor_id?: string;
          p_actor_role?: Database["public"]["Enums"]["price_event_source"];
          p_amount_mmk: number;
          p_context?: Json;
          p_event_type: Database["public"]["Enums"]["price_event_type"];
          p_product_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      data_sufficiency: "sufficient" | "low" | "none";
      media_kind: "photo" | "video";
      price_event_source: "seller" | "buyer" | "system";
      price_event_type:
        | "initial_listing"
        | "price_change"
        | "offer"
        | "counter_offer"
        | "agreed"
        | "confirmed_actual";
      price_verdict: "high" | "within_range" | "low" | "insufficient_data";
      product_condition: "new" | "like_new" | "good" | "fair" | "poor";
      product_status: "draft" | "selling" | "reserved" | "completed";
      trust_level: "new" | "active" | "trusted";
      value_check_status: "draft" | "recognized" | "priced" | "listed" | "abandoned";
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never;

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Insert: infer I } ? I : never;

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Update: infer U } ? U : never;

export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

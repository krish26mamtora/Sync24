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
      daily_editions: {
        Row: {
          collection_started_at: string | null
          created_at: string
          edition_date: string
          expires_at: string | null
          id: string
          processing_started_at: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["edition_status"]
          updated_at: string
        }
        Insert: {
          collection_started_at?: string | null
          created_at?: string
          edition_date: string
          expires_at?: string | null
          id?: string
          processing_started_at?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["edition_status"]
          updated_at?: string
        }
        Update: {
          collection_started_at?: string | null
          created_at?: string
          edition_date?: string
          expires_at?: string | null
          id?: string
          processing_started_at?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["edition_status"]
          updated_at?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          author: string | null
          category: string | null
          company: string | null
          content: string | null
          created_at: string
          description: string | null
          diversity_score: number | null
          edition_id: string
          external_id: string | null
          fetched_at: string
          final_score: number | null
          freshness_score: number | null
          id: string
          image_alt: string | null
          image_url: string | null
          importance_score: number | null
          is_selected: boolean
          original_url: string
          popularity_score: number | null
          published_at: string | null
          rank: number | null
          relevance_score: number | null
          source_domain: string | null
          source_name: string
          source_quality_score: number | null
          summary: string | null
          title: string
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          company?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          diversity_score?: number | null
          edition_id: string
          external_id?: string | null
          fetched_at?: string
          final_score?: number | null
          freshness_score?: number | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          importance_score?: number | null
          is_selected?: boolean
          original_url: string
          popularity_score?: number | null
          published_at?: string | null
          rank?: number | null
          relevance_score?: number | null
          source_domain?: string | null
          source_name: string
          source_quality_score?: number | null
          summary?: string | null
          title: string
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          company?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          diversity_score?: number | null
          edition_id?: string
          external_id?: string | null
          fetched_at?: string
          final_score?: number | null
          freshness_score?: number | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          importance_score?: number | null
          is_selected?: boolean
          original_url?: string
          popularity_score?: number | null
          published_at?: string | null
          rank?: number | null
          relevance_score?: number | null
          source_domain?: string | null
          source_name?: string
          source_quality_score?: number | null
          summary?: string | null
          title?: string
          topics?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "daily_editions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      edition_status:
        | "collecting"
        | "processing"
        | "published"
        | "expired"
        | "failed"
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
      edition_status: [
        "collecting",
        "processing",
        "published",
        "expired",
        "failed",
      ],
    },
  },
} as const

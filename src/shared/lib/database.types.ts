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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chats: {
        Row: {
          created_at: string
          id: string
          requester_id: string
          updated_at: string
          walk_request_id: string | null
          walker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requester_id: string
          updated_at?: string
          walk_request_id?: string | null
          walker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requester_id?: string
          updated_at?: string
          walk_request_id?: string | null
          walker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_walk_request_id_fkey"
            columns: ["walk_request_id"]
            isOneToOne: false
            referencedRelation: "walk_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_walker_id_fkey"
            columns: ["walker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          created_at: string | null
          from_user_id: string
          id: string
          status: string | null
          to_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_user_id: string
          id?: string
          status?: string | null
          to_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_user_id?: string
          id?: string
          status?: string | null
          to_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string | null
          id: string
          interest: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          audio_duration: number | null
          audio_url: string | null
          chat_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          read: boolean
          sender_id: string
        }
        Insert: {
          audio_duration?: number | null
          audio_url?: string | null
          chat_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          read?: boolean
          sender_id: string
        }
        Update: {
          audio_duration?: number | null
          audio_url?: string | null
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
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
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string
          gender: string | null
          id: string
          interests: string[] | null
          languages: string[] | null
          looking_for: string | null
          social_instagram: string | null
          social_telegram: string | null
          status: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name: string
          gender?: string | null
          id: string
          interests?: string[] | null
          languages?: string[] | null
          looking_for?: string | null
          social_instagram?: string | null
          social_telegram?: string | null
          status?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string
          gender?: string | null
          id?: string
          interests?: string[] | null
          languages?: string[] | null
          looking_for?: string | null
          social_instagram?: string | null
          social_telegram?: string | null
          status?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      walk_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string
          requester_id: string
          status: string
          updated_at: string | null
          walk_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string
          requester_id: string
          status?: string
          updated_at?: string | null
          walk_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          requester_id?: string
          status?: string
          updated_at?: string | null
          walk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "walk_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "walk_requests_walk_id_fkey"
            columns: ["walk_id"]
            isOneToOne: false
            referencedRelation: "walks"
            referencedColumns: ["id"]
          },
        ]
      }
      walks: {
        Row: {
          created_at: string | null
          deleted: boolean | null
          description: string | null
          duration: number
          id: string
          image_url: string | null
          latitude: number
          longitude: number
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted?: boolean | null
          description?: string | null
          duration: number
          id?: string
          image_url?: string | null
          latitude: number
          longitude: number
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted?: boolean | null
          description?: string | null
          duration?: number
          id?: string
          image_url?: string | null
          latitude?: number
          longitude?: number
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_walks: { Args: never; Returns: undefined }
      create_chat_from_request_transactional: {
        Args: {
          p_request_id: string
          p_requester_id: string
          p_walker_id: string
        }
        Returns: string
      }
      earth: { Args: never; Returns: number }
      get_database_stats: {
        Args: never
        Returns: {
          index_size: string
          row_count: number
          table_name: string
          total_size: string
        }[]
      }
      get_my_chats_optimized: {
        Args: { p_user_id: string }
        Returns: {
          chat_id: string
          chat_updated_at: string
          last_message_content: string
          last_message_created_at: string
          last_message_read: boolean
          last_message_sender_id: string
          requester_age: number
          requester_avatar_url: string
          requester_bio: string
          requester_display_name: string
          requester_gender: string
          requester_id: string
          requester_interests: string[]
          requester_languages: string[]
          requester_looking_for: string
          requester_social_instagram: string
          requester_social_telegram: string
          requester_status: string
          requester_username: string
          walk_image_url: string
          walk_request_id: string
          walk_title: string
          walker_age: number
          walker_avatar_url: string
          walker_bio: string
          walker_display_name: string
          walker_gender: string
          walker_id: string
          walker_interests: string[]
          walker_languages: string[]
          walker_looking_for: string
          walker_social_instagram: string
          walker_social_telegram: string
          walker_status: string
          walker_username: string
        }[]
      }
      get_nearby_walks: {
        Args: { p_latitude: number; p_longitude: number; p_radius_km: number }
        Returns: {
          description: string
          distance: number
          duration: number
          id: string
          image_url: string
          latitude: number
          longitude: number
          start_time: string
          title: string
          user_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

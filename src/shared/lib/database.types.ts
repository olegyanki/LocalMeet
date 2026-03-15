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
      chat_participants: {
        Row: {
          chat_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          requester_id: string | null
          type: string
          updated_at: string
          walk_id: string | null
          walk_request_id: string | null
          walker_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          requester_id?: string | null
          type?: string
          updated_at?: string
          walk_id?: string | null
          walk_request_id?: string | null
          walker_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          requester_id?: string | null
          type?: string
          updated_at?: string
          walk_id?: string | null
          walk_request_id?: string | null
          walker_id?: string | null
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
            foreignKeyName: "chats_walk_id_fkey"
            columns: ["walk_id"]
            isOneToOne: false
            referencedRelation: "walks"
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
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          first_name: string
          gender: string | null
          id: string
          interests: string[] | null
          languages: string[] | null
          last_name: string | null
          occupation: string | null
          social_instagram: string | null
          social_telegram: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          first_name: string
          gender?: string | null
          id: string
          interests?: string[] | null
          languages?: string[] | null
          last_name?: string | null
          occupation?: string | null
          social_instagram?: string | null
          social_telegram?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          interests?: string[] | null
          languages?: string[] | null
          last_name?: string | null
          occupation?: string | null
          social_instagram?: string | null
          social_telegram?: string | null
          updated_at?: string | null
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
      get_badge_counts_optimized: {
        Args: { p_user_id: string }
        Returns: {
          pending_requests: number
          unread_messages: number
        }[]
      }
      get_chat_details: {
        Args: { p_chat_id: string; p_user_id: string }
        Returns: {
          chat_id: string
          chat_type: string
          participant_avatar_url: string
          participant_first_name: string
          participant_id: string
          participant_joined_at: string
          participant_last_name: string
          participant_role: string
          walk_id: string
          walk_image_url: string
          walk_start_time: string
          walk_title: string
        }[]
      }
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
          chat_type: string
          chat_updated_at: string
          last_message_content: string
          last_message_created_at: string
          last_message_read: boolean
          last_message_sender_id: string
          participant_avatar_urls: string[]
          participant_first_names: string[]
          participant_ids: string[]
          participant_last_names: string[]
          unread_count: number
          walk_id: string
          walk_image_url: string
          walk_start_time: string
          walk_title: string
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
      get_nearby_walks_filtered: {
        Args: {
          p_interests?: string[]
          p_latitude: number
          p_longitude: number
          p_max_distance_km?: number
          p_radius_km?: number
          p_time_filter?: string
        }
        Returns: {
          created_at: string
          description: string
          distance: number
          duration: number
          host_avatar_url: string
          host_first_name: string
          host_interests: string[]
          host_last_name: string
          id: string
          image_url: string
          latitude: number
          longitude: number
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }[]
      }
      is_chat_owner: {
        Args: { p_chat_id: string; p_user_id: string }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { p_chat_id: string; p_user_id: string }
        Returns: boolean
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

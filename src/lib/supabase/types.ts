/**
 * Hand-written mirror of the Supabase schema defined in
 * supabase/migrations/0001_init.sql. Once a real Supabase project exists,
 * replace this file by running:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 *
 * Keep this file in sync with the migration until then.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      cities: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      places: {
        Row: {
          id: string;
          user_id: string;
          city_id: string;
          name: string;
          maps_url: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          city_id: string;
          name: string;
          maps_url?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          city_id?: string;
          name?: string;
          maps_url?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      place_images: {
        Row: {
          id: string;
          place_id: string;
          user_id: string;
          storage_path: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          place_id: string;
          user_id?: string;
          storage_path: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          place_id?: string;
          user_id?: string;
          storage_path?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      place_tags: {
        Row: {
          place_id: string;
          tag_id: string;
          user_id: string;
        };
        Insert: {
          place_id: string;
          tag_id: string;
          user_id?: string;
        };
        Update: {
          place_id?: string;
          tag_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tours: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          city_id: string | null;
          start_date: string;
          end_date: string;
          share_enabled: boolean;
          share_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          city_id?: string | null;
          start_date: string;
          end_date: string;
          share_enabled?: boolean;
          share_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          city_id?: string | null;
          start_date?: string;
          end_date?: string;
          share_enabled?: boolean;
          share_token?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tour_days: {
        Row: {
          id: string;
          tour_id: string;
          day_index: number;
          date: string;
          place_ids: string[];
        };
        Insert: {
          id?: string;
          tour_id: string;
          day_index: number;
          date: string;
          place_ids?: string[];
        };
        Update: {
          id?: string;
          tour_id?: string;
          day_index?: number;
          date?: string;
          place_ids?: string[];
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_shared_tour: {
        Args: { p_token: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

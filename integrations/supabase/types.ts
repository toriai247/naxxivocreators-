export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: number
          target_id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          details?: Json | null
          target_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          details?: Json | null
          target_id?: string
        }
      },
      anime_episodes: {
        Row: {
          created_at: string
          episode_number: number
          id: number
          series_id: number
          title: string | null
          video_url: string
        }
        Insert: {
          episode_number: number
          series_id: number
          title?: string | null
          video_url: string
        }
        Update: {
          episode_number?: number
          series_id?: number
          title?: string | null
          video_url?: string
        }
      },
      anime_series: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          id: number
          thumbnail_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          banner_url?: string | null
          description?: string | null
          thumbnail_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          banner_url?: string | null
          description?: string | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
        }
      },
      app_settings: {
        Row: {
          key: string
          value: Json
          description: string | null
          updated_at: string | null
        }
        Insert: {
          key: string
          value: Json
          description?: string | null
          updated_at?: string | null
        }
        Update: {
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string | null
        }
      },
      comments: {
        Row: {
          id: number
          created_at: string
          content: string
          user_id: string
          post_id: number
        }
        Insert: {
          id?: number
          content: string
          user_id: string
          post_id: number
        }
        Update: {
          content?: string
        }
      },
      daily_claims: {
        Row: {
          claim_date: string
          claimed_xp: number
          created_at: string
          id: number
          user_id: string
          user_subscription_id: number
        }
        Insert: {
          claim_date: string
          claimed_xp: number
          user_id: string
          user_subscription_id: number
        }
        Update: {
          claim_date?: string
          claimed_xp?: number
          user_id?: string
          user_subscription_id?: number
        }
      },
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          follower_id: string
          following_id: string
        }
        Update: {
          follower_id?: string
          following_id?: string
        }
      },
      manual_payments: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: number
          product_id: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          sender_details: string
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          product_id?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          sender_details: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          product_id?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          sender_details?: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
      },
      likes: {
        Row: {
          user_id: string
          post_id: number
          created_at: string
        }
        Insert: {
          user_id: string
          post_id: number
        }
        Update: {}
      },
      messages: {
        Row: {
          content: string
          created_at: string
          id: number
          is_read: boolean
          recipient_id: string
          sender_id: string
          status: string
        }
        Insert: {
          content: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
          status?: string
        }
        Update: {
          content?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
          status?: string
        }
      },
      notifications: {
        Row: {
          id: number;
          user_id: string;
          type: Enums<'notification_type'>;
          actor_id: string | null;
          entity_id: string | null;
          content: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: Enums<'notification_type'>;
          actor_id?: string | null;
          entity_id?: string | null;
          content?: Json | null;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
      },
      posts: {
        Row: {
          id: number
          created_at: string
          caption: string | null
          content_url: string | null
          user_id: string
          status: Database["public"]["Enums"]["post_status"]
        }
        Insert: {
          caption?: string | null
          content_url?: string | null
          user_id: string
          status?: Database["public"]["Enums"]["post_status"]
        }
        Update: {
          caption?: string | null
          content_url?: string | null
        }
      },
      products: {
        Row: {
          created_at: string
          description: string | null
          details: Json | null
          icon: string | null
          id: number
          is_active: boolean
          name: string
          price: number
          product_type: Database["public"]["Enums"]["product_type"]
        }
        Insert: {
          description?: string | null
          details?: Json | null
          icon?: string | null
          is_active?: boolean
          name: string
          price: number
          product_type: Database["public"]["Enums"]["product_type"]
        }
        Update: {
          description?: string | null
          details?: Json | null
          icon?: string | null
          is_active?: boolean
          name?: string
          price?: number
          product_type?: Database["public"]["Enums"]["product_type"]
        }
      },
      profile_gifs: {
        Row: {
          id: number
          user_id: string
          gif_url: string
          storage_path: string
          created_at: string
        }
        Insert: {
          user_id: string
          gif_url: string
          storage_path: string
        }
        Update: {
          user_id?: string
          gif_url?: string
          storage_path?: string
        }
      },
      profile_music: {
        Row: {
          created_at: string
          file_name: string | null
          id: number
          music_url: string
          profile_id: string
        }
        Insert: {
          file_name?: string | null
          music_url: string
          profile_id: string
        }
        Update: {
          file_name?: string | null
          music_url?: string
          profile_id?: string
        }
      },
      preset_avatars: {
        Row: {
          id: number
          name: string
          image_url: string
          category: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          name: string
          image_url: string
          category: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          image_url?: string
          category?: string
          is_active?: boolean
          created_at?: string
        }
      },
      profiles: {
        Row: {
          bio: string | null
          cover_url: string | null
          created_at: string
          id: string
          name: string | null
          photo_url: string | null
          selected_music_id: number | null
          active_gif_id: number | null
          status: Database["public"]["Enums"]["profile_status"]
          username: string
          xp_balance: number
          has_seen_welcome_bonus: boolean
          is_admin: boolean | null
          active_cover_id: number | null
          website_url: string | null
          youtube_url: string | null
          facebook_url: string | null
          instagram_url: string | null
          twitter_url: string | null
          tiktok_url: string | null
          discord_url: string | null
          gold_coins: number | null
          diamond_coins: number | null
          silver_coins: number | null
          gender: string | null
          bio_links: Json | null
          contact_email: string | null
          contact_phone: string | null
          contact_location: string | null
          telegram_url: string | null
          whatsapp_url: string | null
          linkedin_url: string | null
          github_url: string | null
          bio_tagline: string | null
          content_keywords: string | null
        }
        Insert: {
          id: string
          username: string
          bio?: string | null
          cover_url?: string | null
          name?: string | null
          photo_url?: string | null
          selected_music_id?: number | null
          active_gif_id?: number | null
          status?: Database["public"]["Enums"]["profile_status"]
          xp_balance?: number
          has_seen_welcome_bonus?: boolean
          is_admin?: boolean | null
          active_cover_id?: number | null
          website_url?: string | null
          youtube_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          tiktok_url?: string | null
          discord_url?: string | null
          gold_coins?: number | null
          diamond_coins?: number | null
          silver_coins?: number | null
          gender?: string | null
          bio_links?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_location?: string | null
          telegram_url?: string | null
          whatsapp_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          bio_tagline?: string | null
          content_keywords?: string | null
        }
        Update: {
          bio?: string | null
          cover_url?: string | null
          name?: string | null
          photo_url?: string | null
          selected_music_id?: number | null
          active_gif_id?: number | null
          status?: Database["public"]["Enums"]["profile_status"]
          username?: string
          xp_balance?: number
          has_seen_welcome_bonus?: boolean
          is_admin?: boolean | null
          active_cover_id?: number | null
          website_url?: string | null
          youtube_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          tiktok_url?: string | null
          discord_url?: string | null
          gold_coins?: number | null
          diamond_coins?: number | null
          silver_coins?: number | null
          gender?: string | null
          bio_links?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_location?: string | null
          telegram_url?: string | null
          whatsapp_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          bio_tagline?: string | null
          content_keywords?: string | null
        }
      },
      user_subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: number
          is_active: boolean
          payment_id: number | null
          product_id: number | null
          start_date: string
          user_id: string
        }
        Insert: {
          end_date: string
          is_active?: boolean
          payment_id?: number | null
          product_id?: number | null
          start_date: string
          user_id: string
        }
        Update: {
          end_date?: string
          is_active?: boolean
          payment_id?: number | null
          product_id?: number | null
          start_date?: string
          user_id?: string
        }
      },
      user_themes: {
        Row: {
          user_id: string
          light_theme: Json
          dark_theme: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          light_theme: Json
          dark_theme: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          light_theme?: Json
          dark_theme?: Json
          updated_at?: string
        }
      },
      tasks: {
        Row: {
          id: number;
          title: string;
          description: string | null;
          xp_reward: number;
          type: string;
          required_count: number;
          reset_interval: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          xp_reward?: number;
          type: string;
          required_count?: number;
          reset_interval?: string;
          is_active?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          xp_reward?: number;
          type?: string;
          required_count?: number;
          reset_interval?: string;
          is_active?: boolean;
        };
      },
      user_task_progress: {
        Row: {
          id: number;
          user_id: string;
          task_id: number;
          progress_count: number;
          last_completed_at: string | null;
          last_updated_at: string;
        };
        Insert: {
          user_id: string;
          task_id: number;
          progress_count?: number;
          last_completed_at?: string | null;
        };
        Update: {
          progress_count?: number;
          last_completed_at?: string | null;
        };
      },
      gift_codes: {
        Row: {
          id: number;
          code: string;
          xp_reward: number;
          max_uses: number | null;
          uses_remaining: number | null;
          max_uses_per_user: number;
          expires_at: string | null;
          created_by: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          code: string;
          xp_reward: number;
          max_uses?: number | null;
          uses_remaining?: number | null;
          max_uses_per_user?: number;
          expires_at?: string | null;
          created_by: string;
          is_active?: boolean;
        };
        Update: {
          code?: string;
          xp_reward?: number;
          max_uses?: number | null;
          uses_remaining?: number | null;
          max_uses_per_user?: number;
          expires_at?: string | null;
          is_active?: boolean;
        };
      },
      user_gift_code_redemptions: {
        Row: {
          id: number;
          user_id: string;
          gift_code_id: number;
          redeemed_at: string;
        };
        Insert: {
          user_id: string;
          gift_code_id: number;
        };
        Update: {};
      },
      store_items: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          category: Enums<'store_item_category'>;
          price: number;
          preview_url: string | null;
          asset_details: Json | null;
          is_active: boolean;
          created_at: string;
          created_by_user_id: string | null;
          is_approved: boolean | null;
          sellable: boolean | null;
          sell_price: number | null;
          sell_currency: Enums<'currency'> | null;
        };
        Insert: {
          name: string;
          description?: string | null;
          category: Enums<'store_item_category'>;
          price?: number;
          preview_url?: string | null;
          asset_details?: Json | null;
          is_active?: boolean;
          created_by_user_id?: string | null;
          is_approved?: boolean | null;
          sellable?: boolean | null;
          sell_price?: number | null;
          sell_currency?: Enums<'currency'> | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          category?: Enums<'store_item_category'>;
          price?: number;
          preview_url?: string | null;
          asset_details?: Json | null;
          is_active?: boolean;
          created_by_user_id?: string | null;
          is_approved?: boolean | null;
          sellable?: boolean | null;
          sell_price?: number | null;
          sell_currency?: Enums<'currency'> | null;
        };
      },
      user_inventory: {
        Row: {
          id: number;
          user_id: string;
          item_id: number;
          purchased_at: string;
        };
        Insert: {
          user_id: string;
          item_id: number;
        };
        Update: {};
      },
      luck_royale_prizes: {
        Row: {
          id: number
          item_id: number | null
          rarity: Database["public"]["Enums"]["luck_royale_rarity"]
          is_active: boolean
          created_at: string
          prize_type: Database["public"]["Enums"]["luck_royale_prize_type"]
          currency_type: Database["public"]["Enums"]["currency"] | null
          currency_amount: number | null
          currency: Database["public"]["Enums"]["currency"]
        }
        Insert: {
          item_id?: number | null
          rarity: Database["public"]["Enums"]["luck_royale_rarity"]
          is_active?: boolean
          prize_type?: Database["public"]["Enums"]["luck_royale_prize_type"]
          currency_type?: Database["public"]["Enums"]["currency"] | null
          currency_amount?: number | null
          currency?: Database["public"]["Enums"]["currency"]
        }
        Update: {
          item_id?: number | null
          rarity?: Database["public"]["Enums"]["luck_royale_rarity"]
          is_active?: boolean
          prize_type?: Database["public"]["Enums"]["luck_royale_prize_type"]
          currency_type?: Database["public"]["Enums"]["currency"] | null
          currency_amount?: number | null
          currency?: Database["public"]["Enums"]["currency"]
        }
      },
      luck_royale_spins: {
        Row: {
          id: number;
          user_id: string;
          prize_won_item_id: number | null;
          is_duplicate: boolean;
          consolation_prize: Json | null;
          cost_in_gold: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          prize_won_item_id?: number | null;
          is_duplicate?: boolean;
          consolation_prize?: Json | null;
          cost_in_gold: number;
        };
        Update: {
          prize_won_item_id?: number | null;
          is_duplicate?: boolean;
          consolation_prize?: Json | null;
          cost_in_gold?: number;
        };
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_xp_to_user: {
        Args: {
          user_id_to_update: string
          xp_to_add: number
        }
        Returns: undefined
      }
      admin_delete_user_inventory_item: {
        Args: {
          inventory_id_to_delete: number
        }
        Returns: undefined
      }
      buy_store_item: {
        Args: {
          p_item_id: number
        }
        Returns: string
      }
      create_user_profile_cover: {
        Args: {
          p_name: string
          p_preview_url: string
          p_description: string
        }
        Returns: string
      }
      deduct_xp_for_action: {
        Args: {
          p_user_id: string
          p_cost: number
        }
        Returns: string
      }
      equip_inventory_item: {
        Args: {
          p_inventory_id: bigint
        }
        Returns: string
      }
      get_admin_dashboard_stats: {
        Args: Record<string, never>
        Returns: {
          totalUsers: number
          pendingPayments: number
          totalRevenue: number
          activeSubscriptions: number
        }
      }
      get_chat_messages: {
        Args: {
          user_a_id: string
          user_b_id: string
        }
        Returns: Tables<'messages'>[]
      }
      get_pending_payments_admin: {
        Args: Record<string, never>
        Returns: {
          id: number
          created_at: string
          user_id: string
          product_id: number | null
          amount: number
          sender_details: string
          screenshot_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          admin_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          profiles: any
          products: any
        }[]
      }
      get_sellable_inventory_items: {
        Args: Record<string, never>
        Returns: {
          id: number
          user_id: string
          item_id: number
          purchased_at: string
          store_items: Json
        }[]
      }
      redeem_gift_code: {
        Args: {
          p_code: string
          p_user_id: string
        }
        Returns: string
      }
      sell_item_from_inventory: {
        Args: {
          p_inventory_id: bigint
        }
        Returns: string
      }
      spin_luck_royale: {
        Args: {
          spin_count: number
          p_currency: Enums<'currency'>
        }
        Returns: Json
      }
      update_task_progress: {
        Args: {
          p_user_id: string
          p_task_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      comment_status: "live" | "hidden"
      notification_type:
        | "NEW_FOLLOWER"
        | "NEW_MESSAGE"
        | "PAYMENT_APPROVED"
        | "PAYMENT_REJECTED"
        | "XP_REWARD"
        | "POST_LIKE"
        | "POST_COMMENT"
      payment_status: "pending" | "approved" | "rejected"
      post_status: "live" | "suspended" | "under_review"
      product_type: "package" | "subscription"
      profile_status: "active" | "banned"
      store_item_category: "PROFILE_COVER"
      luck_royale_rarity: "COMMON" | "RARE" | "LEGENDARY"
      currency: "GOLD" | "SILVER" | "DIAMOND"
      luck_royale_prize_type: "ITEM" | "CURRENCY"
    }
    CompositeTypes: {
      luck_royale_prize_with_weight: {
        id: number | null
        item_id: number | null
        prize_type: Enums<'luck_royale_prize_type'> | null
        currency_type: Enums<'currency'> | null
        currency_amount: number | null
        weight: number | null
      }
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<
  T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
> = (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]

export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]

export type CompositeTypes<T extends keyof PublicSchema["CompositeTypes"]> =
  PublicSchema["CompositeTypes"][T]


export const Constants = {
  public: {
    Enums: {
      comment_status: {
        Live: "live",
        Hidden: "hidden",
      },
      payment_status: {
        Pending: "pending",
        Approved: "approved",
        Rejected: "rejected",
      },
      post_status: {
        Live: "live",
        Suspended: "suspended",
        UnderReview: "under_review",
      },
      product_type: {
        Package: "package",
        Subscription: "subscription",
      },
      profile_status: {
        Active: "active",
        Banned: "banned",
      },
      store_item_category: {
        ProfileCover: "PROFILE_COVER"
      },
    },
  },
} as const
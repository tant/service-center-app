export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "brands_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "customers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          body_html: string | null
          body_text: string | null
          bounce_reason: string | null
          bounced_at: string | null
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          last_retry_at: string | null
          notification_type: string
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          retry_count: number
          sent_at: string | null
          status: string
          subject: string
          template_name: string | null
          updated_at: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          bounce_reason?: string | null
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          notification_type: string
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject: string
          template_name?: string | null
          updated_at?: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          bounce_reason?: string | null
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          notification_type?: string
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject?: string
          template_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parts: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          min_stock_level: number | null
          name: string
          part_number: string | null
          price: number
          sku: string | null
          stock_quantity: number
          supplier: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_level?: number | null
          name: string
          part_number?: string | null
          price: number
          sku?: string | null
          stock_quantity?: number
          supplier?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_level?: number | null
          name?: string
          part_number?: string | null
          price?: number
          sku?: string | null
          stock_quantity?: number
          supplier?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "parts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      physical_products: {
        Row: {
          condition: Database["public"]["Enums"]["product_condition"]
          created_at: string
          current_ticket_id: string | null
          id: string
          notes: string | null
          physical_warehouse_id: string | null
          product_id: string
          purchase_date: string | null
          purchase_price: number | null
          rma_batch_id: string | null
          rma_date: string | null
          rma_reason: string | null
          serial_number: string
          supplier_id: string | null
          updated_at: string
          virtual_warehouse_type: Database["public"]["Enums"]["warehouse_type"]
          warranty_end_date: string | null
          warranty_months: number | null
          warranty_start_date: string | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          current_ticket_id?: string | null
          id?: string
          notes?: string | null
          physical_warehouse_id?: string | null
          product_id: string
          purchase_date?: string | null
          purchase_price?: number | null
          rma_batch_id?: string | null
          rma_date?: string | null
          rma_reason?: string | null
          serial_number: string
          supplier_id?: string | null
          updated_at?: string
          virtual_warehouse_type?: Database["public"]["Enums"]["warehouse_type"]
          warranty_end_date?: string | null
          warranty_months?: number | null
          warranty_start_date?: string | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          current_ticket_id?: string | null
          id?: string
          notes?: string | null
          physical_warehouse_id?: string | null
          product_id?: string
          purchase_date?: string | null
          purchase_price?: number | null
          rma_batch_id?: string | null
          rma_date?: string | null
          rma_reason?: string | null
          serial_number?: string
          supplier_id?: string | null
          updated_at?: string
          virtual_warehouse_type?: Database["public"]["Enums"]["warehouse_type"]
          warranty_end_date?: string | null
          warranty_months?: number | null
          warranty_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_products_current_ticket_id_fkey"
            columns: ["current_ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_products_current_ticket_id_fkey"
            columns: ["current_ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "physical_products_current_ticket_id_fkey"
            columns: ["current_ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
          {
            foreignKeyName: "physical_products_physical_warehouse_id_fkey"
            columns: ["physical_warehouse_id"]
            isOneToOne: false
            referencedRelation: "physical_warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_alerts"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "physical_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_warehouse_stock_levels"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "physical_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "physical_products_rma_batch_id_fkey"
            columns: ["rma_batch_id"]
            isOneToOne: false
            referencedRelation: "rma_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_warehouses: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_parts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_required: boolean
          notes: string | null
          part_id: string
          product_id: string
          quantity_per_unit: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_required?: boolean
          notes?: string | null
          part_id: string
          product_id: string
          quantity_per_unit?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_required?: boolean
          notes?: string | null
          part_id?: string
          product_id?: string
          quantity_per_unit?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "product_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_alerts"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_warehouse_stock_levels"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_parts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      product_stock_thresholds: {
        Row: {
          alert_enabled: boolean
          created_at: string
          id: string
          last_alert_sent_at: string | null
          maximum_quantity: number | null
          minimum_quantity: number
          product_id: string
          reorder_quantity: number | null
          updated_at: string
          warehouse_type: Database["public"]["Enums"]["warehouse_type"]
        }
        Insert: {
          alert_enabled?: boolean
          created_at?: string
          id?: string
          last_alert_sent_at?: string | null
          maximum_quantity?: number | null
          minimum_quantity: number
          product_id: string
          reorder_quantity?: number | null
          updated_at?: string
          warehouse_type: Database["public"]["Enums"]["warehouse_type"]
        }
        Update: {
          alert_enabled?: boolean
          created_at?: string
          id?: string
          last_alert_sent_at?: string | null
          maximum_quantity?: number | null
          minimum_quantity?: number
          product_id?: string
          reorder_quantity?: number | null
          updated_at?: string
          warehouse_type?: Database["public"]["Enums"]["warehouse_type"]
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_thresholds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_thresholds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_alerts"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_stock_thresholds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_warehouse_stock_levels"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_stock_thresholds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          model: string | null
          name: string
          primary_image: string | null
          short_description: string | null
          sku: string | null
          type: string
          updated_at: string
          updated_by: string | null
          warranty_period_months: number | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          model?: string | null
          name: string
          primary_image?: string | null
          short_description?: string | null
          sku?: string | null
          type: string
          updated_at?: string
          updated_by?: string | null
          warranty_period_months?: number | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          model?: string | null
          name?: string
          primary_image?: string | null
          short_description?: string | null
          sku?: string | null
          type?: string
          updated_at?: string
          updated_by?: string | null
          warranty_period_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rma_batches: {
        Row: {
          batch_number: string
          created_at: string
          created_by_id: string
          id: string
          notes: string | null
          shipping_date: string | null
          status: string
          supplier_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          created_by_id: string
          id?: string
          notes?: string | null
          shipping_date?: string | null
          status?: string
          supplier_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          created_by_id?: string
          id?: string
          notes?: string | null
          shipping_date?: string | null
          status?: string
          supplier_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rma_batches_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          converted_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivery_address: string | null
          delivery_method: Database["public"]["Enums"]["delivery_method"]
          id: string
          issue_description: string
          issue_photos: Json | null
          product_brand: string
          product_model: string
          purchase_date: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by_id: string | null
          serial_number: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["request_status"]
          submitted_ip: string | null
          ticket_id: string | null
          tracking_token: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_method?: Database["public"]["Enums"]["delivery_method"]
          id?: string
          issue_description: string
          issue_photos?: Json | null
          product_brand: string
          product_model: string
          purchase_date?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          serial_number?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["request_status"]
          submitted_ip?: string | null
          ticket_id?: string | null
          tracking_token: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_method?: Database["public"]["Enums"]["delivery_method"]
          id?: string
          issue_description?: string
          issue_photos?: Json | null
          product_brand?: string
          product_model?: string
          purchase_date?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: string | null
          serial_number?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["request_status"]
          submitted_ip?: string | null
          ticket_id?: string | null
          tracking_token?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_reviewed_by_id_fkey"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "service_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
        ]
      }
      service_ticket_attachments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "service_ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
        ]
      }
      service_ticket_comments: {
        Row: {
          comment: string
          comment_type: Database["public"]["Enums"]["comment_type"]
          created_at: string
          created_by: string
          id: string
          is_internal: boolean
          ticket_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          comment: string
          comment_type?: Database["public"]["Enums"]["comment_type"]
          created_at?: string
          created_by: string
          id?: string
          is_internal?: boolean
          ticket_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          comment?: string
          comment_type?: Database["public"]["Enums"]["comment_type"]
          created_at?: string
          created_by?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "service_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
          {
            foreignKeyName: "service_ticket_comments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_ticket_parts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          part_id: string
          quantity: number
          ticket_id: string
          total_price: number | null
          unit_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          part_id: string
          quantity: number
          ticket_id: string
          total_price?: number | null
          unit_price: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          part_id?: string
          quantity?: number
          ticket_id?: string
          total_price?: number | null
          unit_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_ticket_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_ticket_parts_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_ticket_parts_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "service_ticket_parts_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
          {
            foreignKeyName: "service_ticket_parts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_ticket_tasks: {
        Row: {
          assigned_to_id: string | null
          blocked_reason: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          name: string
          sequence_order: number
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type_id: string
          template_task_id: string | null
          ticket_id: string
          updated_at: string
        }
        Insert: {
          assigned_to_id?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          name: string
          sequence_order: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type_id: string
          template_task_id?: string | null
          ticket_id: string
          updated_at?: string
        }
        Update: {
          assigned_to_id?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          name?: string
          sequence_order?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type_id?: string
          template_task_id?: string | null
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_tasks_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_ticket_tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_ticket_tasks_template_task_id_fkey"
            columns: ["template_task_id"]
            isOneToOne: false
            referencedRelation: "task_templates_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_ticket_tasks_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_ticket_tasks_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "service_ticket_tasks_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
        ]
      }
      service_tickets: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          delivery_address: string | null
          delivery_method: Database["public"]["Enums"]["delivery_method"] | null
          diagnosis_fee: number
          discount_amount: number
          id: string
          issue_description: string
          notes: string | null
          parts_total: number
          priority_level: Database["public"]["Enums"]["priority_level"]
          product_id: string
          request_id: string | null
          service_fee: number
          started_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          template_id: string | null
          ticket_number: string
          total_cost: number | null
          updated_at: string
          updated_by: string | null
          warranty_type: Database["public"]["Enums"]["warranty_type"] | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          delivery_address?: string | null
          delivery_method?:
            | Database["public"]["Enums"]["delivery_method"]
            | null
          diagnosis_fee?: number
          discount_amount?: number
          id?: string
          issue_description: string
          notes?: string | null
          parts_total?: number
          priority_level?: Database["public"]["Enums"]["priority_level"]
          product_id: string
          request_id?: string | null
          service_fee?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          template_id?: string | null
          ticket_number: string
          total_cost?: number | null
          updated_at?: string
          updated_by?: string | null
          warranty_type?: Database["public"]["Enums"]["warranty_type"] | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delivery_address?: string | null
          delivery_method?:
            | Database["public"]["Enums"]["delivery_method"]
            | null
          diagnosis_fee?: number
          discount_amount?: number
          id?: string
          issue_description?: string
          notes?: string | null
          parts_total?: number
          priority_level?: Database["public"]["Enums"]["priority_level"]
          product_id?: string
          request_id?: string | null
          service_fee?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          template_id?: string | null
          ticket_number?: string
          total_cost?: number | null
          updated_at?: string
          updated_by?: string | null
          warranty_type?: Database["public"]["Enums"]["warranty_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "service_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_alerts"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "service_tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_warehouse_stock_levels"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "service_tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "service_tickets_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "v_service_request_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["template_id"]
          },
          {
            foreignKeyName: "service_tickets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          from_physical_warehouse_id: string | null
          from_virtual_warehouse:
            | Database["public"]["Enums"]["warehouse_type"]
            | null
          id: string
          moved_by_id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          physical_product_id: string
          reason: string | null
          ticket_id: string | null
          to_physical_warehouse_id: string | null
          to_virtual_warehouse:
            | Database["public"]["Enums"]["warehouse_type"]
            | null
        }
        Insert: {
          created_at?: string
          from_physical_warehouse_id?: string | null
          from_virtual_warehouse?:
            | Database["public"]["Enums"]["warehouse_type"]
            | null
          id?: string
          moved_by_id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          physical_product_id: string
          reason?: string | null
          ticket_id?: string | null
          to_physical_warehouse_id?: string | null
          to_virtual_warehouse?:
            | Database["public"]["Enums"]["warehouse_type"]
            | null
        }
        Update: {
          created_at?: string
          from_physical_warehouse_id?: string | null
          from_virtual_warehouse?:
            | Database["public"]["Enums"]["warehouse_type"]
            | null
          id?: string
          moved_by_id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          physical_product_id?: string
          reason?: string | null
          ticket_id?: string | null
          to_physical_warehouse_id?: string | null
          to_virtual_warehouse?:
            | Database["public"]["Enums"]["warehouse_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_from_physical_warehouse_id_fkey"
            columns: ["from_physical_warehouse_id"]
            isOneToOne: false
            referencedRelation: "physical_warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_moved_by_id_fkey"
            columns: ["moved_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_physical_product_id_fkey"
            columns: ["physical_product_id"]
            isOneToOne: false
            referencedRelation: "physical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_physical_product_id_fkey"
            columns: ["physical_product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_movement_history"
            referencedColumns: ["physical_product_id"]
          },
          {
            foreignKeyName: "stock_movements_physical_product_id_fkey"
            columns: ["physical_product_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["physical_product_id"]
          },
          {
            foreignKeyName: "stock_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "stock_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
          {
            foreignKeyName: "stock_movements_to_physical_warehouse_id_fkey"
            columns: ["to_physical_warehouse_id"]
            isOneToOne: false
            referencedRelation: "physical_warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          changed_by_id: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["task_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["task_status"] | null
          task_id: string
          ticket_id: string
        }
        Insert: {
          changed_by_id?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["task_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["task_status"] | null
          task_id: string
          ticket_id: string
        }
        Update: {
          changed_by_id?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["task_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["task_status"] | null
          task_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_history_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "service_ticket_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "task_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
        ]
      }
      task_templates: {
        Row: {
          created_at: string
          created_by_id: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          product_type: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          strict_sequence: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_type?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          strict_sequence?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_type?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          strict_sequence?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_product_type_fkey"
            columns: ["product_type"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_product_type_fkey"
            columns: ["product_type"]
            isOneToOne: false
            referencedRelation: "v_low_stock_alerts"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "task_templates_product_type_fkey"
            columns: ["product_type"]
            isOneToOne: false
            referencedRelation: "v_warehouse_stock_levels"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "task_templates_product_type_fkey"
            columns: ["product_type"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["product_id"]
          },
        ]
      }
      task_templates_tasks: {
        Row: {
          created_at: string
          custom_instructions: string | null
          id: string
          is_required: boolean
          sequence_order: number
          task_type_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          custom_instructions?: string | null
          id?: string
          is_required?: boolean
          sequence_order: number
          task_type_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          custom_instructions?: string | null
          id?: string
          is_required?: boolean
          sequence_order?: number
          task_type_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["template_id"]
          },
        ]
      }
      task_types: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean
          name: string
          requires_notes: boolean
          requires_photo: boolean
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          requires_notes?: boolean
          requires_photo?: boolean
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          requires_notes?: boolean
          requires_photo?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ticket_template_changes: {
        Row: {
          changed_by_id: string
          created_at: string
          id: string
          new_template_id: string | null
          old_template_id: string | null
          reason: string
          ticket_id: string
        }
        Insert: {
          changed_by_id: string
          created_at?: string
          id?: string
          new_template_id?: string | null
          old_template_id?: string | null
          reason: string
          ticket_id: string
        }
        Update: {
          changed_by_id?: string
          created_at?: string
          id?: string
          new_template_id?: string | null
          old_template_id?: string | null
          reason?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_template_changes_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_template_changes_new_template_id_fkey"
            columns: ["new_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_template_changes_new_template_id_fkey"
            columns: ["new_template_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["template_id"]
          },
          {
            foreignKeyName: "ticket_template_changes_old_template_id_fkey"
            columns: ["old_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_template_changes_old_template_id_fkey"
            columns: ["old_template_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["template_id"]
          },
          {
            foreignKeyName: "ticket_template_changes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_template_changes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "ticket_template_changes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
        ]
      }
      virtual_warehouses: {
        Row: {
          color_code: string | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          updated_at: string
          warehouse_type: Database["public"]["Enums"]["warehouse_type"]
        }
        Insert: {
          color_code?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          updated_at?: string
          warehouse_type: Database["public"]["Enums"]["warehouse_type"]
        }
        Update: {
          color_code?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          warehouse_type?: Database["public"]["Enums"]["warehouse_type"]
        }
        Relationships: []
      }
    }
    Views: {
      service_ticket_comments_with_author: {
        Row: {
          author_avatar: string | null
          author_email: string | null
          author_name: string | null
          comment: string | null
          comment_type: Database["public"]["Enums"]["comment_type"] | null
          created_at: string | null
          created_by: string | null
          id: string | null
          is_internal: boolean | null
          ticket_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "service_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
          {
            foreignKeyName: "service_ticket_comments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_low_stock_alerts: {
        Row: {
          alert_enabled: boolean | null
          brand_name: string | null
          current_quantity: number | null
          last_alert_sent_at: string | null
          maximum_quantity: number | null
          minimum_quantity: number | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          quantity_below_minimum: number | null
          reorder_quantity: number | null
          threshold_created_at: string | null
          threshold_updated_at: string | null
          warehouse_type: Database["public"]["Enums"]["warehouse_type"] | null
        }
        Relationships: []
      }
      v_service_request_summary: {
        Row: {
          converted_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_method: Database["public"]["Enums"]["delivery_method"] | null
          hours_to_conversion: number | null
          hours_to_review: number | null
          id: string | null
          issue_description: string | null
          photo_count: number | null
          product_brand: string | null
          product_model: string | null
          purchase_date: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by_id: string | null
          reviewed_by_name: string | null
          serial_number: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: Database["public"]["Enums"]["request_status"] | null
          submitted_at: string | null
          submitted_ip: string | null
          ticket_id: string | null
          ticket_number: string | null
          ticket_status: Database["public"]["Enums"]["ticket_status"] | null
          tracking_token: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_reviewed_by_id_fkey"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "service_requests_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
        ]
      }
      v_stock_movement_history: {
        Row: {
          brand_name: string | null
          condition: Database["public"]["Enums"]["product_condition"] | null
          from_physical_warehouse_code: string | null
          from_physical_warehouse_name: string | null
          from_virtual_warehouse:
            | Database["public"]["Enums"]["warehouse_type"]
            | null
          moved_at: string | null
          moved_by_id: string | null
          moved_by_name: string | null
          moved_by_role: Database["public"]["Enums"]["user_role"] | null
          movement_id: string | null
          movement_type: Database["public"]["Enums"]["movement_type"] | null
          notes: string | null
          physical_product_id: string | null
          product_name: string | null
          product_sku: string | null
          reason: string | null
          serial_number: string | null
          ticket_id: string | null
          ticket_number: string | null
          ticket_status: Database["public"]["Enums"]["ticket_status"] | null
          to_physical_warehouse_code: string | null
          to_physical_warehouse_name: string | null
          to_virtual_warehouse:
            | Database["public"]["Enums"]["warehouse_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_moved_by_id_fkey"
            columns: ["moved_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_task_progress_summary"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "stock_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "v_warranty_expiring_soon"
            referencedColumns: ["current_ticket_id"]
          },
        ]
      }
      v_task_progress_summary: {
        Row: {
          blocked_tasks: number | null
          blocked_tasks_detail: Json | null
          completed_tasks: number | null
          completion_percentage: number | null
          first_task_started_at: string | null
          in_progress_tasks: number | null
          last_task_completed_at: string | null
          next_pending_task: Json | null
          pending_tasks: number | null
          required_completed: number | null
          required_completion_percentage: number | null
          required_tasks: number | null
          skipped_tasks: number | null
          strict_sequence: boolean | null
          template_id: string | null
          template_name: string | null
          ticket_created_at: string | null
          ticket_id: string | null
          ticket_number: string | null
          ticket_status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_updated_at: string | null
          total_minutes_spent: number | null
          total_tasks: number | null
        }
        Relationships: []
      }
      v_warehouse_stock_levels: {
        Row: {
          active_warranty_count: number | null
          alert_enabled: boolean | null
          avg_purchase_price: number | null
          brand_name: string | null
          condition: Database["public"]["Enums"]["product_condition"] | null
          expired_count: number | null
          expiring_soon_count: number | null
          is_below_minimum: boolean | null
          maximum_quantity: number | null
          minimum_quantity: number | null
          newest_stock_date: string | null
          oldest_stock_date: string | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          quantity: number | null
          reorder_quantity: number | null
          total_purchase_value: number | null
          warehouse_type: Database["public"]["Enums"]["warehouse_type"] | null
        }
        Relationships: []
      }
      v_warranty_expiring_soon: {
        Row: {
          brand_name: string | null
          condition: Database["public"]["Enums"]["product_condition"] | null
          created_at: string | null
          current_ticket_id: string | null
          current_ticket_number: string | null
          current_ticket_status:
            | Database["public"]["Enums"]["ticket_status"]
            | null
          days_remaining: number | null
          physical_product_id: string | null
          physical_warehouse_code: string | null
          physical_warehouse_name: string | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          serial_number: string | null
          updated_at: string | null
          virtual_warehouse_type:
            | Database["public"]["Enums"]["warehouse_type"]
            | null
          warranty_end_date: string | null
          warranty_months: number | null
          warranty_start_date: string | null
          warranty_status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_warranty_end_date: {
        Args: { p_start_date: string; p_warranty_months: number }
        Returns: string
      }
      decrease_part_stock: {
        Args: { part_id: string; quantity_to_decrease: number }
        Returns: boolean
      }
      generate_ticket_number: { Args: never; Returns: string }
      get_warranty_status: {
        Args: { p_warranty_end_date: string }
        Returns: string
      }
      increase_part_stock: {
        Args: { part_id: string; quantity_to_increase: number }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_manager: { Args: never; Returns: boolean }
    }
    Enums: {
      comment_type: "note" | "status_change" | "assignment" | "system"
      delivery_method: "pickup" | "delivery"
      movement_type:
        | "receipt"
        | "transfer"
        | "assignment"
        | "return"
        | "disposal"
      priority_level: "low" | "normal" | "high" | "urgent"
      product_condition: "new" | "refurbished" | "used" | "faulty" | "for_parts"
      request_status:
        | "submitted"
        | "received"
        | "processing"
        | "completed"
        | "cancelled"
      service_type: "warranty" | "paid" | "replacement"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "blocked"
        | "skipped"
      ticket_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "admin" | "manager" | "technician" | "reception"
      warehouse_type:
        | "warranty_stock"
        | "rma_staging"
        | "dead_stock"
        | "in_service"
        | "parts"
      warranty_type: "warranty" | "paid" | "goodwill"
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
      comment_type: ["note", "status_change", "assignment", "system"],
      delivery_method: ["pickup", "delivery"],
      movement_type: [
        "receipt",
        "transfer",
        "assignment",
        "return",
        "disposal",
      ],
      priority_level: ["low", "normal", "high", "urgent"],
      product_condition: ["new", "refurbished", "used", "faulty", "for_parts"],
      request_status: [
        "submitted",
        "received",
        "processing",
        "completed",
        "cancelled",
      ],
      service_type: ["warranty", "paid", "replacement"],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "blocked",
        "skipped",
      ],
      ticket_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["admin", "manager", "technician", "reception"],
      warehouse_type: [
        "warranty_stock",
        "rma_staging",
        "dead_stock",
        "in_service",
        "parts",
      ],
      warranty_type: ["warranty", "paid", "goodwill"],
    },
  },
} as const


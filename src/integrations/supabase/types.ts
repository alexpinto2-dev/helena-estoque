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
      materias_primas: {
        Row: {
          categoria: string | null
          created_at: string
          custo_medio: number
          estoque_minimo: number
          fornecedor: string | null
          foto_url: string | null
          id: string
          nome: string
          quantidade: number
          unidade: Database["public"]["Enums"]["unidade_medida"]
          updated_at: string
          validade: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          custo_medio?: number
          estoque_minimo?: number
          fornecedor?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          quantidade?: number
          unidade?: Database["public"]["Enums"]["unidade_medida"]
          updated_at?: string
          validade?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          custo_medio?: number
          estoque_minimo?: number
          fornecedor?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          quantidade?: number
          unidade?: Database["public"]["Enums"]["unidade_medida"]
          updated_at?: string
          validade?: string | null
        }
        Relationships: []
      }
      movimentacoes: {
        Row: {
          created_at: string
          custo_unitario: number | null
          id: string
          materia_prima_id: string
          motivo: string | null
          producao_id: string | null
          quantidade: number
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          user_id: string | null
          validade: string | null
        }
        Insert: {
          created_at?: string
          custo_unitario?: number | null
          id?: string
          materia_prima_id: string
          motivo?: string | null
          producao_id?: string | null
          quantidade: number
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          user_id?: string | null
          validade?: string | null
        }
        Update: {
          created_at?: string
          custo_unitario?: number | null
          id?: string
          materia_prima_id?: string
          motivo?: string | null
          producao_id?: string | null
          quantidade?: number
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
          user_id?: string | null
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_materia_prima_id_fkey"
            columns: ["materia_prima_id"]
            isOneToOne: false
            referencedRelation: "materias_primas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_producao_id_fkey"
            columns: ["producao_id"]
            isOneToOne: false
            referencedRelation: "producoes"
            referencedColumns: ["id"]
          },
        ]
      }
      producoes: {
        Row: {
          created_at: string
          custo_total: number
          id: string
          lotes: number
          observacao: string | null
          receita_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          custo_total?: number
          id?: string
          lotes?: number
          observacao?: string | null
          receita_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          custo_total?: number
          id?: string
          lotes?: number
          observacao?: string | null
          receita_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producoes_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receita_ingredientes: {
        Row: {
          created_at: string
          id: string
          materia_prima_id: string
          quantidade: number
          receita_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          materia_prima_id: string
          quantidade: number
          receita_id: string
        }
        Update: {
          created_at?: string
          id?: string
          materia_prima_id?: string
          quantidade?: number
          receita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receita_ingredientes_materia_prima_id_fkey"
            columns: ["materia_prima_id"]
            isOneToOne: false
            referencedRelation: "materias_primas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receita_ingredientes_receita_id_fkey"
            columns: ["receita_id"]
            isOneToOne: false
            referencedRelation: "receitas"
            referencedColumns: ["id"]
          },
        ]
      }
      receitas: {
        Row: {
          created_at: string
          descricao: string | null
          foto_url: string | null
          id: string
          nome: string
          rendimento: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          rendimento?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          rendimento?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aplicar_movimentacao: {
        Args: {
          _custo_unitario: number
          _materia_id: string
          _motivo: string
          _producao_id: string
          _quantidade: number
          _tipo: Database["public"]["Enums"]["tipo_movimentacao"]
          _validade: string
        }
        Returns: string
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      registrar_producao: {
        Args: { _lotes: number; _observacao: string; _receita_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "cozinha" | "compras"
      tipo_movimentacao: "entrada" | "saida"
      unidade_medida: "kg" | "g" | "L" | "ml" | "un" | "caixa"
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
      app_role: ["admin", "cozinha", "compras"],
      tipo_movimentacao: ["entrada", "saida"],
      unidade_medida: ["kg", "g", "L", "ml", "un", "caixa"],
    },
  },
} as const

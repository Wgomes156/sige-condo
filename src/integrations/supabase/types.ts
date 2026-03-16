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
      acessos_unidade: {
        Row: {
          ativo: boolean | null
          codigo_identificacao: string | null
          created_at: string | null
          descricao: string | null
          id: string
          tipo_acesso: string
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo_identificacao?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo_acesso: string
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo_identificacao?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo_acesso?: string
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acessos_unidade_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      acordo_alertas: {
        Row: {
          acao_sugerida: string | null
          acordo_id: string
          created_at: string | null
          data_envio: string | null
          data_leitura: string | null
          destinatario_email: string | null
          destinatario_telefone: string | null
          destinatario_usuario_id: string | null
          dias_antecedencia: number | null
          enviado: boolean | null
          id: string
          lido: boolean | null
          mensagem: string
          prioridade: Database["public"]["Enums"]["acordo_prioridade"] | null
          tipo_alerta: Database["public"]["Enums"]["acordo_tipo_alerta"]
          titulo: string
          url_acao: string | null
        }
        Insert: {
          acao_sugerida?: string | null
          acordo_id: string
          created_at?: string | null
          data_envio?: string | null
          data_leitura?: string | null
          destinatario_email?: string | null
          destinatario_telefone?: string | null
          destinatario_usuario_id?: string | null
          dias_antecedencia?: number | null
          enviado?: boolean | null
          id?: string
          lido?: boolean | null
          mensagem: string
          prioridade?: Database["public"]["Enums"]["acordo_prioridade"] | null
          tipo_alerta: Database["public"]["Enums"]["acordo_tipo_alerta"]
          titulo: string
          url_acao?: string | null
        }
        Update: {
          acao_sugerida?: string | null
          acordo_id?: string
          created_at?: string | null
          data_envio?: string | null
          data_leitura?: string | null
          destinatario_email?: string | null
          destinatario_telefone?: string | null
          destinatario_usuario_id?: string | null
          dias_antecedencia?: number | null
          enviado?: boolean | null
          id?: string
          lido?: boolean | null
          mensagem?: string
          prioridade?: Database["public"]["Enums"]["acordo_prioridade"] | null
          tipo_alerta?: Database["public"]["Enums"]["acordo_tipo_alerta"]
          titulo?: string
          url_acao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acordo_alertas_acordo_id_fkey"
            columns: ["acordo_id"]
            isOneToOne: false
            referencedRelation: "acordos"
            referencedColumns: ["id"]
          },
        ]
      }
      acordo_historico: {
        Row: {
          acordo_id: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          descricao: string
          id: string
          ip_origem: string | null
          parcela_id: string | null
          tipo_acao: Database["public"]["Enums"]["acordo_tipo_acao"]
          user_agent: string | null
          usuario_id: string | null
          valor_envolvido: number | null
        }
        Insert: {
          acordo_id: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao: string
          id?: string
          ip_origem?: string | null
          parcela_id?: string | null
          tipo_acao: Database["public"]["Enums"]["acordo_tipo_acao"]
          user_agent?: string | null
          usuario_id?: string | null
          valor_envolvido?: number | null
        }
        Update: {
          acordo_id?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string
          id?: string
          ip_origem?: string | null
          parcela_id?: string | null
          tipo_acao?: Database["public"]["Enums"]["acordo_tipo_acao"]
          user_agent?: string | null
          usuario_id?: string | null
          valor_envolvido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acordo_historico_acordo_id_fkey"
            columns: ["acordo_id"]
            isOneToOne: false
            referencedRelation: "acordos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordo_historico_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "acordo_parcelas_negociadas"
            referencedColumns: ["id"]
          },
        ]
      }
      acordo_parcelas_negociadas: {
        Row: {
          acordo_id: string
          codigo_transacao: string | null
          comprovante_url: string | null
          created_at: string | null
          data_envio_cobranca: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string | null
          dias_atraso: number | null
          enviado_cobranca: boolean | null
          id: string
          metodo_pagamento: string | null
          numero_parcela: number
          status: Database["public"]["Enums"]["acordo_parcela_status"] | null
          updated_at: string | null
          valor_pago: number | null
          valor_parcela: number
        }
        Insert: {
          acordo_id: string
          codigo_transacao?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_envio_cobranca?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao?: string | null
          dias_atraso?: number | null
          enviado_cobranca?: boolean | null
          id?: string
          metodo_pagamento?: string | null
          numero_parcela: number
          status?: Database["public"]["Enums"]["acordo_parcela_status"] | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_parcela: number
        }
        Update: {
          acordo_id?: string
          codigo_transacao?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_envio_cobranca?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string | null
          dias_atraso?: number | null
          enviado_cobranca?: boolean | null
          id?: string
          metodo_pagamento?: string | null
          numero_parcela?: number
          status?: Database["public"]["Enums"]["acordo_parcela_status"] | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_parcela?: number
        }
        Relationships: [
          {
            foreignKeyName: "acordo_parcelas_negociadas_acordo_id_fkey"
            columns: ["acordo_id"]
            isOneToOne: false
            referencedRelation: "acordos"
            referencedColumns: ["id"]
          },
        ]
      }
      acordo_parcelas_origem: {
        Row: {
          acordo_id: string
          boleto_id: string | null
          competencia: string | null
          created_at: string | null
          data_vencimento_original: string | null
          dias_atraso: number | null
          id: string
          incluida_acordo: boolean | null
          numero_parcela: string | null
          valor_correcao: number | null
          valor_juros: number | null
          valor_multa: number | null
          valor_original: number
          valor_total: number
        }
        Insert: {
          acordo_id: string
          boleto_id?: string | null
          competencia?: string | null
          created_at?: string | null
          data_vencimento_original?: string | null
          dias_atraso?: number | null
          id?: string
          incluida_acordo?: boolean | null
          numero_parcela?: string | null
          valor_correcao?: number | null
          valor_juros?: number | null
          valor_multa?: number | null
          valor_original: number
          valor_total: number
        }
        Update: {
          acordo_id?: string
          boleto_id?: string | null
          competencia?: string | null
          created_at?: string | null
          data_vencimento_original?: string | null
          dias_atraso?: number | null
          id?: string
          incluida_acordo?: boolean | null
          numero_parcela?: string | null
          valor_correcao?: number | null
          valor_juros?: number | null
          valor_multa?: number | null
          valor_original?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "acordo_parcelas_origem_acordo_id_fkey"
            columns: ["acordo_id"]
            isOneToOne: false
            referencedRelation: "acordos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordo_parcelas_origem_boleto_id_fkey"
            columns: ["boleto_id"]
            isOneToOne: false
            referencedRelation: "boletos"
            referencedColumns: ["id"]
          },
        ]
      }
      acordos: {
        Row: {
          aceite_data_hora: string | null
          aceite_digital: boolean | null
          aceite_ip: string | null
          cliente_cpf_cnpj: string
          cliente_email: string | null
          cliente_nome: string
          cliente_telefone: string | null
          condominio_id: string
          created_at: string | null
          data_assinatura: string | null
          data_criacao: string
          data_primeiro_vencimento: string | null
          data_quitacao: string | null
          data_rompimento: string | null
          data_ultimo_contato: string | null
          desconto_avista: number | null
          desconto_correcao: number | null
          desconto_juros: number | null
          desconto_multa: number | null
          desconto_total: number | null
          dia_vencimento: number | null
          dias_atraso: number | null
          forma_pagamento: Database["public"]["Enums"]["acordo_forma_pagamento"]
          id: string
          metodo_pagamento:
            | Database["public"]["Enums"]["acordo_metodo_pagamento"]
            | null
          motivo_rompimento: string | null
          numero_acordo: string
          observacoes_cliente: string | null
          observacoes_internas: string | null
          parcelas_atrasadas: number | null
          parcelas_pagas: number | null
          percentual_desconto: number | null
          periodo_divida_fim: string | null
          periodo_divida_inicio: string | null
          probabilidade_rompimento: number | null
          proxima_acao_agendada: string | null
          proxima_acao_descricao: string | null
          qtd_parcelas: number | null
          responsavel_acompanhamento_id: string | null
          responsavel_negociacao_id: string | null
          status: Database["public"]["Enums"]["acordo_status"] | null
          termo_acordo_url: string | null
          termo_assinado: boolean | null
          unidade_id: string
          updated_at: string | null
          valor_correcao: number | null
          valor_entrada: number | null
          valor_juros: number | null
          valor_multa: number | null
          valor_parcela: number | null
          valor_pendente: number | null
          valor_principal: number
          valor_recuperado: number | null
          valor_total_divida: number
          valor_total_negociado: number
        }
        Insert: {
          aceite_data_hora?: string | null
          aceite_digital?: boolean | null
          aceite_ip?: string | null
          cliente_cpf_cnpj: string
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          condominio_id: string
          created_at?: string | null
          data_assinatura?: string | null
          data_criacao?: string
          data_primeiro_vencimento?: string | null
          data_quitacao?: string | null
          data_rompimento?: string | null
          data_ultimo_contato?: string | null
          desconto_avista?: number | null
          desconto_correcao?: number | null
          desconto_juros?: number | null
          desconto_multa?: number | null
          desconto_total?: number | null
          dia_vencimento?: number | null
          dias_atraso?: number | null
          forma_pagamento: Database["public"]["Enums"]["acordo_forma_pagamento"]
          id?: string
          metodo_pagamento?:
            | Database["public"]["Enums"]["acordo_metodo_pagamento"]
            | null
          motivo_rompimento?: string | null
          numero_acordo: string
          observacoes_cliente?: string | null
          observacoes_internas?: string | null
          parcelas_atrasadas?: number | null
          parcelas_pagas?: number | null
          percentual_desconto?: number | null
          periodo_divida_fim?: string | null
          periodo_divida_inicio?: string | null
          probabilidade_rompimento?: number | null
          proxima_acao_agendada?: string | null
          proxima_acao_descricao?: string | null
          qtd_parcelas?: number | null
          responsavel_acompanhamento_id?: string | null
          responsavel_negociacao_id?: string | null
          status?: Database["public"]["Enums"]["acordo_status"] | null
          termo_acordo_url?: string | null
          termo_assinado?: boolean | null
          unidade_id: string
          updated_at?: string | null
          valor_correcao?: number | null
          valor_entrada?: number | null
          valor_juros?: number | null
          valor_multa?: number | null
          valor_parcela?: number | null
          valor_pendente?: number | null
          valor_principal: number
          valor_recuperado?: number | null
          valor_total_divida: number
          valor_total_negociado: number
        }
        Update: {
          aceite_data_hora?: string | null
          aceite_digital?: boolean | null
          aceite_ip?: string | null
          cliente_cpf_cnpj?: string
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          condominio_id?: string
          created_at?: string | null
          data_assinatura?: string | null
          data_criacao?: string
          data_primeiro_vencimento?: string | null
          data_quitacao?: string | null
          data_rompimento?: string | null
          data_ultimo_contato?: string | null
          desconto_avista?: number | null
          desconto_correcao?: number | null
          desconto_juros?: number | null
          desconto_multa?: number | null
          desconto_total?: number | null
          dia_vencimento?: number | null
          dias_atraso?: number | null
          forma_pagamento?: Database["public"]["Enums"]["acordo_forma_pagamento"]
          id?: string
          metodo_pagamento?:
            | Database["public"]["Enums"]["acordo_metodo_pagamento"]
            | null
          motivo_rompimento?: string | null
          numero_acordo?: string
          observacoes_cliente?: string | null
          observacoes_internas?: string | null
          parcelas_atrasadas?: number | null
          parcelas_pagas?: number | null
          percentual_desconto?: number | null
          periodo_divida_fim?: string | null
          periodo_divida_inicio?: string | null
          probabilidade_rompimento?: number | null
          proxima_acao_agendada?: string | null
          proxima_acao_descricao?: string | null
          qtd_parcelas?: number | null
          responsavel_acompanhamento_id?: string | null
          responsavel_negociacao_id?: string | null
          status?: Database["public"]["Enums"]["acordo_status"] | null
          termo_acordo_url?: string | null
          termo_assinado?: boolean | null
          unidade_id?: string
          updated_at?: string | null
          valor_correcao?: number | null
          valor_entrada?: number | null
          valor_juros?: number | null
          valor_multa?: number | null
          valor_parcela?: number | null
          valor_pendente?: number | null
          valor_principal?: number
          valor_recuperado?: number | null
          valor_total_divida?: number
          valor_total_negociado?: number
        }
        Relationships: [
          {
            foreignKeyName: "acordos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      administradoras: {
        Row: {
          cidade: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      anexos: {
        Row: {
          created_at: string
          criado_por: string | null
          entidade_id: string
          entidade_tipo: string
          id: string
          nome_arquivo: string
          storage_path: string
          tamanho: number
          tipo_arquivo: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          entidade_id: string
          entidade_tipo: string
          id?: string
          nome_arquivo: string
          storage_path: string
          tamanho: number
          tipo_arquivo: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          nome_arquivo?: string
          storage_path?: string
          tamanho?: number
          tipo_arquivo?: string
        }
        Relationships: []
      }
      animais_unidade: {
        Row: {
          created_at: string | null
          especie: string
          foto_url: string | null
          id: string
          nome: string
          observacoes: string | null
          porte: Database["public"]["Enums"]["porte_animal"] | null
          raca: string | null
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          especie: string
          foto_url?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          porte?: Database["public"]["Enums"]["porte_animal"] | null
          raca?: string | null
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          especie?: string
          foto_url?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          porte?: Database["public"]["Enums"]["porte_animal"] | null
          raca?: string | null
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animais_unidade_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      areas_comuns: {
        Row: {
          ativa: boolean | null
          capacidade: number | null
          condominio_id: string
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          regras: string | null
          updated_at: string
          valor_taxa: number | null
        }
        Insert: {
          ativa?: boolean | null
          capacidade?: number | null
          condominio_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          regras?: string | null
          updated_at?: string
          valor_taxa?: number | null
        }
        Update: {
          ativa?: boolean | null
          capacidade?: number | null
          condominio_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          regras?: string | null
          updated_at?: string
          valor_taxa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_comuns_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimento_historico: {
        Row: {
          atendimento_id: string
          created_at: string
          criado_por: string | null
          data: string
          detalhes: string
          hora: string
          id: string
          status: string
        }
        Insert: {
          atendimento_id: string
          created_at?: string
          criado_por?: string | null
          data?: string
          detalhes: string
          hora?: string
          id?: string
          status?: string
        }
        Update: {
          atendimento_id?: string
          created_at?: string
          criado_por?: string | null
          data?: string
          detalhes?: string
          hora?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_historico_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos: {
        Row: {
          canal: string
          cliente_email: string | null
          cliente_nome: string
          cliente_telefone: string
          condominio_id: string | null
          condominio_nome: string
          created_at: string
          data: string
          hora: string
          id: string
          motivo: string
          observacoes: string | null
          operador_id: string | null
          operador_nome: string
          status: string
          updated_at: string
        }
        Insert: {
          canal: string
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone: string
          condominio_id?: string | null
          condominio_nome: string
          created_at?: string
          data?: string
          hora?: string
          id?: string
          motivo: string
          observacoes?: string | null
          operador_id?: string | null
          operador_nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          canal?: string
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string
          condominio_id?: string | null
          condominio_nome?: string
          created_at?: string
          data?: string
          hora?: string
          id?: string
          motivo?: string
          observacoes?: string | null
          operador_id?: string | null
          operador_nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id: string
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
          user_role?: string | null
        }
        Relationships: []
      }
      boletos: {
        Row: {
          categoria_id: string | null
          condominio_id: string
          conta_bancaria_id: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          id: string
          morador_email: string | null
          morador_nome: string | null
          morador_telefone: string | null
          nosso_numero: string | null
          observacoes: string | null
          referencia: string
          status: string
          unidade: string
          unidade_id: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          condominio_id: string
          conta_bancaria_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          morador_email?: string | null
          morador_nome?: string | null
          morador_telefone?: string | null
          nosso_numero?: string | null
          observacoes?: string | null
          referencia: string
          status?: string
          unidade: string
          unidade_id?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria_id?: string | null
          condominio_id?: string
          conta_bancaria_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          morador_email?: string | null
          morador_nome?: string | null
          morador_telefone?: string | null
          nosso_numero?: string | null
          observacoes?: string | null
          referencia?: string
          status?: string
          unidade?: string
          unidade_id?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "boletos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boletos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boletos_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boletos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_demanda: {
        Row: {
          cor: string | null
          created_at: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          updated_at: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          updated_at?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categorias_financeiras: {
        Row: {
          ativa: boolean | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categorias_servico: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: string
          nome_categoria: string
          ordem_exibicao: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome_categoria: string
          ordem_exibicao?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome_categoria?: string
          ordem_exibicao?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comunicados: {
        Row: {
          ativo: boolean | null
          condominio_id: string
          conteudo: string
          created_at: string | null
          criado_por: string | null
          data_expiracao: string | null
          data_publicacao: string | null
          id: string
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          condominio_id: string
          conteudo: string
          created_at?: string | null
          criado_por?: string | null
          data_expiracao?: string | null
          data_publicacao?: string | null
          id?: string
          tipo?: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          condominio_id?: string
          conteudo?: string
          created_at?: string | null
          criado_por?: string | null
          data_expiracao?: string | null
          data_publicacao?: string | null
          id?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comunicados_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      condominios: {
        Row: {
          administradora_contrato_path: string | null
          administradora_email: string | null
          administradora_id: string | null
          administradora_responsavel: string | null
          administradora_site: string | null
          administradora_telefone: string | null
          administradora_tem_contrato: boolean | null
          area_kids: boolean | null
          arquivo_cnpj_path: string | null
          arquivo_documentacao_path: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          controle_acesso_vagas: string | null
          created_at: string
          data_ultima_atualizacao: string | null
          descricao_sustentabilidade: string | null
          empresa_seguranca_nome: string | null
          endereco: string | null
          id: string
          nome: string
          nome_administradora: string | null
          numero: string | null
          observacoes: string | null
          outras_areas: boolean | null
          outras_areas_descricao: string | null
          outros_funcionarios_descricao: string | null
          outros_funcionarios_quantidade: number | null
          piscina: boolean | null
          porteiro_turno: string | null
          programa_sustentabilidade: boolean | null
          quadra_futsal: boolean | null
          quadra_tenis: boolean | null
          quantidade_blocos: number | null
          quantidade_porteiros: number | null
          quantidade_total_vagas: number | null
          quantidade_unidades: number | null
          quantidade_vagas_visitantes: number | null
          sala_jogos: boolean | null
          salao_festa: boolean | null
          sauna: boolean | null
          seguranca_turno: string | null
          sindico_email: string | null
          sindico_nome: string | null
          sindico_telefone: string | null
          sistema_cameras: boolean | null
          sistema_mensageria: boolean | null
          tem_administradora: boolean | null
          tem_cnpj: boolean | null
          tem_convencao_ou_estatuto: boolean | null
          tem_monitoramento: boolean | null
          tem_porteiro: string | null
          tem_regimento_interno: boolean | null
          tem_seguranca: boolean | null
          tem_sindico: boolean | null
          tem_vagas_garagem: boolean | null
          tipo_acesso: string | null
          tipo_imovel: string | null
          uf: string | null
          updated_at: string
          vagas_identificadas: boolean | null
          vagas_visitantes: boolean | null
        }
        Insert: {
          administradora_contrato_path?: string | null
          administradora_email?: string | null
          administradora_id?: string | null
          administradora_responsavel?: string | null
          administradora_site?: string | null
          administradora_telefone?: string | null
          administradora_tem_contrato?: boolean | null
          area_kids?: boolean | null
          arquivo_cnpj_path?: string | null
          arquivo_documentacao_path?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          controle_acesso_vagas?: string | null
          created_at?: string
          data_ultima_atualizacao?: string | null
          descricao_sustentabilidade?: string | null
          empresa_seguranca_nome?: string | null
          endereco?: string | null
          id?: string
          nome: string
          nome_administradora?: string | null
          numero?: string | null
          observacoes?: string | null
          outras_areas?: boolean | null
          outras_areas_descricao?: string | null
          outros_funcionarios_descricao?: string | null
          outros_funcionarios_quantidade?: number | null
          piscina?: boolean | null
          porteiro_turno?: string | null
          programa_sustentabilidade?: boolean | null
          quadra_futsal?: boolean | null
          quadra_tenis?: boolean | null
          quantidade_blocos?: number | null
          quantidade_porteiros?: number | null
          quantidade_total_vagas?: number | null
          quantidade_unidades?: number | null
          quantidade_vagas_visitantes?: number | null
          sala_jogos?: boolean | null
          salao_festa?: boolean | null
          sauna?: boolean | null
          seguranca_turno?: string | null
          sindico_email?: string | null
          sindico_nome?: string | null
          sindico_telefone?: string | null
          sistema_cameras?: boolean | null
          sistema_mensageria?: boolean | null
          tem_administradora?: boolean | null
          tem_cnpj?: boolean | null
          tem_convencao_ou_estatuto?: boolean | null
          tem_monitoramento?: boolean | null
          tem_porteiro?: string | null
          tem_regimento_interno?: boolean | null
          tem_seguranca?: boolean | null
          tem_sindico?: boolean | null
          tem_vagas_garagem?: boolean | null
          tipo_acesso?: string | null
          tipo_imovel?: string | null
          uf?: string | null
          updated_at?: string
          vagas_identificadas?: boolean | null
          vagas_visitantes?: boolean | null
        }
        Update: {
          administradora_contrato_path?: string | null
          administradora_email?: string | null
          administradora_id?: string | null
          administradora_responsavel?: string | null
          administradora_site?: string | null
          administradora_telefone?: string | null
          administradora_tem_contrato?: boolean | null
          area_kids?: boolean | null
          arquivo_cnpj_path?: string | null
          arquivo_documentacao_path?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          controle_acesso_vagas?: string | null
          created_at?: string
          data_ultima_atualizacao?: string | null
          descricao_sustentabilidade?: string | null
          empresa_seguranca_nome?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          nome_administradora?: string | null
          numero?: string | null
          observacoes?: string | null
          outras_areas?: boolean | null
          outras_areas_descricao?: string | null
          outros_funcionarios_descricao?: string | null
          outros_funcionarios_quantidade?: number | null
          piscina?: boolean | null
          porteiro_turno?: string | null
          programa_sustentabilidade?: boolean | null
          quadra_futsal?: boolean | null
          quadra_tenis?: boolean | null
          quantidade_blocos?: number | null
          quantidade_porteiros?: number | null
          quantidade_total_vagas?: number | null
          quantidade_unidades?: number | null
          quantidade_vagas_visitantes?: number | null
          sala_jogos?: boolean | null
          salao_festa?: boolean | null
          sauna?: boolean | null
          seguranca_turno?: string | null
          sindico_email?: string | null
          sindico_nome?: string | null
          sindico_telefone?: string | null
          sistema_cameras?: boolean | null
          sistema_mensageria?: boolean | null
          tem_administradora?: boolean | null
          tem_cnpj?: boolean | null
          tem_convencao_ou_estatuto?: boolean | null
          tem_monitoramento?: boolean | null
          tem_porteiro?: string | null
          tem_regimento_interno?: boolean | null
          tem_seguranca?: boolean | null
          tem_sindico?: boolean | null
          tem_vagas_garagem?: boolean | null
          tipo_acesso?: string | null
          tipo_imovel?: string | null
          uf?: string | null
          updated_at?: string
          vagas_identificadas?: boolean | null
          vagas_visitantes?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "condominios_administradora_id_fkey"
            columns: ["administradora_id"]
            isOneToOne: false
            referencedRelation: "administradoras"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_cobranca: {
        Row: {
          ativa: boolean | null
          categoria_id: string | null
          condominio_id: string
          conta_bancaria_id: string | null
          created_at: string
          descricao_padrao: string | null
          dia_vencimento: number
          id: string
          ultima_geracao: string | null
          updated_at: string
          valor_padrao: number
        }
        Insert: {
          ativa?: boolean | null
          categoria_id?: string | null
          condominio_id: string
          conta_bancaria_id?: string | null
          created_at?: string
          descricao_padrao?: string | null
          dia_vencimento?: number
          id?: string
          ultima_geracao?: string | null
          updated_at?: string
          valor_padrao?: number
        }
        Update: {
          ativa?: boolean | null
          categoria_id?: string | null
          condominio_id?: string
          conta_bancaria_id?: string | null
          created_at?: string
          descricao_padrao?: string | null
          dia_vencimento?: number
          id?: string
          ultima_geracao?: string | null
          updated_at?: string
          valor_padrao?: number
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_cobranca_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracoes_cobranca_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: true
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracoes_cobranca_conta_bancaria_id_fkey"
            columns: ["conta_bancaria_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_demanda: {
        Row: {
          alertas_email: boolean | null
          alertas_inapp: boolean | null
          alertas_push: boolean | null
          ativar_servicos_condicionais: boolean | null
          bloquear_sem_documentos: boolean | null
          calcular_proxima_automatico: boolean | null
          condominio_id: string
          created_at: string | null
          exigir_aprovacao: boolean | null
          exigir_documentos: boolean | null
          frequencia_atencao: string | null
          frequencia_informativo: string | null
          frequencia_urgente: string | null
          id: string
          notificar_administradora: boolean | null
          notificar_conselho: boolean | null
          notificar_sindico: boolean | null
          updated_at: string | null
          valor_aprovacao: number | null
        }
        Insert: {
          alertas_email?: boolean | null
          alertas_inapp?: boolean | null
          alertas_push?: boolean | null
          ativar_servicos_condicionais?: boolean | null
          bloquear_sem_documentos?: boolean | null
          calcular_proxima_automatico?: boolean | null
          condominio_id: string
          created_at?: string | null
          exigir_aprovacao?: boolean | null
          exigir_documentos?: boolean | null
          frequencia_atencao?: string | null
          frequencia_informativo?: string | null
          frequencia_urgente?: string | null
          id?: string
          notificar_administradora?: boolean | null
          notificar_conselho?: boolean | null
          notificar_sindico?: boolean | null
          updated_at?: string | null
          valor_aprovacao?: number | null
        }
        Update: {
          alertas_email?: boolean | null
          alertas_inapp?: boolean | null
          alertas_push?: boolean | null
          ativar_servicos_condicionais?: boolean | null
          bloquear_sem_documentos?: boolean | null
          calcular_proxima_automatico?: boolean | null
          condominio_id?: string
          created_at?: string | null
          exigir_aprovacao?: boolean | null
          exigir_documentos?: boolean | null
          frequencia_atencao?: string | null
          frequencia_informativo?: string | null
          frequencia_urgente?: string | null
          id?: string
          notificar_administradora?: boolean | null
          notificar_conselho?: boolean | null
          notificar_sindico?: boolean | null
          updated_at?: string | null
          valor_aprovacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_demanda_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: true
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_bancarias: {
        Row: {
          administradora_id: string | null
          agencia: string
          agencia_digito: string | null
          ativa: boolean
          banco_codigo: string
          banco_nome: string
          carteira: string | null
          codigo_cedente: string | null
          condominio_id: string | null
          conta: string
          conta_digito: string | null
          conta_padrao: boolean
          convenio: string | null
          created_at: string
          dias_protesto: number | null
          id: string
          instrucoes_linha1: string | null
          instrucoes_linha2: string | null
          instrucoes_linha3: string | null
          juros_mensal: number | null
          multa_percentual: number | null
          nome_conta: string
          nosso_numero_atual: number | null
          nosso_numero_inicio: number | null
          tipo_conta: string
          titular_documento: string
          titular_nome: string
          titular_tipo: string
          updated_at: string
          variacao_carteira: string | null
        }
        Insert: {
          administradora_id?: string | null
          agencia: string
          agencia_digito?: string | null
          ativa?: boolean
          banco_codigo: string
          banco_nome: string
          carteira?: string | null
          codigo_cedente?: string | null
          condominio_id?: string | null
          conta: string
          conta_digito?: string | null
          conta_padrao?: boolean
          convenio?: string | null
          created_at?: string
          dias_protesto?: number | null
          id?: string
          instrucoes_linha1?: string | null
          instrucoes_linha2?: string | null
          instrucoes_linha3?: string | null
          juros_mensal?: number | null
          multa_percentual?: number | null
          nome_conta: string
          nosso_numero_atual?: number | null
          nosso_numero_inicio?: number | null
          tipo_conta?: string
          titular_documento: string
          titular_nome: string
          titular_tipo?: string
          updated_at?: string
          variacao_carteira?: string | null
        }
        Update: {
          administradora_id?: string | null
          agencia?: string
          agencia_digito?: string | null
          ativa?: boolean
          banco_codigo?: string
          banco_nome?: string
          carteira?: string | null
          codigo_cedente?: string | null
          condominio_id?: string | null
          conta?: string
          conta_digito?: string | null
          conta_padrao?: boolean
          convenio?: string | null
          created_at?: string
          dias_protesto?: number | null
          id?: string
          instrucoes_linha1?: string | null
          instrucoes_linha2?: string | null
          instrucoes_linha3?: string | null
          juros_mensal?: number | null
          multa_percentual?: number | null
          nome_conta?: string
          nosso_numero_atual?: number | null
          nosso_numero_inicio?: number | null
          tipo_conta?: string
          titular_documento?: string
          titular_nome?: string
          titular_tipo?: string
          updated_at?: string
          variacao_carteira?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_bancarias_administradora_id_fkey"
            columns: ["administradora_id"]
            isOneToOne: false
            referencedRelation: "administradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_bancarias_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_condominio: {
        Row: {
          alertar_antecedencia_dias: number | null
          ativo: boolean | null
          base_legal: string | null
          categoria_id: string | null
          condominio_id: string
          created_at: string | null
          criado_por: string | null
          custo_estimado: number | null
          descricao: string | null
          documentos_necessarios: string[] | null
          fornecedor_id: string | null
          id: string
          nome: string
          obrigatorio: boolean | null
          observacoes: string | null
          periodicidade: string
          periodicidade_meses: number | null
          permite_prorrogacao: boolean | null
          proxima_execucao: string | null
          status: string | null
          template_id: string | null
          ultima_execucao: string | null
          updated_at: string | null
        }
        Insert: {
          alertar_antecedencia_dias?: number | null
          ativo?: boolean | null
          base_legal?: string | null
          categoria_id?: string | null
          condominio_id: string
          created_at?: string | null
          criado_por?: string | null
          custo_estimado?: number | null
          descricao?: string | null
          documentos_necessarios?: string[] | null
          fornecedor_id?: string | null
          id?: string
          nome: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          periodicidade?: string
          periodicidade_meses?: number | null
          permite_prorrogacao?: boolean | null
          proxima_execucao?: string | null
          status?: string | null
          template_id?: string | null
          ultima_execucao?: string | null
          updated_at?: string | null
        }
        Update: {
          alertar_antecedencia_dias?: number | null
          ativo?: boolean | null
          base_legal?: string | null
          categoria_id?: string | null
          condominio_id?: string
          created_at?: string | null
          criado_por?: string | null
          custo_estimado?: number | null
          descricao?: string | null
          documentos_necessarios?: string[] | null
          fornecedor_id?: string | null
          id?: string
          nome?: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          periodicidade?: string
          periodicidade_meses?: number | null
          permite_prorrogacao?: boolean | null
          proxima_execucao?: string | null
          status?: string | null
          template_id?: string | null
          ultima_execucao?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demandas_condominio_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_demanda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_condominio_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_condominio_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_condominio_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates_demanda"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_unidade: {
        Row: {
          created_at: string | null
          criado_por: string | null
          id: string
          nome_arquivo: string
          storage_path: string
          tamanho: number | null
          tipo_arquivo: string | null
          tipo_documento: string
          unidade_id: string
        }
        Insert: {
          created_at?: string | null
          criado_por?: string | null
          id?: string
          nome_arquivo: string
          storage_path: string
          tamanho?: number | null
          tipo_arquivo?: string | null
          tipo_documento: string
          unidade_id: string
        }
        Update: {
          created_at?: string | null
          criado_por?: string | null
          id?: string
          nome_arquivo?: string
          storage_path?: string
          tamanho?: number | null
          tipo_arquivo?: string | null
          tipo_documento?: string
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_unidade_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      execucoes_demanda: {
        Row: {
          created_at: string | null
          custo: number | null
          data_execucao: string
          demanda_id: string
          documentos_anexados: string[] | null
          executado_por: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          id: string
          observacoes: string | null
        }
        Insert: {
          created_at?: string | null
          custo?: number | null
          data_execucao: string
          demanda_id: string
          documentos_anexados?: string[] | null
          executado_por?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          observacoes?: string | null
        }
        Update: {
          created_at?: string | null
          custo?: number | null
          data_execucao?: string
          demanda_id?: string
          documentos_anexados?: string[] | null
          executado_por?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execucoes_demanda_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demandas_condominio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_demanda_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean | null
          avaliacao: number | null
          cidade: string | null
          cnpj: string | null
          contato_nome: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avaliacao?: number | null
          cidade?: string | null
          cnpj?: string | null
          contato_nome?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avaliacao?: number | null
          cidade?: string | null
          cnpj?: string | null
          contato_nome?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      historico_geracao_boletos: {
        Row: {
          condominio_id: string
          created_at: string
          id: string
          mensagem_erro: string | null
          quantidade_boletos: number
          referencia: string
          status: string | null
          valor_total: number
        }
        Insert: {
          condominio_id: string
          created_at?: string
          id?: string
          mensagem_erro?: string | null
          quantidade_boletos?: number
          referencia: string
          status?: string | null
          valor_total?: number
        }
        Update: {
          condominio_id?: string
          created_at?: string
          id?: string
          mensagem_erro?: string | null
          quantidade_boletos?: number
          referencia?: string
          status?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_geracao_boletos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      inquilinos_unidade: {
        Row: {
          cpf: string | null
          created_at: string | null
          data_inicio_contrato: string | null
          data_termino_contrato: string | null
          email: string | null
          id: string
          nome_completo: string
          telefone: string | null
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          data_inicio_contrato?: string | null
          data_termino_contrato?: string | null
          email?: string | null
          id?: string
          nome_completo: string
          telefone?: string | null
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          data_inicio_contrato?: string | null
          data_termino_contrato?: string | null
          email?: string | null
          id?: string
          nome_completo?: string
          telefone?: string | null
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquilinos_unidade_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: true
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      moradores_unidade: {
        Row: {
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          nome_completo: string
          parentesco: string | null
          telefone: string | null
          tipo_vinculo: string
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome_completo: string
          parentesco?: string | null
          telefone?: string | null
          tipo_vinculo: string
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome_completo?: string
          parentesco?: string | null
          telefone?: string | null
          tipo_vinculo?: string
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moradores_unidade_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias_condominio: {
        Row: {
          atribuido_a: string | null
          categoria: string | null
          condominio_id: string
          created_at: string
          custo_estimado: number | null
          custo_real: number | null
          data_ocorrencia: string
          data_resolucao: string | null
          descricao: string
          id: string
          local_ocorrencia: string | null
          observacoes: string | null
          prioridade: string
          registrado_por: string | null
          resolucao: string | null
          status: string
          tipo_ocorrencia: string
          titulo: string
          updated_at: string
        }
        Insert: {
          atribuido_a?: string | null
          categoria?: string | null
          condominio_id: string
          created_at?: string
          custo_estimado?: number | null
          custo_real?: number | null
          data_ocorrencia?: string
          data_resolucao?: string | null
          descricao: string
          id?: string
          local_ocorrencia?: string | null
          observacoes?: string | null
          prioridade?: string
          registrado_por?: string | null
          resolucao?: string | null
          status?: string
          tipo_ocorrencia: string
          titulo: string
          updated_at?: string
        }
        Update: {
          atribuido_a?: string | null
          categoria?: string | null
          condominio_id?: string
          created_at?: string
          custo_estimado?: number | null
          custo_real?: number | null
          data_ocorrencia?: string
          data_resolucao?: string | null
          descricao?: string
          id?: string
          local_ocorrencia?: string | null
          observacoes?: string | null
          prioridade?: string
          registrado_por?: string | null
          resolucao?: string | null
          status?: string
          tipo_ocorrencia?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_condominio_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias_unidade: {
        Row: {
          created_at: string | null
          data_ocorrencia: string
          descricao: string
          id: string
          registrado_por: string | null
          resolucao: string | null
          resolvida: boolean | null
          tipo_ocorrencia: string
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_ocorrencia?: string
          descricao: string
          id?: string
          registrado_por?: string | null
          resolucao?: string | null
          resolvida?: boolean | null
          tipo_ocorrencia: string
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_ocorrencia?: string
          descricao?: string
          id?: string
          registrado_por?: string | null
          resolucao?: string | null
          resolvida?: boolean | null
          tipo_ocorrencia?: string
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_unidade_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          atribuido_a: string | null
          condominio_id: string | null
          condominio_nome: string
          created_at: string
          criado_por: string | null
          data_atendimento: string | null
          data_solicitacao: string
          descricao_servico: string
          hora_solicitacao: string
          id: string
          numero_os: number
          observacoes: string | null
          prioridade: Database["public"]["Enums"]["os_prioridade"]
          solicitante: string
          status: Database["public"]["Enums"]["os_status"]
          updated_at: string
        }
        Insert: {
          atribuido_a?: string | null
          condominio_id?: string | null
          condominio_nome: string
          created_at?: string
          criado_por?: string | null
          data_atendimento?: string | null
          data_solicitacao?: string
          descricao_servico: string
          hora_solicitacao?: string
          id?: string
          numero_os?: number
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["os_prioridade"]
          solicitante: string
          status?: Database["public"]["Enums"]["os_status"]
          updated_at?: string
        }
        Update: {
          atribuido_a?: string | null
          condominio_id?: string | null
          condominio_nome?: string
          created_at?: string
          criado_por?: string | null
          data_atendimento?: string | null
          data_solicitacao?: string
          descricao_servico?: string
          hora_solicitacao?: string
          id?: string
          numero_os?: number
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["os_prioridade"]
          solicitante?: string
          status?: Database["public"]["Enums"]["os_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposta_assinaturas: {
        Row: {
          assinatura_digital: string | null
          cargo: string | null
          created_at: string | null
          data_assinatura: string | null
          id: string
          ip_assinatura: string | null
          nome_assinante: string
          proposta_id: string
          tipo_assinante: Database["public"]["Enums"]["tipo_assinante"]
        }
        Insert: {
          assinatura_digital?: string | null
          cargo?: string | null
          created_at?: string | null
          data_assinatura?: string | null
          id?: string
          ip_assinatura?: string | null
          nome_assinante: string
          proposta_id: string
          tipo_assinante: Database["public"]["Enums"]["tipo_assinante"]
        }
        Update: {
          assinatura_digital?: string | null
          cargo?: string | null
          created_at?: string | null
          data_assinatura?: string | null
          id?: string
          ip_assinatura?: string | null
          nome_assinante?: string
          proposta_id?: string
          tipo_assinante?: Database["public"]["Enums"]["tipo_assinante"]
        }
        Relationships: [
          {
            foreignKeyName: "proposta_assinaturas_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_documentos: {
        Row: {
          created_at: string | null
          data_envio: string | null
          enviado: boolean | null
          id: string
          nome_arquivo: string
          obrigatorio: boolean | null
          proposta_id: string
          storage_path: string
          tamanho_kb: number | null
          tipo_documento: string
        }
        Insert: {
          created_at?: string | null
          data_envio?: string | null
          enviado?: boolean | null
          id?: string
          nome_arquivo: string
          obrigatorio?: boolean | null
          proposta_id: string
          storage_path: string
          tamanho_kb?: number | null
          tipo_documento: string
        }
        Update: {
          created_at?: string | null
          data_envio?: string | null
          enviado?: boolean | null
          id?: string
          nome_arquivo?: string
          obrigatorio?: boolean | null
          proposta_id?: string
          storage_path?: string
          tamanho_kb?: number | null
          tipo_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposta_documentos_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_historico: {
        Row: {
          acao: string
          created_at: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          descricao: string | null
          id: string
          proposta_id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string | null
          id?: string
          proposta_id: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          descricao?: string | null
          id?: string
          proposta_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposta_historico_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_servicos: {
        Row: {
          categoria_id: string | null
          created_at: string | null
          id: string
          personalizado: boolean | null
          proposta_id: string
          quantidade: number | null
          selecionado: boolean | null
          servico_descricao: string | null
          servico_id: string | null
          servico_nome: string
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string | null
          id?: string
          personalizado?: boolean | null
          proposta_id: string
          quantidade?: number | null
          selecionado?: boolean | null
          servico_descricao?: string | null
          servico_id?: string | null
          servico_nome: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          categoria_id?: string | null
          created_at?: string | null
          id?: string
          personalizado?: boolean | null
          proposta_id?: string
          quantidade?: number | null
          selecionado?: boolean | null
          servico_descricao?: string | null
          servico_id?: string | null
          servico_nome?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposta_servicos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposta_servicos_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposta_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          aprovado_por: string | null
          cobranca_modelo: Database["public"]["Enums"]["cobranca_modelo"] | null
          cobranca_percentual: number | null
          cobranca_valor_fixo: number | null
          cobranca_valor_minimo: number | null
          cobranca_valor_por_unidade: number | null
          condominio_cep: string | null
          condominio_cidade: string | null
          condominio_cnpj: string | null
          condominio_endereco: string | null
          condominio_estado: string | null
          condominio_estrutura: Json | null
          condominio_nome: string
          condominio_qtd_blocos: number | null
          condominio_qtd_funcionarios: number | null
          condominio_qtd_unidades: number
          condominio_sindico_email: string | null
          condominio_sindico_nome: string | null
          condominio_sindico_telefone: string | null
          condominio_tipo: Database["public"]["Enums"]["condominio_tipo"]
          created_at: string | null
          criado_por: string | null
          data_aprovacao: string | null
          data_emissao: string
          data_validade: string
          diferenciais: string | null
          id: string
          motivo_recusa: string | null
          numero_proposta: string
          observacoes: string | null
          pacote_tipo: Database["public"]["Enums"]["pacote_tipo"]
          previsao_inicio_servicos: string | null
          responsavel_cargo: string | null
          responsavel_contato_preferido: string | null
          responsavel_email: string
          responsavel_nome: string
          responsavel_telefone: string
          resumo_servicos: string | null
          sla_atendimento: string | null
          status: Database["public"]["Enums"]["proposta_status"] | null
          updated_at: string | null
          valor_administracao: number | null
          valor_pacote: number | null
          valor_rh: number | null
          valor_servicos_extras: number | null
          valor_sindico_profissional: number | null
          valor_total: number
        }
        Insert: {
          aprovado_por?: string | null
          cobranca_modelo?:
            | Database["public"]["Enums"]["cobranca_modelo"]
            | null
          cobranca_percentual?: number | null
          cobranca_valor_fixo?: number | null
          cobranca_valor_minimo?: number | null
          cobranca_valor_por_unidade?: number | null
          condominio_cep?: string | null
          condominio_cidade?: string | null
          condominio_cnpj?: string | null
          condominio_endereco?: string | null
          condominio_estado?: string | null
          condominio_estrutura?: Json | null
          condominio_nome: string
          condominio_qtd_blocos?: number | null
          condominio_qtd_funcionarios?: number | null
          condominio_qtd_unidades?: number
          condominio_sindico_email?: string | null
          condominio_sindico_nome?: string | null
          condominio_sindico_telefone?: string | null
          condominio_tipo: Database["public"]["Enums"]["condominio_tipo"]
          created_at?: string | null
          criado_por?: string | null
          data_aprovacao?: string | null
          data_emissao?: string
          data_validade?: string
          diferenciais?: string | null
          id?: string
          motivo_recusa?: string | null
          numero_proposta: string
          observacoes?: string | null
          pacote_tipo?: Database["public"]["Enums"]["pacote_tipo"]
          previsao_inicio_servicos?: string | null
          responsavel_cargo?: string | null
          responsavel_contato_preferido?: string | null
          responsavel_email: string
          responsavel_nome: string
          responsavel_telefone: string
          resumo_servicos?: string | null
          sla_atendimento?: string | null
          status?: Database["public"]["Enums"]["proposta_status"] | null
          updated_at?: string | null
          valor_administracao?: number | null
          valor_pacote?: number | null
          valor_rh?: number | null
          valor_servicos_extras?: number | null
          valor_sindico_profissional?: number | null
          valor_total?: number
        }
        Update: {
          aprovado_por?: string | null
          cobranca_modelo?:
            | Database["public"]["Enums"]["cobranca_modelo"]
            | null
          cobranca_percentual?: number | null
          cobranca_valor_fixo?: number | null
          cobranca_valor_minimo?: number | null
          cobranca_valor_por_unidade?: number | null
          condominio_cep?: string | null
          condominio_cidade?: string | null
          condominio_cnpj?: string | null
          condominio_endereco?: string | null
          condominio_estado?: string | null
          condominio_estrutura?: Json | null
          condominio_nome?: string
          condominio_qtd_blocos?: number | null
          condominio_qtd_funcionarios?: number | null
          condominio_qtd_unidades?: number
          condominio_sindico_email?: string | null
          condominio_sindico_nome?: string | null
          condominio_sindico_telefone?: string | null
          condominio_tipo?: Database["public"]["Enums"]["condominio_tipo"]
          created_at?: string | null
          criado_por?: string | null
          data_aprovacao?: string | null
          data_emissao?: string
          data_validade?: string
          diferenciais?: string | null
          id?: string
          motivo_recusa?: string | null
          numero_proposta?: string
          observacoes?: string | null
          pacote_tipo?: Database["public"]["Enums"]["pacote_tipo"]
          previsao_inicio_servicos?: string | null
          responsavel_cargo?: string | null
          responsavel_contato_preferido?: string | null
          responsavel_email?: string
          responsavel_nome?: string
          responsavel_telefone?: string
          resumo_servicos?: string | null
          sla_atendimento?: string | null
          status?: Database["public"]["Enums"]["proposta_status"] | null
          updated_at?: string | null
          valor_administracao?: number | null
          valor_pacote?: number | null
          valor_rh?: number | null
          valor_servicos_extras?: number | null
          valor_sindico_profissional?: number | null
          valor_total?: number
        }
        Relationships: []
      }
      proprietarios_unidade: {
        Row: {
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          nome_completo: string
          possui_procuracao: boolean | null
          telefone: string | null
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome_completo: string
          possui_procuracao?: boolean | null
          telefone?: string | null
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome_completo?: string
          possui_procuracao?: boolean | null
          telefone?: string | null
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proprietarios_unidade_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: true
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      reserva_convidados: {
        Row: {
          cpf: string
          created_at: string
          entrada_registrada: boolean | null
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          nome: string
          reserva_id: string
          status_acesso:
            | Database["public"]["Enums"]["convidado_status_acesso"]
            | null
          telefone: string | null
        }
        Insert: {
          cpf: string
          created_at?: string
          entrada_registrada?: boolean | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          nome: string
          reserva_id: string
          status_acesso?:
            | Database["public"]["Enums"]["convidado_status_acesso"]
            | null
          telefone?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string
          entrada_registrada?: boolean | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          nome?: string
          reserva_id?: string
          status_acesso?:
            | Database["public"]["Enums"]["convidado_status_acesso"]
            | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reserva_convidados_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      reserva_historico: {
        Row: {
          acao: string
          created_at: string
          dados_json: Json | null
          descricao: string | null
          id: string
          reserva_id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_json?: Json | null
          descricao?: string | null
          id?: string
          reserva_id: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_json?: Json | null
          descricao?: string | null
          id?: string
          reserva_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reserva_historico_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          aprovado_por: string | null
          area_comum_id: string
          condominio_id: string
          created_at: string
          criado_por: string | null
          data_aprovacao: string | null
          data_fim: string
          data_inicio: string
          data_pagamento: string | null
          horario_fim: string
          horario_inicio: string
          id: string
          motivo_recusa: string | null
          numero_reserva: string
          observacoes: string | null
          responsavel_cpf: string | null
          responsavel_email: string | null
          responsavel_nome: string
          responsavel_telefone: string
          status: Database["public"]["Enums"]["reserva_status"] | null
          taxa_paga: boolean | null
          tem_convidados: boolean | null
          total_convidados: number | null
          unidade_id: string
          updated_at: string
          valor_taxa: number | null
        }
        Insert: {
          aprovado_por?: string | null
          area_comum_id: string
          condominio_id: string
          created_at?: string
          criado_por?: string | null
          data_aprovacao?: string | null
          data_fim: string
          data_inicio: string
          data_pagamento?: string | null
          horario_fim: string
          horario_inicio: string
          id?: string
          motivo_recusa?: string | null
          numero_reserva?: string
          observacoes?: string | null
          responsavel_cpf?: string | null
          responsavel_email?: string | null
          responsavel_nome: string
          responsavel_telefone: string
          status?: Database["public"]["Enums"]["reserva_status"] | null
          taxa_paga?: boolean | null
          tem_convidados?: boolean | null
          total_convidados?: number | null
          unidade_id: string
          updated_at?: string
          valor_taxa?: number | null
        }
        Update: {
          aprovado_por?: string | null
          area_comum_id?: string
          condominio_id?: string
          created_at?: string
          criado_por?: string | null
          data_aprovacao?: string | null
          data_fim?: string
          data_inicio?: string
          data_pagamento?: string | null
          horario_fim?: string
          horario_inicio?: string
          id?: string
          motivo_recusa?: string | null
          numero_reserva?: string
          observacoes?: string | null
          responsavel_cpf?: string | null
          responsavel_email?: string | null
          responsavel_nome?: string
          responsavel_telefone?: string
          status?: Database["public"]["Enums"]["reserva_status"] | null
          taxa_paga?: boolean | null
          tem_convidados?: boolean | null
          total_convidados?: number | null
          unidade_id?: string
          updated_at?: string
          valor_taxa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_area_comum_id_fkey"
            columns: ["area_comum_id"]
            isOneToOne: false
            referencedRelation: "areas_comuns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean | null
          categoria_id: string | null
          created_at: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          nome_servico: string
          observacoes: string | null
          tipo_valor: Database["public"]["Enums"]["tipo_valor_servico"] | null
          updated_at: string | null
          valor: string
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome_servico: string
          observacoes?: string | null
          tipo_valor?: Database["public"]["Enums"]["tipo_valor_servico"] | null
          updated_at?: string | null
          valor: string
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome_servico?: string
          observacoes?: string | null
          tipo_valor?: Database["public"]["Enums"]["tipo_valor_servico"] | null
          updated_at?: string | null
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_historico: {
        Row: {
          alterado_por: string | null
          campo_alterado: string
          created_at: string | null
          id: string
          servico_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          alterado_por?: string | null
          campo_alterado: string
          created_at?: string | null
          id?: string
          servico_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          alterado_por?: string | null
          campo_alterado?: string
          created_at?: string | null
          id?: string
          servico_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_historico_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      templates_demanda: {
        Row: {
          alertar_antecedencia_dias: number | null
          ativo: boolean | null
          base_legal: string | null
          categoria_id: string | null
          condicao_campo: string | null
          condicao_valor: string | null
          condicional: boolean | null
          created_at: string | null
          custo_estimado: number | null
          descricao: string | null
          documentos_necessarios: string[] | null
          id: string
          nome: string
          obrigatorio: boolean | null
          periodicidade: string
          periodicidade_meses: number | null
          permite_prorrogacao: boolean | null
          updated_at: string | null
        }
        Insert: {
          alertar_antecedencia_dias?: number | null
          ativo?: boolean | null
          base_legal?: string | null
          categoria_id?: string | null
          condicao_campo?: string | null
          condicao_valor?: string | null
          condicional?: boolean | null
          created_at?: string | null
          custo_estimado?: number | null
          descricao?: string | null
          documentos_necessarios?: string[] | null
          id?: string
          nome: string
          obrigatorio?: boolean | null
          periodicidade?: string
          periodicidade_meses?: number | null
          permite_prorrogacao?: boolean | null
          updated_at?: string | null
        }
        Update: {
          alertar_antecedencia_dias?: number | null
          ativo?: boolean | null
          base_legal?: string | null
          categoria_id?: string | null
          condicao_campo?: string | null
          condicao_valor?: string | null
          condicional?: boolean | null
          created_at?: string | null
          custo_estimado?: number | null
          descricao?: string | null
          documentos_necessarios?: string[] | null
          id?: string
          nome?: string
          obrigatorio?: boolean | null
          periodicidade?: string
          periodicidade_meses?: number | null
          permite_prorrogacao?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_demanda_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_demanda"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_financeiras: {
        Row: {
          categoria_id: string | null
          condominio_id: string
          created_at: string | null
          criado_por: string | null
          criado_por_nome: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          documento: string | null
          forma_pagamento: string | null
          id: string
          morador_nome: string | null
          observacoes: string | null
          recorrencia_tipo: string | null
          recorrente: boolean | null
          status: string
          tipo: string
          unidade: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          condominio_id: string
          created_at?: string | null
          criado_por?: string | null
          criado_por_nome: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          documento?: string | null
          forma_pagamento?: string | null
          id?: string
          morador_nome?: string | null
          observacoes?: string | null
          recorrencia_tipo?: string | null
          recorrente?: boolean | null
          status?: string
          tipo: string
          unidade?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria_id?: string | null
          condominio_id?: string
          created_at?: string | null
          criado_por?: string | null
          criado_por_nome?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          documento?: string | null
          forma_pagamento?: string | null
          id?: string
          morador_nome?: string | null
          observacoes?: string | null
          recorrencia_tipo?: string | null
          recorrente?: boolean | null
          status?: string
          tipo?: string
          unidade?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_financeiras_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          alterado_por: string | null
          andar: number | null
          ativa: boolean | null
          bloco: string | null
          codigo: string
          complemento: string | null
          condominio_id: string
          created_at: string
          endereco: string | null
          id: string
          inquilino_cpf: string | null
          inquilino_email: string | null
          inquilino_nome: string | null
          inquilino_telefone: string | null
          morador_email: string | null
          morador_nome: string | null
          morador_telefone: string | null
          nome_localizacao: string | null
          numero_endereco: string | null
          numero_unidade: string | null
          observacoes_gerais: string | null
          observacoes_internas: string | null
          proprietario_cpf: string | null
          proprietario_email: string | null
          proprietario_nome: string | null
          proprietario_telefone: string | null
          quantidade_moradores: number | null
          resp_financeiro_cpf: string | null
          resp_financeiro_email: string | null
          resp_financeiro_nome: string | null
          resp_financeiro_opcao_envio: string | null
          resp_financeiro_telefone: string | null
          responsavel_financeiro:
            | Database["public"]["Enums"]["responsavel_financeiro"]
            | null
          situacao: Database["public"]["Enums"]["situacao_unidade"] | null
          status_financeiro:
            | Database["public"]["Enums"]["status_financeiro_unidade"]
            | null
          tipo_localizacao:
            | Database["public"]["Enums"]["tipo_localizacao"]
            | null
          tipo_ocupacao: Database["public"]["Enums"]["tipo_ocupacao"] | null
          tipo_unidade: Database["public"]["Enums"]["tipo_unidade"] | null
          updated_at: string
        }
        Insert: {
          alterado_por?: string | null
          andar?: number | null
          ativa?: boolean | null
          bloco?: string | null
          codigo?: string
          complemento?: string | null
          condominio_id: string
          created_at?: string
          endereco?: string | null
          id?: string
          inquilino_cpf?: string | null
          inquilino_email?: string | null
          inquilino_nome?: string | null
          inquilino_telefone?: string | null
          morador_email?: string | null
          morador_nome?: string | null
          morador_telefone?: string | null
          nome_localizacao?: string | null
          numero_endereco?: string | null
          numero_unidade?: string | null
          observacoes_gerais?: string | null
          observacoes_internas?: string | null
          proprietario_cpf?: string | null
          proprietario_email?: string | null
          proprietario_nome?: string | null
          proprietario_telefone?: string | null
          quantidade_moradores?: number | null
          resp_financeiro_cpf?: string | null
          resp_financeiro_email?: string | null
          resp_financeiro_nome?: string | null
          resp_financeiro_opcao_envio?: string | null
          resp_financeiro_telefone?: string | null
          responsavel_financeiro?:
            | Database["public"]["Enums"]["responsavel_financeiro"]
            | null
          situacao?: Database["public"]["Enums"]["situacao_unidade"] | null
          status_financeiro?:
            | Database["public"]["Enums"]["status_financeiro_unidade"]
            | null
          tipo_localizacao?:
            | Database["public"]["Enums"]["tipo_localizacao"]
            | null
          tipo_ocupacao?: Database["public"]["Enums"]["tipo_ocupacao"] | null
          tipo_unidade?: Database["public"]["Enums"]["tipo_unidade"] | null
          updated_at?: string
        }
        Update: {
          alterado_por?: string | null
          andar?: number | null
          ativa?: boolean | null
          bloco?: string | null
          codigo?: string
          complemento?: string | null
          condominio_id?: string
          created_at?: string
          endereco?: string | null
          id?: string
          inquilino_cpf?: string | null
          inquilino_email?: string | null
          inquilino_nome?: string | null
          inquilino_telefone?: string | null
          morador_email?: string | null
          morador_nome?: string | null
          morador_telefone?: string | null
          nome_localizacao?: string | null
          numero_endereco?: string | null
          numero_unidade?: string | null
          observacoes_gerais?: string | null
          observacoes_internas?: string | null
          proprietario_cpf?: string | null
          proprietario_email?: string | null
          proprietario_nome?: string | null
          proprietario_telefone?: string | null
          quantidade_moradores?: number | null
          resp_financeiro_cpf?: string | null
          resp_financeiro_email?: string | null
          resp_financeiro_nome?: string | null
          resp_financeiro_opcao_envio?: string | null
          resp_financeiro_telefone?: string | null
          responsavel_financeiro?:
            | Database["public"]["Enums"]["responsavel_financeiro"]
            | null
          situacao?: Database["public"]["Enums"]["situacao_unidade"] | null
          status_financeiro?:
            | Database["public"]["Enums"]["status_financeiro_unidade"]
            | null
          tipo_localizacao?:
            | Database["public"]["Enums"]["tipo_localizacao"]
            | null
          tipo_ocupacao?: Database["public"]["Enums"]["tipo_ocupacao"] | null
          tipo_unidade?: Database["public"]["Enums"]["tipo_unidade"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_condominio_access: {
        Row: {
          condominio_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          condominio_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          condominio_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_condominio_access_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
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
      user_unidade_access: {
        Row: {
          created_at: string | null
          id: string
          tipo_morador: string
          unidade_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tipo_morador?: string
          unidade_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tipo_morador?: string
          unidade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_unidade_access_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas_garagem: {
        Row: {
          coberta: boolean | null
          created_at: string | null
          id: string
          localizacao: string | null
          numero_vaga: string
          observacoes: string | null
          tipo: string | null
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          coberta?: boolean | null
          created_at?: string | null
          id?: string
          localizacao?: string | null
          numero_vaga: string
          observacoes?: string | null
          tipo?: string | null
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          coberta?: boolean | null
          created_at?: string | null
          id?: string
          localizacao?: string | null
          numero_vaga?: string
          observacoes?: string | null
          tipo?: string | null
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vagas_garagem_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos_unidade: {
        Row: {
          cor: string | null
          created_at: string | null
          id: string
          marca: string | null
          modelo: string | null
          nome_proprietario: string | null
          placa: string
          proprietario_veiculo: string
          tipo: Database["public"]["Enums"]["tipo_veiculo"] | null
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome_proprietario?: string | null
          placa: string
          proprietario_veiculo: string
          tipo?: Database["public"]["Enums"]["tipo_veiculo"] | null
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome_proprietario?: string | null
          placa?: string
          proprietario_veiculo?: string
          tipo?: Database["public"]["Enums"]["tipo_veiculo"] | null
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_unidade_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      visitantes_autorizados: {
        Row: {
          ativo: boolean | null
          cpf: string | null
          created_at: string | null
          id: string
          nome_completo: string
          observacoes: string | null
          parentesco: string | null
          telefone: string | null
          unidade_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string | null
          id?: string
          nome_completo: string
          observacoes?: string | null
          parentesco?: string | null
          telefone?: string | null
          unidade_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string | null
          id?: string
          nome_completo?: string
          observacoes?: string | null
          parentesco?: string | null
          telefone?: string | null
          unidade_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitantes_autorizados_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atualizar_boletos_atrasados: { Args: never; Returns: number }
      atualizar_status_demandas: { Args: never; Returns: number }
      calcular_status_demanda: { Args: { proxima: string }; Returns: string }
      calcular_valor_total_proposta: {
        Args: { proposta_uuid: string }
        Returns: number
      }
      can_access_boleto: {
        Args: { _boleto_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_os: {
        Args: { _os_id: string; _user_id: string }
        Returns: boolean
      }
      gerar_nosso_numero: { Args: never; Returns: string }
      gerar_numero_acordo: { Args: never; Returns: string }
      gerar_numero_proposta: { Args: never; Returns: string }
      gerar_numero_reserva: { Args: never; Returns: string }
      has_acordo_access: {
        Args: { _acordo_id: string; _user_id: string }
        Returns: boolean
      }
      has_condominio_access: {
        Args: { _condominio_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_unidade_access: {
        Args: { _unidade_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      acordo_forma_pagamento: "avista" | "parcelado"
      acordo_metodo_pagamento:
        | "boleto"
        | "pix"
        | "cartao"
        | "debito_automatico"
        | "dinheiro"
        | "transferencia"
      acordo_parcela_status: "pendente" | "paga" | "atrasada" | "cancelada"
      acordo_prioridade: "baixa" | "media" | "alta" | "critica"
      acordo_status:
        | "em_negociacao"
        | "ativo"
        | "quitado"
        | "rompido"
        | "cancelado"
      acordo_tipo_acao:
        | "criacao"
        | "edicao"
        | "assinatura"
        | "pagamento_parcela"
        | "atraso_parcela"
        | "quitacao"
        | "rompimento"
        | "cancelamento"
        | "contato_realizado"
        | "acao_agendada"
        | "desconto_aplicado"
        | "documento_anexado"
      acordo_tipo_alerta:
        | "vencimento_proximo"
        | "parcela_vencida"
        | "risco_rompimento"
        | "acao_agendada"
        | "documento_pendente"
        | "contato_necessario"
      app_role: "admin" | "operador" | "gerente" | "morador"
      cobranca_modelo:
        | "por_unidade"
        | "valor_minimo"
        | "percentual"
        | "fixo_mensal"
        | "misto"
      condominio_tipo: "residencial" | "comercial" | "misto"
      convidado_status_acesso: "liberado" | "bloqueado" | "pendente"
      os_prioridade: "urgente" | "periodico" | "nao_urgente"
      os_status: "aberta" | "em_andamento" | "concluida" | "cancelada"
      pacote_tipo: "basico" | "intermediario" | "completo" | "personalizado"
      porte_animal: "pequeno" | "medio" | "grande"
      proposta_status:
        | "rascunho"
        | "enviada"
        | "em_analise"
        | "aprovada"
        | "recusada"
        | "expirada"
      reserva_status:
        | "pendente"
        | "confirmada"
        | "cancelada"
        | "concluida"
        | "recusada"
      responsavel_financeiro: "proprietario" | "inquilino"
      situacao_unidade: "ativa" | "inativa" | "em_reforma" | "desocupada"
      status_financeiro_unidade: "em_dia" | "inadimplente" | "acordo"
      tipo_assinante: "sindico" | "administradora" | "testemunha"
      tipo_localizacao: "bloco" | "torre" | "rua"
      tipo_ocupacao: "moradia" | "aluguel" | "aluguel_temporada" | "desocupado"
      tipo_unidade: "apartamento" | "casa" | "loja" | "escritorio" | "sala"
      tipo_valor_servico: "fixo" | "percentual" | "variavel"
      tipo_veiculo:
        | "carro"
        | "moto"
        | "bicicleta"
        | "outro"
        | "suv"
        | "caminhonete"
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
      acordo_forma_pagamento: ["avista", "parcelado"],
      acordo_metodo_pagamento: [
        "boleto",
        "pix",
        "cartao",
        "debito_automatico",
        "dinheiro",
        "transferencia",
      ],
      acordo_parcela_status: ["pendente", "paga", "atrasada", "cancelada"],
      acordo_prioridade: ["baixa", "media", "alta", "critica"],
      acordo_status: [
        "em_negociacao",
        "ativo",
        "quitado",
        "rompido",
        "cancelado",
      ],
      acordo_tipo_acao: [
        "criacao",
        "edicao",
        "assinatura",
        "pagamento_parcela",
        "atraso_parcela",
        "quitacao",
        "rompimento",
        "cancelamento",
        "contato_realizado",
        "acao_agendada",
        "desconto_aplicado",
        "documento_anexado",
      ],
      acordo_tipo_alerta: [
        "vencimento_proximo",
        "parcela_vencida",
        "risco_rompimento",
        "acao_agendada",
        "documento_pendente",
        "contato_necessario",
      ],
      app_role: ["admin", "operador", "gerente", "morador", "sindico"],
      cobranca_modelo: [
        "por_unidade",
        "valor_minimo",
        "percentual",
        "fixo_mensal",
        "misto",
      ],
      condominio_tipo: ["residencial", "comercial", "misto"],
      convidado_status_acesso: ["liberado", "bloqueado", "pendente"],
      os_prioridade: ["urgente", "periodico", "nao_urgente"],
      os_status: ["aberta", "em_andamento", "concluida", "cancelada"],
      pacote_tipo: ["basico", "intermediario", "completo", "personalizado"],
      porte_animal: ["pequeno", "medio", "grande"],
      proposta_status: [
        "rascunho",
        "enviada",
        "em_analise",
        "aprovada",
        "recusada",
        "expirada",
      ],
      reserva_status: [
        "pendente",
        "confirmada",
        "cancelada",
        "concluida",
        "recusada",
      ],
      responsavel_financeiro: ["proprietario", "inquilino"],
      situacao_unidade: ["ativa", "inativa", "em_reforma", "desocupada"],
      status_financeiro_unidade: ["em_dia", "inadimplente", "acordo"],
      tipo_assinante: ["sindico", "administradora", "testemunha"],
      tipo_localizacao: ["bloco", "torre", "rua"],
      tipo_ocupacao: ["moradia", "aluguel", "aluguel_temporada", "desocupado"],
      tipo_unidade: ["apartamento", "casa", "loja", "escritorio", "sala"],
      tipo_valor_servico: ["fixo", "percentual", "variavel"],
      tipo_veiculo: [
        "carro",
        "moto",
        "bicicleta",
        "outro",
        "suv",
        "caminhonete",
      ],
    },
  },
} as const

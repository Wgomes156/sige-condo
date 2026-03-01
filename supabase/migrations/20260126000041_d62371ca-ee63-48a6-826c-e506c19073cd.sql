
-- Criar tabela de categorias de demanda
CREATE TABLE public.categorias_demanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  icone text DEFAULT 'Wrench',
  cor text DEFAULT '#3B82F6',
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de templates de serviços (pré-cadastrados)
CREATE TABLE public.templates_demanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid REFERENCES public.categorias_demanda(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  periodicidade text NOT NULL DEFAULT 'anual', -- mensal, trimestral, semestral, anual, bienal, sob_demanda, personalizada
  periodicidade_meses integer,
  obrigatorio boolean DEFAULT false,
  base_legal text,
  documentos_necessarios text[] DEFAULT '{}',
  alertar_antecedencia_dias integer DEFAULT 30,
  permite_prorrogacao boolean DEFAULT true,
  condicional boolean DEFAULT false,
  condicao_campo text, -- campo do condomínio que deve ser verificado
  condicao_valor text, -- valor que o campo deve ter
  custo_estimado numeric(10,2) DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de fornecedores
CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  telefone text,
  email text,
  endereco text,
  cidade text,
  uf text,
  contato_nome text,
  observacoes text,
  avaliacao numeric(2,1) DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de demandas por condomínio
CREATE TABLE public.demandas_condominio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.templates_demanda(id) ON DELETE SET NULL,
  categoria_id uuid REFERENCES public.categorias_demanda(id) ON DELETE SET NULL,
  nome text NOT NULL,
  descricao text,
  periodicidade text NOT NULL DEFAULT 'anual',
  periodicidade_meses integer,
  obrigatorio boolean DEFAULT false,
  base_legal text,
  documentos_necessarios text[] DEFAULT '{}',
  alertar_antecedencia_dias integer DEFAULT 30,
  permite_prorrogacao boolean DEFAULT true,
  custo_estimado numeric(10,2) DEFAULT 0,
  fornecedor_id uuid REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  ultima_execucao date,
  proxima_execucao date,
  status text DEFAULT 'em_dia', -- em_dia, atencao, urgente, vencido, sob_demanda
  ativo boolean DEFAULT true,
  observacoes text,
  criado_por uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de execuções de demandas
CREATE TABLE public.execucoes_demanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id uuid NOT NULL REFERENCES public.demandas_condominio(id) ON DELETE CASCADE,
  data_execucao date NOT NULL,
  fornecedor_id uuid REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  fornecedor_nome text,
  custo numeric(10,2) DEFAULT 0,
  observacoes text,
  documentos_anexados text[] DEFAULT '{}',
  executado_por uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de configurações de demanda por condomínio
CREATE TABLE public.configuracoes_demanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid NOT NULL UNIQUE REFERENCES public.condominios(id) ON DELETE CASCADE,
  alertas_email boolean DEFAULT true,
  alertas_push boolean DEFAULT true,
  alertas_inapp boolean DEFAULT true,
  frequencia_urgente text DEFAULT 'diario',
  frequencia_atencao text DEFAULT 'semanal',
  frequencia_informativo text DEFAULT 'quinzenal',
  notificar_sindico boolean DEFAULT true,
  notificar_conselho boolean DEFAULT true,
  notificar_administradora boolean DEFAULT false,
  calcular_proxima_automatico boolean DEFAULT true,
  ativar_servicos_condicionais boolean DEFAULT true,
  exigir_aprovacao boolean DEFAULT false,
  valor_aprovacao numeric(10,2) DEFAULT 5000,
  exigir_documentos boolean DEFAULT true,
  bloquear_sem_documentos boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorias_demanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_demanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas_condominio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execucoes_demanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_demanda ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias_demanda (leitura para todos autenticados)
CREATE POLICY "Categorias visíveis para autenticados" ON public.categorias_demanda
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode gerenciar categorias" ON public.categorias_demanda
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Políticas para templates_demanda (leitura para todos autenticados)
CREATE POLICY "Templates visíveis para autenticados" ON public.templates_demanda
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode gerenciar templates" ON public.templates_demanda
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Políticas para fornecedores
CREATE POLICY "Fornecedores visíveis para autenticados" ON public.fornecedores
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin e Gerentes podem gerenciar fornecedores" ON public.fornecedores
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'));

-- Políticas para demandas_condominio
CREATE POLICY "Visualizar demandas do condomínio" ON public.demandas_condominio
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Admin e Gerentes podem criar demandas" ON public.demandas_condominio
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Admin e Gerentes podem atualizar demandas" ON public.demandas_condominio
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Admin pode deletar demandas" ON public.demandas_condominio
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Políticas para execucoes_demanda
CREATE POLICY "Visualizar execuções permitidas" ON public.execucoes_demanda
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR 
    EXISTS (
      SELECT 1 FROM public.demandas_condominio d 
      WHERE d.id = execucoes_demanda.demanda_id 
      AND has_condominio_access(auth.uid(), d.condominio_id)
    )
  );

CREATE POLICY "Admin e Gerentes podem criar execuções" ON public.execucoes_demanda
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    EXISTS (
      SELECT 1 FROM public.demandas_condominio d 
      WHERE d.id = execucoes_demanda.demanda_id 
      AND has_condominio_access(auth.uid(), d.condominio_id)
    )
  );

CREATE POLICY "Admin pode deletar execuções" ON public.execucoes_demanda
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Políticas para configuracoes_demanda
CREATE POLICY "Visualizar config demandas" ON public.configuracoes_demanda
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Admin e Gerentes podem gerenciar config" ON public.configuracoes_demanda
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_condominio_access(auth.uid(), condominio_id));

-- Inserir categorias padrão
INSERT INTO public.categorias_demanda (nome, icone, cor, ordem) VALUES
  ('Água e Saneamento', 'Droplets', '#0EA5E9', 1),
  ('Controle de Pragas', 'Bug', '#84CC16', 2),
  ('Estrutura e Segurança Predial', 'Building2', '#6366F1', 3),
  ('Prevenção e Combate a Incêndio', 'Flame', '#EF4444', 4),
  ('Documentação e Obrigações Jurídicas', 'FileText', '#8B5CF6', 5),
  ('Áreas Externas e Paisagismo', 'TreePine', '#22C55E', 6),
  ('Limpeza e Conservação', 'Sparkles', '#14B8A6', 7),
  ('Outros Serviços', 'Settings', '#64748B', 8);

-- Inserir templates de serviços pré-cadastrados
INSERT INTO public.templates_demanda (categoria_id, nome, descricao, periodicidade, periodicidade_meses, obrigatorio, base_legal, documentos_necessarios, alertar_antecedencia_dias) VALUES
-- Água e Saneamento
((SELECT id FROM public.categorias_demanda WHERE nome = 'Água e Saneamento'), 'Limpeza e desinfecção das caixas d''água', 'Limpeza completa e desinfecção de todas as caixas d''água do condomínio', 'semestral', 6, true, 'Portaria MS 2914/2011', ARRAY['Certificado de limpeza', 'Laudo bacteriológico'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Água e Saneamento'), 'Limpeza de cisterna', 'Limpeza e higienização da cisterna', 'semestral', 6, true, NULL, ARRAY['Certificado de limpeza'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Água e Saneamento'), 'Teste de potabilidade da água', 'Análise laboratorial da qualidade da água', 'anual', 12, true, 'Portaria GM/MS 888/2021', ARRAY['Laudo de potabilidade'], 45),

-- Controle de Pragas
((SELECT id FROM public.categorias_demanda WHERE nome = 'Controle de Pragas'), 'Dedetização, desratização e descupinização', 'Controle completo de pragas urbanas', 'semestral', 6, true, 'Lei Federal 6.514/77, Vigilância Sanitária', ARRAY['Certificado de dedetização', 'ART do responsável técnico'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Controle de Pragas'), 'Controle de pombos e morcegos', 'Manejo de fauna urbana', 'sob_demanda', NULL, false, NULL, ARRAY['Laudo técnico', 'Autorização ambiental'], 30),

-- Estrutura e Segurança Predial
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Vistoria predial completa (AVCB/Laudo técnico)', 'Inspeção geral das condições do edifício', 'anual', 12, true, 'Corpo de Bombeiros local, Lei 13.425/2017', ARRAY['AVCB', 'Laudo técnico de vistoria'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Laudo de inspeção predial (NBR 16747)', 'Inspeção técnica conforme norma ABNT', 'anual', 12, true, 'NBR 16747:2020', ARRAY['Laudo de inspeção predial', 'ART'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Laudo SPDA (para-raios)', 'Verificação do sistema de proteção contra descargas atmosféricas', 'anual', 12, true, 'NBR 5419, NR-10', ARRAY['Laudo SPDA', 'ART'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Laudo de elevadores', 'Vistoria técnica dos elevadores', 'anual', 12, true, 'NBR NM 313, NR-12', ARRAY['Laudo de vistoria', 'Certificado de conformidade'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Manutenção preventiva dos elevadores', 'Manutenção mensal dos elevadores', 'mensal', 1, true, 'NBR 16083', ARRAY['Relatório de manutenção'], 7),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Teste de estanqueidade do gás', 'Verificação de vazamentos na rede de gás', 'anual', 12, true, 'NBR 15923, NBR 13103', ARRAY['Laudo de estanqueidade', 'ART'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Limpeza de dutos de exaustão', 'Higienização dos dutos de ventilação', 'anual', 12, true, 'NBR 14518, Corpo de Bombeiros', ARRAY['Certificado de limpeza'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Limpeza de caixa de gordura', 'Limpeza periódica das caixas de gordura', 'trimestral', 3, true, 'NBR 8160', ARRAY['Comprovante de limpeza'], 15),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Manutenção de bombas d''água', 'Verificação e manutenção das bombas', 'mensal', 1, true, NULL, ARRAY['Relatório de manutenção'], 7),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Manutenção de portões automáticos', 'Manutenção preventiva dos portões', 'mensal', 1, true, 'NBR 13207', ARRAY['Relatório de manutenção'], 7),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Manutenção de gerador', 'Manutenção do grupo gerador', 'mensal', 1, false, NULL, ARRAY['Relatório de manutenção'], 7),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Manutenção de sistemas de CFTV', 'Verificação das câmeras e gravadores', 'anual', 12, false, NULL, ARRAY['Relatório técnico'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Revisão de impermeabilização', 'Inspeção das áreas impermeabilizadas', 'anual', 12, false, 'NBR 9575', ARRAY['Laudo técnico'], 45),

-- Prevenção e Combate a Incêndio
((SELECT id FROM public.categorias_demanda WHERE nome = 'Prevenção e Combate a Incêndio'), 'Recarga e inspeção de extintores', 'Recarga e verificação dos extintores', 'anual', 12, true, 'NBR 12962, NR-23', ARRAY['Certificado de recarga', 'Etiqueta de validade'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Prevenção e Combate a Incêndio'), 'Teste e manutenção de hidrantes', 'Verificação do sistema de hidrantes', 'anual', 12, true, 'NBR 13714', ARRAY['Laudo técnico', 'ART'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Prevenção e Combate a Incêndio'), 'Teste de iluminação de emergência', 'Verificação do sistema de iluminação', 'anual', 12, true, 'NBR 10898', ARRAY['Relatório de teste'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Prevenção e Combate a Incêndio'), 'Renovação do AVCB', 'Auto de Vistoria do Corpo de Bombeiros', 'anual', 12, true, 'Corpo de Bombeiros local', ARRAY['AVCB renovado'], 90),

-- Documentação e Obrigações Jurídicas
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Certidão negativa de débitos (INSS, FGTS)', 'Obtenção das certidões negativas', 'anual', 12, true, 'CLT, Lei 8212/91', ARRAY['CND INSS', 'CRF FGTS', 'CND Federal'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Certidão negativa trabalhista', 'Certidão de débitos trabalhistas', 'anual', 12, true, NULL, ARRAY['CNDT'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Certidão negativa municipal', 'Certidão de débitos municipais', 'anual', 12, true, NULL, ARRAY['CND Municipal'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Atualização do seguro predial', 'Renovação da apólice de seguro', 'anual', 12, true, NULL, ARRAY['Apólice de seguro renovada'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Exames periódicos (PCMSO)', 'Exames ocupacionais dos funcionários', 'anual', 12, true, 'NR-7', ARRAY['ASO'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Atualização do PGR', 'Programa de Gerenciamento de Riscos', 'anual', 12, true, 'NR-9, NR-1', ARRAY['PGR atualizado'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Treinamento de brigada de incêndio', 'Capacitação da brigada', 'anual', 12, true, 'NBR 14276', ARRAY['Certificados de treinamento'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Assembleia ordinária', 'Assembleia anual obrigatória', 'anual', 12, true, 'Código Civil, Lei 4.591/64', ARRAY['Edital de convocação', 'Ata de assembleia'], 60),

-- Áreas Externas e Paisagismo
((SELECT id FROM public.categorias_demanda WHERE nome = 'Áreas Externas e Paisagismo'), 'Poda de árvores', 'Poda e manutenção das árvores', 'anual', 12, false, 'Legislação ambiental municipal', ARRAY['Autorização de poda'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Áreas Externas e Paisagismo'), 'Manutenção de jardins', 'Cuidados com áreas verdes', 'mensal', 1, false, NULL, ARRAY['Relatório de serviço'], 7),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Áreas Externas e Paisagismo'), 'Limpeza de calhas e rufos', 'Desobstrução do sistema de drenagem', 'semestral', 6, true, NULL, ARRAY['Comprovante de serviço'], 30),

-- Limpeza e Conservação
((SELECT id FROM public.categorias_demanda WHERE nome = 'Limpeza e Conservação'), 'Limpeza de fachada', 'Lavagem e conservação da fachada', 'anual', 12, false, 'Legislação municipal', ARRAY['Comprovante de serviço', 'ART'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Limpeza e Conservação'), 'Lavagem de garagem', 'Limpeza das áreas de estacionamento', 'semestral', 6, false, NULL, ARRAY['Comprovante de serviço'], 15),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Limpeza e Conservação'), 'Limpeza de caixas de inspeção', 'Desobstrução das caixas de inspeção', 'trimestral', 3, true, NULL, ARRAY['Comprovante de limpeza'], 15),

-- Outros Serviços
((SELECT id FROM public.categorias_demanda WHERE nome = 'Outros Serviços'), 'Inventário de bens do condomínio', 'Levantamento patrimonial', 'anual', 12, false, NULL, ARRAY['Relatório de inventário'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Outros Serviços'), 'Auditoria contábil', 'Verificação das contas', 'anual', 12, false, NULL, ARRAY['Relatório de auditoria'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Outros Serviços'), 'Revisão de contratos de seguros', 'Análise das apólices', 'anual', 12, true, NULL, ARRAY['Análise comparativa de apólices'], 60);

-- Criar índices para performance
CREATE INDEX idx_demandas_condominio_id ON public.demandas_condominio(condominio_id);
CREATE INDEX idx_demandas_status ON public.demandas_condominio(status);
CREATE INDEX idx_demandas_proxima_execucao ON public.demandas_condominio(proxima_execucao);
CREATE INDEX idx_execucoes_demanda_id ON public.execucoes_demanda(demanda_id);
CREATE INDEX idx_templates_categoria_id ON public.templates_demanda(categoria_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_demandas_condominio_updated_at
  BEFORE UPDATE ON public.demandas_condominio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_demanda_updated_at
  BEFORE UPDATE ON public.configuracoes_demanda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular status da demanda
CREATE OR REPLACE FUNCTION public.calcular_status_demanda(proxima date)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  dias_restantes integer;
BEGIN
  IF proxima IS NULL THEN
    RETURN 'sob_demanda';
  END IF;
  
  dias_restantes := proxima - CURRENT_DATE;
  
  IF dias_restantes < 0 THEN
    RETURN 'vencido';
  ELSIF dias_restantes <= 7 THEN
    RETURN 'urgente';
  ELSIF dias_restantes <= 30 THEN
    RETURN 'atencao';
  ELSE
    RETURN 'em_dia';
  END IF;
END;
$$;

-- Função para atualizar status de todas as demandas
CREATE OR REPLACE FUNCTION public.atualizar_status_demandas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quantidade_atualizada INTEGER;
BEGIN
  UPDATE demandas_condominio
  SET status = calcular_status_demanda(proxima_execucao),
      updated_at = now()
  WHERE ativo = true
    AND status != calcular_status_demanda(proxima_execucao);
  
  GET DIAGNOSTICS quantidade_atualizada = ROW_COUNT;
  RETURN quantidade_atualizada;
END;
$$;

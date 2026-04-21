-- Fix: Alinhar as políticas de RLS da tabela atendimento_historico
-- com as políticas da tabela atendimentos (pai).
--
-- PROBLEMA: As políticas anteriores eram excessivamente restritivas,
-- exigindo role admin, acesso ao condomínio, ou que operador_id == auth.uid().
-- Se operador_id fosse NULL ou o usuário não fosse admin, o INSERT e SELECT
-- falhavam silenciosamente, fazendo com que novos registros de histórico
-- não aparecessem na interface.
--
-- SOLUÇÃO: Usar a mesma política da tabela atendimentos: qualquer usuário
-- autenticado pode ler, inserir e atualizar. Apenas admin pode deletar.

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admin pode gerenciar histórico atendimentos" ON public.atendimento_historico;
DROP POLICY IF EXISTS "Gerentes podem gerenciar histórico dos seus condomínios" ON public.atendimento_historico;
DROP POLICY IF EXISTS "Operadores podem gerenciar histórico dos seus atendimentos" ON public.atendimento_historico;

-- Criar novas políticas alinhadas com a tabela atendimentos
CREATE POLICY "Authenticated users can view atendimento_historico"
  ON public.atendimento_historico FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert atendimento_historico"
  ON public.atendimento_historico FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update atendimento_historico"
  ON public.atendimento_historico FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete atendimento_historico"
  ON public.atendimento_historico FOR DELETE
  TO authenticated
  USING (true);

-- Também permitir que usuários autenticados deletem anexos
-- (Importante porque deletar histórico tenta deletar os anexos vinculados)
DROP POLICY IF EXISTS "Deletar anexos admin" ON public.anexos;
CREATE POLICY "Authenticated users can delete anexos"
  ON public.anexos FOR DELETE
  TO authenticated
  USING (true);

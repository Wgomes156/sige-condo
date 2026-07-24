-- A migration anterior (20260723220000) liberou INSERT em condominios para
-- gerente/operador e criou um trigger AFTER INSERT que concede acesso via
-- user_condominio_access. Mas o Supabase JS sempre encadeia
-- .insert(...).select(), equivalente a INSERT ... RETURNING, e a política de
-- SELECT usada para decidir o que aparece no RETURNING é avaliada ANTES do
-- trigger AFTER INSERT rodar. Ou seja, para um gerente/operador recém-criando
-- um condomínio, has_condominio_access() ainda não enxerga a linha de acesso
-- (só será inserida depois pelo trigger) e o INSERT inteiro falha com
-- "new row violates row-level security policy" — mesmo com a WITH CHECK do
-- INSERT correta. Mesma classe de bug documentada para ordens_servico
-- (ver migration 20260702120000), mas aqui causada por timing de trigger em
-- vez de self-join.
--
-- Correção: adiciona coluna `criado_por` (preenchida automaticamente com
-- auth.uid() na própria linha sendo inserida) e uma política de SELECT que
-- usa essa coluna diretamente — sem depender de nenhum efeito colateral de
-- trigger nem de subquery. O trigger de user_condominio_access continua
-- valendo para o acesso de longo prazo (updates futuros, outras telas que
-- dependem de has_condominio_access).

ALTER TABLE public.condominios
  ADD COLUMN IF NOT EXISTS criado_por uuid REFERENCES auth.users(id);

ALTER TABLE public.condominios
  ALTER COLUMN criado_por SET DEFAULT auth.uid();

CREATE POLICY "Criador pode ver o condominio recem-criado"
ON public.condominios FOR SELECT
TO authenticated
USING (criado_por = auth.uid());

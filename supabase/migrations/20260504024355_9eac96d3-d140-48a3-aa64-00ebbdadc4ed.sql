-- Tabela de auditoria
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  table_name TEXT NOT NULL,
  record_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Função helper para checar se é o admin master
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'alexpinto2@gmail.com'
  )
$$;

CREATE POLICY "Apenas admin master vê auditoria"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_master_admin());

-- Permite inserts via trigger (security definer); ninguém insere direto
CREATE POLICY "Sistema insere auditoria"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (false);

-- Função genérica de log
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_record_id TEXT;
  v_details JSONB;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  IF TG_OP = 'DELETE' THEN
    v_record_id := COALESCE(OLD.id::TEXT, NULL);
    v_details := to_jsonb(OLD);
  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := COALESCE(NEW.id::TEXT, NULL);
    v_details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSE
    v_record_id := COALESCE(NEW.id::TEXT, NULL);
    v_details := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, details)
  VALUES (auth.uid(), v_email, TG_OP, TG_TABLE_NAME, v_record_id, v_details);

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- Triggers nas tabelas principais
CREATE TRIGGER audit_materias_primas
AFTER INSERT OR UPDATE OR DELETE ON public.materias_primas
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_movimentacoes
AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_producoes
AFTER INSERT OR UPDATE OR DELETE ON public.producoes
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_receitas
AFTER INSERT OR UPDATE OR DELETE ON public.receitas
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_receita_ingredientes
AFTER INSERT OR UPDATE OR DELETE ON public.receita_ingredientes
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_fornecedores
AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

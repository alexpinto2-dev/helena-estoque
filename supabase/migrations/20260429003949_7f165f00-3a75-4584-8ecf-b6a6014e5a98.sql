DROP POLICY IF EXISTS "Admin e compras leem fornecedores" ON public.fornecedores;

CREATE POLICY "Equipe interna lê fornecedores"
ON public.fornecedores
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'compras'::public.app_role)
  OR public.has_role(auth.uid(), 'cozinha'::public.app_role)
);

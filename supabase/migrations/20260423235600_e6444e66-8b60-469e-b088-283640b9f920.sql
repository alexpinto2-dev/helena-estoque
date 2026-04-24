
-- Remove leitura ampla
DROP POLICY IF EXISTS "Fotos públicas para leitura" ON storage.objects;

-- Leitura individual continua pública via URL (direta), mas a política de SELECT só permite a autenticados (impede listagem). 
-- Fotos seguem servidas via URL pública porque o bucket é público (storage serve arquivos sem RLS).
CREATE POLICY "Autenticados listam fotos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'materias-fotos');

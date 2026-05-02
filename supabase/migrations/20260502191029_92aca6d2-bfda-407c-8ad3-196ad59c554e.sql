UPDATE auth.users
SET encrypted_password = crypt('Helena@2026!Doces', gen_salt('bf'))
WHERE email = 'helena@helenarabelo.com.br';
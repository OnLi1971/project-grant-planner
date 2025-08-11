-- =============================================
-- Admin User Setup Utility
-- =============================================
-- Tento script pomůže nastavit prvního admin uživatele

-- 1. NAJDĚTE SVÉ USER ID:
-- Po registraci běžte do Supabase Auth > Users a zkopírujte svůj User ID

-- 2. NAHRAĎTE 'YOUR_USER_ID_HERE' svým skutečným User ID
-- 3. SPUSŤTE TENTO SCRIPT V SQL EDITORU

UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'YOUR_USER_ID_HERE';

-- Pro kontrolu - zobrazí všechny uživatele a jejich role:
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
ORDER BY created_at;

-- =============================================
-- Alternativní způsob - najít prvního uživatele a udělat ho admin:
-- =============================================

-- Najde prvního zaregistrovaného uživatele a udělá ho admin
-- POZOR: Používejte pouze pokud jste si jisti, že chcete prvního uživatele udělat admin

-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (
--     SELECT id 
--     FROM public.profiles 
--     ORDER BY created_at 
--     LIMIT 1
-- );

-- =============================================
-- Pomocné queries pro správu uživatelů:
-- =============================================

-- Najít uživatele podle emailu a udělat ho admin:
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- Zobrazit počet adminů:
-- SELECT COUNT(*) as admin_count 
-- FROM public.profiles 
-- WHERE role = 'admin';

-- Zobrazit všechny adminy:
-- SELECT email, full_name, role, created_at 
-- FROM public.profiles 
-- WHERE role = 'admin' 
-- ORDER BY created_at;
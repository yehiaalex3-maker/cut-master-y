-- إصلاح سياسات RLS لجدول users_profile و projects

-- 1. تفعيل RLS على الجداول
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Enable read access for own profile" ON users_profile;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users_profile;
DROP POLICY IF EXISTS "Enable update for own profile" ON users_profile;

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- 3. إنشاء سياسات users_profile
CREATE POLICY "Enable read access for own profile"
ON users_profile FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
ON users_profile FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile"
ON users_profile FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. إنشاء سياسات projects
CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- 5. إنشاء Trigger لإنشاء profile تلقائيًا عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف الـ trigger القديم إن وجد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- إنشاء الـ trigger الجديد
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. إنشاء profiles للمستخدمين الموجودين الذين ليس لديهم profile
INSERT INTO public.users_profile (id, email, full_name, role, is_active)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  'user',
  true
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users_profile)
ON CONFLICT (id) DO NOTHING;

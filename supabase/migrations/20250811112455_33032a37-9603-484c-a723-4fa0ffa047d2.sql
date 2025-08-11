-- Grant Planer Database Schema
-- =============================================

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- PLANNING ENTRIES TABLE
-- =============================================
CREATE TABLE public.planning_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    konstrukter TEXT NOT NULL,
    cw TEXT NOT NULL,
    mesic TEXT NOT NULL,
    mh_tyden INTEGER DEFAULT 0,
    projekt TEXT DEFAULT 'FREE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    
    -- Ensure unique combination of konstrukter and calendar week
    UNIQUE(konstrukter, cw)
);

-- Enable RLS on planning_entries
ALTER TABLE public.planning_entries ENABLE ROW LEVEL SECURITY;

-- Planning entries policies
CREATE POLICY "Everyone can view planning entries" ON public.planning_entries
    FOR SELECT USING (true);

CREATE POLICY "Editors and admins can insert planning entries" ON public.planning_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Editors and admins can update planning entries" ON public.planning_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Only admins can delete planning entries" ON public.planning_entries
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'viewer'::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for planning_entries updated_at
CREATE TRIGGER set_updated_at_planning_entries
    BEFORE UPDATE ON public.planning_entries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for profiles updated_at
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample planning data
INSERT INTO public.planning_entries (konstrukter, cw, mesic, mh_tyden, projekt) VALUES
('Jan Novák', 'CW32', 'August', 40, 'PROJECT_A'),
('Jan Novák', 'CW33', 'August', 40, 'PROJECT_A'),
('Petr Svoboda', 'CW32', 'August', 40, 'FREE'),
('Petr Svoboda', 'CW33', 'August', 35, 'PROJECT_B')
ON CONFLICT (konstrukter, cw) DO NOTHING;
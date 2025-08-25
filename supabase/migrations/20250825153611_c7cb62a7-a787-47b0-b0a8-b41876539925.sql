-- Create table for customers
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for project managers
CREATE TABLE public.project_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for programs
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  project_manager_id UUID NOT NULL,
  program_id UUID NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  hourly_rate INTEGER,
  project_type TEXT NOT NULL DEFAULT 'WP',
  budget INTEGER,
  average_hourly_rate INTEGER,
  project_status TEXT DEFAULT 'Realizace',
  probability INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create table for project licenses
CREATE TABLE public.project_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  license_id UUID NOT NULL,
  percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.projects
ADD CONSTRAINT fk_projects_customer_id FOREIGN KEY (customer_id) REFERENCES public.customers(id),
ADD CONSTRAINT fk_projects_project_manager_id FOREIGN KEY (project_manager_id) REFERENCES public.project_managers(id),
ADD CONSTRAINT fk_projects_program_id FOREIGN KEY (program_id) REFERENCES public.programs(id);

ALTER TABLE public.project_licenses
ADD CONSTRAINT fk_project_licenses_project_id FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_project_licenses_license_id FOREIGN KEY (license_id) REFERENCES public.licenses(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_licenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Authenticated users can view customers" 
ON public.customers FOR SELECT USING (true);

CREATE POLICY "Editors and admins can insert customers" 
ON public.customers FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "Editors and admins can update customers" 
ON public.customers FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "Only admins can delete customers" 
ON public.customers FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create RLS policies for project managers
CREATE POLICY "Authenticated users can view project managers" 
ON public.project_managers FOR SELECT USING (true);

CREATE POLICY "Editors and admins can insert project managers" 
ON public.project_managers FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "Editors and admins can update project managers" 
ON public.project_managers FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "Only admins can delete project managers" 
ON public.project_managers FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create RLS policies for programs
CREATE POLICY "Authenticated users can view programs" 
ON public.programs FOR SELECT USING (true);

CREATE POLICY "Editors and admins can insert programs" 
ON public.programs FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "Editors and admins can update programs" 
ON public.programs FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "Only admins can delete programs" 
ON public.programs FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create RLS policies for projects
CREATE POLICY "Authenticated users can view projects" 
ON public.projects FOR SELECT USING (true);

CREATE POLICY "Editors and admins can insert projects" 
ON public.projects FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "Editors and admins can update projects" 
ON public.projects FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "Only admins can delete projects" 
ON public.projects FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create RLS policies for project licenses
CREATE POLICY "Authenticated users can view project licenses" 
ON public.project_licenses FOR SELECT USING (true);

CREATE POLICY "Editors and admins can insert project licenses" 
ON public.project_licenses FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "Editors and admins can update project licenses" 
ON public.project_licenses FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'editor')
));

CREATE POLICY "Only admins can delete project licenses" 
ON public.project_licenses FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Add triggers for updated_at columns
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_project_managers_updated_at
BEFORE UPDATE ON public.project_managers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_programs_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_project_licenses_updated_at
BEFORE UPDATE ON public.project_licenses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default data for customers
INSERT INTO public.customers (name, code) VALUES
('ST', 'ST'),
('NUVIA', 'NUVIA'),
('WABTEC', 'WABTEC'),
('BUCHER', 'BUCHER'),
('SAFRAN', 'SAFRAN'),
('AIRBUS', 'AIRBUS'),
('N/A', 'NA');

-- Insert default data for project managers
INSERT INTO public.project_managers (name, email) VALUES
('KaSo', 'kaso@company.com'),
('JoMa', 'joma@company.com'),
('PeNe', 'pene@company.com'),
('OnLi', 'onli@company.com'),
('PeMa', 'pema@company.com'),
('DaAm', 'daam@company.com'),
('PaHo', 'paho@company.com'),
('N/A', 'na@company.com');

-- Insert default data for programs
INSERT INTO public.programs (name, code) VALUES
('RAIL', 'RAIL'),
('MACH', 'MACH'),
('AERO', 'AERO'),
('N/A', 'NA');
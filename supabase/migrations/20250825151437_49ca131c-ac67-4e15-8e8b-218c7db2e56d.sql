-- Create licenses table
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('software', 'certification', 'training')),
  provider TEXT NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 0,
  used_seats INTEGER NOT NULL DEFAULT 0,
  expiration_date DATE NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'expiring-soon')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view licenses" 
ON public.licenses 
FOR SELECT 
USING (true);

CREATE POLICY "Editors and admins can insert licenses" 
ON public.licenses 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'editor')
));

CREATE POLICY "Editors and admins can update licenses" 
ON public.licenses 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'editor')
));

CREATE POLICY "Only admins can delete licenses" 
ON public.licenses 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_licenses_updated_at
BEFORE UPDATE ON public.licenses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default licenses
INSERT INTO public.licenses (name, type, provider, total_seats, used_seats, expiration_date, cost, status) VALUES
('AutoCAD Professional', 'software', 'Autodesk', 10, 8, '2024-12-31', 150000, 'active'),
('SolidWorks Premium', 'software', 'Dassault Systèmes', 5, 5, '2024-06-15', 200000, 'expiring-soon'),
('Certifikace ISO 9001', 'certification', 'TÜV SÜD', 1, 1, '2025-03-20', 80000, 'active');
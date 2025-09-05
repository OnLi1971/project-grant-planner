-- Create employees table for organizational structure
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  company text NOT NULL,
  program text,
  organizational_leader text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view employees" 
ON public.employees 
FOR SELECT 
USING (true);

CREATE POLICY "Editors and admins can insert employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'editor'::user_role])))));

CREATE POLICY "Editors and admins can update employees" 
ON public.employees 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'editor'::user_role])))));

CREATE POLICY "Only admins can delete employees" 
ON public.employees 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert organizational structure data
INSERT INTO public.employees (name, company, program, organizational_leader) VALUES
('Ambrož David', 'TM CZ a.s.', 'Steam Turbines', 'OnLi'),
('Anovčín Branislav', 'TM CZ a.s.', 'Steam Turbines', 'DaAm'),
('Bartovič Anton', 'TM CZ a.s.', 'Steam Turbines', 'DaAm'),
('Bartovičová Agáta', 'TM CZ a.s.', 'Car Body & Bogies', 'KaSo'),
('Bohušík Martin', 'MB idea SK, s.r.o.', 'N/A', 'Dodavatel'),
('Borský Jan', 'TM CZ a.s.', 'Electro Design', 'PaHo'),
('Břicháček Miloš', 'TM CZ a.s.', 'Interiors & Non-metallic Design', 'JoMa'),
('Brojír Jaroslav', 'TM CZ a.s.', 'Car Body & Bogies', 'KaSo'),
('Chrenko Daniel', 'MB idea SK, s.r.o.', 'N/A', 'Dodavatel'),
('Chrenko Peter', 'MB idea SK, s.r.o.', 'N/A', 'Dodavatel'),
('Fenyk Pavel', 'TM CZ a.s.', 'General Machinery', 'PeMa'),
('Fica Ladislav', 'TM CZ a.s.', 'General Machinery', 'PeMa'),
('Friedlová Jiřina', 'TM CZ a.s.', 'IWE', 'OnLi'),
('Fuchs Pavel', 'TM CZ a.s.', 'Steam Turbines', 'DaAm'),
('Heřman Daniel', 'TM CZ a.s.', 'Interiors & Non-metallic Design', 'JoMa'),
('Hibler František', 'TM CZ a.s.', 'Car Body & Bogies', 'KaSo'),
('Hlavan Martin', 'TM CZ a.s.', 'Interiors & Non-metallic Design', 'JoMa'),
('Hrachová Ivana', 'TM CZ a.s.', 'Car Body & Bogies', 'KaSo'),
('Jandečka Karel', 'TM CZ a.s.', 'Car Body & Bogies', 'KaSo'),
('Ješš Jozef', 'TM CZ a.s.', 'Stress Analysis', 'PeNe'),
('Jiřička Aleš', 'TM CZ a.s.', 'Interiors & Non-metallic Design', 'JoMa'),
('Jurčišin Peter', 'MB idea SK, s.r.o.', 'N/A', 'Dodavatel'),
('Kalafa Ján', 'TM CZ a.s.', 'Interiors & Non-metallic Design', 'JoMa'),
('Karlesz Michal', 'TM CZ a.s.', 'General Machinery', 'PeMa'),
('Karlík Štěpán', 'TM CZ a.s.', 'Interiors & Non-metallic Design', 'JoMa'),
('Klíma Milan', 'TM CZ a.s.', 'Car Body & Bogies', 'KaSo'),
('Lengyel Martin', 'TM CZ a.s.', 'Interiors & Non-metallic Design', 'JoMa'),
('Litvinov Evgenii', 'TM CZ a.s.', 'Electro Design', 'PaHo'),
('Madanský Peter', 'TM CZ a.s.', 'General Machinery', 'OnLi'),
('Matta Jozef', 'TM CZ a.s.', 'Interiors & Non-metallic Design', 'OnLi'),
('Melichar Ondřej', 'TM CZ a.s.', 'Stress Analysis', 'PeNe'),
('Mohelník Martin', 'TM CZ a.s.', 'General Machinery', 'PeMa'),
('Nedavaška Petr', 'TM CZ a.s.', '', 'OnLi'),
('Pecinovský Pavel', 'TM CZ a.s.', 'Interiors & Non-metallic Design', 'JoMa'),
('Púpava Marián', 'MB idea SK, s.r.o.', 'N/A', 'Dodavatel'),
('Pytela Martin', 'TM CZ a.s.', 'Electro Design', 'PaHo'),
('Samko Mikuláš', 'TM CZ a.s.', 'Interiors & Non-metallic Design', 'JoMa'),
('Šedovičová Darina', 'TM CZ a.s.', 'Stress Analysis', 'PeNe'),
('Slavík Ondřej', 'TM CZ a.s.', 'Car Body & Bogies', 'KaSo'),
('Šoupa Karel', 'TM CZ a.s.', 'Car Body & Bogies', 'OnLi'),
('Stránský Martin', 'TM CZ a.s.', 'General Machinery', 'PeMa'),
('Trač Vasyl', 'TM CZ a.s.', 'General Machinery', 'PeMa'),
('Uher Tomáš', 'TM CZ a.s.', 'Steam Turbines', 'DaAm'),
('Večeř Jiří', 'TM CZ a.s.', 'Interiors & Non-metallic Design', 'JoMa'),
('Weiss Ondřej', 'TM CZ a.s.', 'Electro Design', 'PaHo');
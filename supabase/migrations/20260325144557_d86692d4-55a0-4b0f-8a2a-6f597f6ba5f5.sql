ALTER TABLE public.knowledge_specialization 
  ADD COLUMN oblast_id uuid REFERENCES public.knowledge_oblast(id) ON DELETE CASCADE;

UPDATE public.knowledge_specialization SET oblast_id = (SELECT id FROM public.knowledge_oblast WHERE name = 'Kolejová vozidla') 
  WHERE name IN ('Hrubá stavba', 'Stanoviště strojvedoucího/kabina řidiče');

UPDATE public.knowledge_specialization SET oblast_id = (SELECT id FROM public.knowledge_oblast WHERE name = 'Obecné strojírenství') 
  WHERE oblast_id IS NULL;
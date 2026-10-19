import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Use the same current project/program records as Project Management. */
export function useProjectHoursCatalog() {
  return useQuery({
    queryKey: ['project-hours-catalog'],
    queryFn: async () => {
      const [projects, programs] = await Promise.all([
        supabase.from('projects').select('code, name, program_id, project_status').order('name'),
        supabase.from('programs').select('id, code').order('name'),
      ]);
      if (projects.error) throw projects.error;
      if (programs.error) throw programs.error;
      const programCodes = new Map(programs.data.map(program => [program.id, program.code]));
      return {
        projects: projects.data,
        programs: programs.data,
        statusByProject: new Map(projects.data.map(project => [project.code, project.project_status || 'Realizace'])),
        programByProject: new Map(projects.data.map(project => [project.code, programCodes.get(project.program_id) || 'NA'])),
      };
    },
    staleTime: 0,
  });
}
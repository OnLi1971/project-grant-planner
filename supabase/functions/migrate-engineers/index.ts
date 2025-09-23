import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { corsHeaders } from '../_shared/cors.ts';

interface EmployeeData {
  id?: string;
  name: string;
  company: string;
  organizational_leader: string;
  program?: string;
}

interface StaticEngineerData {
  jmeno: string;
  spolecnost: string;
  orgVedouci: string;
  pozice?: string;
}

// Static data from the existing files (backup in case employees table is empty)
const STATIC_ENGINEERS: StaticEngineerData[] = [
  { jmeno: "Fuchs Pavel", spolecnost: "SBD", orgVedouci: "Fuchs Pavel" },
  { jmeno: "Novák Jan", spolecnost: "SBD", orgVedouci: "Novák Jan" },
  { jmeno: "Svoboda Petr", spolecnost: "SBD", orgVedouci: "Svoboda Petr" },
  { jmeno: "Dvořák Martin", spolecnost: "AERTEC", orgVedouci: "Dvořák Martin" },
  { jmeno: "Novotný Tomáš", spolecnost: "AERTEC", orgVedouci: "Novotný Tomáš" },
  { jmeno: "Kratochvíl Lukáš", spolecnost: "SBD", orgVedouci: "Kratochvíl Lukáš" },
  { jmeno: "Horáček Petr", spolecnost: "SBD", orgVedouci: "Horáček Petr" },
  { jmeno: "Krejčí Milan", spolecnost: "AERTEC", orgVedouci: "Krejčí Milan" },
  { jmeno: "Zeman František", spolecnost: "SBD", orgVedouci: "Zeman František" },
  { jmeno: "Pospíšil David", spolecnost: "AERTEC", orgVedouci: "Pospíšil David" },
  { jmeno: "José Carreras", spolecnost: "AERTEC", orgVedouci: "José Carreras" },
  { jmeno: "Marta López", spolecnost: "AERTEC", orgVedouci: "Marta López" },
  { jmeno: "Iván Bellamy", spolecnost: "AERTEC", orgVedouci: "Iván Bellamy" }
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting engineer migration...');

    // Step 1: Check if engineers table is empty
    const { data: existingEngineers, error: checkError } = await supabaseClient
      .from('engineers')
      .select('id')
      .limit(1);

    if (checkError) {
      throw new Error(`Error checking engineers: ${checkError.message}`);
    }

    if (existingEngineers && existingEngineers.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Engineers table already contains data. Migration skipped.',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Try to get data from employees table first
    const { data: employeesData, error: employeesError } = await supabaseClient
      .from('employees')
      .select('*');

    let engineersToMigrate: StaticEngineerData[] = [];

    if (employeesError) {
      console.log('No employees table found, using static data');
      engineersToMigrate = STATIC_ENGINEERS;
    } else if (!employeesData || employeesData.length === 0) {
      console.log('Employees table is empty, using static data');
      engineersToMigrate = STATIC_ENGINEERS;
    } else {
      console.log(`Found ${employeesData.length} employees in database`);
      // Transform employees data to engineer format
      engineersToMigrate = employeesData.map((emp: EmployeeData) => ({
        jmeno: emp.name,
        spolecnost: emp.company,
        orgVedouci: emp.organizational_leader,
        pozice: emp.program
      }));
    }

    console.log(`Migrating ${engineersToMigrate.length} engineers...`);

    // Step 3: Migrate each engineer using the safe RPC function
    const results: any[] = [];
    const errors: string[] = [];

    for (const engineer of engineersToMigrate) {
      try {
        const { data, error } = await supabaseClient.rpc('engineers_create', {
          p_display_name: engineer.jmeno,
          p_email: null,
          p_status: 'active',
          p_fte: 100,
          p_department: null,
          p_manager: null
        });

        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`Skipping duplicate: ${engineer.jmeno}`);
            continue;
          }
          throw error;
        }

        results.push(data);
        console.log(`Created engineer: ${engineer.jmeno} -> ${data.slug}`);
      } catch (err) {
        const errorMsg = `Failed to create ${engineer.jmeno}: ${err.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Step 4: Update planning_entries to link to engineer_id
    console.log('Updating planning entries with engineer_id...');
    
    const { data: planningEntries } = await supabaseClient
      .from('planning_entries')
      .select('id, konstrukter')
      .is('engineer_id', null);

    if (planningEntries && planningEntries.length > 0) {
      const { data: engineersMapping } = await supabaseClient
        .from('engineers')
        .select('id, display_name, slug');

      const updatePromises = [];
      
      for (const entry of planningEntries) {
        // Try to find matching engineer by display_name first, then by normalized name
        const matchingEngineer = engineersMapping?.find(eng => 
          eng.display_name === entry.konstrukter ||
          eng.display_name.toLowerCase() === entry.konstrukter.toLowerCase()
        );

        if (matchingEngineer) {
          updatePromises.push(
            supabaseClient
              .from('planning_entries')
              .update({ engineer_id: matchingEngineer.id })
              .eq('id', entry.id)
          );
        }
      }

      const updateResults = await Promise.allSettled(updatePromises);
      const successfulUpdates = updateResults.filter(r => r.status === 'fulfilled').length;
      console.log(`Updated ${successfulUpdates} planning entries with engineer_id`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Engineer migration completed successfully',
        migrated: results.length,
        errors: errors.length,
        errorDetails: errors,
        planningEntriesUpdated: planningEntries?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
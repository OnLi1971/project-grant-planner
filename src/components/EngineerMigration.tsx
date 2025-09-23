import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MigrationResult {
  success: boolean;
  message: string;
  migrated?: number;
  errors?: number;
  errorDetails?: string[];
  planningEntriesUpdated?: number;
}

export function EngineerMigration() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const { toast } = useToast();

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('migrate-engineers');

      if (error) {
        throw new Error(error.message);
      }

      const migrationResult = data as MigrationResult;
      setResult(migrationResult);

      if (migrationResult.success) {
        toast({
          title: "Migration completed",
          description: `Successfully migrated ${migrationResult.migrated} engineers`,
        });
      } else {
        toast({
          title: "Migration info",
          description: migrationResult.message,
          variant: "default",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Migration failed';
      setResult({
        success: false,
        message: errorMessage
      });
      toast({
        title: "Migration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Engineer Data Migration
        </CardTitle>
        <CardDescription>
          Migrate engineer data from static files and employees table to the new engineers system.
          This will create the new engineer records and link existing planning entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runMigration} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Start Migration
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p className="font-medium">{result.message}</p>
                
                {result.migrated !== undefined && (
                  <p>Engineers migrated: <span className="font-mono">{result.migrated}</span></p>
                )}
                
                {result.planningEntriesUpdated !== undefined && (
                  <p>Planning entries updated: <span className="font-mono">{result.planningEntriesUpdated}</span></p>
                )}
                
                {result.errors !== undefined && result.errors > 0 && (
                  <div>
                    <p className="text-red-600 font-medium">Errors: {result.errors}</p>
                    {result.errorDetails && (
                      <ul className="text-sm text-red-500 mt-1 space-y-1">
                        {result.errorDetails.map((error, idx) => (
                          <li key={idx} className="font-mono">{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <h4 className="font-medium mb-2">What this migration does:</h4>
          <ul className="space-y-1 text-xs">
            <li>• Creates engineer records in the new engineers table</li>
            <li>• Generates normalized slugs for unique identification</li>
            <li>• Links existing planning entries to engineer IDs</li>
            <li>• Preserves all existing planning data</li>
            <li>• Skips migration if engineers already exist</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
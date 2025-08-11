import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, ExternalLink, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const SupabaseNotConnected = () => {
  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-6 w-6" />
          Supabase databáze není připojena
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-yellow-700 dark:text-yellow-300">
          Pro plnou funkcionalita (cloudová databáze, multi-user přístup, real-time sync) je potřeba připojit Supabase.
        </p>
        
        <div className="space-y-2">
          <p className="font-medium text-yellow-800 dark:text-yellow-200">Jak připojit Supabase:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            <li>Klikněte na <Badge variant="secondary" className="mx-1">zelené tlačítko Supabase</Badge> v pravém horním rohu</li>
            <li>Připojte se k vašemu Supabase projektu</li>
            <li>Spusťte SQL schema v Supabase editoru</li>
          </ol>
        </div>

        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Momentálně běží v demo módu:
          </p>
          <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Data uložena pouze lokálně</li>
            <li>• Bez multi-user podpory</li>
            <li>• Bez real-time synchronizace</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
              <Database className="h-4 w-4" />
              Vytvořit Supabase účet
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
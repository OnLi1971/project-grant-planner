import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Database, Users, Shield, Zap } from 'lucide-react';

export const WelcomeMessage = () => {
  return (
    <Card className="border-primary bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <CheckCircle className="h-6 w-6" />
          Grant Planer je připraven k použití!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Váš systém pro plánování kapacit je plně funkční s cloudovou databází a real-time synchronizací.
        </p>
        
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-success" />
            <span className="text-sm">Cloudová databáze připojena</span>
            <Badge variant="secondary" className="text-xs">Supabase</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-success" />
            <span className="text-sm">Multi-user přístup</span>
            <Badge variant="secondary" className="text-xs">Aktivní</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            <span className="text-sm">Systém oprávnění</span>
            <Badge variant="secondary" className="text-xs">RLS</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-success" />
            <span className="text-sm">Real-time sync</span>
            <Badge variant="secondary" className="text-xs">WebSocket</Badge>
          </div>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg text-sm">
          <p className="font-medium mb-1">Můžete začít:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Editovat plánování v záložce "Vstupní data"</li>
            <li>• Prohlížet analýzy v "Výstupy"</li>
            <li>• Spravovat uživatele v "Správa utilit" &gt; "Správa uživatelů"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
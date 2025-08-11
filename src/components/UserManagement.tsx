import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, Crown, UserCheck } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export const UserManagement = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstUser, setIsFirstUser] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUsers(data || []);
      
      // Check if this is the first user and no admin exists
      const hasAdmin = data?.some(u => u.role === 'admin');
      const isCurrentUserFirst = data?.length === 1 && data[0].id === user?.id;
      setIsFirstUser(isCurrentUserFirst && !hasAdmin);
      
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Chyba při načítání uživatelů",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    if (profile?.role !== 'admin') {
      toast({
        title: "Nedostatečná oprávnění",
        description: "Pouze administrátoři mohou měnit role uživatelů.",
        variant: "destructive",
      });
      return;
    }

    if (userId === user?.id && newRole !== 'admin') {
      toast({
        title: "Nelze změnit vlastní roli",
        description: "Nemůžete odebrat sami sobě admin práva.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      
      toast({
        title: "Role aktualizována",
        description: "Role uživatele byla úspěšně změněna.",
      });
    } catch (error: any) {
      toast({
        title: "Chyba při aktualizaci role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const makeMeAdmin = async () => {
    if (!isFirstUser || !user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (error) throw error;

      await fetchUsers();
      setIsFirstUser(false);
      
      toast({
        title: "Gratulujeme! 🎉",
        description: "Stal jste se administrátorem systému.",
      });
      
      // Refresh the page to update auth context
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Chyba při nastavování admin práv",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="gap-1"><Crown className="w-3 h-3" />Admin</Badge>;
      case 'editor':
        return <Badge variant="default" className="gap-1"><Shield className="w-3 h-3" />Editor</Badge>;
      case 'viewer':
        return <Badge variant="secondary" className="gap-1"><UserCheck className="w-3 h-3" />Viewer</Badge>;
      default:
        return <Badge variant="outline">Neznámá</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Načítání uživatelů...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* First User Welcome */}
      {isFirstUser && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Crown className="h-6 w-6" />
              Vítejte v Grant Planer!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Jste první uživatel v systému. Chcete se stát administrátorem a získat plná oprávnění pro správu uživatelů a dat?
            </p>
            <Button onClick={makeMeAdmin} className="gap-2">
              <Crown className="h-4 w-4" />
              Stát se administrátorem
            </Button>
          </CardContent>
        </Card>
      )}

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Správa uživatelů
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {profile?.role === 'admin' 
              ? 'Můžete měnit role uživatelů a spravovat přístup k systému.'
              : 'Přehled všech uživatelů v systému.'
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Uživatel</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Registrace</TableHead>
                  {profile?.role === 'admin' && <TableHead>Akce</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell className="font-medium">
                      {userItem.full_name || 'Bez jména'}
                      {userItem.id === user?.id && (
                        <Badge variant="outline" className="ml-2">Vy</Badge>
                      )}
                    </TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    <TableCell>
                      {getRoleBadge(userItem.role)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(userItem.created_at)}
                    </TableCell>
                    {profile?.role === 'admin' && (
                      <TableCell>
                        <Select
                          value={userItem.role}
                          onValueChange={(newRole: 'admin' | 'editor' | 'viewer') => 
                            updateUserRole(userItem.id, newRole)
                          }
                          disabled={userItem.id === user?.id} // Can't change own role
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Žádní uživatelé nebyli nalezeni.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Popis rolí
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-destructive" />
                <h4 className="font-semibold">Administrátor</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Úplná kontrola nad systémem</li>
                <li>• Správa uživatelů a rolí</li>
                <li>• Mazání a editace všech dat</li>
                <li>• Přístup ke všem funkcím</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Editor</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Editace plánování</li>
                <li>• Přidávání konstruktérů</li>
                <li>• Úprava projektových dat</li>
                <li>• Zobrazení všech výstupů</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">Prohlížeč</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Pouze čtení dat</li>
                <li>• Zobrazení výstupů</li>
                <li>• Analýzy a reporty</li>
                <li>• Bez editačních práv</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, Edit, Eye } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Zkontroluje, jestli je uživatel admin
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
  }, []);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    setIsAdmin(data?.role === 'admin');
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({
        title: "Chyba při načítání uživatelů",
        description: "Nepodařilo se načíst seznam uživatelů.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Aktualizuj místní stav
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      toast({
        title: "Role byla změněna",
        description: `Uživateli byla nastavena role: ${getRoleLabel(newRole)}`,
      });
    } catch (error) {
      toast({
        title: "Chyba při změně role",
        description: "Nepodařilo se změnit uživatelskou roli.",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrátor';
      case 'editor': return 'Editor';
      case 'viewer': return 'Pouze čtení';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'editor': return <Edit className="h-4 w-4" />;
      case 'viewer': return <Eye className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive' as const;
      case 'editor': return 'default' as const;
      case 'viewer': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Správa uživatelů
          </CardTitle>
          <CardDescription>
            Nemáte oprávnění k prohlížení této sekce.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Načítání uživatelů...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Správa uživatelů
          </CardTitle>
          <CardDescription>
            Spravujte role a oprávnění uživatelů aplikace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((userProfile) => (
              <div
                key={userProfile.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{userProfile.email}</h3>
                    <Badge
                      variant={getRoleVariant(userProfile.role)}
                      className="flex items-center gap-1"
                    >
                      {getRoleIcon(userProfile.role)}
                      {getRoleLabel(userProfile.role)}
                    </Badge>
                  </div>
                  {userProfile.full_name && (
                    <p className="text-sm text-muted-foreground">
                      {userProfile.full_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Registrován: {new Date(userProfile.created_at).toLocaleDateString('cs-CZ')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {userProfile.id !== user?.id && (
                    <Select
                      value={userProfile.role}
                      onValueChange={(newRole: 'admin' | 'editor' | 'viewer') =>
                        updateUserRole(userProfile.id, newRole)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Pouze čtení
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Editor
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Administrátor
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {userProfile.id === user?.id && (
                    <Badge variant="outline" className="w-40 justify-center">
                      Váš účet
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Žádní uživatelé nebyli nalezeni.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Oprávnění podle rolí</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                <Eye className="h-4 w-4" />
                Pouze čtení
              </Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Prohlížení všech dat</li>
                <li>• Exporty a reporty</li>
                <li>• Žádné úpravy</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Badge variant="default" className="flex items-center gap-1 w-fit">
                <Edit className="h-4 w-4" />
                Editor
              </Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Vše z role "Pouze čtení"</li>
                <li>• Úprava plánování</li>
                <li>• Správa projektů a zdrojů</li>
                <li>• Nemůže mazat data</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                <Shield className="h-4 w-4" />
                Administrátor
              </Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Vše z role "Editor"</li>
                <li>• Mazání všech dat</li>
                <li>• Správa uživatelů</li>
                <li>• Plná kontrola systému</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
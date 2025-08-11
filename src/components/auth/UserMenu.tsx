import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const UserMenu = () => {
  const { user, profile, signOut } = useAuth()

  if (!user) return null

  const getInitials = (name?: string) => {
    if (!name) return user.email?.slice(0, 2).toUpperCase() || 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'editor': return 'default'
      case 'viewer': return 'secondary'
      default: return 'outline'
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrátor'
      case 'editor': return 'Editor'
      case 'viewer': return 'Prohlížeč'
      default: return 'Uživatel'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">
              {profile?.full_name || 'Uživatel'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <Badge variant={getRoleBadgeVariant(profile?.role)} className="w-fit">
              <Shield className="w-3 h-3 mr-1" />
              {getRoleLabel(profile?.role)}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Odhlásit se</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
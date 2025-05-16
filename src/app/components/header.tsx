'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Profile } from '@/types/supabase'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { LogOut, Menu, User, History, Grid2X2, Home } from 'lucide-react'
import { toast } from 'sonner'
import NiceAvatar from 'react-nice-avatar'

interface HeaderProps {
  user: Profile
}

type AvatarConfig = {
  sex: 'man' | 'woman';
  [key: string]: unknown;
};

export default function Header({ user }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const supabase = createClient()
  
  const handleSignOut = async () => {
    setIsLoggingOut(true)
    
    try {
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
      router.refresh()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
      setIsLoggingOut(false)
    }
  }

  // Get user's initials for avatar
  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Parse avatar config
  let avatarConfig: AvatarConfig | undefined = undefined
  if (user.avatar_config) {
    try {
      avatarConfig = typeof user.avatar_config === 'string'
        ? JSON.parse(user.avatar_config)
        : user.avatar_config
    } catch {
      avatarConfig = undefined
      // Optionally log error
    }
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto max-w-7xl py-3 px-4 flex justify-between items-center">
        {/* Desktop: Logo left, menu center, avatar right */}
        <div className="hidden md:flex w-full items-center justify-between">
          {/* Logo */}
          <div className="flex items-center justify-start md:basis-48">
            <Link href="/" className="text-xl font-bold text-primary flex items-center gap-2">
              <span>Rice Pickup</span>
            </Link>
          </div>
          {/* Centered Menu */}
          <nav className="flex-1 flex justify-center items-center gap-6">
            <Link href="/" className={`flex items-center gap-2 text-sm font-medium rounded-md px-3 py-2 transition-colors hover:bg-muted/50 focus:bg-primary/10 ${pathname === '/' ? 'bg-primary/10 text-primary' : ''}`}> <Home className="h-4 w-4" /> <span>Dashboard</span> </Link>
            <Link href="/profile" className={`flex items-center gap-2 text-sm font-medium rounded-md px-3 py-2 transition-colors hover:bg-muted/50 focus:bg-primary/10 ${pathname.startsWith('/profile') ? 'bg-primary/10 text-primary' : ''}`}> <User className="h-4 w-4" /> <span>My Profile</span> </Link>
            <Link href="/history" className={`flex items-center gap-2 text-sm font-medium rounded-md px-3 py-2 transition-colors hover:bg-muted/50 focus:bg-primary/10 ${pathname.startsWith('/history') ? 'bg-primary/10 text-primary' : ''}`}> <History className="h-4 w-4" /> <span>Pickup History</span> </Link>
            <Link href="/divisions" className={`flex items-center gap-2 text-sm font-medium rounded-md px-3 py-2 transition-colors hover:bg-muted/50 focus:bg-primary/10 ${pathname.startsWith('/divisions') ? 'bg-primary/10 text-primary' : ''}`}> <Grid2X2 className="h-4 w-4" /> <span>Divisions</span> </Link>
          </nav>
          {/* Avatar */}
          <div className="flex items-center justify-end basis-48">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" size="icon">
                  {avatarConfig && avatarConfig.sex ? (
                    <NiceAvatar style={{ width: 36, height: 36 }} {...avatarConfig} />
                  ) : (
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-primary/10">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Employee
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/history" className="cursor-pointer flex items-center">
                    <History className="mr-2 h-4 w-4" />
                    <span>Pickup History</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Mobile: burger left, logo center, avatar right */}
        <div className="flex md:hidden w-full items-center justify-between">
          {/* Burger menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 flex flex-col h-full w-64">
              <div className="flex flex-col gap-2 pt-8 px-4 pb-20">
                <Link href="/" className={`flex items-center gap-3 text-base font-semibold py-2 px-2 rounded-md hover:bg-muted/50 transition-colors ${pathname === '/' ? 'bg-primary/10 text-primary' : ''}`}> <Home className="h-4 w-4" /> Dashboard </Link>
                <Link href="/profile" className={`flex items-center gap-3 text-base font-semibold py-2 px-2 rounded-md hover:bg-muted/50 transition-colors ${pathname.startsWith('/profile') ? 'bg-primary/10 text-primary' : ''}`}> <User className="h-4 w-4" /> My Profile </Link>
                <Link href="/history" className={`flex items-center gap-3 text-base font-semibold py-2 px-2 rounded-md hover:bg-muted/50 transition-colors ${pathname.startsWith('/history') ? 'bg-primary/10 text-primary' : ''}`}> <History className="h-4 w-4" /> Pickup History </Link>
                <Link href="/divisions" className={`flex items-center gap-3 text-base font-semibold py-2 px-2 rounded-md hover:bg-muted/50 transition-colors ${pathname.startsWith('/divisions') ? 'bg-primary/10 text-primary' : ''}`}> <Grid2X2 className="h-4 w-4" /> Divisions </Link>
              </div>
              <div className="absolute bottom-0 left-0 w-full px-4 pb-6">
                <Button 
                  variant="destructive" 
                  size="lg"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          {/* Centered logo */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="text-lg font-bold text-primary">Rice Pickup</Link>
          </div>
          {/* Avatar right */}
          <div className="flex items-center gap-2 justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" size="icon">
                  {avatarConfig && avatarConfig.sex ? (
                    <NiceAvatar style={{ width: 36, height: 36 }} {...avatarConfig} />
                  ) : (
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-primary/10">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Employee
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/history" className="cursor-pointer flex items-center">
                    <History className="mr-2 h-4 w-4" />
                    <span>Pickup History</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
} 
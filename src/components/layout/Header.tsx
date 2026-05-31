import { Search, Bell, ArrowLeft, UserCircle, LogIn, Building2, ChevronDown } from 'lucide-react';
import logoImage from '@/assets/tl-logo.png';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveRole } from '@/contexts/ActiveRoleContext';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showBack?: boolean;
}

export function Header({ title = 'Toledo Connect', showSearch = false, showNotifications = false, showBack = false }: HeaderProps) {
  const navigate = useNavigate();
  const { user, isAdmin, isBusiness } = useAuth();
  const { activeView, setActiveView, businesses, activeBusiness } = useActiveRole();

  return (
    <header className="sticky top-0 z-40 safe-area-top">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-xl border-b border-border/50" />
      
      <div className="relative flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl hover:bg-muted" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {showBack && title ? (
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          ) : (
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={logoImage}
                alt="ToledoLokal"
                className="w-10 h-10 object-contain drop-shadow-[0_2px_8px_rgba(45,127,249,0.4)]"
              />
              <div className="leading-none">
                <h1 className="text-[17px] font-bold tracking-tight">
                  <span className="text-foreground">Toledo</span>
                  <span className="text-primary">Lokal</span>
                </h1>
              </div>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-secondary"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>
          )}

          {showNotifications && user && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-secondary relative"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
            </Button>
          )}

          {isAdmin && (
            <Link to="/admin">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs rounded-xl h-8 px-3 border-border/60 hover:bg-muted"
              >
                Admin
              </Button>
            </Link>
          )}

          {isBusiness && businesses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-xl h-8 px-3 border-border/60 hover:bg-muted gap-1"
                >
                  {activeBusiness ? (
                    <>
                      <Building2 className="h-3 w-3" />
                      <span className="max-w-[80px] truncate">{activeBusiness.name}</span>
                    </>
                  ) : (
                    'Personal'
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setActiveView('personal')}>
                  <UserCircle className="h-4 w-4 mr-2" />
                  Personal
                </DropdownMenuItem>
                {businesses.map(b => (
                  <DropdownMenuItem key={b.id} onClick={() => { setActiveView(b.id); navigate('/dashboard'); }}>
                    <Building2 className="h-4 w-4 mr-2" />
                    <span className="truncate">{b.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {isBusiness && businesses.length === 0 && (
            <Link to="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-xl h-8 px-3 border-border/60 hover:bg-muted"
              >
                Dashboard
              </Button>
            </Link>
          )}

          {user ? (
            <Link to="/profile">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl hover:bg-muted"
              >
                <UserCircle className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button 
                variant="default" 
                size="sm" 
                className="text-xs rounded-xl h-8 px-3 gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
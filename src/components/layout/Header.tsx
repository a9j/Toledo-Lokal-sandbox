import { Search, Bell, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showBack?: boolean;
}

export function Header({ title = 'Toledo Connect', showSearch = false, showNotifications = false, showBack = false }: HeaderProps) {
  const navigate = useNavigate();
  const { user, isAdmin, isBusiness } = useAuth();

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
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">
                Toledo<span className="text-primary">Lokal</span>
              </h1>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {showSearch && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl hover:bg-muted"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          {showNotifications && user && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl hover:bg-muted relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-lokal-amber border-2 border-background" />
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

          {isBusiness && (
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
        </div>
      </div>
    </header>
  );
}
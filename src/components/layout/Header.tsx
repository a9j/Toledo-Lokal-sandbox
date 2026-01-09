import { Search, Bell, ArrowLeft } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {showBack && title ? (
            <h1 className="text-lg font-semibold">{title}</h1>
          ) : (
            <h1 className="text-lg font-bold tracking-tight">Toledo<span className="text-primary">Connect</span></h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          {showNotifications && user && (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-5 w-5" />
            </Button>
          )}

          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="text-xs">
                Admin
              </Button>
            </Link>
          )}

          {isBusiness && (
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="text-xs">
                Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

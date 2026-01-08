import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
}

export function Header({ title = 'Toledo Hub', showSearch = false, showNotifications = false }: HeaderProps) {
  const { user, isAdmin, isBusiness } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
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

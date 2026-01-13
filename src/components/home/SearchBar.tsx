import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search businesses, deals, events..." }: SearchBarProps) {
  return (
    <div className="relative group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-13 pl-12 pr-4 rounded-2xl bg-card border border-border/40 text-base placeholder:text-muted-foreground/60 focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
      />
    </div>
  );
}
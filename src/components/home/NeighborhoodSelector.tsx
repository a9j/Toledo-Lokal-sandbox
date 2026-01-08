import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';

interface NeighborhoodSelectorProps {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function NeighborhoodSelector({ selected, onSelect }: NeighborhoodSelectorProps) {
  const { data: neighborhoods } = useNeighborhoods();
  
  const selectedNeighborhood = neighborhoods?.find(n => n.id === selected);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 rounded-full gap-2 px-4">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium">
            {selectedNeighborhood?.name || 'All Toledo'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => onSelect(null)}>
          All Toledo
        </DropdownMenuItem>
        {neighborhoods?.map((neighborhood) => (
          <DropdownMenuItem 
            key={neighborhood.id} 
            onClick={() => onSelect(neighborhood.id)}
          >
            {neighborhood.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

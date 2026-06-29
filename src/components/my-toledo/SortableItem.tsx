import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, MapPin, MessageSquare, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SecureImage } from '@/components/ui/secure-image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  id: string;
  item: {
    id: string;
    item_type: string;
    item_id: string;
    note: string | null;
    business?: {
      id: string;
      name: string;
      logo_url: string | null;
      description: string | null;
      category: { name: string } | null;
      neighborhood: { name: string } | null;
    };
  };
  onRemove: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
}

export function SortableItem({ id, item, onRemove, onUpdateNote }: SortableItemProps) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(item.note || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSaveNote = () => {
    onUpdateNote(item.id, noteValue);
    setIsEditingNote(false);
  };

  if (item.item_type !== 'business' || !item.business) {
    return null; // Only handling businesses for now
  }

  const business = item.business;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "card-elevated p-4 transition-all",
        isDragging && "opacity-50 shadow-xl z-50"
      )}
    >
      <div className="flex gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 touch-none cursor-grab active:cursor-grabbing p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {business.logo_url ? (
            <SecureImage
              storagePath={business.logo_url}
              alt={business.name}
              className="w-full h-full"
              imgClassName="object-contain"
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
              }
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link 
            to={`/business/${business.id}`}
            className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {business.name}
          </Link>
          
          {business.category && (
            <p className="text-sm text-muted-foreground">{business.category.name}</p>
          )}

          {business.neighborhood && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" />
              {business.neighborhood.name}
            </div>
          )}

          {/* Note */}
          {isEditingNote ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Add a personal note..."
                className="text-sm min-h-[60px]"
                maxLength={200}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNote}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingNote(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : item.note ? (
            <button
              onClick={() => setIsEditingNote(true)}
              className="mt-2 text-xs text-muted-foreground italic hover:text-foreground transition-colors text-left"
            >
              "{item.note}"
            </button>
          ) : (
            <button
              onClick={() => setIsEditingNote(true)}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-3 w-3" />
              Add note
            </button>
          )}
        </div>

        {/* Remove */}
        <button
          onClick={() => onRemove(item.id)}
          className="flex-shrink-0 p-1.5 -m-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useCity } from '@/contexts/CityContext';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useMyToledo } from '@/hooks/useMyToledo';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { SortableItem } from '@/components/my-toledo/SortableItem';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Heart, 
  Share2, 
  Globe, 
  Lock, 
  Copy, 
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';

export default function MyToledo() {
  const { city } = useCity();
  const { user } = useAuth();
  const { 
    savedItems, 
    isLoading, 
    collectionSettings,
    updateNote,
    reorderItems,
    togglePublic,
    removeItem
  } = useMyToledo();

  const [copied, setCopied] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = savedItems.findIndex(item => item.id === active.id);
      const newIndex = savedItems.findIndex(item => item.id === over.id);

      const newItems = arrayMove(savedItems, oldIndex, newIndex);
      
      // Update sort order
      const newOrder = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }));

      reorderItems.mutate(newOrder);
    }
  };

  const handleTogglePublic = () => {
    const newValue = !collectionSettings?.is_public;
    togglePublic.mutate(newValue);
  };

  const handleCopyLink = () => {
    if (collectionSettings?.public_slug) {
      const url = `${window.location.origin}/c/${collectionSettings.public_slug}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const publicUrl = collectionSettings?.public_slug 
    ? `${window.location.origin}/c/${collectionSettings.public_slug}`
    : null;

  return (
    <>
      <SEOHead
        title="My Toledo | ToledoLokal"
        description={`Your personal collection of favorite ${city.name} businesses`}
        url="/my-toledo"
      />
      <Header title={`My ${city.name}`} showBack />
      
      <PageContainer className="space-y-6">
        {/* Header Section */}
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Heart className="h-8 w-8 text-primary fill-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {collectionSettings?.collection_name || `My ${city.name}`}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {savedItems.length} {savedItems.length === 1 ? 'place' : 'places'} saved
          </p>
        </div>

        {/* Sharing Controls */}
        <div className="card-elevated p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {collectionSettings?.is_public ? (
                <Globe className="h-5 w-5 text-primary" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {collectionSettings?.is_public ? 'Public Collection' : 'Private Collection'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {collectionSettings?.is_public 
                    ? 'Anyone with the link can view' 
                    : 'Only you can see this'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={collectionSettings?.is_public || false}
              onCheckedChange={handleTogglePublic}
              disabled={togglePublic.isPending}
            />
          </div>

          {collectionSettings?.is_public && publicUrl && (
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground truncate">
                {publicUrl}
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        {/* Items List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : savedItems.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              Start your collection
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Save your favorite {city.name} spots to build your personal guide
            </p>
            <Link to="/discover">
              <Button>
                Discover Places
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={savedItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {savedItems.map(item => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    item={item}
                    onRemove={(id) => removeItem.mutate(id)}
                    onUpdateNote={(id, note) => updateNote.mutate({ itemId: id, note })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Tip */}
        {savedItems.length > 1 && (
          <p className="text-center text-xs text-muted-foreground">
            Drag items to reorder your collection
          </p>
        )}
      </PageContainer>
    </>
  );
}

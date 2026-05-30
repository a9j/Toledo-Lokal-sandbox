import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useProfileBlocks } from '@/hooks/useProfileBlocks';
import { BLOCK_LIBRARY, BlockType, REQUIRED_BLOCKS, PRESETS } from '@/lib/profile-blocks';

const BLOCK_META = Object.fromEntries(BLOCK_LIBRARY.map((b) => [b.type, b])) as Record<
  BlockType,
  (typeof BLOCK_LIBRARY)[number]
>;

interface RowProps {
  blockType: BlockType;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function BlockRow({ blockType, enabled, onToggle }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: blockType,
  });
  const meta = BLOCK_META[blockType];
  const isRequired = REQUIRED_BLOCKS.includes(blockType);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card p-3',
        isDragging && 'opacity-60 shadow-lg z-50',
        !enabled && 'opacity-70'
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${meta.label}`}
        className="flex-shrink-0 touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{meta.label}</span>
          {isRequired && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Always on
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{meta.description}</p>
      </div>

      <Switch
        checked={enabled}
        disabled={isRequired}
        onCheckedChange={onToggle}
        aria-label={`Toggle ${meta.label}`}
      />
    </div>
  );
}

export function ProfileLayoutManager({ businessId }: { businessId: string }) {
  const { data: blocks, isLoading, seedFromPreset, toggleBlock, reorderBlocks } =
    useProfileBlocks(businessId);
  const [order, setOrder] = useState<BlockType[]>([]);

  // Keep a local order for snappy drag, synced from the server.
  useEffect(() => {
    if (blocks) setOrder(blocks.map((b) => b.block_type));
  }, [blocks]);

  const enabledMap = useMemo(() => {
    const map: Partial<Record<BlockType, boolean>> = {};
    (blocks ?? []).forEach((b) => {
      map[b.block_type] = b.enabled;
    });
    return map;
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id as BlockType);
    const newIndex = order.indexOf(over.id as BlockType);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    reorderBlocks.mutate(next, {
      onError: () => toast.error('Could not save the new order.'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading layout…
      </div>
    );
  }

  // No blocks yet — let the owner start from a preset.
  if (!blocks || blocks.length === 0) {
    return (
      <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
        <p className="text-sm text-muted-foreground">
          Choose a starting layout for your profile. You can toggle and reorder blocks afterwards.
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.values(PRESETS).map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={seedFromPreset.isPending}
              onClick={() =>
                seedFromPreset.mutate(preset.id, {
                  onSuccess: () => toast.success(`Started from the ${preset.label} layout.`),
                  onError: () => toast.error('Could not set up the layout.'),
                })
              }
            >
              {seedFromPreset.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Profile layout</h3>
        <p className="text-xs text-muted-foreground">
          Drag to reorder. Toggle a block off to hide it from your public profile.
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order.map((blockType) => (
              <BlockRow
                key={blockType}
                blockType={blockType}
                enabled={enabledMap[blockType] ?? false}
                onToggle={(enabled) =>
                  toggleBlock.mutate(
                    { blockType, enabled },
                    { onError: () => toast.error('Could not update that block.') }
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

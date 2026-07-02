import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerMessages, type OwnerMessage } from '@/hooks/useOwnerMessages';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, MailOpen, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Messages() {
  const { user } = useAuth();
  const { messages, isLoading, markRead } = useOwnerMessages();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (msg: OwnerMessage) => {
    const next = expandedId === msg.id ? null : msg.id;
    setExpandedId(next);
    if (next && !msg.read_at) markRead(msg.id);
  };

  return (
    <>
      <SEOHead title="Messages | ToledoLokal" description="Messages from the ToledoLokal team" url="/messages" />
      <Header title="Messages" showBack />
      <PageContainer className="space-y-3">
        {!user ? (
          <p className="text-center text-muted-foreground py-12">Please sign in to view your messages.</p>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <Mail className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No messages yet.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOpen = expandedId === msg.id;
            const unread = !msg.read_at;
            return (
              <button
                key={msg.id}
                onClick={() => toggle(msg)}
                className={cn(
                  'w-full text-left card-elevated p-4 transition-colors',
                  unread ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/30',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {unread ? <Mail className="h-5 w-5 text-primary" /> : <MailOpen className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn('truncate', unread ? 'font-semibold' : 'font-medium')}>
                        {msg.subject || 'Message from ToledoLokal'}
                      </h3>
                      {msg.is_broadcast && (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground">
                          <Megaphone className="h-2.5 w-2.5" /> Announcement
                        </span>
                      )}
                    </div>
                    <p className={cn('text-sm text-muted-foreground mt-1', !isOpen && 'line-clamp-1')}>
                      {msg.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {format(new Date(msg.created_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </PageContainer>
    </>
  );
}

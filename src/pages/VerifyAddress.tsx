import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyHome, useAddressVerification } from '@/hooks/useMyCity';

const FAILURE_COPY: Record<string, string> = {
  no_code: 'That code has expired or was already used. Send a new one.',
  expired: 'That code has expired. Send a new one.',
  too_many_attempts: 'Too many tries. Send a new code and start again.',
  home_changed: 'Your address changed after we sent that code. Send a new one.',
};

/**
 * Lokal ID.
 *
 * Confirms a resident really lives at the address they picked, using a code we
 * email them. No document upload. The code never reaches the browser: the edge
 * function generates it, stores only a hash, and emails the plain text.
 */
export default function VerifyAddress() {
  const navigate = useNavigate();
  const { data: home, isLoading } = useMyHome();
  const { sendCode, confirmCode } = useAddressVerification();
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    sendCode.mutate(undefined, {
      onSuccess: (result) => {
        setSent(true);
        toast.success(`Code sent to ${result.sent_to}.`);
      },
      onError: (error: Error) =>
        toast.error(error.message || 'Could not send the code. Please try again.'),
    });
  };

  const handleConfirm = () => {
    confirmCode.mutate(code.trim(), {
      onSuccess: (result) => {
        if (result?.ok) {
          toast.success('Address verified.');
          navigate('/my-city');
          return;
        }
        if (result?.reason === 'wrong_code') {
          const left = result.attempts_left ?? 0;
          toast.error(
            left > 0
              ? `That code did not match. ${left} ${left === 1 ? 'try' : 'tries'} left.`
              : 'That code did not match.',
          );
          return;
        }
        toast.error(FAILURE_COPY[result?.reason ?? ''] ?? 'That did not work. Try again.');
        if (result?.reason && result.reason !== 'wrong_code') setSent(false);
      },
      onError: () => toast.error('Could not check that code. Please try again.'),
    });
  };

  if (isLoading) {
    return (
      <>
        <Header title="Verify address" showBack />
        <PageContainer>
          <Skeleton className="h-32 w-full rounded-xl" />
        </PageContainer>
      </>
    );
  }

  if (!home) {
    return (
      <>
        <Header title="Verify address" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <h1 className="font-heading text-lg font-semibold">Set your address first</h1>
            <Button asChild className="mt-5">
              <Link to="/my-city">Go to My City</Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  if (home.verified_at) {
    return (
      <>
        <Header title="Verify address" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-heading text-lg font-semibold">Address verified</h1>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              {home.address}
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link to="/my-city">Back to My City</Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Verify address" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Verify my address</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We email you a six digit code. No documents, no upload.
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Confirming</p>
          <p className="mt-1 text-sm font-semibold">{home.address}</p>
        </div>

        {!sent ? (
          <Button className="mt-4 w-full" onClick={handleSend} disabled={sendCode.isPending}>
            {sendCode.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-1.5 h-4 w-4" />
            )}
            Email me a code
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="Six digit code"
              className="text-center text-lg tracking-[0.4em]"
            />
            <Button
              className="w-full"
              onClick={handleConfirm}
              disabled={code.trim().length !== 6 || confirmCode.isPending}
            >
              {confirmCode.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={handleSend}
              disabled={sendCode.isPending}
            >
              Send another code
            </Button>
          </div>
        )}

        <p className="mt-5 text-xs leading-snug text-muted-foreground">
          The code works for 15 minutes. Verifying only confirms you live here. It does not
          share your address with anyone.
        </p>
      </PageContainer>
    </>
  );
}

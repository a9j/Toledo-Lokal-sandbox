import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { siteUrl } from '@/lib/site-url';
import { z } from 'zod';
import { Check, Circle, User, Building2, Mail } from 'lucide-react';
import tlLogo from '@/assets/tl-logo.png';

const SIGNUP_TYPES = [
  { value: 'resident', label: "I'm a Resident", icon: User, desc: 'Explore Toledo and earn rewards' },
  { value: 'business', label: "I'm a Business", icon: Building2, desc: 'List your business on Toledo Lokal' },
] as const;

type SignupType = (typeof SIGNUP_TYPES)[number]['value'];

const emailSchema = z.string().email('Please enter a valid email');

// Sign-up password rules. Kept in one place so the inline checklist and the
// submit-time validation can never drift apart.
const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'A number', test: (p) => /[0-9]/.test(p) },
  { label: 'A symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const isStrongPassword = (p: string) => PASSWORD_RULES.every((rule) => rule.test(p));

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [signupType, setSignupType] = useState<SignupType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showCheckEmail, setShowCheckEmail] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isHandlingNavRef = useRef(false);

  // A flow may stash where to return after auth (e.g. the Charter 100 join
  // resume). Honor it ahead of the default post-auth routing. Only same-origin
  // paths are allowed. sessionStorage covers same-tab; localStorage survives the
  // email-confirmation round trip in the same browser.
  const consumePostAuthRedirect = (): string | null => {
    const stored =
      sessionStorage.getItem('post_auth_redirect') ||
      localStorage.getItem('post_auth_redirect');
    if (stored) {
      sessionStorage.removeItem('post_auth_redirect');
      localStorage.removeItem('post_auth_redirect');
    }
    return stored && stored.startsWith('/') ? stored : null;
  };

  const navigateAfterAuth = async (userId: string, storedSignupType?: string | null) => {
    const effectiveType = storedSignupType || signupType || localStorage.getItem('signup_type');
    localStorage.removeItem('signup_type');

    if (effectiveType === 'resident' || effectiveType === 'business') {
      const { data: existing } = await supabase
        .from('pending_claims')
        .select('id')
        .eq('claimant_user_id', userId)
        .eq('status', 'pending')
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('pending_claims').insert({
          claimant_user_id: userId,
          claimed_role: effectiveType,
          verification_method: 'self_signup',
          status: 'pending',
        } as never);
      }
    }

    navigate('/', { replace: true });
  };

  // The email confirmation link redirects back here already signed in. If a
  // signup is pending in this browser, route the user to the right next step
  // (business → create-business, etc.); otherwise just send them home. This
  // also covers the case of an already-logged-in user landing on /auth.
  useEffect(() => {
    if (!user || isHandlingNavRef.current) return;
    isHandlingNavRef.current = true;
    const resume = consumePostAuthRedirect();
    if (resume) {
      navigate(resume, { replace: true });
      return;
    }
    const pendingSignupType = localStorage.getItem('signup_type');
    if (pendingSignupType) {
      navigateAfterAuth(user.id, pendingSignupType);
    } else {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (user) {
    return null;
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0]?.message;
    }

    if (isSignUp) {
      // New accounts must meet the full policy.
      if (!isStrongPassword(password)) {
        newErrors.password = 'Please meet all the password requirements below.';
      }
    } else if (password.length === 0) {
      // Sign-in only needs a non-empty password; existing accounts may predate
      // the stricter policy, so don't block them here.
      newErrors.password = 'Please enter your password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: 'Please enter your email address first' });
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Canonical domain, not window.location.origin — see src/lib/site-url.ts.
        redirectTo: siteUrl('/auth'),
      });
      
      if (error) throw error;
      
      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reset email',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: siteUrl('/auth') },
      });
      if (error) throw error;
      toast({
        title: 'Email resent',
        description: 'Check your inbox (and spam folder) for a new confirmation link.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not resend email. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isSignUp) {
        const chosenType = signupType || 'explorer';
        localStorage.setItem('signup_type', chosenType);
        const { error } = await signUp(email, password, name, chosenType);
        if (error) {
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('already exists')) {
            toast({
              variant: 'destructive',
              title: 'Account exists',
              description: 'This email is already registered. Please sign in instead.',
            });
          } else if (msg.includes('email') && msg.includes('invalid')) {
            toast({
              variant: 'destructive',
              title: 'Invalid email',
              description: 'Please enter a valid email address.',
            });
          } else if (msg.includes('password')) {
            toast({
              variant: 'destructive',
              title: 'Password issue',
              description: error.message,
            });
          } else if (msg.includes('security') || msg.includes('rate') || msg.includes('429')) {
            toast({
              variant: 'destructive',
              title: 'Too many attempts',
              description: 'Please wait a moment and try again.',
            });
          } else {
            console.error('Signup error:', error.message);
            toast({
              variant: 'destructive',
              title: 'Sign up failed',
              description: error.message || 'Could not create account. Please try again.',
            });
          }
        } else {
          setShowCheckEmail(true);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setFailedAttempts(prev => prev + 1);
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('invalid') || msg.includes('credentials')) {
            toast({
              variant: 'destructive',
              title: 'Invalid credentials',
              description: 'Please check your email and password.',
            });
          } else if (msg.includes('email not confirmed')) {
            toast({
              variant: 'destructive',
              title: 'Email not confirmed',
              description: 'Please check your inbox and confirm your email first.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Sign in failed',
              description: 'Could not sign in. Please try again.',
            });
          }
        } else {
          setFailedAttempts(0);
          navigate(consumePostAuthRedirect() ?? '/');
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showCheckEmail) {
    return (
      <div className="min-h-screen safe-area-pad-top flex flex-col items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-3">
            <img src={tlLogo} alt="ToledoLokal" className="h-20 w-auto mx-auto mb-2" />
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
            <p className="text-muted-foreground text-sm">
              We sent a confirmation link to <strong>{email}</strong>. Click the link
              in that email to verify your account and finish signing up.
            </p>
            <p className="text-muted-foreground text-xs">
              Can't find it? Check your spam/junk folder.
            </p>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={isLoading}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              {isLoading ? 'Sending...' : "Didn't get the link? Resend"}
            </button>
            <br />
            <button
              type="button"
              onClick={() => { setShowCheckEmail(false); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen safe-area-pad-top flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <img
            src={tlLogo}
            alt="ToledoLokal"
            className="h-20 w-auto mx-auto mb-2"
          />
          <h1 className="text-2xl font-bold tracking-tight">ToledoLokal</h1>
          <p className="text-muted-foreground text-sm">
            {isSignUp ? 'Create your account to get started' : 'Welcome back'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SIGNUP_TYPES.map((t) => {
                    const Icon = t.icon;
                    const active = signupType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setSignupType(t.value)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${
                          active
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-semibold leading-tight">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(prev => ({ ...prev, email: undefined }));
              }}
              className={`h-12 rounded-xl ${errors.email ? 'border-destructive' : ''}`}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors(prev => ({ ...prev, password: undefined }));
              }}
              className={`h-12 rounded-xl ${errors.password ? 'border-destructive' : ''}`}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
            {isSignUp && (
              <ul className="space-y-1 pt-1">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li
                      key={rule.label}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        met ? 'text-emerald-600' : 'text-muted-foreground'
                      }`}
                    >
                      {met ? (
                        <Check className="h-3.5 w-3.5 flex-shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                      )}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        {/* Forgot Password - shows after 3 failed attempts */}
        {!isSignUp && failedAttempts >= 3 && (
          <div className="text-center animate-in fade-in slide-in-from-top-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isResettingPassword}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              {isResettingPassword ? 'Sending...' : 'Forgot your password?'}
            </button>
          </div>
        )}

        {/* Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrors({});
              setFailedAttempts(0);
              setSignupType(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        {isSignUp && (
          <p className="text-center text-xs text-muted-foreground">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link> and{' '}
            <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
        )}
      </div>
    </div>
  );
}

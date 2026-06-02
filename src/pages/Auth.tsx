import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { siteUrl } from '@/lib/site-url';
import { z } from 'zod';
import { Check, Circle, Compass, Building2, Truck } from 'lucide-react';
import tlLogo from '@/assets/tl-logo.png';

const SIGNUP_TYPES = [
  { value: 'explorer', label: 'Toledo Explorer', icon: Compass, desc: 'Find local spots & earn rewards' },
  { value: 'business', label: 'Business', icon: Building2, desc: 'List your business on ToledoLokal' },
  { value: 'food_truck', label: 'Food Truck', icon: Truck, desc: 'Get your food truck discovered' },
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
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isHandlingNavRef = useRef(false);

  const navigateAfterAuth = async (userId: string, storedSignupType?: string | null) => {
    const effectiveType = storedSignupType || signupType || 'explorer';
    if (effectiveType === 'business' || effectiveType === 'food_truck') {
      await supabase.from('profiles').upsert(
        {
          user_id: userId,
          name: (await supabase.auth.getUser()).data.user?.user_metadata?.name || email,
          role_selected: true,
          profile_completed: true,
        } as any,
        { onConflict: 'user_id' },
      );
      navigate('/create-business', { replace: true });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role_selected')
      .eq('user_id', userId)
      .single();
    if (profile && !profile.role_selected) {
      navigate('/role-select', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // Redirect if already logged in (skip if we're handling navigation ourselves)
  if (user && !isHandlingNavRef.current) {
    navigate('/', { replace: true });
    return null;
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
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

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) return;
    setIsVerifyingOtp(true);
    isHandlingNavRef.current = true;
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: 'signup',
      });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Invalid code',
          description: 'Please check the code and try again, or request a new one.',
        });
      } else {
        toast({ title: 'Email confirmed!' });
        const { data: { user: confirmedUser } } = await supabase.auth.getUser();
        if (confirmedUser) {
          await navigateAfterAuth(confirmedUser.id, confirmedUser.user_metadata?.signup_type);
        } else {
          navigate('/');
        }
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not verify code. Please try again.',
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: siteUrl('/') },
      });
      if (error) throw error;
      toast({
        title: 'Email resent',
        description: 'Check your inbox (and spam folder) for a new code.',
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
        const { error } = await signUp(email, password, name, signupType || 'explorer');
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
          setShowOtpScreen(true);
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
          navigate('/');
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

  if (showOtpScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <img src={tlLogo} alt="ToledoLokal" className="h-20 w-auto mx-auto mb-2" />
            <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
            <p className="text-muted-foreground text-sm">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <p className="text-muted-foreground text-xs">
              Check your spam/junk folder if you don't see it
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Confirmation code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-14 rounded-xl text-center text-2xl tracking-[0.3em] font-mono"
                maxLength={6}
              />
            </div>

            <Button
              onClick={handleVerifyOtp}
              className="w-full h-12 rounded-xl text-base font-medium"
              disabled={otpCode.length < 6 || isVerifyingOtp}
            >
              {isVerifyingOtp ? 'Verifying...' : 'Confirm Email'}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={isLoading}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              {isLoading ? 'Sending...' : "Didn't get the code? Resend"}
            </button>
            <br />
            <button
              type="button"
              onClick={() => { setShowOtpScreen(false); setOtpCode(''); }}
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
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
            {isSignUp ? 'Sign up with your business email for faster approval' : 'Welcome back'}
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
                <div className="grid grid-cols-3 gap-2">
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
      </div>
    </div>
  );
}

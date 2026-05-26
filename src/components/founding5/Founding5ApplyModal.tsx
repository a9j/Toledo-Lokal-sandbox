import { useState } from 'react';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FOUNDING_CATEGORY_OPTIONS, FoundingCategory } from './types';

interface Founding5ApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  neighborhood: string;
  category: FoundingCategory | '';
  whyUs: string;
}

const EMPTY_FORM: FormState = {
  businessName: '',
  ownerName: '',
  email: '',
  phone: '',
  neighborhood: '',
  category: '',
  whyUs: '',
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function Founding5ApplyModal({ open, onOpenChange }: Founding5ApplyModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      // Reset after the close animation so the form does not flicker.
      window.setTimeout(() => {
        setForm(EMPTY_FORM);
        setSubmitted(false);
        setSubmitting(false);
      }, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName.trim() || !form.ownerName.trim() || !form.email.trim()) {
      toast.error('Please add your business name, your name, and an email.');
      return;
    }
    if (!isValidEmail(form.email.trim())) {
      toast.error('That email does not look right. Please check it.');
      return;
    }
    if (!form.category) {
      toast.error('Please pick a category.');
      return;
    }

    setSubmitting(true);
    // Step 4 wires this to the founding_5_applications table and the email
    // notification. For now it simulates a successful submit.
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-border/60 max-h-[92vh] overflow-y-auto">
        {submitted ? (
          <div className="flex flex-col items-center text-center px-8 py-14">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-6">
              <Check className="h-8 w-8 text-emerald-500" strokeWidth={2.5} />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Got it.</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed max-w-xs">
              Anthony will reach out within 48 hours.
            </p>
            <Button
              onClick={() => handleOpenChange(false)}
              className="mt-8 rounded-full px-8 h-11"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-7 py-8 space-y-5">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-display text-2xl font-semibold tracking-tight">
                Apply to the Founding 5
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed">
                Tell us about your spot. We read every one.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="f5-business">Business name</Label>
                <Input
                  id="f5-business"
                  value={form.businessName}
                  onChange={(e) => update('businessName', e.target.value)}
                  placeholder="The Flying Joe"
                  autoComplete="organization"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="f5-owner">Your name</Label>
                  <Input
                    id="f5-owner"
                    value={form.ownerName}
                    onChange={(e) => update('ownerName', e.target.value)}
                    placeholder="Jordan Smith"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f5-neighborhood">Neighborhood</Label>
                  <Input
                    id="f5-neighborhood"
                    value={form.neighborhood}
                    onChange={(e) => update('neighborhood', e.target.value)}
                    placeholder="Old West End"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="f5-email">Email</Label>
                  <Input
                    id="f5-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f5-phone">Phone</Label>
                  <Input
                    id="f5-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="(419) 555-0123"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f5-category">What kind of spot is it?</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => update('category', v as FoundingCategory)}
                >
                  <SelectTrigger id="f5-category">
                    <SelectValue placeholder="Pick one" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOUNDING_CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f5-why">Why you?</Label>
                <Textarea
                  id="f5-why"
                  value={form.whyUs}
                  onChange={(e) => update('whyUs', e.target.value)}
                  placeholder="Tell us what makes your place a Toledo original."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full h-12 text-base"
            >
              {submitting ? 'Sending...' : 'Send application'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

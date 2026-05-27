import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import tlLogo from '@/assets/tl-logo.png';

interface SpecRow {
  label: string;
  value: string;
}

function SpecCard({
  title,
  rows,
  tip,
  highlight,
}: {
  title: string;
  rows: SpecRow[];
  tip: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlight ? 'border-amber-200 bg-amber-50/40' : 'border-gray-100'
      }`}
    >
      <h4 className="mb-4 text-lg font-semibold text-gray-900">{title}</h4>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between border-b border-gray-100 py-1.5 last:border-0">
            <span className="text-xs uppercase tracking-wider text-gray-400">{r.label}</span>
            <span className="text-sm font-medium text-gray-700">{r.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-gray-500">{tip}</p>
    </div>
  );
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-8 flex items-baseline gap-4">
      <span className="font-mono text-sm text-gray-300">{number}</span>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h2>
    </div>
  );
}

export default function BusinessImageGuide() {
  useEffect(() => {
    document.title = 'Toledo Lokal - Business Image Guide';
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <div className="print:hidden fixed right-6 top-6 z-50">
        <Button
          onClick={() => window.print()}
          variant="outline"
          className="rounded-full border-gray-200 bg-white/80 px-5 py-2.5 text-sm font-medium shadow-sm backdrop-blur-md hover:bg-gray-50"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="mx-auto max-w-[8.5in] bg-white px-8 print:max-w-none print:p-0">
        {/* Cover */}
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center print:break-after-page">
          <img src={tlLogo} alt="Toledo Lokal" className="mb-10 h-14" />
          <h1 className="mb-3 text-5xl font-bold tracking-tight text-gray-900">Business Image Guide</h1>
          <p className="max-w-md text-lg font-light leading-relaxed text-gray-400">
            How to upload photos that look great and load fast. Logos, covers, and everything in between.
          </p>
        </div>

        {/* 01 What to prepare */}
        <div className="py-14 print:break-after-page">
          <SectionHeader number="01" title="What to get ready" />
          <p className="mb-8 leading-relaxed text-gray-500">
            Save these on your phone or computer before you start. You will move much faster.
          </p>
          <ol className="space-y-4 text-gray-600">
            <li>
              <strong className="text-gray-900">Your logo.</strong> A square image, at least 800 by 800 pixels. A
              PNG with a see-through background looks best.
            </li>
            <li>
              <strong className="text-gray-900">One great cover photo.</strong> A wide shot of your storefront,
              your food, your team, or your work. At least 2400 pixels wide.
            </li>
            <li>
              <strong className="text-gray-900">A few gallery photos.</strong> Up to 10. Square shots look cleanest.
              iPhone photos are fine.
            </li>
          </ol>
        </div>

        {/* 02 Exact specs */}
        <div className="py-14 print:break-after-page">
          <SectionHeader number="02" title="Exact image specs" />
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <SpecCard
              title="Logo"
              rows={[
                { label: 'Recommended', value: '800 × 800 px' },
                { label: 'Minimum', value: '400 × 400 px' },
                { label: 'Aspect Ratio', value: '1:1 (Square)' },
                { label: 'Max Size', value: '5 MB' },
                { label: 'Formats', value: 'JPG, PNG, WebP, HEIC' },
              ]}
              tip="Use a clean, high-contrast logo. Skip tiny text, it blurs at small sizes. A transparent PNG works best."
            />
            <SpecCard
              title="Cover photo"
              highlight
              rows={[
                { label: 'Recommended', value: '2400 × 800 px' },
                { label: 'Minimum', value: '1200 × 400 px' },
                { label: 'Aspect Ratio', value: '3:1 (Wide)' },
                { label: 'Max Size', value: '5 MB' },
                { label: 'Formats', value: 'JPG, PNG, WebP, HEIC' },
              ]}
              tip="This is the big banner at the top of your page. Show your space, your work, or your team. One strong photo beats a busy collage."
            />
            <SpecCard
              title="Gallery photos"
              rows={[
                { label: 'Recommended', value: '1080 × 1080 px' },
                { label: 'Max Photos', value: 'Up to 10' },
                { label: 'Aspect Ratio', value: 'Any' },
                { label: 'Max Size', value: '5 MB each' },
                { label: 'Formats', value: 'JPG, PNG, WebP, GIF, HEIC' },
              ]}
              tip="Show real moments. Products, people, your space. These appear in your photo gallery."
            />
            <SpecCard
              title="Owner photo (Founding 5)"
              rows={[
                { label: 'Recommended', value: '800 × 800 px' },
                { label: 'Aspect Ratio', value: '1:1 (Square)' },
                { label: 'Max Size', value: '5 MB' },
                { label: 'Formats', value: 'JPG, PNG, WebP, HEIC' },
                { label: 'Shows as', value: 'Round avatar' },
              ]}
              tip="A friendly headshot of the owner. Used on the Founding 5 card. Our team can add this for you."
            />
          </div>
        </div>

        {/* 03 How it works */}
        <div className="py-14 print:break-after-page">
          <SectionHeader number="03" title="How uploads work" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-sm font-medium text-gray-900">iPhone photos just work</p>
              <p className="text-sm text-gray-500">
                HEIC photos are turned into JPG for you. No extra steps.
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-sm font-medium text-gray-900">Auto-optimized</p>
              <p className="text-sm text-gray-500">
                Every image is compressed for fast loading. Upload the full-size original.
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-sm font-medium text-gray-900">Nothing gets stretched</p>
              <p className="text-sm text-gray-500">
                You crop and zoom each image to fit, so it is never squished out of shape.
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-sm font-medium text-gray-900">Bigger is better</p>
              <p className="text-sm text-gray-500">
                We shrink large photos but never blow up small ones. Start with the sharpest file you have.
              </p>
            </div>
          </div>
        </div>

        {/* 04 Signup steps */}
        <div className="py-14 print:break-after-page">
          <SectionHeader number="04" title="Signing up, step by step" />
          <ol className="space-y-5 text-gray-600">
            <li>
              <strong className="text-gray-900">1. Create your account.</strong> Sign up, confirm your email, and
              choose the business role.
            </li>
            <li>
              <strong className="text-gray-900">2. Start your business profile.</strong> Enter your business name.
            </li>
            <li>
              <strong className="text-gray-900">3. Add your location.</strong> Enter your address. Add more than one
              if you have multiple spots, then pick your main one.
            </li>
            <li>
              <strong className="text-gray-900">4. The Look.</strong> Tap "Upload logo," frame it in the circle, and
              confirm. Then tap "Upload cover image" and frame your wide banner. You can replace either one later.
            </li>
            <li>
              <strong className="text-gray-900">5. Hours and contact.</strong> Add your hours, phone, website, and
              social links.
            </li>
            <li>
              <strong className="text-gray-900">6. Finish.</strong> Submit for a quick review. Once you are live, add
              gallery photos and edit anything from your dashboard.
            </li>
          </ol>
        </div>

        {/* 05 Tips */}
        <div className="py-14">
          <SectionHeader number="05" title="Tips for great photos" />
          <ul className="space-y-3 text-gray-600">
            <li>Shoot in good light and hold the phone level.</li>
            <li>Fill the frame with your subject.</li>
            <li>Skip heavy filters. Real and clear beats over-edited.</li>
            <li>For your logo, simple and bold reads best.</li>
            <li>For your cover, pick the one photo that says the most about you.</li>
          </ul>
          <p className="mt-10 text-sm text-gray-400">
            Need a hand? Reply to your welcome email and our team will help you set up your images.
          </p>
        </div>
      </div>
    </div>
  );
}

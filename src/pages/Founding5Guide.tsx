import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import tlLogo from '@/assets/tl-logo.png';

export default function Founding5Guide() {
  useEffect(() => {
    document.title = 'Toledo Lokal - Founding 5 Welcome Guide';
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* Print Controls */}
      <div className="print:hidden fixed top-[calc(env(safe-area-inset-top,0px)+1.5rem)] right-6 z-50">
        <Button
          onClick={handlePrint}
          variant="outline"
          className="rounded-full px-5 py-2.5 text-sm font-medium shadow-sm border-gray-200 bg-white/80 backdrop-blur-md hover:bg-gray-50"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="max-w-[8.5in] mx-auto bg-white px-8 py-0 print:p-0 print:max-w-none">

        {/* ===== COVER PAGE ===== */}
        <div className="min-h-[10in] flex flex-col items-center justify-center text-center print:break-after-page">
          <img src={tlLogo} alt="Toledo Lokal" className="h-16 mb-10" />

          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-lg shadow-amber-500/20">
            <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">★</span>
            </div>
            <span className="text-white font-bold tracking-[0.2em] uppercase text-[11px]">Founding 5 Member</span>
            <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">★</span>
            </div>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
            Welcome Guide
          </h1>
          <p className="text-lg text-gray-400 mb-16 max-w-sm leading-relaxed font-light">
            Your exclusive setup manual &amp; complete feature overview
          </p>

          <div className="w-12 h-px bg-gray-200 mb-16" />

          <p className="text-gray-300 text-xs tracking-wide uppercase">
            Version 1.0 &middot; February 2026
          </p>
          <p className="text-gray-300 text-[10px] mt-1 tracking-wide">
            Exclusively for Founding 5 business partners
          </p>
        </div>

        {/* ===== TABLE OF CONTENTS ===== */}
        <div className="py-16 print:break-after-page">
          <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-3">Contents</p>
          <h2 className="text-3xl font-bold mb-10 text-gray-900 tracking-tight">Table of Contents</h2>
          <div className="space-y-0">
            {[
              ['What is Founding 5?', '01'],
              ['Setting Up Your Account', '02'],
              ['Image Requirements', '03'],
              ['Your Free-Forever Features', '04'],
              ['Loop Lokal Rewards', '05'],
              ['Getting the Most Out of Toledo Lokal', '06'],
            ].map(([title, page], i) => (
              <div key={title} className="flex items-baseline justify-between py-3.5 border-b border-gray-100 group">
                <div className="flex items-baseline gap-4">
                  <span className="text-sm text-gray-300 font-mono">{page}</span>
                  <span className="text-base text-gray-700 group-hover:text-gray-900 transition-colors">{title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SECTION 1: WHAT IS FOUNDING 5 ===== */}
        <div className="py-16 print:break-after-page">
          <SectionHeader number="01" title="What is Founding 5?" />

          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-8 mb-10">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              You are one of five.
            </h3>
            <p className="text-gray-600 leading-relaxed">
              The Founding 5 are the first five businesses hand-selected to launch alongside Toledo Lokal.
              This is not a subscription tier — it's a <strong className="text-gray-900">permanent, top-tier status</strong> that
              recognizes your role in building Toledo's local business ecosystem from day one.
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-6 text-gray-900">What makes Founding 5 different?</h3>
          <div className="grid gap-4">
            <FeatureRow
              title="Permanent Premium Badge"
              description="A distinctive 'FOUNDING 5' badge on your profile that never expires and cannot be purchased."
            />
            <FeatureRow
              title="All Features Free, Forever"
              description="Every feature on the platform — including those in our $150/month Anchor Partner tier — is yours at no cost. Forever."
            />
            <FeatureRow
              title="Priority Visibility"
              description="Featured placement in search results, the homepage, and community sections."
            />
            <FeatureRow
              title="Legacy Status"
              description="As Toledo Lokal grows, your Founding 5 status grows with it. Every new feature is automatically unlocked for you."
            />
          </div>
        </div>

        {/* ===== SECTION 2: ACCOUNT SETUP ===== */}
        <div className="py-16 print:break-after-page">
          <SectionHeader number="02" title="Setting Up Your Account" />

          <StepGroup title="Step 1 — Create Your Account">
            <ol className="list-decimal list-inside space-y-3 text-gray-600">
              <li>Visit <strong className="text-gray-900">toledolokal.com</strong></li>
              <li>Tap <strong className="text-gray-900">"Sign In"</strong> in the top right corner</li>
              <li>Choose <strong className="text-gray-900">"Sign Up"</strong> and enter your email address</li>
              <li>Check your email for a <strong className="text-gray-900">verification link</strong></li>
              <li>Click the link to verify — you're in</li>
            </ol>
          </StepGroup>

          <StepGroup title="Step 2 — Create Your Business Profile">
            <ol className="list-decimal list-inside space-y-3 text-gray-600">
              <li>After signing in, go to your <strong className="text-gray-900">Dashboard</strong></li>
              <li>Click <strong className="text-gray-900">"Create Business"</strong></li>
              <li>Fill in your business name and select a category</li>
              <li>Add your address, phone number, and website</li>
              <li>Upload your <strong className="text-gray-900">logo</strong> and <strong className="text-gray-900">cover photo</strong> (see size guide on next page)</li>
              <li>Write a compelling description — this is what customers see first</li>
              <li>Set your business hours for each day of the week</li>
              <li>Submit for review — our team will activate your Founding 5 badge</li>
            </ol>
          </StepGroup>

          <Callout>
            Complete profiles get <strong>3x more engagement</strong>. Fill out every section — description, story, hours, photos — for maximum visibility.
          </Callout>

          <StepGroup title="Step 3 — Add Your Social Links">
            <p className="text-gray-500 mb-4 text-sm">Help customers find you everywhere.</p>
            <div className="grid grid-cols-2 gap-2">
              {['Website URL', 'Instagram handle', 'Facebook page', 'TikTok profile'].map(link => (
                <div key={link} className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  {link}
                </div>
              ))}
            </div>
          </StepGroup>
        </div>

        {/* ===== SECTION 3: IMAGE REQUIREMENTS ===== */}
        <div className="py-16 print:break-after-page">
          <SectionHeader number="03" title="Image Requirements" />

          <p className="text-gray-500 mb-10 leading-relaxed">
            High-quality images make your profile stand out. Here are the exact specifications for each image type.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <ImageSpec
              title="Logo"
              specs={[
                ['Recommended', '800 × 800 px'],
                ['Minimum', '400 × 400 px'],
                ['Aspect Ratio', '1:1 (Square)'],
                ['Max Size', '5 MB'],
                ['Formats', 'JPG, PNG, WebP, HEIC'],
              ]}
              tip="Use a clean, high-contrast logo. Avoid text-heavy designs, they become unreadable at small sizes. Transparent PNG works best."
            />
            <ImageSpec
              title="Cover Photo"
              highlight
              specs={[
                ['Recommended', '2400 × 800 px'],
                ['Minimum', '1200 × 400 px'],
                ['Aspect Ratio', '3:1 (Wide)'],
                ['Max Size', '5 MB'],
                ['Formats', 'JPG, PNG, WebP, HEIC'],
              ]}
              tip="Show your storefront, products, or team. This is the hero image on your profile, make it count."
            />
          </div>

          <div className="border border-gray-100 rounded-2xl p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Gallery Photos</h4>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Recommended</p>
                <p className="text-gray-700">1080 × 1080 px</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Max Photos</p>
                <p className="text-gray-700">Up to 10 images</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Formats</p>
                <p className="text-gray-700">JPG, PNG, WebP, HEIC</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-gray-900 text-sm mb-1">iPhone Users</p>
              <p className="text-gray-500 text-sm">HEIC photos are automatically converted to JPG. No extra steps needed.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-gray-900 text-sm mb-1">Auto-Optimized</p>
              <p className="text-gray-500 text-sm">All images are automatically compressed for fast loading. Upload full quality.</p>
            </div>
          </div>
        </div>

        {/* ===== SECTION 4: FREE-FOREVER FEATURES ===== */}
        <div className="py-16 print:break-after-page">
          <SectionHeader number="04" title="Your Free-Forever Features" />

          <div className="bg-gradient-to-br from-amber-50/60 to-white border border-amber-100 rounded-2xl p-8 mb-10">
            <p className="text-base text-gray-700 leading-relaxed mb-2">
              As a Founding 5 member, you receive <strong className="text-gray-900">every feature</strong> on Toledo Lokal — equivalent to our
              <strong className="text-gray-900"> Anchor Partner tier ($150/month)</strong> — completely free, forever.
            </p>
            <p className="text-sm text-gray-400">
              This includes all current features and every future feature we add to the platform.
            </p>
          </div>

          <div className="space-y-4">
            <FeatureCategory title="Profile & Visibility">
              <Feature text="Premium business listing with full profile" />
              <Feature text="Permanent 'FOUNDING 5' gold badge" />
              <Feature text="Featured placement on homepage & search" />
              <Feature text="'Locally Owned' and 'Active This Week' trust badges" />
              <Feature text="Priority in neighborhood listings" />
            </FeatureCategory>

            <FeatureCategory title="Deals & Events">
              <Feature text="Unlimited active deals" />
              <Feature text="Create & post events" />
              <Feature text="Featured deal placement" />
              <Feature text="Event analytics" />
            </FeatureCategory>

            <FeatureCategory title="Community & Events">
              <Feature text="Post and promote community events" />
              <Feature text="Featured event placement" />
              <Feature text="Event analytics & RSVP tracking" />
              <Feature text="Priority visibility in event feeds" />
            </FeatureCategory>

            <FeatureCategory title="Pulse (Community Updates)">
              <Feature text="Unlimited Pulse posts per day" />
              <Feature text="Photo & video support" />
              <Feature text="Pinned posts capability" />
            </FeatureCategory>

            <FeatureCategory title="Loop Lokal Rewards">
              <Feature text="Full Loop Pro access (5,000 points/month)" />
              <Feature text="Custom QR codes for check-ins" />
              <Feature text="Reward creation & management" />
              <Feature text="Customer loyalty analytics" />
            </FeatureCategory>

            <FeatureCategory title="Analytics & Tools">
              <Feature text="Full analytics dashboard" />
              <Feature text="Lead management" />
              <Feature text="Staff accounts (Owner, Manager, Staff roles)" />
              <Feature text="Content boost capabilities" />
            </FeatureCategory>
          </div>
        </div>

        {/* ===== SECTION 5: LOOP LOKAL ===== */}
        <div className="py-16 print:break-after-page">
          <SectionHeader number="05" title="Loop Lokal Rewards" />

          <p className="text-gray-500 mb-10 leading-relaxed">
            Loop Lokal is Toledo Lokal's built-in loyalty program. As a Founding 5 member,
            you get the full <strong className="text-gray-900">Loop Pro</strong> tier — our most powerful rewards package.
          </p>

          <div className="bg-gradient-to-br from-amber-50/60 to-white border border-amber-100 rounded-2xl p-8 mb-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Points Beyond Your Business</h3>
            <p className="text-gray-600 leading-relaxed mb-3">
              Loop Lokal points aren't limited to in-store rewards. Customers can also use their points for:
            </p>
            <ul className="space-y-2.5">
              {[
                'City-wide special events and festivals hosted on Toledo Lokal',
                'Exclusive seasonal occasions and community celebrations',
                'Cross-business promotions and collaborative rewards',
                'Priority access to limited-capacity local experiences',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-gray-600 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-400 mt-4">
              This means more foot traffic for you — customers earning points at your business can redeem them across the entire Toledo Lokal ecosystem.
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-6 text-gray-900">How It Works</h3>
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[
              { step: '1', title: 'Customer Visits', desc: 'They scan your QR code at checkout' },
              { step: '2', title: 'Points Earned', desc: 'You choose how many points per visit' },
              { step: '3', title: 'Rewards Redeemed', desc: 'Customers redeem points for your rewards' },
            ].map(item => (
              <div key={item.step} className="text-center p-5 rounded-2xl bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center mx-auto mb-4 text-sm font-medium">
                  {item.step}
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold mb-5 text-gray-900">Your Loop Pro Includes</h3>
          <ul className="space-y-3">
            {[
              '5,000 points to distribute per month',
              'Custom-branded QR codes',
              'Create unlimited rewards',
              'Staff-confirmed scans for security',
              'Analytics on customer visits & redemptions',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-gray-600 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* ===== SECTION 6: GETTING THE MOST ===== */}
        <div className="py-16 print:break-after-page">
          <SectionHeader number="06" title="Getting the Most Out of Toledo Lokal" />

          <div className="space-y-6">
            {[
              { title: 'Complete Your Profile 100%', desc: 'Add your logo, cover photo, gallery images, hours, description, story, and all social links. Complete profiles get significantly more engagement.' },
              { title: 'Post on Pulse Regularly', desc: 'Share updates, behind-the-scenes content, and specials. Businesses that post weekly see 4x more profile visits.' },
              { title: 'Create Deals & Events', desc: 'Active deals and events appear prominently in the app. They drive foot traffic and engagement.' },
              { title: 'Set Up Loop Rewards', desc: 'Print your QR code and display it at your counter. Customers love earning points — and they come back more often.' },
              { title: 'Invite Your Staff', desc: 'Add managers and staff to help manage your profile, confirm Loop scans, and respond to leads.' },
            ].map((item, i) => (
              <div key={item.title} className="flex gap-5">
                <div className="w-px bg-gray-200 flex-shrink-0 mt-1" style={{ minHeight: '3rem' }} />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 mt-14 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-500 text-sm mb-4">
              Our team is here to support you every step of the way.
            </p>
            <p className="text-gray-400 text-sm">
              Email us at <strong className="text-gray-700">support@toledolokal.com</strong>
            </p>
          </div>
        </div>

        {/* ===== BACK COVER ===== */}
        <div className="min-h-[10in] flex flex-col items-center justify-center text-center">
          <img src={tlLogo} alt="Toledo Lokal" className="h-12 mb-8 opacity-60" />

          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-lg shadow-amber-500/20">
            <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">★</span>
            </div>
            <span className="text-white font-bold tracking-[0.2em] uppercase text-[11px]">Founding 5</span>
            <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">★</span>
            </div>
          </div>

          <p className="text-lg text-gray-300 max-w-xs leading-relaxed font-light">
            Thank you for believing in local.<br />
            You are the foundation.
          </p>
        </div>

      </div>
    </div>
  );
}

/* ===== Sub-components ===== */

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 font-mono">{number}</p>
      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h2>
    </div>
  );
}

function StepGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border-l-2 border-gray-900 p-5 mb-10 rounded-r-xl">
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
}

function ImageSpec({
  title,
  specs,
  tip,
  highlight,
}: {
  title: string;
  specs: [string, string][];
  tip: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-6 border ${highlight ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}>
      <h4 className="text-lg font-semibold text-gray-900 mb-5">{title}</h4>
      <div className="space-y-3 text-sm">
        {specs.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-gray-400">{label}</span>
            <span className="text-gray-700 font-medium">{value}</span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-gray-400 leading-relaxed">{tip}</p>
    </div>
  );
}

function FeatureRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-5 bg-gray-50 rounded-xl">
      <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCategory({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <div className="bg-gray-900 px-5 py-3">
        <h4 className="font-medium text-white text-sm">{title}</h4>
      </div>
      <div className="p-5 space-y-2.5">{children}</div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-gray-600">
      <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
      {text}
    </div>
  );
}

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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Print Controls */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <Button onClick={handlePrint} className="shadow-lg">
          <Printer className="h-4 w-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="max-w-[8.5in] mx-auto bg-white p-8 print:p-0 print:max-w-none">

        {/* ===== COVER PAGE ===== */}
        <div className="min-h-[10in] flex flex-col items-center justify-center text-center print:break-after-page relative overflow-hidden">
          {/* Decorative gold accent lines */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
          <div className="absolute top-2 left-0 w-full h-px bg-amber-300/50" />
          <div className="absolute bottom-2 left-0 w-full h-px bg-amber-300/50" />

          <img src={tlLogo} alt="Toledo Lokal" className="h-20 mb-6" />

          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-50 border border-amber-200 mb-6">
            <span className="text-amber-600 text-lg">★</span>
            <span className="text-amber-800 font-semibold tracking-wide uppercase text-sm">Founding 5 Member</span>
            <span className="text-amber-600 text-lg">★</span>
          </div>

          <h1 className="text-5xl font-bold text-[hsl(218,55%,28%)] mb-4 leading-tight">
            Welcome Guide
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-md">
            Your exclusive setup manual & complete feature overview
          </p>

          <div className="w-24 h-0.5 bg-amber-400 rounded-full mb-10" />

          <p className="text-gray-400 text-sm">
            Version 1.0 • February 2026
          </p>
          <p className="text-gray-400 text-xs mt-1">
            This guide is exclusively for Founding 5 business partners
          </p>
        </div>

        {/* ===== TABLE OF CONTENTS ===== */}
        <div className="py-12 print:break-after-page">
          <h2 className="text-3xl font-bold mb-8 text-[hsl(218,55%,28%)]">Table of Contents</h2>
          <div className="space-y-3 text-lg">
            {[
              ['1. What is Founding 5?', '3'],
              ['2. Setting Up Your Account', '4'],
              ['3. Image Requirements', '5'],
              ['4. Your Free-Forever Features', '6'],
              ['5. Loop Lokal Rewards', '8'],
              ['6. Getting the Most Out of Toledo Lokal', '9'],
            ].map(([title, page]) => (
              <div key={title} className="flex justify-between border-b border-dotted border-gray-300 pb-2">
                <span>{title}</span>
                <span className="text-gray-400">{page}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SECTION 1: WHAT IS FOUNDING 5 ===== */}
        <div className="py-12 print:break-after-page">
          <SectionHeader number="1" title="What is Founding 5?" />

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🏆</span>
              <div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">
                  You are one of five.
                </h3>
                <p className="text-amber-800 leading-relaxed">
                  The Founding 5 are the first five businesses hand-selected to launch alongside Toledo Lokal. 
                  This is not a subscription tier — it's a <strong>permanent, top-tier status</strong> that 
                  recognizes your role in building Toledo's local business ecosystem from day one.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4">What makes Founding 5 different?</h3>
          <div className="space-y-4">
            <FeatureRow
              icon="⭐"
              title="Permanent Premium Badge"
              description="A distinctive 'FOUNDING 5' badge on your profile that never expires and cannot be purchased."
            />
            <FeatureRow
              icon="💎"
              title="All Features Free, Forever"
              description="Every feature on the platform — including those in our $150/month Anchor Partner tier — is yours at no cost. Forever."
            />
            <FeatureRow
              icon="📍"
              title="Priority Visibility"
              description="Featured placement in search results, the homepage, and community sections."
            />
            <FeatureRow
              icon="🤝"
              title="Legacy Status"
              description="As Toledo Lokal grows, your Founding 5 status grows with it. Every new feature is automatically unlocked for you."
            />
          </div>
        </div>

        {/* ===== SECTION 2: ACCOUNT SETUP ===== */}
        <div className="py-12 print:break-after-page">
          <SectionHeader number="2" title="Setting Up Your Account" />

          <h3 className="text-xl font-semibold mt-2 mb-4">Step 1: Create Your Account</h3>
          <ol className="list-decimal list-inside space-y-3 ml-4 text-gray-700">
            <li>Visit <strong className="text-[hsl(218,55%,28%)]">toledo-hub-connect.lovable.app</strong></li>
            <li>Tap <strong>"Sign In"</strong> in the top right corner</li>
            <li>Choose <strong>"Sign Up"</strong> and enter your email address</li>
            <li>Check your email for a <strong>verification link</strong></li>
            <li>Click the link to verify — you're in!</li>
          </ol>

          <h3 className="text-xl font-semibold mt-10 mb-4">Step 2: Create Your Business Profile</h3>
          <ol className="list-decimal list-inside space-y-3 ml-4 text-gray-700">
            <li>After signing in, go to your <strong>Dashboard</strong></li>
            <li>Click <strong>"Create Business"</strong></li>
            <li>Fill in your business name and select a category</li>
            <li>Add your address, phone number, and website</li>
            <li>Upload your <strong>logo</strong> and <strong>cover photo</strong> (see size guide on next page)</li>
            <li>Write a compelling description — this is what customers see first!</li>
            <li>Set your business hours for each day of the week</li>
            <li>Submit for review — our team will activate your Founding 5 badge</li>
          </ol>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-8">
            <p className="font-semibold text-blue-800">💡 Pro Tip</p>
            <p className="text-blue-700">Complete profiles get <strong>3x more engagement</strong>. Fill out every section — description, story, hours, photos — for maximum visibility.</p>
          </div>

          <h3 className="text-xl font-semibold mt-10 mb-4">Step 3: Add Your Social Links</h3>
          <p className="text-gray-600 mb-3">Help customers find you everywhere:</p>
          <div className="grid grid-cols-2 gap-3">
            {['Website URL', 'Instagram handle', 'Facebook page', 'TikTok profile'].map(link => (
              <div key={link} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-green-500">✓</span>
                <span>{link}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SECTION 3: IMAGE REQUIREMENTS ===== */}
        <div className="py-12 print:break-after-page">
          <SectionHeader number="3" title="Image Requirements" />

          <p className="text-gray-600 mb-8">
            High-quality images make your profile stand out. Here are the exact specifications for each image type:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Logo */}
            <div className="border-2 border-[hsl(218,55%,28%)] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-lg bg-[hsl(218,55%,28%)] flex items-center justify-center">
                  <span className="text-white text-xl">📷</span>
                </div>
                <h3 className="text-xl font-bold text-[hsl(218,55%,28%)]">Logo</h3>
              </div>
              <div className="space-y-3 text-sm">
                <SpecRow label="Recommended Size" value="400 × 400 px" />
                <SpecRow label="Minimum Size" value="200 × 200 px" />
                <SpecRow label="Aspect Ratio" value="1:1 (Square)" highlight />
                <SpecRow label="Max File Size" value="10 MB" />
                <SpecRow label="Formats" value="JPG, PNG, WebP" />
              </div>
              <div className="mt-5 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <strong>Tips:</strong> Use a clean, high-contrast logo. Avoid text-heavy designs — they become unreadable at small sizes. Transparent PNG works best.
              </div>
            </div>

            {/* Cover Photo */}
            <div className="border-2 border-amber-400 rounded-xl p-6 bg-amber-50/30">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center">
                  <span className="text-white text-xl">🖼️</span>
                </div>
                <h3 className="text-xl font-bold text-amber-800">Cover Photo</h3>
              </div>
              <div className="space-y-3 text-sm">
                <SpecRow label="Recommended Size" value="1920 × 1080 px" />
                <SpecRow label="Minimum Size" value="1200 × 675 px" />
                <SpecRow label="Aspect Ratio" value="16:9 (Landscape)" highlight />
                <SpecRow label="Max File Size" value="10 MB" />
                <SpecRow label="Formats" value="JPG, PNG, WebP" />
              </div>
              <div className="mt-5 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                <strong>Tips:</strong> Show your storefront, products, or team. This is the hero image on your profile — make it count!
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div className="border rounded-xl p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📸</span>
              <h3 className="text-xl font-bold">Gallery Photos</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1">Recommended Size</p>
                <p className="text-gray-500">1080 × 1080 px (square)</p>
              </div>
              <div>
                <p className="font-medium mb-1">Max Photos</p>
                <p className="text-gray-500">Up to 10 images</p>
              </div>
              <div>
                <p className="font-medium mb-1">Formats</p>
                <p className="text-gray-500">JPG, PNG, WebP, HEIC</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <div className="flex-1 bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="font-semibold text-blue-800 text-sm">📱 iPhone Users</p>
              <p className="text-blue-700 text-sm">HEIC photos are automatically converted to JPG. No extra steps needed!</p>
            </div>
            <div className="flex-1 bg-green-50 border-l-4 border-green-500 p-4">
              <p className="font-semibold text-green-800 text-sm">⚡ Auto-Optimized</p>
              <p className="text-green-700 text-sm">All images are automatically compressed for fast loading. Upload full quality!</p>
            </div>
          </div>
        </div>

        {/* ===== SECTION 4: FREE-FOREVER FEATURES ===== */}
        <div className="py-12 print:break-after-page">
          <SectionHeader number="4" title="Your Free-Forever Features" />

          <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-xl p-6 mb-8">
            <p className="text-lg text-amber-900 font-medium mb-2">
              As a Founding 5 member, you receive <strong>every feature</strong> on Toledo Lokal — equivalent to our 
              <strong> Anchor Partner tier ($150/month)</strong> — completely free, forever.
            </p>
            <p className="text-amber-700 text-sm">
              This includes all current features and every future feature we add to the platform.
            </p>
          </div>

          <div className="space-y-3">
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

            <FeatureCategory title="Jobs & Hiring">
              <Feature text="Unlimited active job postings" />
              <Feature text="60-day job listing duration" />
              <Feature text="Priority placement in job feed" />
              <Feature text="'Top Employer' badge on listings" />
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
        <div className="py-12 print:break-after-page">
          <SectionHeader number="5" title="Loop Lokal Rewards" />

          <p className="text-gray-600 mb-6">
            Loop Lokal is Toledo Lokal's built-in loyalty program. As a Founding 5 member, 
            you get the full <strong>Loop Pro</strong> tier — our most powerful rewards package.
          </p>

          <h3 className="text-xl font-semibold mb-4">How It Works</h3>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { step: '1', title: 'Customer Visits', desc: 'They scan your QR code at checkout' },
              { step: '2', title: 'Points Earned', desc: 'You choose how many points per visit' },
              { step: '3', title: 'Rewards Redeemed', desc: 'Customers redeem points for your rewards' },
            ].map(item => (
              <div key={item.step} className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[hsl(218,55%,28%)] text-white flex items-center justify-center mx-auto mb-3 font-bold">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-semibold mb-4">Your Loop Pro Includes</h3>
          <ul className="space-y-2 ml-4">
            <li className="flex items-center gap-2"><span className="text-amber-500">★</span> 5,000 points to distribute per month</li>
            <li className="flex items-center gap-2"><span className="text-amber-500">★</span> Custom-branded QR codes</li>
            <li className="flex items-center gap-2"><span className="text-amber-500">★</span> Create unlimited rewards</li>
            <li className="flex items-center gap-2"><span className="text-amber-500">★</span> Staff-confirmed scans for security</li>
            <li className="flex items-center gap-2"><span className="text-amber-500">★</span> Analytics on customer visits & redemptions</li>
          </ul>
        </div>

        {/* ===== SECTION 6: GETTING THE MOST ===== */}
        <div className="py-12 print:break-after-page">
          <SectionHeader number="6" title="Getting the Most Out of Toledo Lokal" />

          <div className="space-y-6">
            <div className="border-l-4 border-[hsl(218,55%,28%)] pl-5">
              <h3 className="font-semibold text-lg mb-2">Complete Your Profile 100%</h3>
              <p className="text-gray-600">Add your logo, cover photo, gallery images, hours, description, story, and all social links. Complete profiles get significantly more engagement.</p>
            </div>

            <div className="border-l-4 border-amber-400 pl-5">
              <h3 className="font-semibold text-lg mb-2">Post on Pulse Regularly</h3>
              <p className="text-gray-600">Share updates, behind-the-scenes content, and specials. Businesses that post weekly see 4x more profile visits.</p>
            </div>

            <div className="border-l-4 border-green-500 pl-5">
              <h3 className="font-semibold text-lg mb-2">Create Deals & Events</h3>
              <p className="text-gray-600">Active deals and events appear prominently in the app. They drive foot traffic and engagement.</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-5">
              <h3 className="font-semibold text-lg mb-2">Set Up Loop Rewards</h3>
              <p className="text-gray-600">Print your QR code and display it at your counter. Customers love earning points — and they come back more often.</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-5">
              <h3 className="font-semibold text-lg mb-2">Invite Your Staff</h3>
              <p className="text-gray-600">Add managers and staff to help manage your profile, confirm Loop scans, and respond to leads.</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mt-10 text-center">
            <h3 className="text-xl font-bold mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              Our team is here to support you every step of the way.
            </p>
            <p className="text-gray-500 text-sm">
              Email us at <strong>support@toledolokal.com</strong>
            </p>
          </div>
        </div>

        {/* ===== BACK COVER ===== */}
        <div className="min-h-[10in] flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

          <img src={tlLogo} alt="Toledo Lokal" className="h-16 mb-6 opacity-80" />

          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-50 border border-amber-200 mb-6">
            <span className="text-amber-600">★</span>
            <span className="text-amber-800 font-semibold tracking-wide uppercase text-sm">Founding 5</span>
            <span className="text-amber-600">★</span>
          </div>

          <p className="text-xl text-gray-400 max-w-sm leading-relaxed">
            Thank you for believing in local.<br />
            You are the foundation.
          </p>

          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
        </div>

      </div>
    </div>
  );
}

/* ===== Sub-components ===== */

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <h2 className="text-3xl font-bold mb-6 text-[hsl(218,55%,28%)] border-b-2 border-[hsl(218,55%,28%)] pb-2 flex items-baseline gap-3">
      <span className="text-amber-500 text-2xl">{number}.</span> {title}
    </h2>
  );
}

function SpecRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-medium text-gray-600">{label}</span>
      <span className={highlight ? 'font-bold text-[hsl(218,55%,28%)]' : ''}>{value}</span>
    </div>
  );
}

function FeatureRow({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
      <span className="text-2xl mt-0.5">{icon}</span>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function FeatureCategory({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="bg-[hsl(218,55%,28%)] px-5 py-2.5">
        <h4 className="font-semibold text-white">{title}</h4>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-amber-500 font-bold">✓</span>
      <span>{text}</span>
    </div>
  );
}

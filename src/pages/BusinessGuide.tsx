import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, ClipboardList, Camera, Image, Images, Smartphone, Zap, ScanLine, Gift, Lightbulb, Calendar, Briefcase, Megaphone, Mail, Crown, Star, Check } from 'lucide-react';
import tlLogo from '@/assets/tl-logo.png';

export default function BusinessGuide() {
  useEffect(() => {
    document.title = 'Toledo Lokal - Business Partner Guide';
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden fixed safe-area-fixed-top right-4 z-50 flex gap-2 mt-4">
        <Button onClick={handlePrint} className="shadow-lg">
          <Printer className="h-4 w-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      {/* PDF Content */}
      <div className="max-w-[8.5in] mx-auto bg-white p-8 print:p-0 print:max-w-none">
        
        {/* Cover Page */}
        <div className="min-h-[10in] flex flex-col items-center justify-center text-center border-b-4 border-primary print:break-after-page">
          <img src={tlLogo} alt="Toledo Lokal" className="h-24 mb-8" />
          <h1 className="text-5xl font-bold text-primary mb-4">Business Partner Guide</h1>
          <p className="text-2xl text-muted-foreground mb-8">Your Complete Setup & Success Manual</p>
          <div className="w-32 h-1 bg-primary rounded-full mb-8" />
          <p className="text-lg text-muted-foreground">
            Welcome to Toledo's Local Business Community
          </p>
          <p className="text-sm text-muted-foreground mt-12">
            Version 1.0 • February 2026
          </p>
        </div>

        {/* Table of Contents */}
        <div className="py-12 print:break-after-page">
          <h2 className="text-3xl font-bold mb-8 text-primary">Table of Contents</h2>
          <div className="space-y-3 text-lg">
            <div className="flex justify-between border-b border-dotted pb-2">
              <span>1. Getting Started</span>
              <span>3</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-2">
              <span>2. Setting Up Your Business Profile</span>
              <span>4</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-2">
              <span>3. Image Requirements & Best Practices</span>
              <span>5</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-2">
              <span>4. Membership Plans</span>
              <span>6</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-2">
              <span>5. Loop Lokal Rewards Program</span>
              <span>8</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-2">
              <span>6. Managing Deals & Events</span>
              <span>10</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-2">
              <span>7. Hiring & Job Postings</span>
              <span>11</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-2">
              <span>8. Pulse: Community Updates</span>
              <span>12</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-2">
              <span>9. Staff Management</span>
              <span>13</span>
            </div>
            <div className="flex justify-between border-b border-dotted pb-2">
              <span>10. Support & Resources</span>
              <span>14</span>
            </div>
          </div>
        </div>

        {/* Section 1: Getting Started */}
        <div className="py-12 print:break-after-page">
          <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">
            1. Getting Started
          </h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Creating Your Account</h3>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Visit <strong>toledolokal.com</strong></li>
            <li>Click "Sign In" in the top right corner</li>
            <li>Choose "Sign Up" and enter your email address</li>
            <li>Check your email for a verification link</li>
            <li>Click the link to verify your account</li>
            <li>You're now ready to create your business profile!</li>
          </ol>

          <h3 className="text-xl font-semibold mt-8 mb-3">Creating Your Business</h3>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>After signing in, click on "Dashboard" in the navigation</li>
            <li>Click "Create Business" button</li>
            <li>Fill in your business name and select a category</li>
            <li>Add your address, phone, and website</li>
            <li>Upload your logo and cover photo</li>
            <li>Write a compelling description (this is what customers see first!)</li>
            <li>Add your business hours</li>
            <li>Submit for review</li>
          </ol>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mt-6">
            <p className="font-semibold text-amber-800"><ClipboardList className="h-4 w-4 inline mr-1" /> Pro Tip</p>
            <p className="text-amber-700">Complete profiles get 3x more engagement! Fill out every section for maximum visibility.</p>
          </div>
        </div>

        {/* Section 2: Profile Setup */}
        <div className="py-12 print:break-after-page">
          <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">
            2. Setting Up Your Business Profile
          </h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Essential Information</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Business Name</h4>
              <p className="text-muted-foreground">Use your official business name as it appears on signage</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Category</h4>
              <p className="text-muted-foreground">Choose the category that best represents your primary business</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Address</h4>
              <p className="text-muted-foreground">Full street address for map display and directions</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Description</h4>
              <p className="text-muted-foreground">2-3 sentences about what makes your business unique</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Story</h4>
              <p className="text-muted-foreground">Share your origin story, values, and what drives you</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-3">Social Media Links</h3>
          <p className="mb-4">Connect your social profiles to help customers find you everywhere:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Website URL</li>
            <li>Instagram handle</li>
            <li>Facebook page</li>
            <li>TikTok profile</li>
          </ul>

          <h3 className="text-xl font-semibold mt-8 mb-3">Business Hours</h3>
          <p>Set accurate hours for each day of the week. You can mark days as closed or set multiple time ranges for split hours (like lunch breaks).</p>
        </div>

        {/* Section 3: Image Requirements */}
        <div className="py-12 print:break-after-page">
          <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">
            3. Image Requirements & Best Practices
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Logo Requirements */}
            <div className="border-2 border-primary rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary mb-4"><Camera className="h-5 w-5 inline mr-1" /> Logo</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Recommended Size:</span>
                  <span>400 x 400 pixels</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Minimum Size:</span>
                  <span>200 x 200 pixels</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Aspect Ratio:</span>
                  <span>1:1 (Square)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Max File Size:</span>
                  <span>5 MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Formats:</span>
                  <span>JPG, PNG, WebP</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded text-sm">
                <strong>Tips:</strong> Use a clean, high-contrast logo. Avoid text-heavy designs that become unreadable at small sizes.
              </div>
            </div>

            {/* Cover Photo Requirements */}
            <div className="border-2 border-primary rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary mb-4"><Image className="h-5 w-5 inline mr-1" /> Cover Photo</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Recommended Size:</span>
                  <span>1920 x 1080 pixels</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Minimum Size:</span>
                  <span>1200 x 675 pixels</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Aspect Ratio:</span>
                  <span>16:9 (Landscape)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Max File Size:</span>
                  <span>5 MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Formats:</span>
                  <span>JPG, PNG, WebP</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded text-sm">
                <strong>Tips:</strong> Show your storefront, products, or team. This is the first thing customers see!
              </div>
            </div>
          </div>

          {/* Gallery Photos */}
          <div className="border-2 border-muted rounded-lg p-6 mt-6">
            <h3 className="text-xl font-bold mb-4"><Images className="h-5 w-5 inline mr-1" /> Gallery Photos</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <span className="font-medium">Recommended:</span>
                <p className="text-sm text-muted-foreground">1080 x 1080 pixels (square works best)</p>
              </div>
              <div className="space-y-2">
                <span className="font-medium">Max Photos:</span>
                <p className="text-sm text-muted-foreground">Up to 10 gallery images</p>
              </div>
              <div className="space-y-2">
                <span className="font-medium">Formats:</span>
                <p className="text-sm text-muted-foreground">JPG, PNG, WebP, HEIC (auto-converted)</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
            <p className="font-semibold text-blue-800"><Smartphone className="h-4 w-4 inline mr-1" /> iPhone Users</p>
            <p className="text-blue-700">HEIC photos from iPhones are automatically converted to JPG during upload. No extra steps needed!</p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-4">
            <p className="font-semibold text-green-800"><Zap className="h-4 w-4 inline mr-1" /> Automatic Optimization</p>
            <p className="text-green-700">All images are automatically compressed and optimized for fast loading. Upload full-quality images - we'll handle the rest!</p>
          </div>
        </div>

        {/* Section 4: Membership Plans */}
        <div className="py-12 print:break-after-page">
          <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">
            4. Membership Plans
          </h2>
          
          <p className="text-lg mb-6">Choose the plan that fits your business needs. All plans include your basic business listing.</p>

          {/* Free Plan */}
          <div className="border rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold">Free</h3>
                <p className="text-muted-foreground">Perfect for getting started</p>
              </div>
              <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Business name & category
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Location on map
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Basic listing
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> 1 active job posting
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> 1 Pulse post per day
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span>—</span> Jobs auto-expire in 30 days
              </li>
            </ul>
          </div>

          {/* Local Supporter */}
          <div className="border-2 border-primary rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-primary">Local Supporter</h3>
                <p className="text-muted-foreground">Great for engaged businesses</p>
              </div>
              <div className="text-3xl font-bold text-primary">$25<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Everything in Free
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> 1 deal per month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> "Support Local" badge
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Enhanced listing
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> 3 active job postings
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> "Local Employer" badge on jobs
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Loop Starter included (500 pts/mo)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> 3 Pulse posts per day
              </li>
            </ul>
          </div>

          {/* Featured Local */}
          <div className="border rounded-lg p-6 mb-6 bg-gradient-to-r from-amber-50 to-transparent">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold">Featured Local <Star className="h-5 w-5 inline text-amber-500" /></h3>
                <p className="text-muted-foreground">Most popular choice</p>
              </div>
              <div className="text-3xl font-bold">$75<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Everything in Local Supporter
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> <strong>Unlimited deals</strong>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> <strong>Post events</strong>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Featured placement in search
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Basic analytics dashboard
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> 5 active job postings
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Loop Growth included (2,000 pts/mo)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> 5 Pulse posts + 1 pinned per day
              </li>
            </ul>
          </div>

          {/* Anchor Partner */}
          <div className="border-2 border-amber-500 rounded-lg p-6 bg-gradient-to-r from-amber-100 to-transparent">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-amber-700">Anchor Partner <Crown className="h-5 w-5 inline text-amber-700" /></h3>
                <p className="text-muted-foreground">Maximum visibility & features</p>
              </div>
              <div className="text-3xl font-bold text-amber-700">$150<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Everything in Featured Local
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> <strong>Homepage featured section</strong>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Exclusive placements
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Advanced analytics
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Priority support
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> <strong>Unlimited job postings</strong>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> Loop Partner included (5,000 pts/mo)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 inline text-green-500" /> 10 Pulse posts + 3 pinned per day
              </li>
            </ul>
          </div>
        </div>

        {/* Section 5: Loop Lokal */}
        <div className="py-12 print:break-after-page">
          <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">
            5. Loop Lokal Rewards Program
          </h2>

          <div className="bg-primary/5 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-3">What is Loop Lokal?</h3>
            <p className="text-lg">
              Loop Lokal is Toledo's community rewards program that connects businesses with customers through a shared points system. When customers visit participating businesses, they earn Loop Points that can be redeemed at any Loop business—creating a city-wide network of support.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-4xl mb-2"><ScanLine className="h-10 w-10 mx-auto text-primary" /></div>
              <h4 className="font-bold mb-2">1. Customer Scans</h4>
              <p className="text-sm text-muted-foreground">Customer scans your QR code at checkout or visits</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-4xl mb-2"><Star className="h-10 w-10 mx-auto text-primary" /></div>
              <h4 className="font-bold mb-2">2. Points Awarded</h4>
              <p className="text-sm text-muted-foreground">They earn Loop Points from your monthly allocation</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-4xl mb-2"><Gift className="h-10 w-10 mx-auto text-primary" /></div>
              <h4 className="font-bold mb-2">3. Redeem Anywhere</h4>
              <p className="text-sm text-muted-foreground">Points work at any Loop-participating business</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Loop Tiers by Plan</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left">Business Plan</th>
                  <th className="border p-3 text-left">Loop Tier</th>
                  <th className="border p-3 text-left">Monthly Points</th>
                  <th className="border p-3 text-left">Key Features</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">Free</td>
                  <td className="border p-3">Visible Only</td>
                  <td className="border p-3">0</td>
                  <td className="border p-3 text-sm">Listed but no Loop participation</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Local Supporter</td>
                  <td className="border p-3">Loop Starter</td>
                  <td className="border p-3">500</td>
                  <td className="border p-3 text-sm">QR codes, issue & accept points, basic rewards</td>
                </tr>
                <tr>
                  <td className="border p-3">Featured Local</td>
                  <td className="border p-3">Loop Growth</td>
                  <td className="border p-3">2,000</td>
                  <td className="border p-3 text-sm">+ Citywide missions, featured discovery, analytics</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Anchor Partner</td>
                  <td className="border p-3">Loop Partner</td>
                  <td className="border p-3">5,000</td>
                  <td className="border p-3 text-sm">+ Sponsored missions, priority placement, events</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Setting Up Your QR Code</h3>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to Dashboard → Loop → QR Codes</li>
            <li>Click "Create QR Code"</li>
            <li>Set the points value (how many points customers earn per scan)</li>
            <li>Choose scan type: unlimited, daily limit, or single-use</li>
            <li>Print and display at your register or entrance</li>
          </ol>

          <h3 className="text-xl font-semibold mt-8 mb-4">Creating Rewards</h3>
          <p className="mb-4">Rewards are what customers can redeem their points for at your business:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to Dashboard → Loop → Rewards</li>
            <li>Click "Add Reward"</li>
            <li>Name your reward (e.g., "Free Coffee", "$5 Off Purchase")</li>
            <li>Set the points cost</li>
            <li>Add any limits (daily, monthly, or total quantity)</li>
          </ol>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-6">
            <p className="font-semibold text-green-800"><Lightbulb className="h-4 w-4 inline mr-1" /> Best Practice</p>
            <p className="text-green-700">Start with a low-cost reward (like a small discount) to encourage first-time redemptions, then add premium rewards for loyal customers.</p>
          </div>
        </div>

        {/* Section 6: Deals & Events */}
        <div className="py-12 print:break-after-page">
          <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">
            6. Managing Deals & Events
          </h2>

          <h3 className="text-xl font-semibold mt-6 mb-4">Creating Deals</h3>
          <p className="mb-4">Deals appear in the Deals section and help attract new customers:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to Dashboard → Deals</li>
            <li>Click "Create Deal"</li>
            <li>Add a compelling title (e.g., "20% Off First Visit")</li>
            <li>Write a clear description of the offer</li>
            <li>Set start and end dates</li>
            <li>Choose redemption method (show app, mention deal, etc.)</li>
            <li>Upload an eye-catching image</li>
          </ol>

          <div className="bg-muted rounded-lg p-4 mt-4 mb-6">
            <p className="font-semibold">Deal Limits by Plan:</p>
            <ul className="mt-2 space-y-1">
              <li>• Free: No deals</li>
              <li>• Local Supporter: 1 deal/month</li>
              <li>• Featured Local & Anchor: Unlimited deals</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Posting Events</h3>
          <p className="mb-4">Events appear on the Events page and community calendar:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to Dashboard → Events</li>
            <li>Click "Create Event"</li>
            <li>Add event title and description</li>
            <li>Set date, start time, and end time</li>
            <li>Add location (can be different from your business address)</li>
            <li>Upload event artwork</li>
            <li>Add ticket link if applicable</li>
          </ol>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mt-4">
            <p className="font-semibold text-amber-800"><Calendar className="h-4 w-4 inline mr-1" /> Event Tips</p>
            <ul className="text-amber-700 mt-2 space-y-1">
              <li>• Post events at least 2 weeks in advance</li>
              <li>• Use high-quality images sized 1200x675 pixels</li>
              <li>• Include all relevant details (parking, age restrictions, etc.)</li>
            </ul>
          </div>
        </div>

        {/* Section 7: Hiring */}
        <div className="py-12 print:break-after-page">
          <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">
            7. Hiring & Job Postings
          </h2>

          <h3 className="text-xl font-semibold mt-6 mb-4">Creating a Job Posting</h3>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to Dashboard → Jobs</li>
            <li>Click "Post a Job"</li>
            <li>Enter job title and select job type (Full-time, Part-time, etc.)</li>
            <li>Write a detailed job description</li>
            <li>Add pay range and schedule info</li>
            <li>Set application method (email, phone, or external link)</li>
            <li>Submit for posting</li>
          </ol>

          <h3 className="text-xl font-semibold mt-8 mb-4">Job Posting Limits by Plan</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left">Plan</th>
                  <th className="border p-3 text-left">Active Jobs</th>
                  <th className="border p-3 text-left">Expiration</th>
                  <th className="border p-3 text-left">Badges</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">Free</td>
                  <td className="border p-3">1</td>
                  <td className="border p-3">30 days</td>
                  <td className="border p-3">None</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Local Supporter</td>
                  <td className="border p-3">3</td>
                  <td className="border p-3">Never</td>
                  <td className="border p-3">"Local Employer"</td>
                </tr>
                <tr>
                  <td className="border p-3">Featured Local</td>
                  <td className="border p-3">5</td>
                  <td className="border p-3">Never</td>
                  <td className="border p-3">"Local Employer" + Priority</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Anchor Partner</td>
                  <td className="border p-3">Unlimited</td>
                  <td className="border p-3">Never</td>
                  <td className="border p-3">"Local Employer" + Featured</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-6">
            <p className="font-semibold text-green-800"><Briefcase className="h-4 w-4 inline mr-1" /> Hiring Best Practices</p>
            <ul className="text-green-700 mt-2 space-y-1">
              <li>• Be specific about pay ranges—listings with pay info get 2x more applicants</li>
              <li>• Include schedule expectations upfront</li>
              <li>• Highlight unique perks (flexible hours, employee discounts, etc.)</li>
              <li>• Respond to applicants within 48 hours</li>
            </ul>
          </div>
        </div>

        {/* Section 8: Pulse */}
        <div className="py-12 print:break-after-page">
          <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">
            8. Pulse: Community Updates
          </h2>

          <div className="bg-primary/5 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-3">What is Pulse?</h3>
            <p className="text-lg">
              Pulse is your real-time connection to the Toledo community. Share quick updates, announcements, menu specials, behind-the-scenes moments, and more. Think of it as your business's social feed within the Toledo Lokal platform.
            </p>
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-4">Creating a Pulse Post</h3>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to Pulse in the main navigation</li>
            <li>Click "Create Post" or use the composer at the top</li>
            <li>Write your update (keep it concise and engaging)</li>
            <li>Add an image if relevant</li>
            <li>Choose post type: Update, Promo, Announcement, or Behind the Scenes</li>
            <li>Paid plans can "pin" important posts for visibility</li>
          </ol>

          <h3 className="text-xl font-semibold mt-8 mb-4">Pulse Limits by Plan</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-bold">Posts Per Day</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Free: 1 post</li>
                <li>• Local Supporter: 3 posts</li>
                <li>• Featured Local: 5 posts</li>
                <li>• Anchor Partner: 10 posts</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-bold">Pinned Posts Per Day</h4>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Free: 0</li>
                <li>• Local Supporter: 0</li>
                <li>• Featured Local: 1 pinned</li>
                <li>• Anchor Partner: 3 pinned</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
            <p className="font-semibold text-blue-800"><Megaphone className="h-4 w-4 inline mr-1" /> Pulse Tips</p>
            <ul className="text-blue-700 mt-2 space-y-1">
              <li>• Post during peak hours (11am-1pm, 5pm-7pm) for more visibility</li>
              <li>• Use photos—posts with images get 3x more engagement</li>
              <li>• Share authentic moments, not just promotions</li>
              <li>• Respond to comments to build community</li>
            </ul>
          </div>
        </div>

        {/* Section 9: Staff Management */}
        <div className="py-12 print:break-after-page">
          <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">
            9. Staff Management
          </h2>

          <p className="text-lg mb-6">
            Add team members to help manage your business profile, approve Loop scans, and handle day-to-day operations without sharing your login.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-4">Adding Staff Members</h3>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Go to Dashboard → Staff</li>
            <li>Click "Invite Staff Member"</li>
            <li>Enter their email address or phone number</li>
            <li>Select their role (Owner, Manager, or Staff)</li>
            <li>Send invitation</li>
            <li>They'll receive a link to create their account and join</li>
          </ol>

          <h3 className="text-xl font-semibold mt-8 mb-4">Staff Roles & Permissions</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left">Permission</th>
                  <th className="border p-3 text-center">Staff</th>
                  <th className="border p-3 text-center">Manager</th>
                  <th className="border p-3 text-center">Owner</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">View Dashboard</td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Approve Loop Scans</td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                </tr>
                <tr>
                  <td className="border p-3">Create Deals/Events</td>
                  <td className="border p-3 text-center">—</td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Edit Business Profile</td>
                  <td className="border p-3 text-center">—</td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                </tr>
                <tr>
                  <td className="border p-3">Manage Staff</td>
                  <td className="border p-3 text-center">—</td>
                  <td className="border p-3 text-center">—</td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Manage Subscription</td>
                  <td className="border p-3 text-center">—</td>
                  <td className="border p-3 text-center">—</td>
                  <td className="border p-3 text-center"><Check className="h-4 w-4 inline" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 10: Support */}
        <div className="py-12">
          <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">
            10. Support & Resources
          </h2>

          <h3 className="text-xl font-semibold mt-6 mb-4">Getting Help</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h4 className="font-bold text-lg mb-2"><Mail className="h-5 w-5 inline mr-1" /> Email Support</h4>
              <p className="text-muted-foreground mb-2">For general inquiries and technical issues</p>
              <p className="font-medium">support@toledo-lokal.com</p>
            </div>
            <div className="border rounded-lg p-6">
              <h4 className="font-bold text-lg mb-2"><Zap className="h-5 w-5 inline mr-1" /> Priority Support</h4>
              <p className="text-muted-foreground mb-2">For Anchor Partner members</p>
              <p className="font-medium">24-hour response guarantee</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">How long does business approval take?</h4>
              <p className="text-muted-foreground mt-1">Most businesses are approved within 24-48 hours during business days.</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Can I change my subscription plan?</h4>
              <p className="text-muted-foreground mt-1">Yes! Upgrade or downgrade anytime from Dashboard → Subscription. Changes take effect immediately.</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Do unused Loop Points roll over?</h4>
              <p className="text-muted-foreground mt-1">Your monthly point allocation resets each billing cycle. Points you've issued to customers never expire.</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">How do customers redeem rewards?</h4>
              <p className="text-muted-foreground mt-1">Customers show you their redemption code in the app. You confirm it in your dashboard or scanning app.</p>
            </div>
          </div>

          <div className="mt-12 text-center border-t pt-8">
            <img src={tlLogo} alt="Toledo Lokal" className="h-12 mx-auto mb-4" />
            <p className="text-lg font-semibold text-primary">Welcome to the Toledo Lokal Community!</p>
            <p className="text-muted-foreground mt-2">
              We're excited to have you as a partner. Together, we're building a stronger local economy.
            </p>
            <p className="text-sm text-muted-foreground mt-6">
              © 2026 Toledo Lokal. All rights reserved.
            </p>
          </div>
        </div>

      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0.75in;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:break-after-page {
            break-after: page;
          }
        }
      `}</style>
    </div>
  );
}

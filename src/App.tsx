import { lazy as reactLazy, Suspense, ComponentType } from "react";

// Reload once on stale chunk errors (common after a redeploy)
const lazy = <T extends ComponentType<Record<string, never>>>(factory: () => Promise<{ default: T }>) =>
  reactLazy(() =>
    factory().catch((err) => {
      const msg = String(err?.message || err);
      if (/import.*module|Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(msg)) {
        if (!sessionStorage.getItem("__chunk_reloaded__")) {
          sessionStorage.setItem("__chunk_reloaded__", "1");
          window.location.reload();
        }
      }
      throw err;
    })
  );
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LP_ENABLED, SOFT_LAUNCH, TODAY_TAB_ENABLED } from "@/lib/flags";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { LoopProvider } from "@/contexts/LoopContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ActiveRoleProvider } from "@/contexts/ActiveRoleContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { BetaGate } from "@/components/beta/BetaGate";
import { Skeleton } from "@/components/ui/skeleton";
import { Analytics } from "@vercel/analytics/react";

// Critical path: eagerly loaded (landing page)
import Today from "./pages/Today";

// Everything else: lazy-loaded
const NearMe = lazy(() => import("./pages/NearMe"));
const Discover = lazy(() => import("./pages/Discover"));
const Loop = lazy(() => import("./pages/Loop"));
const Feed = lazy(() => import("./pages/Feed"));
const Auth = lazy(() => import("./pages/Auth"));
const Explore = lazy(() => import("./pages/Explore"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Community = lazy(() => import("./pages/Community"));
const NonprofitDetail = lazy(() => import("./pages/NonprofitDetail"));
const Deals = lazy(() => import("./pages/Deals"));
const Requests = lazy(() => import("./pages/Requests"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail"));
const SaveContact = lazy(() => import("./pages/SaveContact"));
const QRResolver = lazy(() => import("./pages/QRResolver"));
const EditBusiness = lazy(() => import("./pages/EditBusiness"));
const CreateBusiness = lazy(() => import("./pages/CreateBusiness"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminConsole = lazy(() => import("./pages/AdminConsole"));
const Tours = lazy(() => import("./pages/Tours"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Stories = lazy(() => import("./pages/Stories"));
const CreateStory = lazy(() => import("./pages/CreateStory"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Saved = lazy(() => import("./pages/Saved"));
const MyToledo = lazy(() => import("./pages/MyToledo"));
const PublicCollection = lazy(() => import("./pages/PublicCollection"));
const LoopWallet = lazy(() => import("./pages/LoopWallet"));
const BusinessQRCodes = lazy(() => import("./pages/BusinessQRCodes"));
const BusinessRewards = lazy(() => import("./pages/BusinessRewards"));
const ScanQR = lazy(() => import("./pages/ScanQR"));
const PendingScans = lazy(() => import("./pages/PendingScans"));
const DashboardStaff = lazy(() => import("./pages/DashboardStaff"));
const DashboardDeals = lazy(() => import("./pages/DashboardDeals"));
const DashboardEvents = lazy(() => import("./pages/DashboardEvents"));
const DashboardLeads = lazy(() => import("./pages/DashboardLeads"));
const DashboardBoost = lazy(() => import("./pages/DashboardBoost"));
const ScannerMode = lazy(() => import("./pages/ScannerMode"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Jobs = lazy(() => import("./pages/Jobs"));
const HireLocalProfile = lazy(() => import("./pages/HireLocalProfile"));
const HireLocalConfirm = lazy(() => import("./pages/HireLocalConfirm"));
const HireLocalClaim = lazy(() => import("./pages/HireLocalClaim"));
const FoodToday = lazy(() => import("./pages/FoodToday"));
const DashboardJobs = lazy(() => import("./pages/DashboardJobs"));
const DashboardFoodTruck = lazy(() => import("./pages/DashboardFoodTruck"));
const Pulse = lazy(() => import("./pages/Pulse"));
const PulseDetail = lazy(() => import("./pages/PulseDetail"));
const BusinessGuide = lazy(() => import("./pages/BusinessGuide"));
const BusinessImageGuide = lazy(() => import("./pages/BusinessImageGuide"));
const Founding5 = lazy(() => import("./pages/Founding5"));
const Founding5Guide = lazy(() => import("./pages/Founding5Guide"));
const ConnectorProfile = lazy(() => import("./pages/ConnectorProfile"));
const ConnectorDashboard = lazy(() => import("./pages/ConnectorDashboard"));
const BusinessOnboarding = lazy(() => import("./pages/BusinessOnboarding"));
const AdminBusinesses = lazy(() => import("./pages/AdminBusinesses"));
const BusinessAdmin = lazy(() => import("./pages/BusinessAdmin"));
const RoleSelect = lazy(() => import("./pages/RoleSelect"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const DashboardLocations = lazy(() => import("./pages/DashboardLocations"));
const DashboardMenu = lazy(() => import("./pages/DashboardMenu"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Join = lazy(() => import("./pages/Join"));
const JoinQR = lazy(() => import("./pages/JoinQR"));
const JoinCharter100 = lazy(() => import("./pages/JoinCharter100"));
const Charter100 = lazy(() => import("./pages/Charter100"));
const FoundingBeta = lazy(() => import("./pages/FoundingBeta"));
const BetaSignup = lazy(() => import("./pages/BetaSignup"));
const CirclesLanding = lazy(() => import("./pages/CirclesLanding"));
const NonprofitSignup = lazy(() => import("./pages/NonprofitSignup"));
const CommunityPartnerSignup = lazy(() => import("./pages/CommunityPartnerSignup"));


// Optimized QueryClient with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min - avoid refetching on every mount
      gcTime: 30 * 60 * 1000, // 30 min garbage collection
      refetchOnWindowFocus: false, // Don't refetch when user tabs back
      retry: 1, // Single retry on failure
    },
  },
});

function PageFallback() {
  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ActiveRoleProvider>
        <SubscriptionProvider>
          <LoopProvider>
            <TooltipProvider>
              <Toaster />
            <Sonner />
            <BrowserRouter>
              <BetaGate>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/discover" replace />} />
                  <Route path="/near-me" element={<NearMe />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/loop" element={LP_ENABLED ? <Loop /> : <Navigate to="/" replace />} />
                  <Route path="/pulse" element={SOFT_LAUNCH ? <Navigate to="/" replace /> : <Pulse />} />
                  <Route path="/pulse/:pulseId" element={SOFT_LAUNCH ? <Navigate to="/" replace /> : <PulseDetail />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/auth" element={<Auth />} />
                  {/* Public, unlisted Founding Partner landing page (QR / shared link only) */}
                  <Route path="/join" element={<Join />} />
                  {/* Unlisted helper that renders a scannable QR for the /join URL */}
                  <Route path="/join/qr" element={<JoinQR />} />
                  {/* Charter 100 cohort join — token-gated, server-validated */}
                  <Route path="/join/charter-100" element={<JoinCharter100 />} />
                  {/* Charter 100 cohort home — cover, live seat counter, feedback */}
                  <Route path="/charter-100" element={<Charter100 />} />
                  {/* Hidden, invite-only Founding Beta Circle (gated to active beta members by RLS) */}
                  <Route path="/founding-beta" element={<FoundingBeta />} />
                  {/* Public closed-beta signup page (target of the shared link / QR) */}
                  <Route path="/beta" element={<BetaSignup />} />
                  {/* Circles tab landing — cohort-first resolver (→ Charter 100 today) */}
                  <Route path="/circles" element={<CirclesLanding />} />
                  {/* Alias so the /join CTA's /signup link resolves to the real signup page */}
                  <Route path="/signup" element={<Auth />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/community/:slug" element={<NonprofitDetail />} />
                  <Route path="/signup/nonprofit" element={<NonprofitSignup />} />
                  <Route path="/signup/community-partner" element={<CommunityPartnerSignup />} />
                  <Route path="/deals" element={<Deals />} />
                  <Route path="/requests" element={<Requests />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/business/:id" element={<BusinessDetail />} />
                  {/* Permanent business QR target. Encodes the immutable business id
                      and forwards to the current public page, keeping ?via=qr. */}
                  <Route path="/qr/:businessId" element={<QRResolver />} />
                  {/* Public contact card reached by scanning a founding QR code */}
                  <Route path="/save/:id" element={<SaveContact />} />
                  <Route path="/business/:id/edit" element={<EditBusiness />} />
                  <Route path="/create-business" element={<CreateBusiness />} />
                  <Route path="/manage" element={<BusinessAdmin />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/qr-codes" element={<BusinessQRCodes />} />
                  <Route path="/dashboard/rewards" element={<BusinessRewards />} />
                  <Route path="/dashboard/pending-scans" element={<PendingScans />} />
                  <Route path="/dashboard/staff" element={<DashboardStaff />} />
                  <Route path="/dashboard/subscription" element={<Subscription />} />
                  <Route path="/dashboard/deals" element={<DashboardDeals />} />
                  <Route path="/dashboard/events" element={<DashboardEvents />} />
                  <Route path="/dashboard/leads" element={<DashboardLeads />} />
                  <Route path="/dashboard/boost" element={<DashboardBoost />} />
                  
                  <Route path="/admin" element={<AdminConsole />} />
                  <Route path="/admin/classic" element={<Admin />} />
                  <Route path="/tours" element={<Tours />} />
                  <Route path="/challenges" element={<Challenges />} />
                  <Route path="/stories" element={<Stories />} />
                  <Route path="/stories/create" element={<CreateStory />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/saved" element={<Saved />} />
                  <Route path="/my-toledo" element={<MyToledo />} />
                  <Route path="/c/:slug" element={<PublicCollection />} />
                  <Route path="/loop-wallet" element={LP_ENABLED ? <LoopWallet /> : <Navigate to="/" replace />} />
                  <Route path="/wallet" element={LP_ENABLED ? <LoopWallet /> : <Navigate to="/" replace />} />
                  <Route path="/scan/:qrCodeId" element={<ScanQR />} />
                  <Route path="/scanner-mode" element={<ScannerMode />} />
                  <Route path="/accept-invitation" element={<AcceptInvitation />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/hire-local/claim" element={<HireLocalClaim />} />
                  <Route path="/hire-local/confirm" element={<HireLocalConfirm />} />
                  <Route path="/hire-local/confirm/:orgId" element={<HireLocalConfirm />} />
                  <Route path="/hire-local/p/:userId" element={<HireLocalProfile />} />
                  <Route path="/food-today" element={<FoodToday />} />
                  <Route path="/dashboard/jobs" element={<DashboardJobs />} />
                  <Route path="/dashboard/food-truck" element={<DashboardFoodTruck />} />
                  <Route path="/dashboard/locations" element={<DashboardLocations />} />
                  <Route path="/dashboard/menu" element={<DashboardMenu />} />
                  <Route path="/business-guide" element={<BusinessGuide />} />
                  <Route path="/business-image-guide" element={<BusinessImageGuide />} />
                  <Route path="/founding-5" element={<Founding5 />} />
                  <Route path="/founding-5-guide" element={<Founding5Guide />} />
                  <Route path="/connector/:slug" element={<ConnectorProfile />} />
                  <Route path="/connector-dashboard" element={<ConnectorDashboard />} />
                  <Route path="/business-onboarding" element={<BusinessOnboarding />} />
                  <Route path="/admin/businesses" element={<AdminBusinesses />} />
                  <Route path="/role-select" element={<RoleSelect />} />
                  <Route path="/profile-setup" element={<ProfileSetup />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <BottomNav />
              <InstallPrompt />
              </BetaGate>
            </BrowserRouter>
            <Analytics />
          </TooltipProvider>
        </LoopProvider>
      </SubscriptionProvider>
        </ActiveRoleProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

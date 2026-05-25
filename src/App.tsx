import { lazy as reactLazy, Suspense, ComponentType } from "react";

// Reload once on stale chunk errors (common after a redeploy)
const lazy = <T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) =>
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
import { LP_ENABLED, SOFT_LAUNCH } from "@/lib/flags";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { LoopProvider } from "@/contexts/LoopContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { Skeleton } from "@/components/ui/skeleton";

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
const EditBusiness = lazy(() => import("./pages/EditBusiness"));
const CreateBusiness = lazy(() => import("./pages/CreateBusiness"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
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
const FoodToday = lazy(() => import("./pages/FoodToday"));
const DashboardJobs = lazy(() => import("./pages/DashboardJobs"));
const DashboardFoodTruck = lazy(() => import("./pages/DashboardFoodTruck"));
const Pulse = lazy(() => import("./pages/Pulse"));
const PulseDetail = lazy(() => import("./pages/PulseDetail"));
const BusinessGuide = lazy(() => import("./pages/BusinessGuide"));
const Founding5Guide = lazy(() => import("./pages/Founding5Guide"));
const ConnectorProfile = lazy(() => import("./pages/ConnectorProfile"));
const ConnectorDashboard = lazy(() => import("./pages/ConnectorDashboard"));
const BusinessOnboarding = lazy(() => import("./pages/BusinessOnboarding"));
const AdminBusinesses = lazy(() => import("./pages/AdminBusinesses"));
const RoleSelect = lazy(() => import("./pages/RoleSelect"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const DashboardLocations = lazy(() => import("./pages/DashboardLocations"));


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
        <SubscriptionProvider>
          <LoopProvider>
            <TooltipProvider>
              <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Today />} />
                  <Route path="/near-me" element={<NearMe />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/loop" element={LP_ENABLED ? <Loop /> : <Navigate to="/" replace />} />
                  <Route path="/pulse" element={SOFT_LAUNCH ? <Navigate to="/" replace /> : <Pulse />} />
                  <Route path="/pulse/:pulseId" element={SOFT_LAUNCH ? <Navigate to="/" replace /> : <PulseDetail />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/community/:slug" element={<NonprofitDetail />} />
                  <Route path="/deals" element={<Deals />} />
                  <Route path="/requests" element={<Requests />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/business/:id" element={<BusinessDetail />} />
                  <Route path="/business/:id/edit" element={<EditBusiness />} />
                  <Route path="/create-business" element={<CreateBusiness />} />
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
                  
                  <Route path="/admin" element={<Admin />} />
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
                  <Route path="/food-today" element={SOFT_LAUNCH ? <Navigate to="/" replace /> : <FoodToday />} />
                  <Route path="/dashboard/jobs" element={<DashboardJobs />} />
                  <Route path="/dashboard/food-truck" element={<DashboardFoodTruck />} />
                  <Route path="/dashboard/locations" element={<DashboardLocations />} />
                  <Route path="/business-guide" element={<BusinessGuide />} />
                  <Route path="/founding-5-guide" element={<Founding5Guide />} />
                  <Route path="/connector/:slug" element={<ConnectorProfile />} />
                  <Route path="/connector-dashboard" element={<ConnectorDashboard />} />
                  <Route path="/business-onboarding" element={<BusinessOnboarding />} />
                  <Route path="/admin/businesses" element={<AdminBusinesses />} />
                  <Route path="/role-select" element={<RoleSelect />} />
                  <Route path="/profile-setup" element={<ProfileSetup />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <BottomNav />
              <InstallPrompt />
            </BrowserRouter>
          </TooltipProvider>
        </LoopProvider>
      </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

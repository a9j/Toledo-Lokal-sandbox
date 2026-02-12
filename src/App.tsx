import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { LoopProvider } from "@/contexts/LoopContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import Today from "./pages/Today";
import NearMe from "./pages/NearMe";
import Discover from "./pages/Discover";
import Loop from "./pages/Loop";
import Feed from "./pages/Feed";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Community from "./pages/Community";
import NonprofitDetail from "./pages/NonprofitDetail";
import Deals from "./pages/Deals";
import Requests from "./pages/Requests";
import Profile from "./pages/Profile";
import BusinessDetail from "./pages/BusinessDetail";
import EditBusiness from "./pages/EditBusiness";
import CreateBusiness from "./pages/CreateBusiness";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Tours from "./pages/Tours";
import Challenges from "./pages/Challenges";
import Stories from "./pages/Stories";
import CreateStory from "./pages/CreateStory";
import Subscription from "./pages/Subscription";
import Saved from "./pages/Saved";
import MyToledo from "./pages/MyToledo";
import PublicCollection from "./pages/PublicCollection";
import LoopWallet from "./pages/LoopWallet";
import BusinessQRCodes from "./pages/BusinessQRCodes";
import BusinessRewards from "./pages/BusinessRewards";
import ScanQR from "./pages/ScanQR";
import PendingScans from "./pages/PendingScans";
import DashboardStaff from "./pages/DashboardStaff";
import DashboardDeals from "./pages/DashboardDeals";
import DashboardEvents from "./pages/DashboardEvents";
import DashboardLeads from "./pages/DashboardLeads";
import DashboardBoost from "./pages/DashboardBoost";
import ScannerMode from "./pages/ScannerMode";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";
import Jobs from "./pages/Jobs";
import FoodToday from "./pages/FoodToday";
import DashboardJobs from "./pages/DashboardJobs";
import DashboardFoodTruck from "./pages/DashboardFoodTruck";
import { AskToledoChat } from "./components/chat/AskToledoChat";
import Pulse from "./pages/Pulse";
import PulseDetail from "./pages/PulseDetail";
import BusinessGuide from "./pages/BusinessGuide";
import ConnectorProfile from "./pages/ConnectorProfile";
import ConnectorDashboard from "./pages/ConnectorDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <LoopProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Today />} />
                <Route path="/near-me" element={<NearMe />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/loop" element={<Loop />} />
                <Route path="/pulse" element={<Pulse />} />
                <Route path="/pulse/:pulseId" element={<PulseDetail />} />
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
                <Route path="/loop-wallet" element={<LoopWallet />} />
                <Route path="/wallet" element={<LoopWallet />} />
                <Route path="/scan/:qrCodeId" element={<ScanQR />} />
                <Route path="/scanner-mode" element={<ScannerMode />} />
                <Route path="/accept-invitation" element={<AcceptInvitation />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/food-today" element={<FoodToday />} />
                <Route path="/dashboard/jobs" element={<DashboardJobs />} />
                <Route path="/dashboard/food-truck" element={<DashboardFoodTruck />} />
                <Route path="/business-guide" element={<BusinessGuide />} />
                <Route path="/connector/:slug" element={<ConnectorProfile />} />
                <Route path="/connector-dashboard" element={<ConnectorDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNav />
              <AskToledoChat />
              <InstallPrompt />
            </BrowserRouter>
          </TooltipProvider>
        </LoopProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

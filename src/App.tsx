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
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Programs from "./pages/Programs";
import Deals from "./pages/Deals";
import Requests from "./pages/Requests";
import Profile from "./pages/Profile";
import BusinessDetail from "./pages/BusinessDetail";
import CreateBusiness from "./pages/CreateBusiness";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Tours from "./pages/Tours";
import Challenges from "./pages/Challenges";
import Stories from "./pages/Stories";
import CreateStory from "./pages/CreateStory";
import Subscription from "./pages/Subscription";
import Saved from "./pages/Saved";
import LoopWallet from "./pages/LoopWallet";
import BusinessQRCodes from "./pages/BusinessQRCodes";
import BusinessRewards from "./pages/BusinessRewards";
import ScanQR from "./pages/ScanQR";
import PendingScans from "./pages/PendingScans";
import DashboardStaff from "./pages/DashboardStaff";
import ScannerMode from "./pages/ScannerMode";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";
import { AskToledoChat } from "./components/chat/AskToledoChat";

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
                <Route path="/" element={<Index />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/business/:id" element={<BusinessDetail />} />
                <Route path="/create-business" element={<CreateBusiness />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/qr-codes" element={<BusinessQRCodes />} />
                <Route path="/dashboard/rewards" element={<BusinessRewards />} />
                <Route path="/dashboard/pending-scans" element={<PendingScans />} />
                <Route path="/dashboard/staff" element={<DashboardStaff />} />
                <Route path="/dashboard/subscription" element={<Subscription />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/tours" element={<Tours />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/stories/create" element={<CreateStory />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/loop-wallet" element={<LoopWallet />} />
                <Route path="/wallet" element={<LoopWallet />} />
                <Route path="/scan/:qrCodeId" element={<ScanQR />} />
                <Route path="/scanner-mode" element={<ScannerMode />} />
                <Route path="/accept-invitation" element={<AcceptInvitation />} />
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

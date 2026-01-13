import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletBalance } from '@/components/loop/WalletBalance';
import { UserWalletQR } from '@/components/loop/UserWalletQR';
import { TransactionHistory } from '@/components/loop/TransactionHistory';
import { RewardsList } from '@/components/loop/RewardsList';
import { MissionsList } from '@/components/loop/MissionsList';
import { BadgesDisplay } from '@/components/loop/BadgesDisplay';
import { CausesList } from '@/components/loop/CausesList';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, Gift, Target, Heart, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Loop() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <>
        <SEOHead
          title="Loop | ToledoLokal"
          description="Earn and redeem Loop Points at local Toledo businesses"
        />
        <div className="min-h-screen bg-background pb-24">
          <div className="px-4 pt-safe-top">
            <header className="py-4">
              <h1 className="text-xl font-bold text-foreground">Loop</h1>
            </header>
          </div>
          
          <div className="px-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <LogIn className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sign in to access Loop</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create an account to start earning Loop Points at local Toledo businesses
            </p>
            <Button onClick={() => navigate('/auth')} size="lg">
              Sign In to Get Started
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Loop | ToledoLokal"
        description="Earn and redeem Loop Points at local Toledo businesses"
      />
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-safe-top">
          <header className="py-4">
            <h1 className="text-xl font-bold text-foreground">Loop</h1>
            <p className="text-sm text-muted-foreground">Earn rewards. Support local.</p>
          </header>
        </div>

        <div className="px-4 space-y-4">
          <WalletBalance />
          <UserWalletQR />
          <BadgesDisplay />
          
          <Tabs defaultValue="rewards" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-12 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger 
                value="rewards" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col gap-0.5 py-1.5"
              >
                <Gift className="h-4 w-4" />
                <span className="text-[10px]">Rewards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="missions"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col gap-0.5 py-1.5"
              >
                <Target className="h-4 w-4" />
                <span className="text-[10px]">Missions</span>
              </TabsTrigger>
              <TabsTrigger 
                value="causes"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col gap-0.5 py-1.5"
              >
                <Heart className="h-4 w-4" />
                <span className="text-[10px]">Give</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex flex-col gap-0.5 py-1.5"
              >
                <History className="h-4 w-4" />
                <span className="text-[10px]">History</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="rewards" className="mt-4">
              <RewardsList />
            </TabsContent>
            
            <TabsContent value="missions" className="mt-4">
              <MissionsList />
            </TabsContent>
            
            <TabsContent value="causes" className="mt-4">
              <CausesList />
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <TransactionHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

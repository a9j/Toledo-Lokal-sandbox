import { useEffect } from 'react';
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
import { LogIn } from 'lucide-react';
import { useLoop } from '@/contexts/LoopContext';

export default function LoopWallet() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { ensureLoaded } = useLoop();
  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  if (!user) {
    return (
      <>
        <SEOHead
          title="Loop Wallet | ToledoLokal"
          description="Earn and redeem Loop Points at local Toledo businesses"
        />
        <Header title="Loop Wallet" />
        <PageContainer className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <LogIn className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Sign in to access your wallet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create an account to start earning Loop Points at local Toledo businesses
          </p>
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Loop Wallet | ToledoLokal"
        description="Earn and redeem Loop Points at local Toledo businesses"
      />
      <Header title="Loop Wallet" />
      <PageContainer className="space-y-4 pb-24">
        <WalletBalance />
        <UserWalletQR />
        <BadgesDisplay />
        
        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="missions">Missions</TabsTrigger>
            <TabsTrigger value="causes">Give</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
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
      </PageContainer>
    </>
  );
}

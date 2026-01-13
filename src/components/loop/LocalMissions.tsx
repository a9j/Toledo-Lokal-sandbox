import { useState } from 'react';
import { 
  Compass, 
  Heart, 
  HandHeart, 
  Footprints,
  ChevronRight, 
  Check,
  Sparkles,
  MapPin,
  Calendar,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLoopMissions, useUserMissionProgress, useJoinMission, useClaimMissionReward, LoopMission } from '@/hooks/useLoopMissions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';

// Map mission types to user-friendly categories per spec
const missionCategories = {
  visits: { label: 'Explore', icon: Compass, color: 'bg-blue-500/10 text-blue-600' },
  category: { label: 'Explore', icon: Compass, color: 'bg-blue-500/10 text-blue-600' },
  neighborhood: { label: 'Explore', icon: Compass, color: 'bg-blue-500/10 text-blue-600' },
  mwbe: { label: 'Support', icon: Heart, color: 'bg-rose-500/10 text-rose-600' },
  tourism: { label: 'Explore', icon: Compass, color: 'bg-blue-500/10 text-blue-600' },
  event: { label: 'Movement', icon: Footprints, color: 'bg-amber-500/10 text-amber-600' },
  donation: { label: 'Give Back', icon: HandHeart, color: 'bg-emerald-500/10 text-emerald-600' },
};

function MissionCard({ 
  mission, 
  progress, 
  onJoin, 
  onClaim, 
  isJoining,
  isClaiming 
}: {
  mission: LoopMission;
  progress?: {
    id: string;
    progress_count: number;
    completed_at: string | null;
    reward_claimed_at: string | null;
  };
  onJoin: () => void;
  onClaim: () => void;
  isJoining: boolean;
  isClaiming: boolean;
}) {
  const isJoined = !!progress;
  const isCompleted = !!progress?.completed_at;
  const canClaim = isCompleted && !progress?.reward_claimed_at;
  const hasClaimed = !!progress?.reward_claimed_at;
  const progressPercent = progress 
    ? Math.min((progress.progress_count / mission.required_count) * 100, 100)
    : 0;

  const category = missionCategories[mission.mission_type] || missionCategories.visits;
  const CategoryIcon = category.icon;

  const endDate = mission.end_date ? parseISO(mission.end_date) : null;
  const isExpiringSoon = endDate && !isPast(endDate) && 
    (endDate.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl transition-all duration-300",
      "bg-gradient-to-br from-card to-card/80",
      "border border-border/50 hover:border-border",
      "hover:shadow-lg hover:shadow-primary/5",
      hasClaimed && "opacity-75"
    )}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
            "transition-transform duration-300 group-hover:scale-105",
            hasClaimed ? "bg-emerald-500/10" : category.color
          )}>
            {hasClaimed ? (
              <Check className="h-6 w-6 text-emerald-600" />
            ) : (
              <CategoryIcon className="h-6 w-6" />
            )}
          </div>

          {/* Title & Purpose */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {mission.title}
              </h3>
              {mission.is_featured && (
                <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {mission.description}
            </p>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
          <Badge variant="secondary" className={cn("font-medium", category.color)}>
            {category.label}
          </Badge>
          
          {endDate && !isPast(endDate) && (
            <span className={cn(
              "flex items-center gap-1.5 text-muted-foreground",
              isExpiringSoon && "text-amber-600"
            )}>
              <Calendar className="h-3.5 w-3.5" />
              {isExpiringSoon 
                ? `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`
                : format(endDate, 'MMM d')
              }
            </span>
          )}

          {mission.neighborhood?.name && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {mission.neighborhood.name}
            </span>
          )}
        </div>

        {/* Progress Section */}
        {isJoined && !hasClaimed && (
          <div className="mb-4 p-3 rounded-xl bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Your progress</span>
              <span className="text-sm font-medium">
                {progress.progress_count} of {mission.required_count}
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-2"
            />
            {isCompleted && (
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                Mission complete! Claim your reward below.
              </p>
            )}
          </div>
        )}

        {/* Reward & Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5">
              <Gift className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-medium text-primary">
                {mission.points_reward} pts
              </span>
            </div>
          </div>

          {hasClaimed ? (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <Check className="h-4 w-4" />
              Completed
            </div>
          ) : canClaim ? (
            <Button 
              size="sm" 
              onClick={onClaim}
              disabled={isClaiming}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
            >
              {isClaiming ? 'Claiming...' : 'Claim Reward'}
            </Button>
          ) : isJoined ? (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Footprints className="h-3.5 w-3.5" />
              In progress
            </div>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onJoin}
              disabled={isJoining}
              className="group/btn"
            >
              {isJoining ? 'Joining...' : 'Start Mission'}
              <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function LocalMissions() {
  const { user } = useAuth();
  const { data: missions, isLoading } = useLoopMissions();
  const { data: progress } = useUserMissionProgress();
  const joinMission = useJoinMission();
  const claimReward = useClaimMissionReward();
  const { toast } = useToast();

  const getProgressForMission = (missionId: string) => {
    return progress?.find(p => p.mission_id === missionId);
  };

  const handleJoin = async (mission: LoopMission) => {
    if (!user) {
      toast({
        title: "Sign in to participate",
        description: "Create an account to start your local journey",
      });
      return;
    }

    try {
      await joinMission.mutateAsync(mission.id);
      toast({
        title: "You're in!",
        description: `Started "${mission.title}" — visit local spots to make progress`,
      });
    } catch (error: any) {
      toast({
        title: "Couldn't join",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleClaim = async (progressId: string, missionTitle: string) => {
    try {
      const result = await claimReward.mutateAsync(progressId);
      toast({
        title: "Mission Complete",
        description: `You earned ${result.points} Loop Points for completing "${missionTitle}"`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to claim reward",
        variant: "destructive",
      });
    }
  };

  // Separate missions into active (joined) and available
  const activeMissions = missions?.filter(m => getProgressForMission(m.id) && !getProgressForMission(m.id)?.reward_claimed_at) || [];
  const availableMissions = missions?.filter(m => !getProgressForMission(m.id)) || [];
  const completedMissions = missions?.filter(m => getProgressForMission(m.id)?.reward_claimed_at) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Local Missions</h2>
            <p className="text-sm text-muted-foreground">Simple ways to participate in Toledo</p>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasMissions = missions && missions.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Local Missions</h2>
        <p className="text-sm text-muted-foreground">
          Simple ways to participate in Toledo — no pressure, just possibilities
        </p>
      </div>

      {!hasMissions ? (
        <div className="text-center py-12 px-6 rounded-2xl bg-muted/20 border border-dashed border-border">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Compass className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-medium text-foreground mb-1">No missions right now</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Check back soon — new ways to explore and support Toledo are always coming
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Missions */}
          {activeMissions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Your Active Missions
              </h3>
              <div className="space-y-3">
                {activeMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    progress={getProgressForMission(mission.id)}
                    onJoin={() => handleJoin(mission)}
                    onClaim={() => handleClaim(getProgressForMission(mission.id)!.id, mission.title)}
                    isJoining={joinMission.isPending}
                    isClaiming={claimReward.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Missions */}
          {availableMissions.length > 0 && (
            <div className="space-y-3">
              {activeMissions.length > 0 && (
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Available Missions
                </h3>
              )}
              <div className="space-y-3">
                {availableMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    progress={undefined}
                    onJoin={() => handleJoin(mission)}
                    onClaim={() => {}}
                    isJoining={joinMission.isPending}
                    isClaiming={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed (collapsed) */}
          {completedMissions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Completed
              </h3>
              <div className="space-y-3">
                {completedMissions.slice(0, 2).map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    progress={getProgressForMission(mission.id)}
                    onJoin={() => {}}
                    onClaim={() => {}}
                    isJoining={false}
                    isClaiming={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

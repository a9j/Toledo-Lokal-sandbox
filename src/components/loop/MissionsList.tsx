import { Target, CheckCircle2, Clock, ChevronRight, Award, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLoopMissions, useUserMissionProgress, useJoinMission, useClaimMissionReward, LoopMission } from '@/hooks/useLoopMissions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const missionTypeLabels = {
  visits: 'Visit Challenge',
  category: 'Category Challenge',
  neighborhood: 'Neighborhood',
  mwbe: 'Support MWBE',
  tourism: 'Toledo Explorer',
  event: 'Event',
  donation: 'Give Back',
};

export function MissionsList() {
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
        title: "Sign in required",
        description: "Please sign in to join missions",
        variant: "destructive",
      });
      return;
    }

    try {
      await joinMission.mutateAsync(mission.id);
      toast({
        title: "Mission joined!",
        description: `You've joined "${mission.title}"`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join mission",
        variant: "destructive",
      });
    }
  };

  const handleClaim = async (progressId: string, missionTitle: string) => {
    try {
      const result = await claimReward.mutateAsync(progressId);
      toast({
        title: "Reward claimed!",
        description: `You earned ${result.points} Loop Points and a badge for completing "${missionTitle}"!`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to claim reward",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Missions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Active Missions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!missions || missions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active missions</p>
            <p className="text-sm">Check back soon for new challenges!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {missions.map((mission) => {
              const missionProgress = getProgressForMission(mission.id);
              const isJoined = !!missionProgress;
              const isCompleted = !!missionProgress?.completed_at;
              const canClaim = isCompleted && !missionProgress?.reward_claimed_at;
              const progressPercent = missionProgress 
                ? (missionProgress.progress_count / mission.required_count) * 100 
                : 0;

              return (
                <div
                  key={mission.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    mission.is_featured && "border-primary/50 bg-primary/5",
                    isCompleted && "bg-success/5 border-success/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${mission.badge_color}20` }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      ) : (
                        <Target className="h-6 w-6" style={{ color: mission.badge_color || undefined }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{mission.title}</span>
                        {mission.is_featured && (
                          <Badge variant="secondary" className="text-[10px]">Featured</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {mission.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {mission.points_reward} pts
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {mission.current_participants} joined
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {missionTypeLabels[mission.mission_type]}
                        </Badge>
                      </div>

                      {isJoined && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {missionProgress.progress_count} / {mission.required_count}
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {canClaim ? (
                        <Button
                          size="sm"
                          onClick={() => handleClaim(missionProgress.id, mission.title)}
                          disabled={claimReward.isPending}
                        >
                          Claim Reward
                        </Button>
                      ) : isJoined ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          In Progress
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJoin(mission)}
                          disabled={joinMission.isPending}
                        >
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

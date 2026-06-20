import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useChallenges, useUserBadges } from '@/hooks/useChallenges';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Star, CheckCircle2, ChevronRight, Award, Lock, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Challenges() {
  const { data: challenges, isLoading } = useChallenges();
  const { data: badges } = useUserBadges();
  const { user } = useAuth();

  const earnedChallengeIds = badges?.map(b => b.challenge_id) || [];

  return (
    <div className="min-h-screen bg-background pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <SEOHead 
        title="Local Challenges"
        description="Support local Toledo businesses through fun challenges. Visit spots, earn badges, and unlock exclusive rewards in the Glass City."
        url="/challenges"
        keywords={['Toledo challenges', 'local rewards', 'Toledo badges', 'support local Toledo', 'Glass City loyalty']}
      />
      <Header title="Challenges" />

      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Support Local Challenges</h1>
          <p className="text-muted-foreground">
            Visit local spots, earn badges, and unlock rewards
          </p>
        </div>

        {/* User Badges */}
        {user && badges && badges.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-toledo-gold" />
              Your Badges ({badges.length})
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: badge.challenge?.badge_color || '#5C8A6E' }}
                >
                  {badge.challenge?.badge_icon || <Trophy className="h-6 w-6 text-white" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))
          ) : challenges && challenges.length > 0 ? (
            challenges.map((challenge) => {
              const isCompleted = earnedChallengeIds.includes(challenge.id);
              
              return (
                <Link
                  key={challenge.id}
                  to={`/challenges/${challenge.id}`}
                  className={`block bg-card rounded-2xl p-4 border border-border hover-lift ${isCompleted ? 'ring-2 ring-primary/30' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: challenge.badge_color || '#5C8A6E' }}
                    >
                      {challenge.badge_icon || <Target className="h-6 w-6 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{challenge.title}</h3>
                        {isCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                        {challenge.featured && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" /> Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {challenge.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Visit {challenge.required_visits} spots to complete
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-1">No challenges yet</h3>
              <p className="text-sm text-muted-foreground">
                Check back here for new ways to explore Toledo and earn rewards.
              </p>
            </div>
          )}
        </div>

        {!user && (
          <div className="mt-6 p-4 bg-secondary rounded-2xl text-center">
            <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Sign in to track your progress and earn badges
            </p>
            <Link to="/auth" className="text-primary font-medium text-sm">
              Sign In →
            </Link>
          </div>
        )}
       </div>
    </div>
  );
}

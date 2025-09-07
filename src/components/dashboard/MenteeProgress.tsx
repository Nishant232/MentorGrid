import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Star, Calendar, Award, Zap, Target, BookOpen, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GamificationService } from "@/lib/gamification-service";

export function MenteeProgress() {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [animateXP, setAnimateXP] = useState(false);
  
  // Fetch user stats and achievements
  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return null;
      
      // Fetch user stats from gamification service
      return GamificationService.getUserStats(userId);
    }
  });
  
  // Fetch user achievements
  const { data: userAchievements, isLoading: isLoadingAchievements } = useQuery({
    queryKey: ["user-achievements"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return [];
      
      // Fetch user achievements from gamification service
      return GamificationService.getUserAchievements(userId);
    },
    onSuccess: (data) => {
      // If no badge is selected yet, select the first earned badge if available
      if (!selectedBadge && data && data.length > 0) {
        setSelectedBadge(data[0].id);
      }
    }
  });
  
  // Fetch all available achievements
  const { data: allAchievements } = useQuery({
    queryKey: ["all-achievements"],
    queryFn: async () => {
      return GamificationService.getAllAchievements();
    },
    staleTime: 1000 * 60 * 60 // 1 hour
  });
  
  // Process data into progressData format
  const progressData = userStats && userAchievements ? {
    totalSessions: userStats.sessions_completed || 0,
    currentStreak: userStats.streak_days || 0,
    totalXP: userStats.total_xp || 0,
    badges: userAchievements.map(a => ({
      code: a.id,
      name: a.name || "",
      description: a.description || "",
      earned: true,
      icon: getAchievementIcon(a.category),
      category: a.category || "",
      xpValue: a.xp_reward || 0
    })),
    allBadges: [],
    nextSessionMilestone: calculateNextMilestone(userStats.sessions_completed || 0),
    sessionsToNextMilestone: calculateSessionsToNextMilestone(userStats.sessions_completed || 0)
  } : null;
  
  // Helper function to get achievement icon
  function getAchievementIcon(category) {
    switch(category) {
      case "streak": return <Flame className="h-5 w-5" />;
      case "milestone": 
        return <BookOpen className="h-5 w-5" />;
      case "master": 
        return <Trophy className="h-5 w-5" />;
      default: 
        return <Target className="h-5 w-5" />;
    }
  }
  
  // Helper function to calculate next milestone
  function calculateNextMilestone(sessions) {
    return sessions < 5 ? 5 : 
           sessions < 10 ? 10 : 
           sessions < 25 ? 25 : 
           sessions < 50 ? 50 : 100;
  }
  
  // Helper function to calculate sessions to next milestone
  function calculateSessionsToNextMilestone(sessions) {
    return sessions < 5 ? 5 - sessions : 
           sessions < 10 ? 10 - sessions : 
           sessions < 25 ? 25 - sessions : 
           sessions < 50 ? 50 - sessions : 
           100 - sessions;
  }
  
  // Helper function to get next streak milestone
  const getNextStreakMilestone = (streakDays) => {
    if (streakDays < 3) return 3;
    if (streakDays < 7) return 7;
    if (streakDays < 14) return 14;
    if (streakDays < 30) return 30;
    if (streakDays < 60) return 60;
    if (streakDays < 90) return 90;
    return Math.ceil(streakDays / 30) * 30; // Next 30-day milestone
  };
  
  const isLoading = isLoadingStats || isLoadingAchievements;
  
  // Animate XP progress on load
  useEffect(() => {
    if (progressData && !animateXP) {
      setAnimateXP(true);
    }
  }, [progressData, animateXP]);

  const nextLevelXP = 2000;
  const currentLevel = Math.floor((progressData?.totalXP || 0) / nextLevelXP) + 1;
  const xpInCurrentLevel = (progressData?.totalXP || 0) % nextLevelXP;
  const progressPercentage = (xpInCurrentLevel / nextLevelXP) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <h1 className="text-3xl font-bold">Progress</h1>
        </div>
        {progressData && (
          <Badge variant="outline" className="px-3 py-1 text-base">
            <Star className="h-4 w-4 mr-1 text-yellow-500 inline" />
            Level {currentLevel}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <p>Loading progress data...</p>
        </div>
      ) : (
        <>
          {/* Learning Streak Section */}
          <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Learning Streak
              </CardTitle>
              <CardDescription>
                Maintain your streak by attending sessions regularly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Current Streak</div>
                  <div className="text-3xl font-bold flex items-center">
                    {progressData?.currentStreak || 0} 
                    <span className="text-base ml-1 font-normal text-muted-foreground">days</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(progressData?.currentStreak || 0, 5) }).map((_, i) => (
                    <Flame 
                      key={i} 
                      className={cn(
                        "h-5 w-5", 
                        i === 0 ? "text-orange-300" : 
                        i === 1 ? "text-orange-400" : 
                        i === 2 ? "text-orange-500" : 
                        i === 3 ? "text-orange-600" : 
                        "text-orange-700"
                      )} 
                    />
                  ))}
                </div>
              </div>
              
              {/* Next streak milestone */}
              {progressData?.currentStreak !== undefined && (
                <div className="mt-3 text-sm text-muted-foreground">
                  {progressData.currentStreak < 3 ? (
                    <p>{3 - progressData.currentStreak} more day(s) to earn the Consistency badge!</p>
                  ) : progressData.currentStreak < 7 ? (
                    <p>{7 - progressData.currentStreak} more day(s) to earn the Momentum badge!</p>
                  ) : progressData.currentStreak < 30 ? (
                    <p>{30 - progressData.currentStreak} more day(s) to earn the Unstoppable badge!</p>
                  ) : (
                    <p>You've reached the highest streak badge! Keep it up!</p>
                  )}
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Streak Bonus:</span>
                  <span className="text-primary">+{(progressData?.currentStreak || 0) * 5} XP</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Log in daily to maintain your streak and earn bonus XP!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Badges Earned Section */}
          <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" />
                Achievements
              </CardTitle>
              <CardDescription>
                Earn badges by reaching milestones and maintaining streaks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {allAchievements?.map((achievement) => {
                    const isEarned = userAchievements?.some(ua => ua.id === achievement.id);
                    const badge = {
                      code: achievement.id,
                      name: achievement.name || "",
                      description: achievement.description || "",
                      earned: isEarned,
                      icon: getAchievementIcon(achievement.category),
                      category: achievement.category || "",
                      xpValue: achievement.xp_reward || 0
                    };
                    return (
                      <Tooltip key={badge.code}>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => setSelectedBadge(badge.code)}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                              selectedBadge === badge.code ? "ring-2 ring-primary" : "",
                              badge.earned 
                                ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                                : 'bg-muted/50 border-muted opacity-50 hover:opacity-60'
                            )}
                          >
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center text-lg transition-transform",
                              selectedBadge === badge.code ? "scale-110" : "",
                              badge.earned ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                            )}>
                              {badge.icon}
                            </div>
                            <div className="text-sm font-medium text-center">
                              {badge.name}
                            </div>
                            {badge.earned && (
                              <Badge variant="secondary" className="text-xs">+{badge.xpValue} XP</Badge>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{badge.description}</p>
                          {!badge.earned && badge.category === "milestone" && (
                            <p className="text-xs mt-1">Complete {badge.code.includes("sessions") ? badge.code.split("_")[1] : "1"} sessions to earn</p>
                          )}
                          {!badge.earned && badge.category === "streak" && (
                            <p className="text-xs mt-1">Maintain a {badge.code.split("_")[1]}-day streak to earn</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
              
              {/* Selected badge details */}
              {selectedBadge && (
                <div className="mt-4 p-4 border rounded-lg bg-card">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl">
                      {getAchievementIcon(allAchievements?.find(a => a.id === selectedBadge)?.category || 'general')}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold">
                        {allAchievements?.find(a => a.id === selectedBadge)?.name || 'Achievement'}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {allAchievements?.find(a => a.id === selectedBadge)?.description || ''}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">+{allAchievements?.find(a => a.id === selectedBadge)?.xp_reward || 0} XP</Badge>
                        {userAchievements?.find(a => a.id === selectedBadge)?.earned_at && (
                          <Badge variant="outline" className="text-xs">
                            Earned on {new Date(userAchievements.find(a => a.id === selectedBadge)?.earned_at).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points & Progress Section */}
          <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Experience Points
              </CardTitle>
              <CardDescription>
                Earn XP by attending sessions, maintaining streaks, and earning badges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Level {currentLevel} Progress</div>
                    <div className="text-3xl font-bold">
                      {animateXP ? progressData?.totalXP || 0 : 0} XP
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Next Level</div>
                    <div className="text-lg font-medium">Level {currentLevel + 1}</div>
                  </div>
                </div>
                
                <Progress 
                  value={animateXP ? progressPercentage : 0} 
                  className="h-3 transition-all duration-1000" 
                />
                
                <div className="flex justify-between text-sm">
                  <span>{xpInCurrentLevel} / {nextLevelXP} XP</span>
                  <span className="font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                
                {/* XP Breakdown */}
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">XP Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sessions ({progressData?.totalSessions || 0})</span>
                      <span>{(progressData?.totalSessions || 0) * 10} XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Streak Bonus ({progressData?.currentStreak || 0} days)</span>
                      <span>{(progressData?.currentStreak || 0) * 5} XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Badges ({progressData?.badges?.length || 0})</span>
                      <span>{progressData?.badges?.reduce((sum, badge) => sum + badge.xpValue, 0) || 0} XP</span>
                    </div>
                  </div>
                </div>
                
                {/* Next milestone */}
                <div className="mt-2 pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">Next Milestone</h3>
                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{progressData?.nextSessionMilestone} Sessions Badge</p>
                      <p className="text-sm text-muted-foreground">
                        {progressData?.sessionsToNextMilestone} more session(s) to go
                      </p>
                    </div>
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Star, Calendar, Award, Zap, Target, BookOpen, Sparkles, TrendingUp, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GamificationService } from "@/lib/gamification-service";
import { ModernLineChart } from "@/components/charts/ModernLineChart";
import { ModernBarChart } from "@/components/charts/ModernBarChart";
import { ProgressRingChart } from "@/components/charts/ProgressRingChart";

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
    }
  });

  // Set selected badge when achievements load
  useEffect(() => {
    if (!selectedBadge && userAchievements && userAchievements.length > 0) {
      setSelectedBadge(userAchievements[0].id);
    }
  }, [userAchievements, selectedBadge]);
  
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
    badges: (userAchievements as any[]).map(a => ({
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

  // Mock data for charts
  const progressChartData = [
    { name: 'Week 1', sessions: 2, xp: 120 },
    { name: 'Week 2', sessions: 3, xp: 180 },
    { name: 'Week 3', sessions: 1, xp: 60 },
    { name: 'Week 4', sessions: 4, xp: 240 },
    { name: 'Week 5', sessions: 2, xp: 140 }
  ];

  const skillsData = [
    { skill: 'Leadership', progress: 75 },
    { skill: 'Communication', progress: 60 },
    { skill: 'Technical Skills', progress: 85 },
    { skill: 'Problem Solving', progress: 70 }
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Trophy className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Progress & Analytics</h1>
          <p className="text-muted-foreground">Track your learning journey and achievements</p>
        </div>
        {progressData && (
          <Badge variant="outline" className="px-3 py-1 text-base ml-auto">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
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
          {/* Progress Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ModernLineChart
              data={progressChartData}
              title="Learning Progress"
              dataKey="xp"
              xAxisKey="name"
              color="hsl(var(--primary))"
            />
            <ProgressRingChart
              percentage={progressPercentage}
              title="Level Progress"
              subtitle={`${xpInCurrentLevel} / ${nextLevelXP} XP`}
            />
          </div>

          {/* Skills Progress */}
          <Card className="transition-smooth hover:shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-success" />
                </div>
                Skill Development
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillsData.map((skill) => (
                <div key={skill.skill} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{skill.skill}</span>
                    <span className="text-sm text-muted-foreground">{skill.progress}%</span>
                  </div>
                  <Progress value={skill.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rest of existing progress components... */}
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AchievementsList } from "@/components/dashboard/AchievementCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Award, Star, Sparkles, BookOpen, Zap, Target, Flame, MessageSquare, Calendar } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

// Mock achievements data - in a real app, this would come from the database
const achievementsData = [
  // Learning achievements
  {
    id: "learn-1",
    name: "First Steps",
    description: "Complete your first learning session",
    icon: <BookOpen className="h-5 w-5" />,
    progress: 1,
    maxProgress: 1,
    completed: true,
    xpReward: 50,
    category: "learning"
  },
  {
    id: "learn-2",
    name: "Knowledge Seeker",
    description: "Complete 5 learning sessions",
    icon: <BookOpen className="h-5 w-5" />,
    progress: 3,
    maxProgress: 5,
    completed: false,
    xpReward: 100,
    category: "learning"
  },
  {
    id: "learn-3",
    name: "Master Student",
    description: "Complete 20 learning sessions",
    icon: <BookOpen className="h-5 w-5" />,
    progress: 3,
    maxProgress: 20,
    completed: false,
    xpReward: 250,
    category: "learning"
  },
  
  // Streak achievements
  {
    id: "streak-1",
    name: "Consistency",
    description: "Maintain a 3-day learning streak",
    icon: <Flame className="h-5 w-5" />,
    progress: 3,
    maxProgress: 3,
    completed: true,
    xpReward: 75,
    category: "streak"
  },
  {
    id: "streak-2",
    name: "Dedication",
    description: "Maintain a 7-day learning streak",
    icon: <Flame className="h-5 w-5" />,
    progress: 5,
    maxProgress: 7,
    completed: false,
    xpReward: 150,
    category: "streak"
  },
  {
    id: "streak-3",
    name: "Unstoppable",
    description: "Maintain a 30-day learning streak",
    icon: <Flame className="h-5 w-5" />,
    progress: 5,
    maxProgress: 30,
    completed: false,
    xpReward: 500,
    category: "streak"
  },
  
  // Feedback achievements
  {
    id: "feedback-1",
    name: "Reviewer",
    description: "Leave your first feedback for a mentor",
    icon: <MessageSquare className="h-5 w-5" />,
    progress: 1,
    maxProgress: 1,
    completed: true,
    xpReward: 50,
    category: "feedback"
  },
  {
    id: "feedback-2",
    name: "Constructive Critic",
    description: "Leave 5 detailed feedback reviews",
    icon: <MessageSquare className="h-5 w-5" />,
    progress: 2,
    maxProgress: 5,
    completed: false,
    xpReward: 125,
    category: "feedback"
  },
  
  // Goal achievements
  {
    id: "goal-1",
    name: "Goal Setter",
    description: "Set your first learning goal",
    icon: <Target className="h-5 w-5" />,
    progress: 1,
    maxProgress: 1,
    completed: true,
    xpReward: 50,
    category: "goals"
  },
  {
    id: "goal-2",
    name: "Goal Achiever",
    description: "Complete your first learning goal",
    icon: <Target className="h-5 w-5" />,
    progress: 0,
    maxProgress: 1,
    completed: false,
    xpReward: 100,
    category: "goals"
  },
  
  // Session achievements
  {
    id: "session-1",
    name: "First Meeting",
    description: "Schedule your first mentoring session",
    icon: <Calendar className="h-5 w-5" />,
    progress: 1,
    maxProgress: 1,
    completed: true,
    xpReward: 50,
    category: "sessions"
  },
  {
    id: "session-2",
    name: "Regular Learner",
    description: "Schedule 5 mentoring sessions",
    icon: <Calendar className="h-5 w-5" />,
    progress: 2,
    maxProgress: 5,
    completed: false,
    xpReward: 150,
    category: "sessions"
  }
];

export default function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  
  // Define type for user stats
  type UserStats = {
    total_xp: number;
    level: number;
    streak_days: number;
    sessions_completed: number;
    goals_completed: number;
    feedback_given: number;
  };

  // Fetch user stats from leaderboard table
  const { data: userStats, isLoading } = useQuery<UserStats>({
    queryKey: ["user-stats"],
    queryFn: async (): Promise<UserStats> => {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          total_xp: 0,
          level: 1,
          streak_days: 0,
          sessions_completed: 0,
          goals_completed: 0,
          feedback_given: 0
        };
      }

      // Get current user stats from leaderboard
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("user_id", user.id)
        .single();
        
      if (error || !data) {
        console.error("Error fetching user stats:", error);
        return {
          total_xp: 325,
          level: 3,
          streak_days: 5,
          sessions_completed: 3,
          goals_completed: 0,
          feedback_given: 2
        };
      }
      
      // Calculate level from XP (100 XP per level)
      const level = Math.floor(data.xp / 100) + 1;
      
      return {
        total_xp: data.xp || 0,
        level: level,
        streak_days: data.current_streak_days || 0,
        sessions_completed: 3,
        goals_completed: 0,
        feedback_given: 2
      };
    }
  });
  
  // Filter achievements based on selected category
  const filteredAchievements = selectedCategory === "all" 
    ? achievementsData 
    : achievementsData.filter(a => a.category === selectedCategory);
  
  // Calculate total XP from completed achievements
  const earnedXP = achievementsData
    .filter(a => a.completed)
    .reduce((sum, a) => sum + a.xpReward, 0);
  
  // Calculate total possible XP from all achievements
  const totalPossibleXP = achievementsData
    .reduce((sum, a) => sum + a.xpReward, 0);
  
  // Calculate completion percentage
  const completedCount = achievementsData.filter(a => a.completed).length;
  const totalCount = achievementsData.length;
  const completionPercentage = (completedCount / totalCount) * 100;
  
  // Calculate XP needed for next level (simplified formula)
  const xpForNextLevel = (userStats?.level || 0) * 100 + 200;
  const levelProgress = ((userStats?.total_xp || 0) / xpForNextLevel) * 100;
  
  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground">
            Track your progress and earn rewards for your learning journey.
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-[180px] rounded-lg" />
            <Skeleton className="h-[180px] rounded-lg" />
            <Skeleton className="h-[180px] rounded-lg" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* XP and Level Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Experience Points
                </CardTitle>
                <CardDescription>
                  Level {userStats?.level || 0} • {userStats?.total_xp || 0} XP total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Level Progress</span>
                      <span>{userStats?.total_xp || 0} / {xpForNextLevel} XP</span>
                    </div>
                    <Progress value={levelProgress} className="h-2" />
                  </div>
                  
                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Achievement XP</span>
                      <span className="font-medium">{earnedXP} / {totalPossibleXP} XP</span>
                    </div>
                    <Progress 
                      value={(earnedXP / totalPossibleXP) * 100} 
                      className="h-1.5" 
                    />
                    <p className="text-xs text-muted-foreground pt-1">
                      You've earned {earnedXP} XP from achievements
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Achievements Progress Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Achievement Progress
                </CardTitle>
                <CardDescription>
                  {completedCount} of {totalCount} achievements completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Progress value={completionPercentage} className="h-2" />
                    <p className="text-sm text-center">
                      {Math.round(completionPercentage)}% Complete
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="flex flex-col items-center justify-center p-2 bg-muted/50 rounded-lg">
                      <span className="text-2xl font-bold">{completedCount}</span>
                      <span className="text-xs text-muted-foreground">Completed</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-muted/50 rounded-lg">
                      <span className="text-2xl font-bold">{totalCount - completedCount}</span>
                      <span className="text-xs text-muted-foreground">Remaining</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Achievements Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Recent Achievements
                </CardTitle>
                <CardDescription>
                  Your latest accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievementsData
                    .filter(a => a.completed)
                    .slice(0, 3)
                    .map(achievement => (
                      <div key={achievement.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                          {achievement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{achievement.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          +{achievement.xpReward} XP
                        </Badge>
                      </div>
                    ))
                  }
                  
                  {achievementsData.filter(a => a.completed).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                      <Sparkles className="h-8 w-8 mb-2 opacity-50" />
                      <p>Complete achievements to see them here!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Achievement Categories */}
        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Achievements</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="streak">Streaks</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedCategory} className="mt-0">
            {isLoading ? (
              <Skeleton className="h-[400px] rounded-lg" />
            ) : (
              <AchievementsList 
                achievements={filteredAchievements}
                title={selectedCategory === "all" ? "All Achievements" : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Achievements`}
                description={selectedCategory === "all" ? "All available achievements" : `Achievements related to ${selectedCategory}`}
                onSelect={(achievement) => setSelectedAchievement(achievement.id === selectedAchievement ? null : achievement.id)}
                selectedId={selectedAchievement}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
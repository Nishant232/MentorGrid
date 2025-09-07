import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Users, Flame, Star, TrendingUp, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { GamificationService } from "@/lib/gamification-service";

export function LeaderboardView() {
  const [timeFrame, setTimeFrame] = useState<'all-time' | 'weekly' | 'monthly'>('all-time');
  const [userCategory, setUserCategory] = useState<string>('all');
  
  // Fetch leaderboard data based on time frame
  const { data: leaderboardData = [], isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ["leaderboard", timeFrame, userCategory],
    queryFn: async () => {
      const result = await GamificationService.getLeaderboard(timeFrame);
      
      // Add category information to each user (in a real app, this would come from the database)
      return result.map((user: any, index: number) => ({
        ...user,
        id: index + 1,
        category: ["Technology", "Marketing", "Finance", "Design", "Engineering", "Product Management", "Sales"][index % 7],
        full_name: user.username,
        xp: user.total_xp
      }));
    }
  });
  
  // Fetch user achievements
  const { data: userAchievements = [], isLoading: isLoadingAchievements } = useQuery({
    queryKey: ["user-achievements"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return [];
      
      // Use gamification service to fetch achievements
      const achievements = await GamificationService.getUserAchievements(userId);
      return achievements || [];
    }
  });

  // Get current user data and rank
  const { data: currentUserData } = useQuery({
    queryKey: ["current-user-data"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return null;

      // Get user profile and stats
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
        
      const stats = await GamificationService.getUserStats(userId);
        
      // Find user's position in leaderboard
      const userIndex = leaderboardData.findIndex(user => user.user_id === userId);
      const rank = userIndex >= 0 ? userIndex + 1 : null;
      
      return {
        profile,
        stats,
        rank
      };
    },
    enabled: leaderboardData.length > 0
  });

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <div className="w-5 h-5 flex items-center justify-center text-xs font-bold">#{position}</div>;
  };

  const globalLeaderboard = leaderboardData;
  const networkLeaderboard = leaderboardData.slice(0, 10); // Top 10 from network
  const categoryLeaderboard = leaderboardData.filter(user => user.category === "Technology").slice(0, 10);

  const LeaderboardTable = ({ data, title }: { data: any[], title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No data available</p>
        ) : (
          <div className="space-y-3">
            {data.map((user, index) => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index + 1)}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold">
                  {(user.full_name || 'U')[0]}
                </div>
                
                <div className="flex-1">
                  <div className="font-medium">{user.full_name}</div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-lg">{user.xp}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    {user.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Filter leaderboard data by category if needed
  const filteredLeaderboardData = userCategory === 'all' 
    ? leaderboardData 
    : leaderboardData.filter(user => user.category === userCategory);
    
  // Get categories for filter
  const categories = Array.from(new Set(leaderboardData.map(user => user.category)));
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
          <CardDescription>
            Track your progress and compete with other mentees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Time frame selector */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Time Frame:</span>
              <div className="flex bg-muted rounded-md p-1">
                <button
                  onClick={() => setTimeFrame('weekly')}
                  className={`px-3 py-1 text-xs rounded-md ${timeFrame === 'weekly' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <Calendar className="inline mr-1 h-3 w-3" /> Weekly
                </button>
                <button
                  onClick={() => setTimeFrame('monthly')}
                  className={`px-3 py-1 text-xs rounded-md ${timeFrame === 'monthly' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <TrendingUp className="inline mr-1 h-3 w-3" /> Monthly
                </button>
                <button
                  onClick={() => setTimeFrame('all-time')}
                  className={`px-3 py-1 text-xs rounded-md ${timeFrame === 'all-time' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <Star className="inline mr-1 h-3 w-3" /> All-Time
                </button>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="global">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="global">
                <Trophy className="mr-2 h-4 w-4" />
                Global
              </TabsTrigger>
              <TabsTrigger value="network">
                <Users className="mr-2 h-4 w-4" />
                Network
              </TabsTrigger>
              <TabsTrigger value="category">
                <Award className="mr-2 h-4 w-4" />
                Category
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="global" className="space-y-4">
              <div className="space-y-4 mt-4">
                {currentUserData?.rank && (
                  <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">Your Rank: #{currentUserData.rank}</p>
                      <p className="text-sm text-muted-foreground">{currentUserData.stats?.total_xp || 0} XP total</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentUserData.stats?.streak_days && currentUserData.stats.streak_days > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          {currentUserData.stats.streak_days} day streak
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {isLeaderboardLoading ? (
                  <div className="flex justify-center p-8">
                    <p>Loading leaderboard...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredLeaderboardData.map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : index === 2 ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                            {index + 1}
                          </div>
                          <Avatar className="h-8 w-8 border">
                            <AvatarImage src={`https://avatar.vercel.sh/${user.user_id}?size=32`} alt={user.full_name} />
                            <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <Badge variant="outline" className="text-xs">{user.category}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="font-semibold">{user.xp} XP</div>
                          <Progress value={(user.xp / (filteredLeaderboardData[0]?.xp || 1)) * 100} className="h-1.5 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="network" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Leaderboard filtered to your network connections.</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-8 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Network Leaderboard</p>
                <p className="text-sm text-muted-foreground mt-1">Connect with more mentees to see them on your network leaderboard</p>
              </div>
            </TabsContent>
            
            <TabsContent value="category" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Leaderboard filtered by category.</p>
                <select 
                  className="text-sm border rounded-md px-2 py-1"
                  value={userCategory}
                  onChange={(e) => setUserCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {filteredLeaderboardData.length > 0 ? (
                <div className="space-y-2">
                  {filteredLeaderboardData.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : index === 2 ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8 border">
                          <AvatarImage src={`https://avatar.vercel.sh/${user.user_id}?size=32`} alt={user.full_name} />
                          <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <Badge variant="outline" className="text-xs">{user.category}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="font-semibold">{user.xp} XP</div>
                        <Progress value={(user.xp / (filteredLeaderboardData[0]?.xp || 1)) * 100} className="h-1.5 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-8 text-center">
                  <Award className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">No users found in this category</p>
                  <p className="text-sm text-muted-foreground mt-1">Try selecting a different category</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
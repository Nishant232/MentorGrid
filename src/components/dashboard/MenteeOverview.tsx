import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, ArrowRight, Users, TrendingUp, BookOpen, Award, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function MenteeOverview() {
  const navigate = useNavigate();

  const { data: recommendations = [] } = useQuery({
    queryKey: ["mentor-recommendations"],
    queryFn: async () => {
      // Get mentors based on mentee's interests
      const { data: mentors } = await supabase
        .from("mentor_profiles")
        .select(`
          id,
          user_id,
          hourly_rate,
          expertise_areas,
          bio
        `)
        .eq("is_active", true)
        .limit(3);

      if (!mentors) return [];

      // Get profile data separately
      const userIds = mentors.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      // Merge the data
      return mentors.map(mentor => ({
        ...mentor,
        profiles: profiles?.find(p => p.user_id === mentor.user_id)
      }));
    }
  });

  const { data: upcomingSessions } = useQuery({
    queryKey: ["mentee-upcoming-sessions"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return [];

      const { data: bookings } = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          mentor_user_id,
          notes,
          status
        `)
        .eq("mentee_user_id", userId)
        .in("status", ["pending", "confirmed"])
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(1);

      if (!bookings || bookings.length === 0) return [];

      // Get mentor profile data separately
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", bookings.map(b => b.mentor_user_id));

      // Merge the data
      return bookings.map(booking => ({
        ...booking,
        profiles: profiles?.find(p => p.user_id === booking.mentor_user_id)
      }));
    }
  });

  const nextSession = upcomingSessions?.[0];

  // Mock stats data - in real app this would come from your analytics
  const statsData = [
    { label: 'Sessions Completed', value: 12, icon: BookOpen, color: 'text-primary' },
    { label: 'Current Streak', value: 5, icon: Flame, color: 'text-orange-500' },
    { label: 'Learning Hours', value: 24, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Achievements', value: 8, icon: Award, color: 'text-purple-500' }
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Star className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">Here's your learning progress overview</p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <Card key={stat.label} className="transition-smooth hover:shadow-medium hover:scale-105">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-background/50", stat.color.replace('text-', 'bg-').replace('-500', '-100'))}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Session Section */}
      <Card className="transition-smooth hover:shadow-medium border-0 shadow-soft bg-gradient-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            Next Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextSession ? (
            <div className="flex items-center justify-between p-6 bg-background/60 rounded-xl border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    Confirmed
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {new Date(nextSession.start_time).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xl font-semibold mb-1">
                  Session with {nextSession.profiles?.full_name || 'Mentor'}
                </div>
                <div className="text-muted-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(nextSession.start_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate(`/session/${nextSession.id}`)}
                    className="bg-primary hover:bg-primary-hover transition-smooth"
                  >
                    Join Session
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/dashboard/mentee?section=bookings')}
                  >
                    View Details
                  </Button>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center w-32 h-32 rounded-2xl bg-gradient-hero text-white font-semibold text-3xl shadow-glow">
                {(nextSession.profiles?.full_name || 'M')[0]}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No upcoming sessions</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Ready to accelerate your learning? Book your first mentoring session today.
              </p>
              <Button 
                onClick={() => navigate("/find-mentor")} 
                size="lg"
                className="bg-gradient-hero hover:scale-105 transition-smooth shadow-glow"
              >
                Find Your Mentor
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Mentors Section */}
      <Card className="transition-smooth hover:shadow-medium">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Users className="h-5 w-5 text-success" />
              </div>
              Recommended Mentors
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/find-mentor")}
              className="transition-smooth hover:bg-primary hover:text-primary-foreground"
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No recommendations yet</p>
              <Button onClick={() => navigate("/find-mentor")} variant="outline">
                Explore Mentors
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {recommendations.map((mentor: any) => (
                <Card 
                  key={mentor.id} 
                  className="group cursor-pointer transition-smooth hover:shadow-medium hover:scale-[1.02] border-0 shadow-soft"
                  onClick={() => navigate(`/mentor/${mentor.user_id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-gradient-hero flex items-center justify-center text-white font-semibold text-lg shadow-glow">
                          {(mentor.profiles?.full_name || 'M')[0]}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-background"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg mb-1 truncate">
                          {mentor.profiles?.full_name || 'Mentor'}
                        </div>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          {mentor.expertise_areas?.[0] || 'Expert'}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {mentor.bio || 'Experienced professional ready to guide your learning journey.'}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">4.9</span>
                        <span className="text-xs text-muted-foreground">(127)</span>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-smooth"
                      >
                        View Profile
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Preview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="transition-smooth hover:shadow-medium">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              Learning Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">5</div>
              <div className="text-muted-foreground mb-4">Days in a row</div>
              <Progress value={83} className="mb-2" />
              <div className="text-sm text-muted-foreground">
                2 more days to reach your 7-day goal!
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-smooth hover:shadow-medium">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-500" />
              </div>
              Recent Achievement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-success rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div className="font-semibold mb-1">Session Master</div>
              <div className="text-sm text-muted-foreground mb-3">
                Completed 10 mentoring sessions
              </div>
              <Badge className="bg-gradient-success border-0 text-white">+50 XP</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
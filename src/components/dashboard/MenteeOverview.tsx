import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, ArrowRight, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Overview</h1>
      </div>

      {/* Upcoming Session Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextSession ? (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-lg font-medium mb-2">
                  Career Coaching Session with {nextSession.profiles?.full_name || 'Mentor'}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  {new Date(nextSession.start_time).toLocaleDateString()} at{' '}
                  {new Date(nextSession.start_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <Button 
                  onClick={() => navigate(`/session/${nextSession.id}`)}
                  className="bg-primary hover:bg-primary/90"
                >
                  View Details
                </Button>
              </div>
              <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold text-2xl">
                {(nextSession.profiles?.full_name || 'M')[0]}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
              <p className="text-muted-foreground mb-4">
                Book your first session to start your learning journey
              </p>
              <Button onClick={() => navigate("/find-mentor")}>
                Book a Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Mentors Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recommended Mentors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No recommendations yet</p>
              <Button onClick={() => navigate("/find-mentor")}>
                Find Mentors
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {recommendations.map((mentor: any) => (
                <div key={mentor.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold text-xl">
                      {(mentor.profiles?.full_name || 'M')[0]}
                    </div>
                    <div>
                      <div className="font-medium text-lg">
                        {mentor.profiles?.full_name || 'Mentor'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {mentor.expertise_areas?.[0] || 'Expert'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {mentor.bio || 'No bio available'}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {mentor.expertise_areas?.slice(0, 2).map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate(`/mentor/${mentor.user_id}`)}
                  >
                    View Profile
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users2, Star, Clock, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function MyMentors() {
  const navigate = useNavigate();

  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ["my-mentors"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return [];

      // Get mentors that the mentee has booked sessions with
      const { data: bookings } = await supabase
        .from("bookings")
        .select(`
          mentor_user_id,
          mentor_profiles!bookings_mentor_user_id_fkey(
            id,
            user_id,
            hourly_rate,
            expertise_areas,
            bio,
            profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)
          )
        `)
        .eq("mentee_user_id", userId)
        .not("mentor_user_id", "is", null);

      // Get unique mentors
      const uniqueMentors = bookings?.reduce((acc: any[], booking: any) => {
        if (booking.mentor_profiles && !acc.find(m => m.id === booking.mentor_profiles.id)) {
          acc.push(booking.mentor_profiles);
        }
        return acc;
      }, []) || [];

      return uniqueMentors;
    }
  });

  const handleBookSession = (mentorId: string) => {
    navigate(`/find-mentor?mentor=${mentorId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users2 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">My Mentors</h1>
        </div>
        <div className="text-muted-foreground">Loading mentors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users2 className="h-6 w-6" />
        <h1 className="text-3xl font-bold">My Mentors</h1>
      </div>

      {mentors.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No mentors yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your learning journey by booking your first session with a mentor.
              </p>
              <Button onClick={() => navigate("/find-mentor")}>
                Find Mentors
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mentors.map((mentor: any) => (
            <Card key={mentor.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold text-lg">
                    {(mentor.profiles?.full_name || 'M')[0]}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{mentor.profiles?.full_name || 'Mentor'}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {mentor.expertise_areas?.[0] || 'Expert'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {mentor.bio || 'No bio available'}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {mentor.expertise_areas?.slice(0, 3).map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>${mentor.hourly_rate}/hr</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Available</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleBookSession(mentor.user_id)}
                >
                  Book Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

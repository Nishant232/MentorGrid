import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Star, DollarSign, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function MentorOverview() {
  const { data: stats } = useQuery({
    queryKey: ["mentor-stats"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return null;

      // Get session count
      const { data: sessions } = await supabase
        .from("bookings")
        .select("id")
        .eq("mentor_user_id", userId)
        .eq("status", "completed");

      // Get average rating
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_user_id", userId);

      // Get earnings
      const { data: earnings } = await supabase
        .from("bookings")
        .select("price_cents")
        .eq("mentor_user_id", userId)
        .eq("status", "completed");

      const avgRating = reviews?.length 
        ? reviews.reduce((sum, r) => sum + (r as any).rating, 0) / reviews.length 
        : 0;
      
      const totalEarnings = earnings?.length 
        ? earnings.reduce((sum, e) => sum + ((e as any).price_cents || 0), 0) / 100 
        : 0;

      return {
        totalSessions: sessions?.length || 0,
        avgRating: Math.round(avgRating * 10) / 10,
        totalEarnings
      };
    }
  });

  const { data: upcomingSessions } = useQuery({
    queryKey: ["upcoming-sessions"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return [];

      const { data } = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          mentee_user_id,
          notes,
          profiles!bookings_mentee_user_id_fkey(full_name)
        `)
        .eq("mentor_user_id", userId)
        .in("status", ["pending", "confirmed"])
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(3);

      return data || [];
    }
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgRating || 0} ⭐</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalEarnings || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions?.length === 0 ? (
            <p className="text-muted-foreground">No upcoming sessions</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions?.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {(session.profiles as any)?.full_name || 'Student'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(session.start_time).toLocaleDateString()} at{' '}
                      {new Date(session.start_time).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session.notes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
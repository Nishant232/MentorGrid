import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Video, ArrowLeft, ArrowRight, CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ModernCalendar } from "./ModernCalendar";
import { cn } from "@/lib/utils";

export function Bookings() {
  const navigate = useNavigate();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["mentee-bookings"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return [];

      const { data } = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          mentor_user_id,
          mentee_feedback_submitted,
          mentor_feedback_submitted,
          profiles!bookings_mentor_user_id_fkey(full_name, avatar_url)
        `)
        .eq("mentee_user_id", userId)
        .order("start_time", { ascending: true });

      return data || [];
    }
  });

  const upcomingSessions = bookings.filter((booking: any) => 
    new Date(booking.start_time) > new Date() && 
    ["pending", "confirmed"].includes(booking.status)
  );

  const pastSessions = bookings.filter((booking: any) => 
    new Date(booking.start_time) < new Date() || 
    ["completed", "cancelled"].includes(booking.status)
  );

  // Transform bookings to calendar events
  const calendarEvents = bookings.map((booking: any) => ({
    id: booking.id,
    title: `Session with ${booking.profiles?.full_name || 'Mentor'}`,
    startTime: booking.start_time,
    endTime: booking.end_time,
    status: booking.status,
    mentor: booking.profiles?.full_name
  }));

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { variant: "default" as const, className: "bg-success text-success-foreground" },
      pending: { variant: "secondary" as const, className: "bg-yellow-500 text-white" },
      completed: { variant: "outline" as const, className: "bg-muted text-muted-foreground" },
      cancelled: { variant: "outline" as const, className: "bg-destructive/10 text-destructive" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleJoinSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  const handleReschedule = (sessionId: string) => {
    navigate(`/find-mentor?reschedule=${sessionId}`);
  };

  const handleLeaveFeedback = (sessionId: string) => {
    navigate(`/dashboard/feedback?bookingId=${sessionId}`);
  };

  const handleCancel = (sessionId: string) => {
    console.log("Cancel session:", sessionId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Your Sessions</h1>
            <p className="text-muted-foreground">Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <CalendarIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Your Sessions</h1>
          <p className="text-muted-foreground">Manage your upcoming and past mentoring sessions</p>
        </div>
      </div>

      {/* Modern Calendar View */}
      <ModernCalendar 
        events={calendarEvents} 
        onEventClick={(event) => console.log('Event clicked:', event)}
      />

      {/* Upcoming Sessions */}
      <Card className="transition-smooth hover:shadow-medium">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Clock className="h-5 w-5 text-success" />
              </div>
              Upcoming Sessions
              <Badge variant="outline">{upcomingSessions.length}</Badge>
            </CardTitle>
            {upcomingSessions.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/find-mentor")}
                className="transition-smooth hover:bg-primary hover:text-primary-foreground"
              >
                Book Another
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                <Clock className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No upcoming sessions</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Ready to learn something new? Book your next mentoring session.
              </p>
              <Button 
                onClick={() => navigate("/find-mentor")}
                size="lg"
                className="bg-gradient-hero hover:scale-105 transition-smooth shadow-glow"
              >
                Find a Mentor
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session: any) => (
                <Card key={session.id} className="transition-smooth hover:shadow-medium hover:scale-[1.01] border-0 shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-hero flex items-center justify-center text-white font-semibold text-lg shadow-glow">
                            {(session.profiles?.full_name || 'M')[0]}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-background"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold text-lg">
                              {session.profiles?.full_name || 'Mentor'}
                            </div>
                            {getStatusBadge(session.status)}
                          </div>
                          <div className="text-muted-foreground flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(session.start_time)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(session.start_time)} - {formatTime(session.end_time)}
                            </div>
                          </div>
                          {session.notes && (
                            <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                              {session.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {session.status === 'confirmed' && (
                          <Button 
                            onClick={() => handleJoinSession(session.id)}
                            className="bg-gradient-success hover:scale-105 transition-smooth"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Join Now
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReschedule(session.id)}
                        >
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Sessions */}
      <Card className="transition-smooth hover:shadow-medium">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            Past Sessions
            <Badge variant="outline">{pastSessions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No past sessions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastSessions.map((session: any) => (
                <Card key={session.id} className="transition-smooth hover:bg-card-hover border-0 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-semibold">
                          {(session.profiles?.full_name || 'M')[0]}
                        </div>
                        <div>
                          <div className="font-medium">
                            {session.profiles?.full_name || 'Mentor'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(session.start_time)} at {formatTime(session.start_time)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status)}
                        {session.status === 'completed' && !session.mentee_feedback_submitted && (
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handleLeaveFeedback(session.id)}
                            className="transition-smooth hover:bg-primary hover:text-primary-foreground"
                          >
                            Leave Feedback
                          </Button>
                        )}
                        {session.status === 'completed' && session.mentee_feedback_submitted && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReschedule(session.id)}
                          >
                            Book Again
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

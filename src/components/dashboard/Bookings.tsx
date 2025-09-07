import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Video, ArrowLeft, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function Bookings() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Add empty days for the start of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking: any) => {
      const bookingDate = new Date(booking.start_time);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleJoinSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  const handleReschedule = (sessionId: string) => {
    // Navigate to reschedule page or open modal
    navigate(`/find-mentor?reschedule=${sessionId}`);
  };

  const handleLeaveFeedback = (sessionId: string) => {
    navigate(`/dashboard/feedback?bookingId=${sessionId}`);
  };

  const handleCancel = (sessionId: string) => {
    // Implement cancel logic
    console.log("Cancel session:", sessionId);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Bookings</h1>
        </div>
        <div className="text-muted-foreground">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Bookings</h1>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Calendar</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold">{monthName}</span>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              const dayBookings = day ? getBookingsForDate(day) : [];
              return (
                <div
                  key={index}
                  className={`p-2 min-h-[60px] border rounded-lg ${
                    day ? 'hover:bg-muted/50 cursor-pointer' : ''
                  }`}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                      {dayBookings.length > 0 && (
                        <div className="space-y-1">
                          {dayBookings.slice(0, 2).map((booking: any) => (
                            <div
                              key={booking.id}
                              className={`text-xs p-1 rounded ${
                                booking.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {formatTime(booking.start_time)}
                            </div>
                          ))}
                          {dayBookings.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayBookings.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No upcoming sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold">
                      {(session.profiles?.full_name || 'M')[0]}
                    </div>
                    <div>
                      <div className="font-medium">
                        Session with {session.profiles?.full_name || 'Mentor'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(session.start_time)} at {formatTime(session.start_time)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={session.status === 'confirmed' ? 'default' : 'secondary'}>
                      {session.status}
                    </Badge>
                    {session.status === 'confirmed' && (
                      <Button 
                        size="sm"
                        onClick={() => handleJoinSession(session.id)}
                      >
                        Join Now
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Past Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastSessions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No past sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastSessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold">
                      {(session.profiles?.full_name || 'M')[0]}
                    </div>
                    <div>
                      <div className="font-medium">
                        Session with {session.profiles?.full_name || 'Mentor'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(session.start_time)} at {formatTime(session.start_time)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{session.status}</Badge>
                    {session.status === 'completed' && !session.mentee_feedback_submitted && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleLeaveFeedback(session.id)}
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
                        Reschedule
                      </Button>
                    )}
                    {session.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleCancel(session.id)}
                      >
                        Cancel
                      </Button>
                    )}
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

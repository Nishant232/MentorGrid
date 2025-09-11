import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  Calendar, 
  BookOpen, 
  Settings, 
  HelpCircle,
  Star,
  MessageSquare,
  Video,
  Clock,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { AvailabilityManager } from "@/components/mentor/AvailabilityManager";
import { CalendarSync } from "@/components/mentor/CalendarSync";
import { CalendarView } from "@/components/mentor/CalendarView";
import { MentorProfileSettings } from "@/components/mentor/MentorProfileSettings";
import { useAuth } from "@/hooks/useAuth";

const MentorDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

  // Determine which user ID to use (URL param or current user)
  const targetUserId = urlUserId || user?.id;

  // Fetch mentor profile and stats
  const { data: mentorData } = useQuery({
    queryKey: ["mentor-dashboard-data", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      // Set the userId state for use in components
      setUserId(targetUserId);

      const [profileRes, bookingsRes, mentorProfileRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", targetUserId)
          .single(),
        
        supabase
          .from("bookings")
          .select("*")
          .eq("mentor_user_id", targetUserId)
          .order("start_time", { ascending: true }),
        
        supabase
          .from("mentor_profiles")
          .select("*")
          .eq("user_id", targetUserId)
          .single()
      ]);

      return {
        profile: profileRes.data,
        bookings: bookingsRes.data || [],
        mentorProfile: mentorProfileRes.data
      };
    },
    enabled: !!targetUserId
  });

  // Redirect if user is not authorized to view this dashboard
  if (user && targetUserId && user.id !== targetUserId && user.role !== 'admin') {
    navigate(`/mentor-dashboard/${user.id}`);
    return null;
  }

  const sidebarItems = [
    { id: "overview", icon: Home, label: "Overview" },
    { id: "mentees", icon: Users, label: "My Mentees" },
    { id: "sessions", icon: Calendar, label: "Sessions" },
    { id: "reviews", icon: Star, label: "Reviews" },
    { id: "resources", icon: BookOpen, label: "Resources" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const upcomingSessions = mentorData?.bookings?.filter(booking => 
    new Date(booking.start_time) > new Date() && 
    booking.status === "confirmed"
  ).slice(0, 3) || [];

  const totalSessions = mentorData?.bookings?.filter(b => b.status === "completed").length || 0;
  const avgRating = 4.8; // Mock data
  const totalEarnings = mentorData?.bookings?.filter(b => b.status === "completed").reduce((sum, b) => sum + (b.price_cents || 0), 0) / 100 || 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        {/* Profile Section */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={mentorData?.mentorProfile?.profile_picture_url || mentorData?.profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {mentorData?.profile?.full_name?.[0] || "M"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">
                {mentorData?.profile?.full_name || "Mentor"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {mentorData?.mentorProfile?.title || "Mentor"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-success text-success-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Help Section */}
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help & FAQs
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Overview</h1>
                <p className="text-muted-foreground">Welcome back! Here's your mentoring dashboard.</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                        <p className="text-2xl font-bold">{totalSessions}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                        <p className="text-2xl font-bold flex items-center gap-1">
                          {avgRating} <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                        <p className="text-2xl font-bold">${totalEarnings}</p>
                      </div>
                      <Users className="h-8 w-8 text-success" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                      <p className="text-muted-foreground">Your schedule is clear for now.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">Mentoring Session</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.start_time).toLocaleDateString()} at{' '}
                              {new Date(session.start_time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            {session.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{session.notes}</p>
                            )}
                          </div>
                          <Button size="sm" onClick={() => navigate(`/session/${session.id}`)}>
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Reviews & Feedback</h1>
              </div>
              
              {userId && (
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          Reviews Received
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Import and use the ReviewDisplay component */}
                        {/* This will be replaced with the actual component once we navigate to the reviews page */}
                        <Button 
                          onClick={() => navigate('/dashboard/reviews')} 
                          variant="outline" 
                          className="w-full"
                        >
                          View All Reviews
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Pending Reviews
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-center py-4 text-muted-foreground">
                          You don't have any pending reviews to write.
                        </p>
                        <Button 
                          onClick={() => navigate('/dashboard/reviews?tab=pending')} 
                          variant="outline" 
                          className="w-full"
                        >
                          Manage Feedback
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* My Mentees Tab */}
          {activeTab === "mentees" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">My Mentees</h1>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Mentee
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Mock mentee cards */}
                {[1, 2, 3].map((mentee) => (
                  <Card key={mentee} className="hover:shadow-medium transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>M{mentee}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">Mentee {mentee}</h3>
                          <p className="text-sm text-muted-foreground">Software Development</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">React</Badge>
                          <Badge variant="secondary">Node.js</Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            View Profile
                          </Button>
                          <Button size="sm" className="flex-1">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Sessions</h1>

              {/* Calendar Management */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Availability Management</h2>
                    <p className="text-muted-foreground mb-4">
                      Set your recurring weekly availability and manage one-off exceptions. Mentees will only be able to book sessions during your available time slots.
                    </p>
                  </div>
                  {userId && <AvailabilityManager userId={userId} />}
                </div>

                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Calendar View</h2>
                    <p className="text-muted-foreground mb-4">
                      View your availability, bookings, and external calendar events in a weekly calendar format.
                    </p>
                  </div>
                  {userId && <CalendarView userId={userId} />}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Calendar Integration</h2>
                    <p className="text-muted-foreground mb-4">
                      Connect your external calendars to automatically block times when you're busy with other appointments.
                    </p>
                  </div>
                  <CalendarSync userId={userId} />
                </div>
              </div>

              {/* Session Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Upcoming Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex-1">
                            <p className="font-medium">Session with Mentee</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.start_time).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-success hover:bg-success/90">
                              <Video className="h-3 w-3 mr-1" />
                              Join Now
                            </Button>
                          </div>
                        </div>
                      ))}
                      {upcomingSessions.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">No upcoming sessions</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Past Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mentorData?.bookings?.filter(b => b.status === "completed").slice(0, 3).map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex-1">
                            <p className="font-medium">Completed Session</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.start_time).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View Recording
                          </Button>
                        </div>
                      ))}
                      {!mentorData?.bookings?.filter(b => b.status === "completed").length && (
                        <p className="text-muted-foreground text-center py-4">No past sessions</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === "resources" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Resources</h1>
                <Button className="bg-success hover:bg-success/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Mock resources */}
                {[1, 2, 3, 4].map((resource) => (
                  <Card key={resource} className="hover:shadow-medium transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <h3 className="font-semibold mb-2">Resource {resource}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        A comprehensive guide for learning and development.
                      </p>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Settings</h1>
              <MentorProfileSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
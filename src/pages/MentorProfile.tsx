import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Star, MessageSquare, Video, Clock, Award, MapPin, DollarSign, Users, ThumbsUp } from "lucide-react";
import { MentorAvailabilityView } from "@/components/mentee/MentorAvailabilityView";
import { ReviewDisplay } from "@/components/feedback/ReviewDisplay";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ApiService } from "@/lib/api-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type Slot = { start: string; end: string };

const MentorProfile = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch mentor data
  const { data: mentorData, isLoading: mentorLoading } = useQuery({
    queryKey: ["mentor-profile", mentorId],
    queryFn: () => ApiService.getMentorProfile(mentorId || ""),
    enabled: !!mentorId,
  });
  
  // Fetch mentor availability stats
  const { data: availabilityStats, isLoading: availabilityLoading } = useQuery({
    queryKey: ["mentor-availability-stats", mentorId],
    queryFn: async () => {
      // In a real app, this would fetch from an API endpoint
      // For now, we'll return mock data
      return {
        totalSlots: 24,
        availableSlots: 14,
        responseRate: 95,
        responseTime: "2 hours",
        preferredTimes: ["Weekday evenings", "Weekend mornings"]
      };
    },
    enabled: !!mentorId,
  });

  const mockMentor = {
    id: mentorId || "mock",
    name: "Sarah Chen",
    title: "Sr. Product Manager at Google",
    rating: 4.9,
    sessions: 127,
    hourlyRate: 80,
    skills: ["Product Strategy", "Leadership", "Career Growth"],
    avatar: "/placeholder.svg",
    bio: "Product leader with 10+ years helping teams build impactful products.",
  };

  // Book session mutation
  const bookSession = useMutation({
    mutationFn: async () => {
      const auth = await supabase.auth.getUser();
      if (!auth.data.user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase.rpc("create_booking", {
        p_mentor_user_id: mentorId,
        p_mentee_user_id: auth.data.user.id,
        p_start: selectedSlot!.start,
        p_end: selectedSlot!.end,
        p_price_cents: Math.round((mockMentor.hourlyRate || 50) * 100),
        p_currency: "USD",
        p_notes: sessionNotes,
      } as any);

      if (error) throw error;
      return { id: data };
    },
    onSuccess: (data) => {
      setShowSuccess(true);
      setSelectedSlot(null);
      navigate("/mentee-dashboard");
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["mentor-reviews", mentorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewee_user_id", mentorId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  if (mentorLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-6 w-48 mt-2" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-4" />
                  
                  <Skeleton className="h-6 w-32 mb-2" />
                  <div className="flex gap-1 mb-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  
                  <Skeleton className="h-6 w-full mt-4" />
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border rounded-md p-3">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4].map(j => (
                            <Skeleton key={j} className="h-8 w-32 rounded-md" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50">
          Session booked successfully! Redirecting to dashboard...
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Mentor Info */}
            <Card className="md:col-span-1">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-white text-xl font-bold">
                    {mockMentor.name[0]}
                  </div>
                  <div>
                    <CardTitle>{mockMentor.name}</CardTitle>
                    <p className="text-muted-foreground text-sm">{mockMentor.title}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{mockMentor.rating}</span>
                      <span className="text-muted-foreground text-sm">
                        ({mockMentor.sessions} sessions)
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{mockMentor.bio}</p>
                
                <div>
                  <h4 className="font-medium mb-2">Skills & Expertise</h4>
                  <div className="flex flex-wrap gap-1">
                    {mockMentor.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Availability Stats */}
                {availabilityStats && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Availability Stats</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{availabilityStats.availableSlots}/{availabilityStats.totalSlots} slots open</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                        <span>{availabilityStats.responseRate}% response rate</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>~{availabilityStats.responseTime} response</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{mockMentor.sessions} sessions</span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Preferred times:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {availabilityStats.preferredTimes.map((time) => (
                          <Badge key={time} variant="outline" className="text-xs">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-semibold">${mockMentor.hourlyRate}/hr</span>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Booking and Reviews */}
            <div className="md:col-span-2">
              <Tabs defaultValue="booking" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="booking">Book a Session</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews & Feedback</TabsTrigger>
                </TabsList>
                
                {/* Booking Tab */}
                <TabsContent value="booking" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Book a Session</CardTitle>
                      <CardDescription>
                        Select an available time slot and book your mentoring session
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <MentorAvailabilityView
                        mentorUserId={mentorId || ""}
                        onSelectSlot={(start, end) => {
                          setSelectedSlot({ start, end });
                        }}
                      />

                      {selectedSlot && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                          <h4 className="font-medium">Selected Time Slot</h4>
                          <div className="text-sm text-muted-foreground">
                            {new Date(selectedSlot.start).toLocaleString()} - {new Date(selectedSlot.end).toLocaleString()}
                          </div>
                          
                          <div>
                            <label htmlFor="notes" className="block text-sm font-medium mb-2">
                              Session Notes (Optional)
                            </label>
                            <textarea
                              id="notes"
                              className="w-full p-2 border rounded-md"
                              placeholder="What would you like to discuss in this session?"
                              value={sessionNotes}
                              onChange={(e) => setSessionNotes(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedSlot(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => bookSession.mutate()}
                              disabled={bookSession.isPending}
                              className="flex-1"
                            >
                              {bookSession.isPending ? "Booking..." : `Book Session - $${mockMentor.hourlyRate}/hr`}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Reviews Tab */}
                <TabsContent value="reviews" className="mt-4">
                  {mentorId && <ReviewDisplay userId={mentorId} showTitle={true} showTabs={true} />}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
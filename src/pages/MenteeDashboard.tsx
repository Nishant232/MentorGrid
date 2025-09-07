import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarHeader, SidebarSeparator } from "@/components/ui/sidebar";
import { Home, Users2, Calendar, TrendingUp, Trophy, MessageSquare, User, Star, Award } from "lucide-react";
import { useState } from "react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { useNavigate, useParams } from "react-router-dom";
import { MenteeOverview } from "@/components/dashboard/MenteeOverview";
import { MenteeProgress } from "@/components/dashboard/MenteeProgress";
import { LeaderboardView } from "@/components/dashboard/LeaderboardView";
import { MenteeProfileSummary } from "@/components/dashboard/MenteeProfileSummary";
import { MenteeProfileForm } from "@/components/dashboard/MenteeProfileForm";
import { MyMentors } from "@/components/dashboard/MyMentors";
import { Bookings } from "@/components/dashboard/Bookings";
import { Messages } from "@/components/dashboard/Messages";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface MenteeProfile {
  id: string;
  bio: string;
  interests: string;
  goals: string;
  currentLevel: string;
  learningStyle: string;
  meetingFrequency: string;
  budgetRange: string;
  timezone: string;
}

const MenteeDashboard = () => {
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [activeScreen, setActiveScreen] = useState<string>("overview");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<MenteeProfile | null>(null);

  // Determine which user ID to use (URL param or current user)
  const targetUserId = urlUserId || user?.id;

  // Redirect if user is not authorized to view this dashboard
  if (user && targetUserId && user.id !== targetUserId && user.role !== 'admin') {
    navigate(`/mentee-dashboard/${user.id}`);
    return null;
  }

  const handleEditProfile = () => {
    setActiveScreen("profile");
    setShowProfileForm(true);
  };

  const handleProfileUpdate = (updatedProfile: MenteeProfile) => {
    setCurrentProfile(updatedProfile);
    // Refresh profile data across the dashboard
    // This will trigger re-renders in components that use profile data
  };

  const handleCloseProfileForm = () => {
    setShowProfileForm(false);
    setActiveScreen("overview");
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case "overview":
        return <MenteeOverview />;
      case "mentors":
        return <MyMentors />;
      case "bookings":
        return <Bookings />;
      case "progress":
        return <MenteeProgress />;
      case "leaderboard":
        return <LeaderboardView />;
      case "messages":
        return <Messages />;
      case "reviews":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Reviews & Feedback</h1>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="rounded-lg border p-4">
                <div className="font-semibold mb-2">My Reviews</div>
                <div className="text-sm text-muted-foreground mb-4">
                  View reviews you've received and provide feedback for your mentors.                  
                </div>
                <Button onClick={() => navigate('/dashboard/reviews')}>
                  <Star className="w-4 h-4 mr-2" />
                  View All Reviews
                </Button>
              </div>
              <div className="rounded-lg border p-4">
                <div className="font-semibold mb-2">Pending Feedback</div>
                <div className="text-sm text-muted-foreground mb-4">
                  You have sessions that need your feedback. Help your mentors improve by sharing your experience.
                </div>
                <Button onClick={() => navigate('/dashboard/reviews?tab=pending')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Provide Feedback
                </Button>
              </div>
            </div>
          </div>
        );
      case "profile":
        return showProfileForm ? (
          <MenteeProfileForm 
            onProfileUpdate={handleProfileUpdate}
            onClose={handleCloseProfileForm}
          />
        ) : (
          <div className="rounded-lg border p-4">
            <div className="font-semibold mb-2">Profile</div>
            <div className="text-sm text-muted-foreground mb-4">
              Click on your profile in the sidebar or use the edit button to manage your profile information.
            </div>
            <Button onClick={handleEditProfile}>
              <User className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        );
      default:
        return <MenteeOverview />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="px-2 py-1 text-lg font-semibold">Innovatech</div>
        </SidebarHeader>
        <SidebarSeparator />
        
        {/* Profile Summary Section */}
        <div className="px-2 py-2">
          <MenteeProfileSummary onEditProfile={handleEditProfile} />
        </div>
        
        <SidebarSeparator />
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  data-screen="overview" 
                  onClick={() => setActiveScreen("overview")}
                  className={activeScreen === "overview" ? "bg-primary text-primary-foreground" : ""}
                >
                  <Home className="h-4 w-4" /> <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  data-screen="mentors" 
                  onClick={() => setActiveScreen("mentors")}
                  className={activeScreen === "mentors" ? "bg-primary text-primary-foreground" : ""}
                >
                  <Users2 className="h-4 w-4" /> <span>My Mentors</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  data-screen="bookings" 
                  onClick={() => setActiveScreen("bookings")}
                  className={activeScreen === "bookings" ? "bg-primary text-primary-foreground" : ""}
                >
                  <Calendar className="h-4 w-4" /> <span>Bookings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  data-screen="progress" 
                  onClick={() => setActiveScreen("progress")}
                  className={activeScreen === "progress" ? "bg-primary text-primary-foreground" : ""}
                >
                  <TrendingUp className="h-4 w-4" /> <span>Progress</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  data-screen="leaderboard" 
                  onClick={() => setActiveScreen("leaderboard")}
                  className={activeScreen === "leaderboard" ? "bg-primary text-primary-foreground" : ""}
                >
                  <Trophy className="h-4 w-4" /> <span>Leaderboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  data-screen="messages" 
                  onClick={() => setActiveScreen("messages")}
                  className={activeScreen === "messages" ? "bg-primary text-primary-foreground" : ""}
                >
                  <MessageSquare className="h-4 w-4" /> <span>Messages</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  data-screen="reviews" 
                  onClick={() => setActiveScreen("reviews")}
                  className={activeScreen === "reviews" ? "bg-primary text-primary-foreground" : ""}
                >
                  <Star className="h-4 w-4" /> <span>Reviews</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate("/achievements")}
                >
                  <Award className="h-4 w-4" /> <span>Achievements</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="p-6">
          {renderActiveScreen()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MenteeDashboard;



import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RoleSelection from "@/components/onboarding/RoleSelection";
import MenteeProfileForm from "@/components/onboarding/MenteeProfileForm";
import { MentorSetupForm } from "@/components/onboarding/MentorSetupForm";

type OnboardingStep = "role" | "profile";
type UserRole = "mentor" | "mentee" | null;

const Onboarding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("role");
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication and existing profile
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      
      // Check if user already has a profile with role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarding_completed")
        .eq("user_id", session.user.id)
        .single();
      
      if (profile?.onboarding_completed) {
        navigate("/");
        return;
      }
      
      if (profile?.role) {
        setSelectedRole(profile.role as UserRole);
        setCurrentStep("profile");
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleRoleSelection = async (role: UserRole) => {
    setError("");
    setLoading(true);
    
    try {
      // Update profile with selected role
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      setSelectedRole(role);
      setCurrentStep("profile");
      
      toast({
        title: "Role selected",
        description: `You've chosen to be a ${role}. Now let's set up your profile.`,
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = async () => {
    setError("");
    setLoading(true);
    
    try {
      // Mark onboarding as completed
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      toast({
        title: "Welcome to MentorConnect!",
        description: "Your profile has been set up successfully.",
      });
      
      // Redirect to user-specific dashboard based on role
      const dashboardPath = selectedRole === 'mentor' 
        ? `/mentor-dashboard/${user.id}`
        : `/mentee-dashboard/${user.id}`;
      navigate(dashboardPath);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to MentorConnect!</h1>
          <p className="text-muted-foreground">
            Let's set up your profile to get you started
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep === "role" ? "border-primary bg-primary text-primary-foreground" : 
              currentStep === "profile" ? "border-primary bg-background text-primary" : 
              "border-muted bg-muted text-muted-foreground"
            }`}>
              1
            </div>
            <div className={`w-12 h-0.5 ${
              currentStep === "profile" ? "bg-primary" : "bg-muted"
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep === "profile" ? "border-primary bg-primary text-primary-foreground" : 
              "border-muted bg-muted text-muted-foreground"
            }`}>
              2
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === "role" && (
          <RoleSelection
            onRoleSelect={handleRoleSelection}
            loading={loading}
          />
        )}

        {currentStep === "profile" && selectedRole === "mentor" && (
          <MentorSetupForm />
        )}

        {currentStep === "profile" && selectedRole === "mentee" && (
          <Card>
            <CardHeader>
              <CardTitle>Mentee Profile Setup</CardTitle>
              <CardDescription>
                Tell us more about yourself to help create the best connections
              </CardDescription>
            </CardHeader>
            <CardContent>
            <MenteeProfileForm
              userId={user.id}
              onComplete={handleProfileComplete}
              loading={loading}
            />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
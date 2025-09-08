import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (data.session) {
          // Get user profile to determine role
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, user_id, onboarding_completed')
            .eq('user_id', data.session.user.id)
            .single();

          if (profileError) throw profileError;

          toast({
            title: "Email verified!",
            description: "Welcome to MentorConnect!",
          });

          // Redirect based on role and onboarding status
          if (!profile.onboarding_completed) {
            navigate('/onboarding');
          } else {
            const dashboardPath = profile.role === 'mentor' 
              ? `/mentor-dashboard/${profile.user_id}`
              : `/mentee-dashboard/${profile.user_id}`;
            navigate(dashboardPath);
          }
        } else {
          // No session, redirect to auth
          navigate('/auth');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message,
        });
        
        // Redirect to auth page after a delay
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Verifying your account...
            </CardTitle>
            <CardDescription>
              Please wait while we confirm your email address
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Verification Failed</CardTitle>
            <CardDescription>
              There was an issue verifying your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Redirecting you back to the login page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserDashboardPath, getUserProfilePath } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserNavigationExample } from '@/components/ui/user-navigation';

const TestAuthFlow: React.FC = () => {
  const { 
    user, 
    isLoading, 
    error, 
    navigateToUserDashboard, 
    navigateToUserProfile,
    getStoredSessionData 
  } = useAuth();

  const storedData = getStoredSessionData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You are not authenticated. Please sign in to test the user-specific navigation.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Go to Auth Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Flow Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Current User Info:</h3>
                <div className="text-sm space-y-1">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Name:</strong> {user.full_name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>Onboarding Completed:</strong> {user.onboarding_completed ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Generated URLs:</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Dashboard:</strong> {getUserDashboardPath(user.id, user.role)}</p>
                  <p><strong>Profile:</strong> {getUserProfilePath(user.id)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Stored Session Data:</h3>
                <div className="text-sm space-y-1">
                  <p><strong>User ID:</strong> {storedData.userId || 'Not stored'}</p>
                  <p><strong>User Role:</strong> {storedData.userRole || 'Not stored'}</p>
                  <p><strong>Onboarding Completed:</strong> {storedData.onboardingCompleted ? 'Yes' : 'No'}</p>
                  <p><strong>Access Token:</strong> {storedData.accessToken ? 'Stored' : 'Not stored'}</p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                  <p className="text-sm text-destructive"><strong>Error:</strong> {error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigateToUserDashboard()}>
                Go to My Dashboard
              </Button>
              <Button onClick={() => navigateToUserProfile()}>
                Go to My Profile
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = getUserDashboardPath(user.id, user.role)}
              >
                Direct Dashboard Link
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = getUserProfilePath(user.id)}
              >
                Direct Profile Link
              </Button>
            </div>
          </CardContent>
        </Card>

        <UserNavigationExample />

        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>1. <strong>Sign In/Up:</strong> Go to /auth and sign in or create an account</p>
              <p>2. <strong>Check Redirect:</strong> After authentication, you should be redirected to your user-specific dashboard</p>
              <p>3. <strong>Test Navigation:</strong> Use the buttons above to test navigation to your profile and dashboard</p>
              <p>4. <strong>Check URLs:</strong> Verify that URLs include your user ID (e.g., /mentor-dashboard/{user.id})</p>
              <p>5. <strong>Refresh Test:</strong> Refresh the page to ensure session persistence</p>
              <p>6. <strong>Logout Test:</strong> Test logout and verify you're redirected to /auth</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAuthFlow;

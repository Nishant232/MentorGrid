import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getUserDashboardPath, getUserProfilePath } from '@/lib/utils';
import { User as UserIcon, Home, Settings } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  role: string;
}

interface UserNavigationProps {
  user: User;
  className?: string;
}

export const UserNavigation: React.FC<UserNavigationProps> = ({ user, className }) => {
  const { navigateToUserDashboard, navigateToUserProfile } = useAuth();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigateToUserDashboard()}
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Dashboard
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigateToUserProfile()}
        className="flex items-center gap-2"
      >
        <UserIcon className="h-4 w-4" />
        Profile
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigateToUserDashboard()}
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        Settings
      </Button>
    </div>
  );
};

// Example usage component
export const UserNavigationExample: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">User Navigation Example</h3>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Current User: {user.full_name} ({user.role})
        </p>
        <p className="text-sm text-muted-foreground">
          User ID: {user.id}
        </p>
        <div className="mt-4">
          <UserNavigation user={user} />
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Dashboard Path: {getUserDashboardPath(user.id, user.role)}</p>
          <p>Profile Path: {getUserProfilePath(user.id)}</p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface RoleBasedContentProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export const RoleBasedContent: React.FC<RoleBasedContentProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback || (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Please log in to access this content.
        </AlertDescription>
      </Alert>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this content.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default RoleBasedContent;
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/lib/types/auth';

export const useAuth = () => {
  const auth = useAuthContext();
  const navigate = useNavigate();

  const navigateToUserDashboard = (role?: UserRole) => {
    const userRole = role || auth.user?.role;
    if (!auth.user?.id || !userRole) {
      navigate('/auth');
      return;
    }

    const dashboardPath = userRole === 'mentor' 
      ? `/mentor-dashboard/${auth.user.id}`
      : `/mentee-dashboard/${auth.user.id}`;
    navigate(dashboardPath);
  };

  const navigateToUserProfile = () => {
    if (!auth.user?.id) {
      navigate('/auth');
      return;
    }
    navigate(`/profile/${auth.user.id}`);
  };

  const navigateToOnboarding = () => {
    navigate('/onboarding');
  };

  const navigateToAuth = () => {
    navigate('/auth');
  };

  return {
    ...auth,
    navigateToUserDashboard,
    navigateToUserProfile,
    navigateToOnboarding,
    navigateToAuth,
  };
};
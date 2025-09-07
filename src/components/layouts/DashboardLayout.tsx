import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users2, Calendar, TrendingUp, Trophy, MessageSquare, User, Star, Settings, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border">
        <div className="p-4">
          <h1 className="text-xl font-bold">Growth Mentor</h1>
        </div>
        <nav className="mt-6">
          <ul className="space-y-1 px-2">
            <li>
              <button 
                onClick={() => navigate('/dashboard')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted",
                  location.pathname === '/dashboard' && "bg-muted"
                )}
              >
                <Home className="h-4 w-4" />
                <span>Overview</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/dashboard/mentors')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted",
                  location.pathname === '/dashboard/mentors' && "bg-muted"
                )}
              >
                <Users2 className="h-4 w-4" />
                <span>Mentors</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/dashboard/bookings')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted",
                  location.pathname === '/dashboard/bookings' && "bg-muted"
                )}
              >
                <Calendar className="h-4 w-4" />
                <span>Bookings</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/dashboard/progress')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted",
                  location.pathname === '/dashboard/progress' && "bg-muted"
                )}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Progress</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/dashboard/leaderboard')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted",
                  location.pathname === '/dashboard/leaderboard' && "bg-muted"
                )}
              >
                <Trophy className="h-4 w-4" />
                <span>Leaderboard</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/dashboard/messages')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted",
                  location.pathname === '/dashboard/messages' && "bg-muted"
                )}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Messages</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/dashboard/reviews')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted",
                  location.pathname === '/dashboard/reviews' && "bg-muted"
                )}>
                <Star className="h-4 w-4" />
                <span>Reviews</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/dashboard/settings')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted",
                  location.pathname === '/dashboard/settings' && "bg-muted"
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/dashboard/achievements')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted",
                  location.pathname === '/dashboard/achievements' && "bg-muted"
                )}
              >
                <Award className="h-4 w-4" />
                <span>Achievements</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
};

export { DashboardLayout };
export default DashboardLayout;
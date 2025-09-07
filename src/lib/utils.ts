import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { UserRole } from "./types/auth"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// User-specific navigation utilities
export const getUserDashboardPath = (userId: string, role: UserRole) => {
  return role === 'mentor' 
    ? `/mentor-dashboard/${userId}`
    : `/mentee-dashboard/${userId}`;
};

export const getUserProfilePath = (userId: string) => {
  return `/profile/${userId}`;
};

export const isUserSpecificRoute = (pathname: string) => {
  return pathname.includes('/mentor-dashboard/') || 
         pathname.includes('/mentee-dashboard/') || 
         pathname.includes('/profile/');
};

export const extractUserIdFromPath = (pathname: string) => {
  const match = pathname.match(/\/(mentor-dashboard|mentee-dashboard|profile)\/([^\/]+)/);
  return match ? match[2] : null;
};

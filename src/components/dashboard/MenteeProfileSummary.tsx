import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Edit, MapPin, Briefcase, Mail, Target, Clock, DollarSign } from "lucide-react";

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

interface MenteeProfileSummaryProps {
  onEditProfile: () => void;
}

export const MenteeProfileSummary = ({ onEditProfile }: MenteeProfileSummaryProps) => {
  const [profile, setProfile] = useState<MenteeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/mentee/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        // If profile doesn't exist, create a default one
        setProfile({
          id: "",
          bio: "Click edit to add your bio",
          interests: "Click edit to add your interests",
          goals: "Click edit to add your goals",
          currentLevel: "",
          learningStyle: "",
          meetingFrequency: "",
          budgetRange: "",
          timezone: ""
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set default profile on error
      setProfile({
        id: "",
        bio: "Click edit to add your bio",
        interests: "Click edit to add your interests",
        goals: "Click edit to add your goals",
        currentLevel: "",
        learningStyle: "",
        meetingFrequency: "",
        budgetRange: "",
        timezone: ""
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  const getInitials = (bio: string) => {
    if (bio && bio !== "Click edit to add your bio") {
      const words = bio.split(' ').slice(0, 2);
      return words.map(word => word.charAt(0)).join('').toUpperCase();
    }
    return "NU"; // New User
  };

  return (
    <Card className="mb-4 cursor-pointer hover:shadow-md transition-shadow" onClick={onEditProfile}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-green-100 text-green-800 text-sm font-semibold">
              {getInitials(profile.bio)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {profile.currentLevel || "New User"}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {profile.learningStyle || "Add learning style"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              onEditProfile();
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 text-xs text-gray-600">
          {profile.bio && profile.bio !== "Click edit to add your bio" && (
            <div className="pt-2">
              <p className="text-xs text-gray-600 line-clamp-2">
                {profile.bio}
              </p>
            </div>
          )}
          
          {profile.interests && profile.interests !== "Click edit to add your interests" && (
            <div className="flex items-center space-x-2">
              <Target className="h-3 w-3" />
              <span className="truncate">{profile.interests}</span>
            </div>
          )}

          {profile.meetingFrequency && (
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span className="truncate">{profile.meetingFrequency}</span>
            </div>
          )}

          {profile.budgetRange && (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-3 w-3" />
              <span className="truncate">{profile.budgetRange}</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEditProfile();
            }}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

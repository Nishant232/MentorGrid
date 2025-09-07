import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, User, Info, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/lib/api-service";

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

interface MenteeProfileFormProps {
  onProfileUpdate: (profile: MenteeProfile) => void;
  onClose: () => void;
}

export const MenteeProfileForm = ({ onProfileUpdate, onClose }: MenteeProfileFormProps) => {
  const [profile, setProfile] = useState<MenteeProfile>({
    id: "",
    bio: "",
    interests: "",
    goals: "",
    currentLevel: "",
    learningStyle: "",
    meetingFrequency: "",
    budgetRange: "",
    timezone: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await ApiService.getMenteeProfile();
      
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to fetch profile');
      }
      
      if (data) {
        // Map the API response to our component's interface
        setProfile({
          id: data.id || "",
          bio: data.bio || "",
          interests: Array.isArray(data.interests) ? data.interests.join(', ') : (data.interests || ""),
          goals: Array.isArray(data.goals) ? data.goals.join(', ') : (data.goals || ""),
          currentLevel: data.current_level || "",
          learningStyle: data.learning_style || "",
          meetingFrequency: data.preferred_meeting_frequency || "",
          budgetRange: data.budget_range || "",
          timezone: data.timezone || ""
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profile.bio.trim()) {
      newErrors.bio = "Bio is required";
    }

    if (!profile.interests.trim()) {
      newErrors.interests = "Interests/Skills are required";
    }

    if (!profile.goals.trim()) {
      newErrors.goals = "Goals are required";
    }

    if (!profile.currentLevel.trim()) {
      newErrors.currentLevel = "Current level is required";
    }

    if (!profile.learningStyle.trim()) {
      newErrors.learningStyle = "Learning style is required";
    }

    if (!profile.meetingFrequency.trim()) {
      newErrors.meetingFrequency = "Meeting frequency is required";
    }

    if (!profile.budgetRange.trim()) {
      newErrors.budgetRange = "Budget range is required";
    }

    if (!profile.timezone.trim()) {
      newErrors.timezone = "Timezone is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      
      // Add profile data
      Object.keys(profile).forEach(key => {
        if (profile[key as keyof MenteeProfile]) {
          formData.append(key, profile[key as keyof MenteeProfile] as string);
        }
      });

      const { data, error } = await ApiService.updateMenteeProfile(formData);

      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to update profile');
      }

      if (data) {
        // Map the API response back to our component's interface
        const updatedProfile = {
          id: data.id || profile.id,
          bio: data.bio || profile.bio,
          interests: Array.isArray(data.interests) ? data.interests.join(', ') : (data.interests || profile.interests),
          goals: Array.isArray(data.goals) ? data.goals.join(', ') : (data.goals || profile.goals),
          currentLevel: data.current_level || profile.currentLevel,
          learningStyle: data.learning_style || profile.learningStyle,
          meetingFrequency: data.preferred_meeting_frequency || profile.meetingFrequency,
          budgetRange: data.budget_range || profile.budgetRange,
          timezone: data.timezone || profile.timezone
        };
        
        setProfile(updatedProfile);
        setSuccess(true);
        onProfileUpdate(updatedProfile);
        
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof MenteeProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Profile updated successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <ul className="list-disc list-inside space-y-1">
                  <li>Your profile helps mentors understand your background and learning goals.</li>
                  <li>This information is shared with mentors to create better mentorship experiences.</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell mentors about yourself, your background, and what you're looking to achieve..."
                rows={4}
                className={errors.bio ? 'border-red-500' : ''}
              />
              {errors.bio && (
                <p className="text-sm text-red-600">{errors.bio}</p>
              )}
              <p className="text-xs text-gray-500">
                This is shared with mentors to help them understand your background and goals.
              </p>
            </div>

            {/* Interests/Skills */}
            <div className="space-y-2">
              <Label htmlFor="interests">Interests/Skills *</Label>
              <Textarea
                id="interests"
                value={profile.interests}
                onChange={(e) => handleInputChange('interests', e.target.value)}
                placeholder="List your interests, skills, or areas you want to develop (separate with commas)..."
                rows={3}
                className={errors.interests ? 'border-red-500' : ''}
              />
              {errors.interests && (
                <p className="text-sm text-red-600">{errors.interests}</p>
              )}
              <p className="text-xs text-gray-500">
                Help mentors understand your current skills and what you want to learn.
              </p>
            </div>

            {/* Goals */}
            <div className="space-y-2">
              <Label htmlFor="goals">Learning Goals *</Label>
              <Textarea
                id="goals"
                value={profile.goals}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                placeholder="What specific goals do you want to achieve through mentorship? (separate with commas)..."
                rows={3}
                className={errors.goals ? 'border-red-500' : ''}
              />
              {errors.goals && (
                <p className="text-sm text-red-600">{errors.goals}</p>
              )}
              <p className="text-xs text-gray-500">
                Clear goals help mentors provide more targeted guidance.
              </p>
            </div>

            {/* Current Level */}
            <div className="space-y-2">
              <Label htmlFor="currentLevel">Current Skill Level *</Label>
              <select
                id="currentLevel"
                value={profile.currentLevel}
                onChange={(e) => handleInputChange('currentLevel', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.currentLevel ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select your current level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
              {errors.currentLevel && (
                <p className="text-sm text-red-600">{errors.currentLevel}</p>
              )}
            </div>

            {/* Learning Style */}
            <div className="space-y-2">
              <Label htmlFor="learningStyle">Preferred Learning Style *</Label>
              <select
                id="learningStyle"
                value={profile.learningStyle}
                onChange={(e) => handleInputChange('learningStyle', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.learningStyle ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select your learning style</option>
                <option value="Hands-on">Hands-on practice</option>
                <option value="Theory">Theory and concepts</option>
                <option value="Mixed">Mixed approach</option>
                <option value="Project-based">Project-based learning</option>
              </select>
              {errors.learningStyle && (
                <p className="text-sm text-red-600">{errors.learningStyle}</p>
              )}
            </div>

            {/* Meeting Frequency */}
            <div className="space-y-2">
              <Label htmlFor="meetingFrequency">Preferred Meeting Frequency *</Label>
              <select
                id="meetingFrequency"
                value={profile.meetingFrequency}
                onChange={(e) => handleInputChange('meetingFrequency', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.meetingFrequency ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select meeting frequency</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="As needed">As needed</option>
              </select>
              {errors.meetingFrequency && (
                <p className="text-sm text-red-600">{errors.meetingFrequency}</p>
              )}
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
              <Label htmlFor="budgetRange">Budget Range *</Label>
              <select
                id="budgetRange"
                value={profile.budgetRange}
                onChange={(e) => handleInputChange('budgetRange', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.budgetRange ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select your budget range</option>
                <option value="$0-25">$0-25 per session</option>
                <option value="$25-50">$25-50 per session</option>
                <option value="$50-100">$50-100 per session</option>
                <option value="$100+">$100+ per session</option>
              </select>
              {errors.budgetRange && (
                <p className="text-sm text-red-600">{errors.budgetRange}</p>
              )}
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone *</Label>
              <select
                id="timezone"
                value={profile.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.timezone ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select your timezone</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Shanghai">Shanghai (CST)</option>
                <option value="Australia/Sydney">Sydney (AEST)</option>
              </select>
              {errors.timezone && (
                <p className="text-sm text-red-600">{errors.timezone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MenteeProfileFormProps {
  userId: string;
  onComplete: () => void;
  loading: boolean;
}

const INTEREST_OPTIONS = [
  "Web Development", "Mobile Development", "Data Science", "Machine Learning",
  "UI/UX Design", "Product Management", "Digital Marketing", "Sales",
  "Leadership & Management", "Project Management", "DevOps & Cloud",
  "Cybersecurity", "Blockchain", "Entrepreneurship", "Career Development",
  "Public Speaking", "Personal Branding", "Networking"
];

const GOAL_OPTIONS = [
  "Learn new skills", "Career transition", "Get promoted", "Start a business",
  "Improve technical skills", "Develop leadership skills", "Build a portfolio",
  "Prepare for interviews", "Network with professionals", "Gain industry insights",
  "Improve work-life balance", "Develop personal brand"
];

const LEVEL_OPTIONS = [
  "Beginner", "Intermediate", "Advanced", "Expert"
];

const LEARNING_STYLE_OPTIONS = [
  "Visual", "Auditory", "Hands-on", "Reading/Writing", "Mixed"
];

const FREQUENCY_OPTIONS = [
  "Weekly", "Bi-weekly", "Monthly", "As needed"
];

const BUDGET_OPTIONS = [
  "$10-25/hour", "$25-50/hour", "$50-75/hour", "$75-100/hour", "$100+/hour"
];

const MenteeProfileForm = ({ userId, onComplete, loading: externalLoading }: MenteeProfileFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    interests: [] as string[],
    goals: [] as string[],
    current_level: "",
    learning_style: "",
    preferred_meeting_frequency: "",
    budget_range: "",
    bio: "",
    timezone: ""
  });
  const [newInterest, setNewInterest] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const { toast } = useToast();

  const isLoading = loading || externalLoading;

  const addInterest = (interest: string) => {
    if (interest && !formData.interests.includes(interest)) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
    setNewInterest("");
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const addGoal = (goal: string) => {
    if (goal && !formData.goals.includes(goal)) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, goal]
      }));
    }
    setNewGoal("");
  };

  const removeGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g !== goal)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("mentee_profiles")
        .insert({
          user_id: userId,
          interests: formData.interests,
          goals: formData.goals,
          current_level: formData.current_level,
          learning_style: formData.learning_style,
          preferred_meeting_frequency: formData.preferred_meeting_frequency,
          budget_range: formData.budget_range,
          bio: formData.bio,
          timezone: formData.timezone
        });

      if (error) throw error;

      toast({
        title: "Profile created!",
        description: "Your mentee profile has been set up successfully.",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Interests */}
      <div className="space-y-3">
        <Label>Interests</Label>
        <div className="flex gap-2">
          <Select onValueChange={addInterest}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select your interests..." />
            </SelectTrigger>
            <SelectContent>
              {INTEREST_OPTIONS.filter(interest => !formData.interests.includes(interest)).map(interest => (
                <SelectItem key={interest} value={interest}>{interest}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              placeholder="Custom interest"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest(newInterest))}
            />
            <Button type="button" onClick={() => addInterest(newInterest)} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.interests.map(interest => (
            <Badge key={interest} variant="secondary" className="gap-1">
              {interest}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeInterest(interest)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="space-y-3">
        <Label>Goals</Label>
        <div className="flex gap-2">
          <Select onValueChange={addGoal}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select your goals..." />
            </SelectTrigger>
            <SelectContent>
              {GOAL_OPTIONS.filter(goal => !formData.goals.includes(goal)).map(goal => (
                <SelectItem key={goal} value={goal}>{goal}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              placeholder="Custom goal"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal(newGoal))}
            />
            <Button type="button" onClick={() => addGoal(newGoal)} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.goals.map(goal => (
            <Badge key={goal} variant="outline" className="gap-1">
              {goal}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeGoal(goal)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Current Level */}
      <div className="space-y-2">
        <Label>Current Level</Label>
        <Select onValueChange={(value) => setFormData(prev => ({ ...prev, current_level: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select your current level..." />
          </SelectTrigger>
          <SelectContent>
            {LEVEL_OPTIONS.map(level => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Learning Style */}
      <div className="space-y-2">
        <Label>Learning Style</Label>
        <Select onValueChange={(value) => setFormData(prev => ({ ...prev, learning_style: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="How do you learn best?" />
          </SelectTrigger>
          <SelectContent>
            {LEARNING_STYLE_OPTIONS.map(style => (
              <SelectItem key={style} value={style}>{style}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preferred Meeting Frequency */}
      <div className="space-y-2">
        <Label>Preferred Meeting Frequency</Label>
        <Select onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_meeting_frequency: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="How often would you like to meet?" />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCY_OPTIONS.map(frequency => (
              <SelectItem key={frequency} value={frequency}>{frequency}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Budget Range */}
      <div className="space-y-2">
        <Label>Budget Range</Label>
        <Select onValueChange={(value) => setFormData(prev => ({ ...prev, budget_range: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="What's your budget for mentorship?" />
          </SelectTrigger>
          <SelectContent>
            {BUDGET_OPTIONS.map(budget => (
              <SelectItem key={budget} value={budget}>{budget}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">About You</Label>
        <Textarea
          id="bio"
          placeholder="Tell potential mentors about yourself, your background, and what you're looking to achieve..."
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          rows={4}
        />
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          placeholder="e.g., PST, EST, GMT+1"
          value={formData.timezone}
          onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating profile...
          </>
        ) : (
          "Complete Setup"
        )}
      </Button>
    </form>
  );
};

export default MenteeProfileForm;
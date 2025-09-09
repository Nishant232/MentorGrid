import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const commonExpertiseAreas = [
  "Product Management", "Software Engineering", "Data Science", "Design", 
  "Marketing", "Sales", "Leadership", "Career Development", "Entrepreneurship",
  "Frontend Development", "Backend Development", "Full Stack", "DevOps",
  "UI/UX Design", "Digital Marketing", "Business Strategy", "Finance"
];

const commonSkills = [
  "React", "Node.js", "Python", "JavaScript", "TypeScript", "AWS", "Docker",
  "Kubernetes", "Machine Learning", "AI", "Figma", "Product Strategy",
  "Agile", "Scrum", "Leadership", "Team Management", "Communication"
];

export function MentorSetupForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    bio: "",
    expertise_areas: [] as string[],
    skills: [] as string[],
    years_experience: "",
    hourly_rate: "",
    languages: ["English"],
    timezone: "UTC"
  });
  
  const [newExpertise, setNewExpertise] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addExpertise = (area: string) => {
    if (area && !formData.expertise_areas.includes(area)) {
      setFormData(prev => ({
        ...prev,
        expertise_areas: [...prev.expertise_areas, area]
      }));
    }
    setNewExpertise("");
  };

  const removeExpertise = (area: string) => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: prev.expertise_areas.filter(e => e !== area)
    }));
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create mentor profile
      const { error } = await supabase
        .from("mentor_profiles")
        .upsert({
          user_id: user.id,
          title: formData.title,
          bio: formData.bio,
          expertise_areas: formData.expertise_areas,
          skills: formData.skills,
          years_experience: parseInt(formData.years_experience),
          hourly_rate: parseFloat(formData.hourly_rate),
          languages: formData.languages,
          timezone: formData.timezone,
          is_active: true,
          status: "active"
        });

      if (error) throw error;

      // Update profile to mark onboarding as completed
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);

      toast({
        title: "Profile Created",
        description: "Your mentor profile has been set up successfully!",
      });

      navigate("/mentor-dashboard");
    } catch (error: any) {
      console.error("Error setting up mentor profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create mentor profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Set Up Your Mentor Profile</CardTitle>
              <CardDescription>
                Tell us about your expertise and experience to help mentees find you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Professional Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Senior Product Manager"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="years_experience">Years of Experience</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      min="0"
                      placeholder="5"
                      value={formData.years_experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, years_experience: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell mentees about your background, experience, and what you can help them with..."
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label>Expertise Areas</Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.expertise_areas.map((area) => (
                        <Badge key={area} variant="secondary" className="flex items-center gap-1">
                          {area}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeExpertise(area)} />
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Select onValueChange={(value) => addExpertise(value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose from common areas..." />
                        </SelectTrigger>
                        <SelectContent>
                          {commonExpertiseAreas
                            .filter(area => !formData.expertise_areas.includes(area))
                            .map((area) => (
                            <SelectItem key={area} value={area}>{area}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Or add a custom expertise area..."
                        value={newExpertise}
                        onChange={(e) => setNewExpertise(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise(newExpertise))}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => addExpertise(newExpertise)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Skills</Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="flex items-center gap-1">
                          {skill}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Select onValueChange={(value) => addSkill(value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose from common skills..." />
                        </SelectTrigger>
                        <SelectContent>
                          {commonSkills
                            .filter(skill => !formData.skills.includes(skill))
                            .map((skill) => (
                            <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Or add a custom skill..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => addSkill(newSkill)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="50.00"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={formData.timezone} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Setting up profile..." : "Complete Setup"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MentorProfileFormProps {
  userId: string;
  onComplete: () => void;
  loading: boolean;
}

const SKILL_OPTIONS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "PHP",
  "Data Science", "Machine Learning", "UI/UX Design", "Product Management",
  "Digital Marketing", "Sales", "Leadership", "Project Management", "DevOps",
  "Mobile Development", "Cloud Computing", "Cybersecurity", "Blockchain"
];

const EXPERTISE_OPTIONS = [
  "Web Development", "Mobile Development", "Data Science", "Machine Learning",
  "UI/UX Design", "Product Management", "Digital Marketing", "Sales",
  "Leadership & Management", "Project Management", "DevOps & Cloud",
  "Cybersecurity", "Blockchain", "Entrepreneurship", "Career Development"
];

const MentorProfileForm = ({ userId, onComplete, loading: externalLoading }: MentorProfileFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    skills: [] as string[],
    expertise_areas: [] as string[],
    hourly_rate: "",
    bio: "",
    years_experience: "",
    education: "",
    certifications: [] as string[],
    languages: ["English"],
    timezone: "",
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    }
  });
  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const { toast } = useToast();

  const isLoading = loading || externalLoading;

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

  const addExpertise = (expertise: string) => {
    if (expertise && !formData.expertise_areas.includes(expertise)) {
      setFormData(prev => ({
        ...prev,
        expertise_areas: [...prev.expertise_areas, expertise]
      }));
    }
  };

  const removeExpertise = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: prev.expertise_areas.filter(e => e !== expertise)
    }));
  };

  const addCertification = () => {
    if (newCertification && !formData.certifications.includes(newCertification)) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification]
      }));
      setNewCertification("");
    }
  };

  const removeCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert)
    }));
  };

  const handleAvailabilityChange = (day: keyof typeof formData.availability) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: !prev.availability[day]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("mentor_profiles")
        .insert({
          user_id: userId,
          skills: formData.skills,
          expertise_areas: formData.expertise_areas,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          bio: formData.bio,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
          education: formData.education,
          certifications: formData.certifications,
          languages: formData.languages,
          timezone: formData.timezone,
          availability: formData.availability
        });

      if (error) throw error;

      toast({
        title: "Profile created!",
        description: "Your mentor profile has been set up successfully.",
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
      {/* Skills */}
      <div className="space-y-3">
        <Label>Skills</Label>
        <div className="flex gap-2">
          <Select onValueChange={addSkill}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select skills..." />
            </SelectTrigger>
            <SelectContent>
              {SKILL_OPTIONS.filter(skill => !formData.skills.includes(skill)).map(skill => (
                <SelectItem key={skill} value={skill}>{skill}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              placeholder="Custom skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
            />
            <Button type="button" onClick={() => addSkill(newSkill)} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.skills.map(skill => (
            <Badge key={skill} variant="secondary" className="gap-1">
              {skill}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Expertise Areas */}
      <div className="space-y-3">
        <Label>Expertise Areas</Label>
        <Select onValueChange={addExpertise}>
          <SelectTrigger>
            <SelectValue placeholder="Select your expertise areas..." />
          </SelectTrigger>
          <SelectContent>
            {EXPERTISE_OPTIONS.filter(exp => !formData.expertise_areas.includes(exp)).map(expertise => (
              <SelectItem key={expertise} value={expertise}>{expertise}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2">
          {formData.expertise_areas.map(expertise => (
            <Badge key={expertise} variant="outline" className="gap-1">
              {expertise}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeExpertise(expertise)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Hourly Rate */}
      <div className="space-y-2">
        <Label htmlFor="hourly-rate">Hourly Rate (USD)</Label>
        <Input
          id="hourly-rate"
          type="number"
          placeholder="50"
          value={formData.hourly_rate}
          onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell potential mentees about yourself, your experience, and what you can help them with..."
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          rows={4}
        />
      </div>

      {/* Years of Experience */}
      <div className="space-y-2">
        <Label htmlFor="experience">Years of Experience</Label>
        <Input
          id="experience"
          type="number"
          placeholder="5"
          value={formData.years_experience}
          onChange={(e) => setFormData(prev => ({ ...prev, years_experience: e.target.value }))}
        />
      </div>

      {/* Education */}
      <div className="space-y-2">
        <Label htmlFor="education">Education</Label>
        <Input
          id="education"
          placeholder="e.g., BS Computer Science, Stanford University"
          value={formData.education}
          onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
        />
      </div>

      {/* Certifications */}
      <div className="space-y-3">
        <Label>Certifications</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add certification"
            value={newCertification}
            onChange={(e) => setNewCertification(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
          />
          <Button type="button" onClick={addCertification} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.certifications.map(cert => (
            <Badge key={cert} variant="secondary" className="gap-1">
              {cert}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeCertification(cert)} />
            </Badge>
          ))}
        </div>
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

      {/* Availability */}
      <div className="space-y-3">
        <Label>Availability (Days of the week)</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(formData.availability).map(day => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={day}
                checked={formData.availability[day as keyof typeof formData.availability]}
                onCheckedChange={() => handleAvailabilityChange(day as keyof typeof formData.availability)}
              />
              <Label htmlFor={day} className="capitalize">
                {day}
              </Label>
            </div>
          ))}
        </div>
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

export default MentorProfileForm;
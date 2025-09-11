import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, FileText, User, Briefcase, Award, Link as LinkIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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

interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface JobRole {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

export function MentorApplicationForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    title: "",
    bio: "",
    detailedBio: "",
    expertise_areas: [] as string[],
    skills: [] as string[],
    years_experience: "",
    hourly_rate: "",
    languages: ["English"],
    timezone: "UTC",
    linkedinUrl: "",
    twitterUrl: "",
    githubUrl: "",
    personalWebsiteUrl: ""
  });
  
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [recentJobRoles, setRecentJobRoles] = useState<JobRole[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<File[]>([]);
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

  const addWorkExperience = () => {
    setWorkExperience([...workExperience, {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: ""
    }]);
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string) => {
    const updated = [...workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperience(updated);
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  const addJobRole = () => {
    setRecentJobRoles([...recentJobRoles, {
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      isCurrent: false
    }]);
  };

  const updateJobRole = (index: number, field: keyof JobRole, value: string | boolean) => {
    const updated = [...recentJobRoles];
    updated[index] = { ...updated[index], [field]: value };
    setRecentJobRoles(updated);
  };

  const removeJobRole = (index: number) => {
    setRecentJobRoles(recentJobRoles.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, folder: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('mentor-files')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('mentor-files')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.title || 
          !formData.detailedBio || !formData.expertise_areas.length || !formData.skills.length ||
          !formData.years_experience || !formData.hourly_rate || !workExperience.length ||
          !recentJobRoles.length) {
        throw new Error("Please fill in all required fields");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Email matching validation
      if (formData.email !== user.email) {
        throw new Error("Email must match your account email (" + user.email + ")");
      }

      // Upload profile picture
      let profilePictureUrl = null;
      if (profilePicture) {
        profilePictureUrl = await uploadFile(profilePicture, 'profile-pictures');
      }

      // Upload certificates
      const certificateUrls = [];
      for (const cert of certificates) {
        const url = await uploadFile(cert, 'certificates');
        certificateUrls.push({
          name: cert.name,
          url: url,
          uploadedAt: new Date().toISOString()
        });
      }

      // Prepare social media links
      const socialMediaLinks = {
        linkedin: formData.linkedinUrl,
        twitter: formData.twitterUrl,
        github: formData.githubUrl,
        website: formData.personalWebsiteUrl
      };

      // Update profile first
      await supabase
        .from("profiles")
        .update({ 
          full_name: `${formData.firstName} ${formData.lastName}`,
          avatar_url: profilePictureUrl,
          role: 'mentor',
          onboarding_completed: true 
        })
        .eq("user_id", user.id);

      // Create mentor profile
      const { error } = await supabase
        .from("mentor_profiles")
        .insert({
          user_id: user.id,
          title: formData.title,
          bio: formData.bio,
          detailed_bio: formData.detailedBio,
          expertise_areas: formData.expertise_areas,
          skills: formData.skills,
          years_experience: parseInt(formData.years_experience),
          hourly_rate: parseFloat(formData.hourly_rate),
          languages: formData.languages,
          timezone: formData.timezone,
          profile_picture_url: profilePictureUrl,
          work_experience: workExperience,
          certificates: certificateUrls,
          recent_job_roles: recentJobRoles,
          social_media_links: socialMediaLinks,
          is_active: true,
          status: "pending" // Set to pending for admin approval
        } as any);

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your mentor application has been submitted for review. We'll get back to you within 2-3 business days.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error submitting mentor application:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit mentor application",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Mentor Application Form
        </CardTitle>
        <CardDescription>
          Complete your mentor profile to start helping mentees achieve their goals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>  
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="Must match your account email"
              />
              <p className="text-sm text-muted-foreground mt-1">
                This must match the email you used to sign up
              </p>
            </div>

            <div>
              <Label htmlFor="title">Professional Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Senior Product Manager at Google"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="profilePicture">Profile Picture *</Label>
              <Input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                className="cursor-pointer"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">Upload a professional headshot (JPG, PNG, WebP)</p>
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">About You</h3>
            
            <div>
              <Label htmlFor="bio">Short Bio *</Label>
              <Textarea
                id="bio"
                placeholder="A brief 2-3 sentence summary about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="detailedBio">Detailed Bio *</Label>
              <Textarea
                id="detailedBio"
                placeholder="Tell mentees about your background, experience, achievements, and what unique value you can provide..."
                value={formData.detailedBio}
                onChange={(e) => setFormData(prev => ({ ...prev, detailedBio: e.target.value }))}
                rows={6}
                required
              />
            </div>
          </div>

          {/* Work Experience */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Work Experience *
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addWorkExperience}>
                <Plus className="w-4 h-4 mr-1" />
                Add Experience
              </Button>
            </div>
            
            {workExperience.map((exp, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Experience #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWorkExperience(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Company *</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Position *</Label>
                    <Input
                      value={exp.position}
                      onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={exp.startDate}
                      onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>End Date *</Label>
                    <Input
                      type="date"
                      value={exp.endDate}
                      onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <Label>Description *</Label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                    placeholder="Describe your role, responsibilities, and achievements..."
                    rows={3}
                    required
                  />
                </div>
              </Card>
            ))}
            
            {workExperience.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No work experience added yet. Click "Add Experience" to get started.</p>
            )}
          </div>

          {/* Recent Job Roles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold border-b pb-2">Recent Job Roles *</h3>
              <Button type="button" variant="outline" size="sm" onClick={addJobRole}>
                <Plus className="w-4 h-4 mr-1" />
                Add Role
              </Button>
            </div>
            
            {recentJobRoles.map((role, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Role #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeJobRole(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Job Title *</Label>
                    <Input
                      value={role.title}
                      onChange={(e) => updateJobRole(index, 'title', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Company *</Label>
                    <Input
                      value={role.company}
                      onChange={(e) => updateJobRole(index, 'company', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={role.startDate}
                      onChange={(e) => updateJobRole(index, 'startDate', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={role.endDate || ""}
                      onChange={(e) => updateJobRole(index, 'endDate', e.target.value)}
                      disabled={role.isCurrent}
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={role.isCurrent}
                      onChange={(e) => updateJobRole(index, 'isCurrent', e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm">This is my current role</span>
                  </label>
                </div>
              </Card>
            ))}
          </div>

          {/* Expertise & Skills */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Expertise & Skills</h3>
            
            <div>
              <Label>Areas of Expertise *</Label>
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
              <Label>Skills *</Label>
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
                <Label htmlFor="years_experience">Years of Experience *</Label>
                <Input
                  id="years_experience"
                  type="number"
                  min="0"
                  value={formData.years_experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, years_experience: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate (USD) *</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Certificates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Certificates (Optional)
            </h3>
            
            <div>
              <Label htmlFor="certificates">Upload Certificates</Label>
              <Input
                id="certificates"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setCertificates(Array.from(e.target.files || []))}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Upload certificates, diplomas, or other credentials (PDF, JPG, PNG)
              </p>
              {certificates.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Selected files:</p>
                  <ul className="text-sm text-muted-foreground">
                    {certificates.map((file, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Social Media & Professional Links *
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn Profile *</Label>
                <Input
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/your-profile"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="personalWebsiteUrl">Personal Website</Label>
                <Input
                  id="personalWebsiteUrl"
                  placeholder="https://yourwebsite.com"
                  value={formData.personalWebsiteUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, personalWebsiteUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="twitterUrl">Twitter/X Profile</Label>
                <Input
                  id="twitterUrl"
                  placeholder="https://twitter.com/your-handle"
                  value={formData.twitterUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="githubUrl">GitHub Profile</Label>
                <Input
                  id="githubUrl"
                  placeholder="https://github.com/your-username"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Additional Details</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone *</Label>
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
              
              <div>
                <Label>Languages</Label>
                <Input
                  value={formData.languages.join(", ")}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    languages: e.target.value.split(",").map(lang => lang.trim()).filter(Boolean)
                  }))}
                  placeholder="English, Spanish, French..."
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Submitting Application..." : "Submit Mentor Application"}
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-2">
              * Required fields. Your application will be reviewed within 2-3 business days.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Plus, Upload, User, Briefcase, Award, Link as LinkIcon, Save, Edit, Camera } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
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

interface MentorProfile {
  id: string;
  user_id: string;
  title: string;
  bio: string;
  detailed_bio: string;
  expertise_areas: string[];
  skills: string[];
  years_experience: number;
  hourly_rate: number;
  languages: string[];
  timezone: string;
  profile_picture_url?: string;
  work_experience: any;
  certificates: any;
  recent_job_roles: any;
  social_media_links: any;
  is_active: boolean;
  status: string;
}

export function MentorProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
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
  const [newExpertise, setNewExpertise] = useState("");
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchMentorProfile();
    }
  }, [user?.id]);

  const fetchMentorProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("mentor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setMentorProfile(data);
        const socialLinks = typeof data.social_media_links === 'object' ? data.social_media_links as Record<string, string> : {};
        const workExp = Array.isArray(data.work_experience) ? data.work_experience : [];
        const jobRoles = Array.isArray(data.recent_job_roles) ? data.recent_job_roles : [];
        
        setFormData({
          title: data.title || "",
          bio: data.bio || "",
          detailedBio: data.detailed_bio || "",
          expertise_areas: data.expertise_areas || [],
          skills: data.skills || [],
          years_experience: data.years_experience?.toString() || "",
          hourly_rate: data.hourly_rate?.toString() || "",
          languages: data.languages || ["English"],
          timezone: data.timezone || "UTC",
          linkedinUrl: socialLinks.linkedin || "",
          twitterUrl: socialLinks.twitter || "",
          githubUrl: socialLinks.github || "",
          personalWebsiteUrl: socialLinks.website || ""
        });
        setWorkExperience((workExp as unknown) as WorkExperience[]);
        setRecentJobRoles((jobRoles as unknown) as JobRole[]);
      }
    } catch (error: any) {
      console.error("Error fetching mentor profile:", error);
      toast({
        title: "Error",
        description: "Failed to load mentor profile",
        variant: "destructive",
      });
    }
  };

  const uploadFile = async (file: File, folder: string) => {
    if (!user?.id) throw new Error("Not authenticated");

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

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Upload profile picture if changed
      let profilePictureUrl = mentorProfile?.profile_picture_url;
      if (profilePicture) {
        profilePictureUrl = await uploadFile(profilePicture, 'profile-pictures');
      }

      // Upload certificates
      const certificateUrls = [...(mentorProfile?.certificates || [])];
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

      // Update profile
      if (profilePictureUrl) {
        await supabase
          .from("profiles")
          .update({ avatar_url: profilePictureUrl })
          .eq("user_id", user.id);
      }

      // Update mentor profile
      const { error } = await supabase
        .from("mentor_profiles")
        .upsert({
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
          work_experience: workExperience as any,
          certificates: certificateUrls as any,
          recent_job_roles: recentJobRoles as any,
          social_media_links: socialMediaLinks as any,
          is_active: true
        } as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setIsEditing(false);
      setCertificates([]);
      setProfilePicture(null);
      await fetchMentorProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!mentorProfile && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mentor Profile</CardTitle>
          <CardDescription>Complete your mentor profile to start helping mentees</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsEditing(true)} className="w-full">
            <Edit className="w-4 h-4 mr-2" />
            Create Mentor Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={mentorProfile?.profile_picture_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {user?.full_name?.[0] || "M"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.full_name}</h2>
                <p className="text-muted-foreground">{mentorProfile?.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={mentorProfile?.status === 'active' ? 'default' : 'secondary'}>
                    {mentorProfile?.status || 'pending'}
                  </Badge>
                  {mentorProfile?.is_active && (
                    <Badge variant="outline">Available</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Content */}
      {isEditing ? (
        <form className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  placeholder="Tell mentees about your background, experience, achievements..."
                  value={formData.detailedBio}
                  onChange={(e) => setFormData(prev => ({ ...prev, detailedBio: e.target.value }))}
                  rows={6}
                  required
                />
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
            </CardContent>
          </Card>

          {/* Expertise & Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Expertise & Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Expertise Areas */}
              <div>
                <Label>Expertise Areas *</Label>
                <div className="flex gap-2 mb-3">
                  <Select onValueChange={addExpertise}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select expertise area" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonExpertiseAreas.map((area) => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Or type custom area"
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise(newExpertise))}
                    />
                    <Button type="button" onClick={() => addExpertise(newExpertise)} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.expertise_areas.map((area) => (
                    <Badge key={area} variant="secondary" className="cursor-pointer" onClick={() => removeExpertise(area)}>
                      {area} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <Label>Skills *</Label>
                <div className="flex gap-2 mb-3">
                  <Select onValueChange={addSkill}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonSkills.map((skill) => (
                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Or type custom skill"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                    />
                    <Button type="button" onClick={() => addSkill(newSkill)} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                      {skill} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Work Experience
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addWorkExperience}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Experience
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {workExperience.map((exp, index) => (
                <Card key={index} className="p-4 mb-4">
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
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Position</Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label>Description</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                      placeholder="Describe your role, responsibilities, and achievements..."
                      rows={3}
                    />
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Recent Job Roles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Job Roles</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addJobRole}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentJobRoles.map((role, index) => (
                <Card key={index} className="p-4 mb-4">
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
                      <Label>Job Title</Label>
                      <Input
                        value={role.title}
                        onChange={(e) => updateJobRole(index, 'title', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={role.company}
                        onChange={(e) => updateJobRole(index, 'company', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={role.startDate}
                        onChange={(e) => updateJobRole(index, 'startDate', e.target.value)}
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
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={role.isCurrent}
                        onChange={(e) => {
                          updateJobRole(index, 'isCurrent', e.target.checked);
                          if (e.target.checked) {
                            updateJobRole(index, 'endDate', '');
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">Current position</span>
                    </label>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Social Media Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/your-profile"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="githubUrl">GitHub Profile</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/your-username"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="twitterUrl">Twitter Profile</Label>
                <Input
                  id="twitterUrl"
                  type="url"
                  placeholder="https://twitter.com/your-username"
                  value={formData.twitterUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="personalWebsiteUrl">Personal Website</Label>
                <Input
                  id="personalWebsiteUrl"
                  type="url"
                  placeholder="https://your-website.com"
                  value={formData.personalWebsiteUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, personalWebsiteUrl: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Certificates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certificates (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="certificates">Upload Additional Certificates</Label>
                <Input
                  id="certificates"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => setCertificates(Array.from(e.target.files || []))}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload certificates (PDF, JPG, PNG) - Optional
                </p>
              </div>
              
              {mentorProfile?.certificates && mentorProfile.certificates.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Current Certificates</h4>
                  <div className="space-y-2">
                    {mentorProfile.certificates.map((cert: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <Award className="w-4 h-4" />
                        <span className="flex-1">{cert.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(cert.url, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      ) : (
        // Display Mode
        <div className="space-y-6">
          {/* Basic Info Display */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{mentorProfile?.bio}</p>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{mentorProfile?.detailed_bio}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-medium mb-2">Experience</h4>
                  <p className="text-muted-foreground">{mentorProfile?.years_experience} years</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Hourly Rate</h4>
                  <p className="text-muted-foreground">${mentorProfile?.hourly_rate}/hour</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expertise & Skills Display */}
          <Card>
            <CardHeader>
              <CardTitle>Expertise & Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Expertise Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {mentorProfile?.expertise_areas?.map((area) => (
                      <Badge key={area} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {mentorProfile?.skills?.map((skill) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Experience Display */}
          {mentorProfile?.work_experience && mentorProfile.work_experience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mentorProfile.work_experience.map((exp, index) => (
                    <div key={index} className="border-l-2 border-primary pl-4">
                      <h4 className="font-medium">{exp.position}</h4>
                      <p className="text-muted-foreground">{exp.company}</p>
                      <p className="text-sm text-muted-foreground">
                        {exp.startDate} - {exp.endDate}
                      </p>
                      <p className="mt-2">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Job Roles Display */}
          {mentorProfile?.recent_job_roles && mentorProfile.recent_job_roles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Job Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mentorProfile.recent_job_roles.map((role, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{role.title}</h4>
                        <p className="text-muted-foreground">{role.company}</p>
                        <p className="text-sm text-muted-foreground">
                          {role.startDate} - {role.isCurrent ? 'Present' : role.endDate}
                        </p>
                      </div>
                      {role.isCurrent && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Social Media Links Display */}
          {mentorProfile?.social_media_links && Object.values(mentorProfile.social_media_links).some(link => link) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Social Media Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mentorProfile.social_media_links.linkedin && (
                    <a 
                      href={mentorProfile.social_media_links.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  )}
                  {mentorProfile.social_media_links.github && (
                    <a 
                      href={mentorProfile.social_media_links.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      GitHub Profile
                    </a>
                  )}
                  {mentorProfile.social_media_links.twitter && (
                    <a 
                      href={mentorProfile.social_media_links.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      Twitter Profile
                    </a>
                  )}
                  {mentorProfile.social_media_links.website && (
                    <a 
                      href={mentorProfile.social_media_links.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      Personal Website
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certificates Display */}
          {mentorProfile?.certificates && mentorProfile.certificates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mentorProfile.certificates.map((cert: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Award className="w-4 h-4" />
                      <span className="flex-1">{cert.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(cert.url, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
// Mock data for testing when backend is not available
export const mockMentors = [
  {
    id: "1",
    full_name: "Sarah Chen",
    avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b109?w=100&h=100&fit=crop&crop=face",
    role: "mentor",
    expertise: ["Product Management", "Leadership"],
    bio: "Senior Product Manager at Google with 8+ years of experience in tech product development.",
    rating: 4.9,
    hourly_rate: 150,
    xp: 2500,
    current_streak_days: 45
  },
  {
    id: "2", 
    full_name: "Michael Rodriguez",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    role: "mentor",
    expertise: ["Software Engineering", "AI/ML"],
    bio: "Lead Software Engineer at Microsoft specializing in AI and machine learning applications.",
    rating: 4.8,
    hourly_rate: 180,
    xp: 3200,
    current_streak_days: 67
  },
  {
    id: "3",
    full_name: "Emily Johnson",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", 
    role: "mentor",
    expertise: ["UX Design", "Product Strategy"],
    bio: "UX Design Director with 10+ years creating user-centered digital experiences.",
    rating: 4.7,
    hourly_rate: 140,
    xp: 2100,
    current_streak_days: 32
  }
];

export const mockLeaderboard = mockMentors.map(mentor => ({
  user_id: mentor.id,
  full_name: mentor.full_name,
  avatar_url: mentor.avatar_url,
  role: mentor.role,
  xp: mentor.xp,
  current_streak_days: mentor.current_streak_days
}));

export const mockCategories = [
  {
    id: "tech",
    name: "Technology & AI",
    mentor_count: 500,
    description: "Learn from tech leaders in AI, ML, software development, and emerging technologies."
  },
  {
    id: "career",
    name: "Career Development", 
    mentor_count: 350,
    description: "Get guidance on career transitions, leadership skills, and professional growth."
  },
  {
    id: "entrepreneurship",
    name: "Entrepreneurship",
    mentor_count: 200,
    description: "Connect with successful founders and learn about starting and scaling businesses."
  }
];

export const mockTestimonials = [
  {
    id: "1",
    mentee_name: "Alex Thompson",
    mentee_role: "Software Engineer",
    content: "Sarah helped me transition from junior to senior engineer. Her guidance was invaluable!",
    rating: 5,
    mentor_name: "Sarah Chen"
  },
  {
    id: "2", 
    mentee_name: "Maria Garcia",
    mentee_role: "Product Manager",
    content: "Michael's insights on AI implementation helped me launch our ML product successfully.",
    rating: 5,
    mentor_name: "Michael Rodriguez"
  }
];

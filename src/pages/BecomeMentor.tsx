import { ArrowLeft, CheckCircle, Users, DollarSign, Calendar, Star } from "lucide-react"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"

const benefits = [
  {
    icon: DollarSign,
    title: "Earn Extra Income",
    description: "Set your own rates and earn $50-200+ per hour sharing your expertise"
  },
  {
    icon: Users,
    title: "Make an Impact", 
    description: "Help shape the next generation of professionals in your field"
  },
  {
    icon: Calendar,
    title: "Flexible Schedule",
    description: "Choose when you want to mentor - fits around your current commitments"
  },
  {
    icon: Star,
    title: "Build Your Brand",
    description: "Establish yourself as a thought leader and grow your professional network"
  }
]

const requirements = [
  "3+ years of professional experience in your field",
  "Passion for teaching and mentoring others",
  "Excellent communication skills",
  "Commitment to helping mentees succeed"
]

export default function BecomeMentor() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Become a Mentor</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-card to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Share Your Expertise,{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">Transform Careers</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Join thousands of industry experts who are making a difference while earning extra income. 
            Help shape the future by mentoring the next generation of professionals.
          </p>
          <div className="flex items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span>2,500+ Active Mentors</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span>$150 Average Hourly Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span>Flexible Scheduling</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">Why Become a Mentor?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-medium transition-all">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements & Application Form */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Requirements */}
              <div>
                <h3 className="text-2xl font-bold mb-6">Mentor Requirements</h3>
                <div className="space-y-4">
                  {requirements.map((requirement, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{requirement}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-card rounded-lg border">
                  <h4 className="font-semibold mb-2">Popular Mentoring Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Product Management</Badge>
                    <Badge variant="secondary">Software Engineering</Badge>
                    <Badge variant="secondary">Data Science</Badge>
                    <Badge variant="secondary">UX/UI Design</Badge>
                    <Badge variant="secondary">Marketing</Badge>
                    <Badge variant="secondary">Sales</Badge>
                    <Badge variant="secondary">Leadership</Badge>
                    <Badge variant="secondary">Career Transition</Badge>
                  </div>
                </div>
              </div>

              {/* Application Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Apply to Become a Mentor</CardTitle>
                  <p className="text-muted-foreground">Fill out this form and we'll review your application within 2-3 business days.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" />
                  </div>

                  <div>
                    <Label htmlFor="company">Current Company & Role</Label>
                    <Input id="company" placeholder="Senior Engineer at Google" />
                  </div>

                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input id="experience" type="number" placeholder="5" />
                  </div>

                  <div>
                    <Label htmlFor="expertise">Areas of Expertise</Label>
                    <Input id="expertise" placeholder="React, Node.js, System Design..." />
                  </div>

                  <div>
                    <Label htmlFor="rate">Preferred Hourly Rate ($)</Label>
                    <Input id="rate" type="number" placeholder="120" />
                  </div>

                  <div>
                    <Label htmlFor="bio">Tell us about yourself</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Share your background, why you want to mentor, and what unique value you can provide to mentees..."
                      rows={4}
                    />
                  </div>

                  <EnhancedButton className="w-full" size="lg" variant="hero">
                    Submit Application
                  </EnhancedButton>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
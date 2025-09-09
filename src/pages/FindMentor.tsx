import { ArrowLeft, Search, Filter, Star, Clock, DollarSign, X } from "lucide-react"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useEffect, useState, useMemo } from "react"
import { ApiService } from "@/lib/api-service"
import { FilterContent } from "@/components/search/FilterContent"



export default function FindMentor() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mentors, setMentors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState("rating")
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [availabilityDate, setAvailabilityDate] = useState<Date | null>(null)
  const [availabilityTimeOfDay, setAvailabilityTimeOfDay] = useState<string>("any")

  const allExpertiseAreas = [
    "Product Management", "Engineering", "Marketing", "Design", 
    "Data Science", "Leadership", "Career Growth", "Startup Strategy",
    "Frontend Development", "Backend Development", "Full Stack",
    "UI/UX Design", "Digital Marketing", "Sales", "Business Strategy"
  ]

  // Get category and expertise from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const expertiseParam = searchParams.get('expertise');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    
    if (expertiseParam) {
      setSelectedExpertise(prev => {
        if (!prev.includes(expertiseParam)) {
          return [...prev, expertiseParam];
        }
        return prev;
      });
    }
  }, [searchParams]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await ApiService.getCategories();
        setCategories(data || []);
      } catch (error) {
        console.warn("Failed to load categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Load mentors
  useEffect(() => {
    const loadMentors = async () => {
      try {
        setLoading(true);
        const { data } = await ApiService.getMentors();
        setMentors(data || []);
      } catch (error) {
        console.warn("Failed to load mentors:", error);
        setMentors([]);
      } finally {
        setLoading(false);
      }
    };
    loadMentors();
  }, [])

  // Filter and search mentors
  const filteredMentors = useMemo(() => {
    return mentors.filter(mentor => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const name = (mentor.profiles?.full_name || "").toLowerCase()
        const bio = (mentor.bio || "").toLowerCase()
        const skills = (mentor.expertise_areas || mentor.skills || []).join(" ").toLowerCase()
        
        if (!name.includes(query) && !bio.includes(query) && !skills.includes(query)) {
          return false
        }
      }

      // Category filter
      if (selectedCategory) {
        const category = categories.find(cat => cat.id === selectedCategory);
        if (category) {
          // If we have a category selected, check if mentor belongs to this category
          // This is a simplified implementation - in a real app, you'd have a proper
          // relationship between mentors and categories in the database
          const mentorExpertise = mentor.expertise_areas || mentor.skills || [];
          const categoryName = category.name.toLowerCase();
          
          // Check if any of the mentor's expertise areas match the category name
          const matchesCategory = mentorExpertise.some((skill: string) => 
            categoryName.includes(skill.toLowerCase()) || 
            skill.toLowerCase().includes(categoryName.split(' ')[0].toLowerCase())
          );
          
          if (!matchesCategory) return false;
        }
      }

      // Expertise filter
      if (selectedExpertise.length > 0) {
        const mentorExpertise = mentor.expertise_areas || mentor.skills || []
        const hasExpertise = selectedExpertise.some(exp => 
          mentorExpertise.some((skill: string) => 
            skill.toLowerCase().includes(exp.toLowerCase())
          )
        )
        if (!hasExpertise) return false
      }

      // Price filter
      const rate = mentor.hourly_rate || 100
      if (rate < priceRange[0] || rate > priceRange[1]) {
        return false
      }

      // Rating filter - using default 4.5 for now since we don't have calculated ratings yet
      const rating = 4.5
      if (rating < minRating) {
        return false
      }

      return true
    })
  }, [mentors, searchQuery, selectedExpertise, priceRange, minRating, selectedCategory, categories])

  // Sort mentors
  const sortedMentors = useMemo(() => {
    return [...filteredMentors].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          // Default rating since we don't have calculated ratings yet
          return 4.5 - 4.5
        case "price-low":
          return (a.hourly_rate || 100) - (b.hourly_rate || 100)
        case "price-high":
          return (b.hourly_rate || 100) - (a.hourly_rate || 100)
        case "experience":
          return (b.years_experience || 5) - (a.years_experience || 5)
        default:
          return 0
      }
    })
  }, [filteredMentors, sortBy])

  const handleExpertiseToggle = (expertise: string) => {
    setSelectedExpertise(prev => 
      prev.includes(expertise) 
        ? prev.filter(e => e !== expertise)
        : [...prev, expertise]
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedExpertise([])
    setPriceRange([0, 200])
    setMinRating(0)
    setSortBy("rating")
    setAvailabilityDate(null)
    setAvailabilityTimeOfDay("any")
    setSelectedCategory(null)
  }

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
            <h1 className="text-2xl font-bold text-foreground">Find Your Perfect Mentor</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <section className="bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search by name, company, or expertise..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 md:hidden">
                    <Filter className="w-4 h-4" />
                    Filters {(selectedExpertise.length > 0 || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 200) && 
                      <Badge variant="secondary" className="ml-1">{selectedExpertise.length + (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 200 ? 1 : 0)}</Badge>
                    }
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Mentors</SheetTitle>
                    <SheetDescription>Refine your search to find the perfect mentor</SheetDescription>
                  </SheetHeader>
                  <FilterContent 
                    selectedExpertise={selectedExpertise}
                    allExpertiseAreas={allExpertiseAreas}
                    handleExpertiseToggle={handleExpertiseToggle}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    minRating={minRating}
                    setMinRating={setMinRating}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    clearFilters={clearFilters}
                  />
                </SheetContent>
              </Sheet>
              
              {/* Desktop Filter */}
              <div className="hidden md:flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="experience">Most Experience</SelectItem>
                  </SelectContent>
                </Select>
                
                {(selectedExpertise.length > 0 || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 200) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedExpertise.length > 0 || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 200) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedExpertise.map(exp => (
                  <Badge key={exp} variant="secondary" className="flex items-center gap-1">
                    {exp}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => handleExpertiseToggle(exp)} />
                  </Badge>
                ))}
                {minRating > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {minRating}+ stars
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setMinRating(0)} />
                  </Badge>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 200) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    ${priceRange[0]}-${priceRange[1]}/hr
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRange([0, 200])} />
                  </Badge>
                )}
              </div>
            )}

            {/* Quick Filters */}
            <div className="hidden md:flex flex-wrap gap-2">
              {allExpertiseAreas.slice(0, 5).map(area => (
                <Badge 
                  key={area} 
                  variant={selectedExpertise.includes(area) ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleExpertiseToggle(area)}
                >
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mentors Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {loading ? "Loading..." : `${sortedMentors.length} mentors found`}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                          <div className="h-3 bg-muted rounded w-1/3" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex gap-1">
                          <div className="h-6 bg-muted rounded w-16" />
                          <div className="h-6 bg-muted rounded w-20" />
                        </div>
                        <div className="flex justify-between">
                          <div className="h-4 bg-muted rounded w-24" />
                          <div className="h-8 bg-muted rounded w-20" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : sortedMentors.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    {searchQuery || selectedExpertise.length > 0 ? "No mentors match your search criteria" : "No mentors found"}
                  </div>
                  {(searchQuery || selectedExpertise.length > 0) && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                sortedMentors.map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-medium transition-all cursor-pointer" onClick={() => navigate(`/mentor/${mentor.user_id}`)}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={mentor.profiles?.avatar_url} alt={mentor.profiles?.full_name || 'Mentor'} />
                        <AvatarFallback>{(mentor.profiles?.full_name || '').split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-card-foreground">{mentor.profiles?.full_name || 'Unknown Mentor'}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2">{mentor.bio || mentor.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm font-medium">4.5</span>
                          <span className="text-muted-foreground text-sm">({mentor.years_experience || 5} years exp)</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(mentor.expertise_areas || mentor.skills || []).slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {(mentor.expertise_areas || mentor.skills || []).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(mentor.expertise_areas || mentor.skills || []).length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-foreground">${mentor.hourly_rate || 100}/hour</span>
                      </div>
                      <EnhancedButton size="sm" variant="premium" onClick={(e) => { e.stopPropagation(); navigate(`/mentor/${mentor.user_id}`) }}>
                        Book Session
                      </EnhancedButton>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            </div>

            {/* Load More */}
            {!loading && sortedMentors.length > 0 && (
              <div className="text-center mt-12">
                <EnhancedButton variant="outline" size="lg">
                  Load More Mentors
                </EnhancedButton>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
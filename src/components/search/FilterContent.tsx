import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Calendar, Clock } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface FilterContentProps {
  selectedExpertise: string[]
  allExpertiseAreas: string[]
  handleExpertiseToggle: (expertise: string) => void
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
  minRating: number
  setMinRating: (rating: number) => void
  sortBy: string
  setSortBy: (sort: string) => void
  clearFilters: () => void
  hasAvailabilityFilter?: boolean
  availabilityDate?: Date | null
  setAvailabilityDate?: (date: Date | null) => void
  availabilityTimeOfDay?: string
  setAvailabilityTimeOfDay?: (time: string) => void
}

export function FilterContent({
  selectedExpertise,
  allExpertiseAreas,
  handleExpertiseToggle,
  priceRange,
  setPriceRange,
  minRating,
  setMinRating,
  sortBy,
  setSortBy,
  clearFilters,
  hasAvailabilityFilter = true,
  availabilityDate = null,
  setAvailabilityDate = () => {},
  availabilityTimeOfDay = 'any',
  setAvailabilityTimeOfDay = () => {}
}: FilterContentProps) {
  return (
    <div className="space-y-6 pt-6">
      {/* Sort */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Sort by</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="experience">Most Experience</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expertise Areas */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Expertise Areas</Label>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {allExpertiseAreas.map(area => (
            <Badge 
              key={area} 
              variant={selectedExpertise.includes(area) ? "default" : "secondary"}
              className="cursor-pointer hover:bg-primary/80 text-xs"
              onClick={() => handleExpertiseToggle(area)}
            >
              {area}
            </Badge>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Hourly Rate: ${priceRange[0]} - ${priceRange[1]}
        </Label>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange([value[0], value[1]])}
          max={300}
          min={0}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>$0</span>
          <span>$300+</span>
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Minimum Rating</Label>
        <div className="flex gap-2">
          {[0, 3, 4, 4.5, 5].map(rating => (
            <Button
              key={rating}
              variant={minRating === rating ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setMinRating(rating)}
            >
              <Star className={`w-3 h-3 ${rating > 0 ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              <span className="text-xs">{rating === 0 ? 'Any' : rating}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Availability Filters */}
      {hasAvailabilityFilter && (
        <div className="space-y-4">
          <Label className="text-sm font-medium mb-3 block">Availability</Label>
          
          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !availabilityDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {availabilityDate ? format(availabilityDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={availabilityDate || undefined}
                  onSelect={(date) => setAvailabilityDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time of Day */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Time of Day</Label>
            <RadioGroup 
              value={availabilityTimeOfDay} 
              onValueChange={setAvailabilityTimeOfDay}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="any" id="any" />
                <Label htmlFor="any" className="text-sm">Any time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="morning" id="morning" />
                <Label htmlFor="morning" className="text-sm">Morning (6am - 12pm)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="afternoon" id="afternoon" />
                <Label htmlFor="afternoon" className="text-sm">Afternoon (12pm - 5pm)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="evening" id="evening" />
                <Label htmlFor="evening" className="text-sm">Evening (5pm - 10pm)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      <Button variant="outline" className="w-full" onClick={clearFilters}>
        Clear All Filters
      </Button>
    </div>
  )
}
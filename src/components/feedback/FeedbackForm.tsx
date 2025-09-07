import { useState } from 'react';
import { Star, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

interface FeedbackFormProps {
  bookingId: string;
  mentorId?: string;
  menteeId?: string;
  onSubmitSuccess?: () => void;
  className?: string;
}

const FEEDBACK_TAGS = [
  'Knowledgeable',
  'Great Communicator',
  'Helpful',
  'Insightful',
  'Patient',
  'Motivating',
  'Technical Expert',
  'Career Advice',
  'Actionable Feedback',
  'Well Prepared'
];

export function FeedbackForm({ bookingId, mentorId, menteeId, onSubmitSuccess, className }: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting feedback.',
        variant: 'destructive'
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: 'Comment Too Short',
        description: 'Please provide a more detailed comment (at least 10 characters).',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Determine if user is mentor or mentee
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('mentor_user_id, mentee_user_id')
        .eq('id', bookingId)
        .single();

      if (!bookingData) {
        throw new Error('Booking not found');
      }

      const isMentor = userId === bookingData.mentor_user_id;
      const revieweeId = isMentor ? bookingData.mentee_user_id : bookingData.mentor_user_id;
      const feedbackType = isMentor ? 'mentee' : 'mentor';

      // Insert review
      const { error } = await supabase.from('reviews').insert({
        booking_id: bookingId,
        reviewer_user_id: userId,
        reviewee_user_id: revieweeId,
        rating,
        comment,
        is_public: isPublic,
        tags: selectedTags,
        type: feedbackType,
        status: feedbackType === 'mentor' ? 'pending' : 'approved' // Mentor reviews need moderation
      });

      if (error) throw error;

      // Update booking status
      await supabase
        .from('bookings')
        .update({ 
          status: 'completed',
          ...(isMentor ? { mentor_feedback_submitted: true } : { mentee_feedback_submitted: true })
        })
        .eq('id', bookingId);

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback!',
      });

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your feedback. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Session Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Rate ${star}`}
                  className="p-1 transition-all hover:scale-110"
                  onClick={() => setRating(star)}
                >
                  <Star 
                    className={`w-8 h-8 ${rating >= star ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} 
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select a rating'}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label>Feedback</Label>
            <Textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="Share your experience and provide constructive feedback..."
              className="min-h-[100px]"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Select Tags (Optional)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {FEEDBACK_TAGS.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`tag-${tag}`} 
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                  <label 
                    htmlFor={`tag-${tag}`}
                    className="text-sm cursor-pointer"
                  >
                    {tag}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center space-x-2">
            <Switch 
              id="public-feedback" 
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public-feedback" className="cursor-pointer flex items-center gap-1">
              {isPublic ? (
                <>
                  <Eye className="h-4 w-4" />
                  Make feedback public
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Keep feedback private
                </>
              )}
            </Label>
            <span className="text-xs text-muted-foreground ml-2">
              Public feedback will be visible on the mentor's profile
            </span>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default FeedbackForm;
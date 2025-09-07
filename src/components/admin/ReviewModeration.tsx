import { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, Star, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

interface Review {
  id: string;
  reviewer_user_id: string;
  reviewee_user_id: string;
  booking_id: string;
  rating: number;
  comment: string;
  feedback?: string; // Legacy field
  tags: string[];
  created_at: string;
  is_public: boolean;
  type: 'mentor' | 'mentee';
  status: 'pending' | 'approved' | 'rejected';
  reviewer?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  reviewee?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export function ReviewModeration() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchReviews = async (status: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to match our interface
      const processedReviews = data?.map(review => ({
        ...review,
        comment: review.comment || review.feedback || '',
        tags: review.tags || [],
        reviewer: null, // We'll fetch user details separately if needed
        reviewee: null
      })) || [];

      setReviews(processedReviews as Review[]);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(activeTab);
  }, [activeTab]);

  const handleApprove = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'approved' })
        .eq('id', reviewId);

      if (error) throw error;

      // Update local state
      setReviews(prev => 
        prev.map(review => 
          review.id === reviewId ? { ...review, status: 'approved' } : review
        )
      );
      
      toast({
        title: "Review approved",
        description: "The review has been published.",
      });
    } catch (error) {
      console.error('Error approving review:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve review.",
      });
    }
  };

  const togglePublicStatus = async (reviewId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      const { error } = await supabase
        .from('reviews')
        .update({ is_public: newStatus })
        .eq('id', reviewId);

      if (error) throw error;

      // Update local state
      setReviews(prev => 
        prev.map(review => 
          review.id === reviewId ? { ...review, is_public: newStatus } : review
        )
      );

      toast({
        title: newStatus ? "Review made public" : "Review made private",
        description: newStatus 
          ? "The review is now visible to everyone." 
          : "The review is now only visible to the reviewer and reviewee.",
      });
    } catch (error) {
      console.error('Error toggling review visibility:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update review visibility.",
      });
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'rejected' })
        .eq('id', reviewId);

      if (error) throw error;

      // Update local state
      setReviews(reviews.filter(review => review.id !== reviewId));
      
      toast({
        title: 'Review Rejected',
        description: 'The review has been rejected',
      });
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject review',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Moderation</CardTitle>
        <CardDescription>
          Manage user reviews before they are published on mentor profiles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending
              {activeTab === 'pending' && reviews.length > 0 && (
                <Badge variant="destructive" className="ml-2">{reviews.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-6">
            {loading ? (
              <p className="text-center py-4">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No pending reviews to moderate</p>
              </div>
            ) : (
              reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onApprove={handleApprove} 
                  onReject={handleReject} 
                  onTogglePublic={togglePublicStatus}
                  showActions={true}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="approved" className="space-y-6">
            {loading ? (
              <p className="text-center py-4">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No approved reviews</p>
            ) : (
              reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onTogglePublic={togglePublicStatus}
                  showActions={false}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="space-y-6">
            {loading ? (
              <p className="text-center py-4">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No rejected reviews</p>
            ) : (
              reviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  onApprove={handleApprove} 
                  onTogglePublic={togglePublicStatus}
                  showActions={true}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ReviewCardProps {
  review: Review;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onTogglePublic?: (id: string, currentStatus: boolean) => void;
  showActions: boolean;
}

function ReviewCard({ review, onApprove, onReject, onTogglePublic, showActions }: ReviewCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={review.reviewer?.avatar_url || ''} alt={review.reviewer?.full_name || 'User'} />
              <AvatarFallback>{getInitials(review.reviewer?.full_name || 'U')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {review.reviewer?.full_name || 'Anonymous'} 
                <span className="text-muted-foreground">→</span> 
                {review.reviewee?.full_name || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex mr-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${review.rating >= star ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
              />
            ))}
          </div>
          <Badge variant={review.is_public ? 'default' : 'outline'} className="text-xs">
            {review.is_public ? 'Public' : 'Private'}
          </Badge>
        </div>
      </div>
      
      <p className="text-sm">{review.comment}</p>
      
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {review.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      
      {showActions && (
        <div className="flex justify-end space-x-2 pt-2">
          {onReject && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onReject(review.id)}
              className="text-destructive hover:text-destructive"
            >
              <X className="mr-1 h-4 w-4" />
              Reject
            </Button>
          )}
          {onApprove && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onApprove(review.id)}
            >
              <Check className="mr-1 h-4 w-4" />
              Approve
            </Button>
          )}
          {onTogglePublic && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onTogglePublic(review.id, review.is_public)}
              className="ml-auto"
            >
              {review.is_public ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Make Private
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Make Public
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export default ReviewModeration;
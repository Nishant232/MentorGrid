import { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface Review {
  id: string;
  reviewer_user_id: string;
  reviewee_user_id: string;
  booking_id: string;
  rating: number;
  comment: string;
  tags: string[];
  created_at: string;
  is_public: boolean;
  type: 'mentor' | 'mentee';
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string; // Legacy field
  reviewer?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

interface ReviewDisplayProps {
  userId: string;
  limit?: number;
  showTitle?: boolean;
  className?: string;
  showTabs?: boolean;
}

export function ReviewDisplay({ userId, limit = 5, showTitle = true, className, showTabs = true }: ReviewDisplayProps) {
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [publicReviews, setPublicReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('all');
  
  const toggleExpand = (reviewId: string) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const isExpanded = (reviewId: string) => {
    return !!expandedReviews[reviewId];
  };
  
  const truncateComment = (comment: string, maxLength = 150) => {
    if (comment.length <= maxLength) return comment;
    return comment.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Fetch all approved reviews for this user
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            *,
            reviewer:reviewer_user_id(id, full_name, avatar_url)
          `)
          .eq('reviewee_user_id', userId)
          .eq('status', 'approved')
          .eq('type', 'mentor') // Only show reviews where this user was the mentor
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Process the data to match our interface
        const processedReviews = data?.map(review => ({
          ...review,
          comment: review.comment || review.feedback || '',
          tags: review.tags || []
        })) || [];

        setAllReviews(processedReviews as Review[]);
        
        // Filter public reviews
        const publicOnly = processedReviews.filter(review => review.is_public);
        setPublicReviews(publicOnly as Review[]);

        // Fetch stats for average rating
        const { data: statsData, error: statsError } = await supabase
          .from('reviews')
          .select('rating', { count: 'exact' })
          .eq('reviewee_user_id', userId)
          .eq('status', 'approved')
          .eq('type', 'mentor');

        if (statsError) throw statsError;

        if (statsData && statsData.length > 0) {
          const total = statsData.length;
          const sum = statsData.reduce((acc, review) => acc + review.rating, 0);
          setAverageRating(sum / total);
          setTotalReviews(total);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchReviews();
    }
  }, [userId, limit]);

  if (loading) {
    return <ReviewSkeleton showTitle={showTitle} />;
  }

  const displayReviews = activeTab === 'all' ? allReviews : publicReviews;
  
  if (allReviews.length === 0) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>No reviews yet</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-center text-muted-foreground py-6">
            This mentor hasn't received any reviews yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reviews</span>
            {averageRating !== null && (
              <div className="flex items-center">
                <div className="flex items-center mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${Math.round(averageRating) >= star ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-normal">
                  {averageRating.toFixed(1)} ({totalReviews})
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
      )}
      {showTabs && (
        <Tabs defaultValue="all" className="mb-4" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">
              All Reviews ({allReviews.length})
            </TabsTrigger>
            <TabsTrigger value="public">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                Public Only ({publicReviews.length})
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      <CardContent className="space-y-6">
        {displayReviews.map((review) => (
          <div key={review.id} className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={review.reviewer?.avatar_url || ''} alt={review.reviewer?.full_name || 'User'} />
                  <AvatarFallback>{getInitials(review.reviewer?.full_name || 'U')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{review.reviewer?.full_name || 'Anonymous User'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!review.is_public && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    Private
                  </Badge>
                )}
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${review.rating >= star ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {review.comment && (
              <div className="text-sm">
                {review.comment.length > 150 ? (
                  <>
                    <p>{isExpanded(review.id) ? review.comment : truncateComment(review.comment)}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 h-auto text-xs text-muted-foreground mt-1"
                      onClick={() => toggleExpand(review.id)}
                    >
                      {isExpanded(review.id) ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" /> Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" /> Read more
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <p>{review.comment}</p>
                )}
              </div>
            )}
            {review.tags && review.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {review.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <hr className="mt-4" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReviewSkeleton({ showTitle }: { showTitle: boolean }) {
  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-1 mt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <hr className="mt-4" />
          </div>
        ))}
      </CardContent>
    </Card>
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

export default ReviewDisplay;
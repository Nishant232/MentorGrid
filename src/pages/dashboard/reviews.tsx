import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from './DashboardLayout';

interface Review {
  id: string;
  rating: number;
  comment: string;
  feedback?: string; // Legacy field
  created_at: string;
  type: 'mentor' | 'mentee';
  status: 'pending' | 'approved' | 'rejected';
}

export default function ReviewsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'received';
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  const [givenReviews, setGivenReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch received reviews
        const { data: receivedData } = await supabase
          .from('reviews')
          .select('*')
          .eq('reviewee_user_id', user.id)
          .order('created_at', { ascending: false });

        // Fetch given reviews
        const { data: givenData } = await supabase
          .from('reviews')
          .select('*')
          .eq('reviewer_user_id', user.id)
          .order('created_at', { ascending: false });

        // Process the data to match our interface and cast types correctly
        const processedReceivedReviews = receivedData?.map(review => ({
          ...review,
          comment: review.comment || review.feedback || '',
          type: review.type as 'mentor' | 'mentee',
          status: review.status as 'pending' | 'approved' | 'rejected'
        })) || [];

        const processedGivenReviews = givenData?.map(review => ({
          ...review,
          comment: review.comment || review.feedback || '',
          type: review.type as 'mentor' | 'mentee',
          status: review.status as 'pending' | 'approved' | 'rejected'
        })) || [];

        setReceivedReviews(processedReceivedReviews);
        setGivenReviews(processedGivenReviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderReviewCard = (review: Review) => (
    <Card key={review.id} className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${review.rating >= star ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
              />
            ))}
          </div>
          <Badge variant={review.status === 'approved' ? 'default' : 'secondary'}>
            {review.status}
          </Badge>
        </div>
        <p className="text-sm mb-2">{review.comment || review.feedback || 'No comment provided'}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container py-6">
          <p>Loading reviews...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Reviews</h1>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          const params = new URLSearchParams(searchParams);
          params.set('tab', value);
          navigate(`?${params.toString()}`, { replace: true });
        }}>
          <TabsList>
            <TabsTrigger value="received">Reviews Received</TabsTrigger>
            <TabsTrigger value="given">Reviews Given</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reviews You've Received</CardTitle>
              </CardHeader>
              <CardContent>
                {receivedReviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    No reviews received yet.
                  </p>
                ) : (
                  receivedReviews.map(renderReviewCard)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="given" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reviews You've Given</CardTitle>
              </CardHeader>
              <CardContent>
                {givenReviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    No reviews given yet.
                  </p>
                ) : (
                  givenReviews.map(renderReviewCard)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
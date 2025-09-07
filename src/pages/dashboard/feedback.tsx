import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import DashboardLayout from './DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) {
        navigate('/dashboard/reviews');
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        setUserId(user.id);

        // Get booking details
        const { data, error } = await supabase
          .from('bookings')
          .select(`*`)
          .eq('id', bookingId)
          .single();

        if (error) throw error;

        // Check if user is part of this booking
        if (data.mentor_user_id !== user.id && data.mentee_user_id !== user.id) {
          setError('You are not authorized to leave feedback for this session');
          return;
        }

        // Check if user already submitted feedback
        const isMentor = data.mentor_user_id === user.id;
        if ((isMentor && data.mentor_feedback_submitted) || (!isMentor && data.mentee_feedback_submitted)) {
          setError('You have already submitted feedback for this session');
          return;
        }

        // Check if booking is completed
        if (data.status !== 'completed') {
          setError('You can only leave feedback for completed sessions');
          return;
        }

        setBookingData(data);
      } catch (error) {
        console.error('Error fetching booking data:', error);
        setError('Failed to load booking information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, navigate]);

  const handleSubmitSuccess = () => {
    navigate('/dashboard/reviews?tab=given');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container py-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
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
          <h1 className="text-3xl font-bold">Session Feedback</h1>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : bookingData ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <h2 className="font-medium mb-2">Session Details</h2>
              <p>
                <span className="text-muted-foreground">Session with:</span>{' '}
                {userId === bookingData.mentor_user_id 
                  ? 'Mentee' 
                  : 'Mentor'}
              </p>
              <p>
                <span className="text-muted-foreground">Date:</span>{' '}
                {new Date(bookingData.start_time).toLocaleDateString()}
              </p>
              <p>
                <span className="text-muted-foreground">Time:</span>{' '}
                {new Date(bookingData.start_time).toLocaleTimeString()} - {new Date(bookingData.end_time).toLocaleTimeString()}
              </p>
            </div>

            <FeedbackForm 
              bookingId={bookingData.id as string}
              onSubmitSuccess={handleSubmitSuccess}
            />
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Calendar, Star, TrendingUp, Activity, DollarSign, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import adminService from '@/services/adminService';

interface AnalyticsData {
  totalUsers: number;
  totalMentors: number;
  totalBookings: number;
  completedSessions: number;
  averageRating: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalMentors: 0,
    totalBookings: 0,
    completedSessions: 0,
    averageRating: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();
  
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAnalytics();
      
      if (response.success) {
        setAnalytics({
          totalUsers: response.data.totalUsers || 0,
          totalMentors: response.data.totalMentors || 0,
          totalBookings: response.data.totalBookings || 0,
          completedSessions: response.data.completedSessions || 0,
          averageRating: Number(response.data.averageRating.toFixed(2)),
          totalRevenue: response.data.totalRevenue || 0,
          monthlyGrowth: response.data.monthlyGrowth || 0
        });
      } else {
        throw new Error(response.error || 'Failed to fetch analytics data');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch analytics: ' + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
            <p className="text-muted-foreground">Monitor platform performance and key metrics.</p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Monitor platform performance and key metrics.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mentors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMentors}</div>
            <p className="text-xs text-muted-foreground">
              Currently available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completedSessions} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Session Completion Rate</span>
              <Badge variant="secondary">
                {analytics.totalBookings > 0 
                  ? Math.round((analytics.completedSessions / analytics.totalBookings) * 100)
                  : 0}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Active Mentor Rate</span>
              <Badge variant="secondary">
                {analytics.totalUsers > 0 
                  ? Math.round((analytics.totalMentors / analytics.totalUsers) * 100)
                  : 0}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Average Rating</span>
              <Badge variant="secondary">{analytics.averageRating}/5</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Total Revenue</span>
              <Badge variant="secondary">${analytics.totalRevenue.toFixed(2)}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Avg. Session Value</span>
              <Badge variant="secondary">
                ${analytics.completedSessions > 0 
                  ? (analytics.totalRevenue / analytics.completedSessions).toFixed(2)
                  : '0.00'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Monthly Growth</span>
              <Badge variant="secondary">+{analytics.monthlyGrowth}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
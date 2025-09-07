import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import adminService, { MentorApplication } from '@/services/adminService';

const MentorApproval: React.FC = () => {
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<MentorApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await adminService.getMentorApplications();
      
      if (response.success) {
        setApplications(response.data || []);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error || 'Failed to fetch mentor applications',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch mentor applications: ' + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: MentorApplication) => {
    try {
      setProcessing(application.id);
      const response = await adminService.approveMentorApplication(application.id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `${application.full_name}'s mentor application has been approved.`,
        });
        // Remove from the list or update status
        setApplications(prev => prev.filter(app => app.id !== application.id));
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error || 'Failed to approve mentor application',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve mentor application: ' + error.message,
      });
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (application: MentorApplication) => {
    setSelectedApplication(application);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    
    try {
      setProcessing(selectedApplication.id);
      const response = await adminService.rejectMentorApplication(
        selectedApplication.id, 
        rejectionReason
      );
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `${selectedApplication.full_name}'s mentor application has been rejected.`,
        });
        // Remove from the list or update status
        setApplications(prev => prev.filter(app => app.id !== selectedApplication.id));
        setShowRejectDialog(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error || 'Failed to reject mentor application',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject mentor application: ' + error.message,
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mentor Applications</CardTitle>
          <CardDescription>
            Review and approve mentor applications. Approved mentors will be able to offer mentoring sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending mentor applications.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={application.avatar_url || ''} alt={application.full_name} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{application.full_name}</div>
                          <div className="text-sm text-muted-foreground">{application.title}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {application.expertise_areas.slice(0, 3).map((area, index) => (
                          <Badge key={index} variant="outline">{area}</Badge>
                        ))}
                        {application.expertise_areas.length > 3 && (
                          <Badge variant="outline">+{application.expertise_areas.length - 3} more</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>${application.hourly_rate}/hr</TableCell>
                    <TableCell>
                      {new Date(application.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleApprove(application)}
                          disabled={processing === application.id}
                        >
                          {processing === application.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openRejectDialog(application)}
                          disabled={processing === application.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Mentor Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this mentor application. This will be sent to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedApplication?.avatar_url || ''} alt={selectedApplication?.full_name} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selectedApplication?.full_name}</div>
                <div className="text-sm text-muted-foreground">{selectedApplication?.title}</div>
              </div>
            </div>
            <Textarea
              placeholder="Reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing === selectedApplication?.id}
            >
              {processing === selectedApplication?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorApproval;
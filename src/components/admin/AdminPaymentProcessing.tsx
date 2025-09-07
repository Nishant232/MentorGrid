import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import adminService, { PaymentRecord } from '@/services/adminService';

const AdminPaymentProcessing: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPayments();
      
      if (response.success) {
        setPayments(response.data || []);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error || 'Failed to fetch payments',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch payments: ' + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const openRefundDialog = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setRefundReason('');
    setShowRefundDialog(true);
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;
    
    try {
      setProcessing(selectedPayment.id);
      const response = await adminService.processRefund(
        selectedPayment.id, 
        refundReason
      );
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Payment has been refunded successfully.`,
        });
        // Update the payment status in the list
        setPayments(prev => prev.map(payment => 
          payment.id === selectedPayment.id 
            ? { 
                ...payment, 
                status: 'refunded',
                refunded_at: new Date().toISOString(),
                refund_reason: refundReason 
              } 
            : payment
        ));
        setShowRefundDialog(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.error || 'Failed to process refund',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process refund: ' + error.message,
      });
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amountCents: number) => {
    return `$${(amountCents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-primary text-primary-foreground">Completed</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Refunded</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>
                View and manage payments and process refunds when necessary.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchPayments} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Mentee</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">{payment.id.substring(0, 8)}...</TableCell>
                    <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.mentee_name}</TableCell>
                    <TableCell>{payment.mentor_name}</TableCell>
                    <TableCell>{formatCurrency(payment.amount_cents)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      {payment.status === 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openRefundDialog(payment)}
                          disabled={processing === payment.id}
                        >
                          {processing === payment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <DollarSign className="h-4 w-4 mr-2" />
                          )}
                          Refund
                        </Button>
                      )}
                      {payment.status === 'refunded' && (
                        <span className="text-sm text-muted-foreground">
                          Refunded on {new Date(payment.refunded_at || '').toLocaleDateString()}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Please provide a reason for this refund. This will be recorded for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPayment && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Payment ID:</div>
                  <div className="font-mono">{selectedPayment.id}</div>
                  
                  <div className="text-muted-foreground">Amount:</div>
                  <div className="font-semibold">{formatCurrency(selectedPayment.amount_cents)}</div>
                  
                  <div className="text-muted-foreground">Mentee:</div>
                  <div>{selectedPayment.mentee_name}</div>
                  
                  <div className="text-muted-foreground">Mentor:</div>
                  <div>{selectedPayment.mentor_name}</div>
                  
                  <div className="text-muted-foreground">Date:</div>
                  <div>{new Date(selectedPayment.created_at).toLocaleString()}</div>
                </div>
              </div>
            )}
            <Textarea
              placeholder="Reason for refund"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleRefund}
              disabled={!refundReason.trim() || processing === selectedPayment?.id}
            >
              {processing === selectedPayment?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentProcessing;
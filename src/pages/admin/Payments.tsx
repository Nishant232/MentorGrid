import React from 'react';
import AdminPaymentProcessing from '@/components/admin/AdminPaymentProcessing';

const Payments = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Payments & Earnings</h2>
      <p className="text-muted-foreground">Track platform payments and mentor earnings.</p>
      <AdminPaymentProcessing />
    </div>
  );
};

export default Payments;



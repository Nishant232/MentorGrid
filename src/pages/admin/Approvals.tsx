import React from 'react';
import MentorApproval from '@/components/admin/MentorApproval';

const Approvals = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Mentor Applications</h2>
      <p className="text-muted-foreground">Review and approve mentor applications.</p>
      <MentorApproval />
    </div>
  );
};

export default Approvals;



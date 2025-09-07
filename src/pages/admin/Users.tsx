import AdminUserManagement from '@/components/admin/AdminUserManagement';
import RoleBasedContent from '@/components/admin/RoleBasedContent';

const Users = () => {
  return (
    <RoleBasedContent allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        
        <AdminUserManagement />
      </div>
    </RoleBasedContent>
  );
};

export default Users;
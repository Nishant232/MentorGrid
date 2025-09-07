import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, UserRole } from '@/lib/types/auth';
import { Loader2, UserCheck, UserX, Crown, Search, RefreshCw, Ban, CheckCircle } from 'lucide-react';
import adminService from '@/services/adminService';

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      const response = {
        success: !error,
        data: users,
        error: error?.message
      };
      
      if (response.success) {
        setUsers(response.data || []);
      } else {
        throw new Error(response.error || 'Failed to fetch users');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch users: ' + error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filterUsers = () => {
    let result = [...users];
    
    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'suspended') {
        result = result.filter(user => user.is_suspended);
      } else {
        result = result.filter(user => user.role === activeTab && !user.is_suspended);
      }
    } else {
      result = result.filter(user => !user.is_suspended);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        user => 
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(result);
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdating(userId);
      
      const response = await adminService.updateUserRole(userId, newRole);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update role');
      }

      // Update local state
      setUsers(prev => prev.map(userItem => 
        userItem.user_id === userId ? { ...userItem, role: newRole } : userItem
      ));

      toast({
        title: 'Success',
        description: `User role updated to ${newRole}. Action has been logged for audit.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update user role',
      });
    } finally {
      setUpdating(null);
    }
  };
  
  const openSuspendDialog = (user: User) => {
    setSelectedUser(user);
    setSuspensionReason('');
    setShowSuspendDialog(true);
  };
  
  const toggleUserSuspension = async (userId: string, suspend: boolean, reason?: string) => {
    try {
      setUpdating(userId);
      
      const response = await adminService.toggleUserSuspension(userId, suspend, reason);
      
      if (!response.success) {
        throw new Error(response.error || `Failed to ${suspend ? 'suspend' : 'reinstate'} user`);
      }

      // Update local state
      setUsers(prev => prev.map(userItem => 
        userItem.user_id === userId ? { ...userItem, is_suspended: suspend, suspension_reason: reason || userItem.suspension_reason } : userItem
      ));

      toast({
        title: 'Success',
        description: `User ${suspend ? 'suspended' : 'reinstated'} successfully.`,
      });
      
      if (suspend) {
        setShowSuspendDialog(false);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `Failed to ${suspend ? 'suspend' : 'reinstate'} user`,
      });
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'mentor': return 'default';
      case 'mentee': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'mentor': return <UserCheck className="w-4 h-4" />;
      case 'mentee': return <UserX className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage user roles, permissions, and account status across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={fetchUsers} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mentee">Mentees</TabsTrigger>
              <TabsTrigger value="mentor">Mentors</TabsTrigger>
              <TabsTrigger value="admin">Admins</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your criteria.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.full_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(user.role)}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.onboarding_completed ? 'default' : 'secondary'}>
                          {user.onboarding_completed ? 'Complete' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_suspended ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Ban className="h-3 w-3" />
                            Suspended
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!user.is_suspended ? (
                            <>
                              <Select
                                value={user.role}
                                onValueChange={(newRole: UserRole) => updateUserRole(user.user_id, newRole)}
                                disabled={updating === user.user_id}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mentee">Mentee</SelectItem>
                                  <SelectItem value="mentor">Mentor</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => openSuspendDialog(user)}
                                disabled={updating === user.user_id}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Suspend
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleUserSuspension(user.user_id, false)}
                              disabled={updating === user.user_id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Reinstate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>
      </CardContent>
      
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User Account</DialogTitle>
            <DialogDescription>
              This will prevent the user from accessing the platform. Please provide a reason for the suspension.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUser && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">User:</div>
                  <div className="font-semibold">{selectedUser.full_name}</div>
                  
                  <div className="text-muted-foreground">Email:</div>
                  <div>{selectedUser.email}</div>
                  
                  <div className="text-muted-foreground">Role:</div>
                  <div>{selectedUser.role}</div>
                </div>
              </div>
            )}
            <Textarea
              placeholder="Reason for suspension"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedUser && toggleUserSuspension(selectedUser.user_id, true, suspensionReason)}
              disabled={!suspensionReason.trim() || updating === selectedUser?.user_id}
            >
              {updating === selectedUser?.user_id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminUserManagement;
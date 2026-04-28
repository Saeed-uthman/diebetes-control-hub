import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search, Users, UserCheck, UserX, Shield, HeartPulse, MoreHorizontal, Eye, Mail, Calendar, Clock, Filter, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/services/authService';
import { userService, UserStats } from '@/services/userService';
import { useAuthenticatedData } from '@/hooks/useApiData';
import { useApiAction } from '@/hooks/useApiAction';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

const UserManagement = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('non-infected');

  const fetchUsers = useCallback(() => userService.getAll(), []);
  const fetchStats = useCallback(() => userService.getStats(), []);

  const { data: userList, loading, error, refetch } = useAuthenticatedData(fetchUsers, isAuthenticated);
  const { data: stats } = useAuthenticatedData(fetchStats, isAuthenticated);

  const { execute: verifyUser } = useApiAction(
    (id: string) => userService.verify(id),
    { successMessage: 'User verified successfully', onSuccess: refetch }
  );
  const { execute: deleteUser } = useApiAction(
    (id: string) => userService.delete(id),
    { successMessage: 'User removed', onSuccess: refetch }
  );
  const { execute: changeRole } = useApiAction(
    ({ id, role }: { id: string; role: UserRole }) => userService.changeRole(id, role),
    { successMessage: 'Role changed successfully', onSuccess: refetch }
  );

  const filteredUsers = useMemo(() => {
    if (!userList) return [];
    return userList.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'verified' && user.verified) ||
        (statusFilter === 'pending' && !user.verified);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [userList, searchQuery, roleFilter, statusFilter]);

  const localStats = useMemo(() => ({
    total: stats?.total ?? userList?.length ?? 0,
    admins: stats?.admin ?? 0,
    infected: stats?.infected ?? 0,
    nonInfected: stats?.non_infected ?? 0,
    pending: stats?.pending ?? 0,
  }), [stats, userList]);

  if (loading && !userList) return <LoadingSpinner message="Loading users..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"><Shield className="mr-1 h-3 w-3" />Admin</Badge>;
      case 'infected':
        return <Badge className="bg-primary/20 text-primary hover:bg-primary/30"><HeartPulse className="mr-1 h-3 w-3" />Patient</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"><Users className="mr-1 h-3 w-3" />Prevention</Badge>;
    }
  };

  const getStatusBadge = (verified: boolean) => verified
    ? <Badge variant="outline" className="border-primary/50 text-primary"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>
    : <Badge variant="outline" className="border-warning/50 text-warning"><AlertCircle className="mr-1 h-3 w-3" />Pending</Badge>;

  const handleChangeRole = () => {
    if (selectedUser) {
      changeRole({ id: selectedUser.id, role: newRole });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, verify accounts, and control access</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2">
          <Shield className="h-5 w-5 text-purple-400" />
          <span className="font-medium text-purple-400">Admin Only</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><Users className="h-5 w-5 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{localStats.total}</p><p className="text-xs text-muted-foreground">Total Users</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10"><Shield className="h-5 w-5 text-purple-400" /></div><div><p className="text-2xl font-bold">{localStats.admins}</p><p className="text-xs text-muted-foreground">Admins</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><HeartPulse className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{localStats.infected}</p><p className="text-xs text-muted-foreground">Patients</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10"><Users className="h-5 w-5 text-blue-400" /></div><div><p className="text-2xl font-bold">{localStats.nonInfected}</p><p className="text-xs text-muted-foreground">Prevention</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10"><AlertCircle className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{localStats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="infected">Patient</SelectItem>
                <SelectItem value="non-infected">Prevention</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage user accounts and verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.verified)}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-muted-foreground">{user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy') : 'Never'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsDetailOpen(true); }}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setNewRole(user.role); setIsRoleDialogOpen(true); }}><Shield className="mr-2 h-4 w-4" />Change Role</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!user.verified ? (
                          <>
                            <DropdownMenuItem onClick={() => verifyUser(user.id)} className="text-primary"><UserCheck className="mr-2 h-4 w-4" />Verify User</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteUser(user.id)} className="text-destructive"><UserX className="mr-2 h-4 w-4" />Reject User</DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => deleteUser(user.id)} className="text-destructive"><XCircle className="mr-2 h-4 w-4" />Deactivate</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No users found matching your criteria</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Complete profile information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">{getInitials(selectedUser.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <div className="mt-1 flex gap-2">{getRoleBadge(selectedUser.role)}{getStatusBadge(selectedUser.verified)}</div>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm">{selectedUser.email}</p></div></div>
                <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Joined</p><p className="text-sm">{format(new Date(selectedUser.createdAt), 'PPP')}</p></div></div>
                <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Last Active</p><p className="text-sm">{selectedUser.lastLogin ? format(new Date(selectedUser.lastLogin), 'PPP') : 'Never'}</p></div></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Update role for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="infected">Patient</SelectItem>
              <SelectItem value="non-infected">Prevention</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeRole}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

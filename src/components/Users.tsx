import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { Search, UserPlus, ArrowLeft, Edit, Trash } from 'lucide-react';
import api from '../utils/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from './ui/use-toast';

// This interface is for a company-specific member view
interface CompanyMember {
  id: string;
  user: string;
  company: string;
  role: 'OWNER' | 'SUPERVISOR' | 'MEMBER';
  branch: string | null;
  user_name: string;
  company_name: string;
  branch_name: string | null;
}

// This is a new, more general interface for the global user list
interface GlobalUser {
  id: string;
  username: string;
  email: string;
  global_user_level: string;
  // This will be a list of strings like "Company A (Owner)", "Company B (Member)"
  memberships_display: string[];
}

const Users: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCompany, user, selectCompany } = useAuth();
  // We can use a more generic state to hold either CompanyMember or GlobalUser
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [editForm, setEditForm] = useState({ username: '', first_name: '', last_name: '', email: '', global_user_level: 'MEMBER' });
  
  const isDeveloper = user?.global_user_level === 'DEVELOPER';

  // Debug logs
  console.log('selectedCompany in Users.tsx:', selectedCompany);
  console.log('user in Users.tsx:', user);

  // Auto-select first company membership for supervisors/owners using useEffect
  useEffect(() => {
    if (
      !isDeveloper &&
      (!selectedCompany || !selectedCompany.company) &&
      location.pathname !== '/users/new'
    ) {
      const memberships = user?.company_memberships || [];
      if (memberships.length > 0) {
        selectCompany(memberships[0]);
      }
    }
    // Only run on mount or when selectedCompany/user changes
  }, [isDeveloper, selectedCompany, user, selectCompany, location.pathname]);

  if (!isDeveloper && (!selectedCompany || !selectedCompany.company)) {
    const memberships = user?.company_memberships || [];
    if (memberships.length === 0) {
      return (
        <div className="p-6 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">No Company Memberships</h2>
          <p className="mb-4">You are not assigned to any company. Please contact your administrator.</p>
        </div>
      );
    }
    // Otherwise, show a loading spinner/message while auto-selecting
    return <div className="p-6 text-center">Loading company data...</div>;
  }

  // Move fetchAndSetUsers to top-level so it can be used in handlers
  const fetchAndSetUsers = async () => {
    setLoading(true);
    try {
      let response;
      if (isDeveloper) {
        response = await api.get('/users/');
      } else if (selectedCompany && selectedCompany.company) {
        response = await api.get(`/companies/${selectedCompany.company}/members/`);
      } else {
        return;
      }
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDeveloper || (selectedCompany && selectedCompany.company)) {
      fetchAndSetUsers();
    }
  }, [selectedCompany, isDeveloper, navigate]);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = users.filter((u) => {
        if (isDeveloper) {
            // Search in username, email, or memberships for Boss Developer
            return (
                u.username.toLowerCase().includes(lowercasedQuery) ||
                u.email?.toLowerCase().includes(lowercasedQuery) ||
                u.memberships_display?.join(', ').toLowerCase().includes(lowercasedQuery)
            );
        } else {
            // Search in user_name, role, or branch_name for Supervisor/Owner
            return (
                u.user_name.toLowerCase().includes(lowercasedQuery) ||
                u.role.toLowerCase().includes(lowercasedQuery) ||
                u.branch_name?.toLowerCase().includes(lowercasedQuery)
            );
        }
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users, isDeveloper]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const canAddUsers = isDeveloper || selectedCompany?.role === 'OWNER' || selectedCompany?.role === 'SUPERVISOR';
  
  const title = isDeveloper ? "System-Wide User Management" : `User Management for ${selectedCompany?.company_name}`;
  const cardTitle = isDeveloper ? "All System Users" : "Company Members";

  const handleEditUser = (user: any) => {
    setUserToEdit(user);
    setEditForm({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      global_user_level: user.global_user_level || 'MEMBER',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!userToEdit) return;
    try {
      await api.patch(`/users/${userToEdit.id}/`, editForm);
      setIsEditDialogOpen(false);
      setUserToEdit(null);
      fetchAndSetUsers();
      toast({ title: 'Success', description: 'User updated successfully.' });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({ title: 'Error', description: 'Failed to update user.', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}/`);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchAndSetUsers();
      toast({ title: 'Success', description: 'User deleted successfully.' });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: 'Error', description: 'Failed to delete user.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Button variant="outline" size="sm" className="mb-4" onClick={() => navigate('/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        {canAddUsers && (
          <Button onClick={() => navigate('/users/new')} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        )}
      </header>

      <Card className="mb-6">
        <CardHeader><CardTitle>Search Users</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder={isDeveloper ? "Search by username, email, company..." : "Search by name, role, branch..."}
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-1"
            />
            <Button disabled><Search className="h-4 w-4 mr-2" />Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{cardTitle}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  {isDeveloper ? (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Global Role</TableHead>
                      <TableHead>Company Memberships</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Company</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Role</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username || user.user_name}</TableCell>
                    {isDeveloper ? (
                      <>
                        <TableCell>{user.first_name} {user.last_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.global_user_level}</TableCell>
                        <TableCell>
                          {Array.isArray(user.memberships_display)
                            ? user.memberships_display.join(', ')
                            : (user.company_name || user.companies || '-')}
                        </TableCell>
                        <TableCell>
                          {Array.isArray(user.memberships)
                            ? user.memberships.map(m => m.branch_name).filter(Boolean).join(', ')
                            : (user.branch_name || '-')}
                        </TableCell>
                        <TableCell>
                          {Array.isArray(user.memberships)
                            ? user.memberships.map(m => m.role).filter(Boolean).join(', ')
                            : (user.role || '-')}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => { setUserToDelete(user); setIsDeleteDialogOpen(true); }}>
                            <Trash className="h-4 w-4 mr-2" />Delete
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{user.company_name}</TableCell>
                        <TableCell>{user.branch_name || 'N/A'}</TableCell>
                        <TableCell>{user.role}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {userToEdit?.username}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              placeholder="Username"
              value={editForm.username}
              onChange={e => setEditForm({ ...editForm, username: e.target.value })}
            />
            <Input
              placeholder="First Name"
              value={editForm.first_name}
              onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
            />
            <Input
              placeholder="Last Name"
              value={editForm.last_name}
              onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={editForm.email}
              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
            />
            <Select value={editForm.global_user_level} onValueChange={val => setEditForm({ ...editForm, global_user_level: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Global Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEVELOPER">DEVELOPER</SelectItem>
                <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
                <SelectItem value="MEMBER">MEMBER</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user <b>{userToDelete?.username}</b>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users; 
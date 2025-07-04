import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import api, { getMediaUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, ArrowLeft, Edit, Trash, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ui/use-toast';

interface Company {
  id: string;
  name: string;
  owner: string;
  supervisor: string | null;
  supervisor_name: string | null;
  owner_username: string | null;
  contact_info?: string;
  email?: string;
  location?: string;
  logo?: string;
}

interface Supervisor {
  id: string;
  username: string;
}

const CompanyManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyContact, setNewCompanyContact] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyLocation, setNewCompanyLocation] = useState('');
  const [newCompanyLogo, setNewCompanyLogo] = useState<File | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [editedCompanyName, setEditedCompanyName] = useState('');
  const [editedCompanyContact, setEditedCompanyContact] = useState('');
  const [editedCompanyEmail, setEditedCompanyEmail] = useState('');
  const [editedCompanyLocation, setEditedCompanyLocation] = useState('');
  const [editedCompanyLogo, setEditedCompanyLogo] = useState<File | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(user?.global_user_level === 'DEVELOPER');
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedCompanyForMembers, setSelectedCompanyForMembers] = useState<Company | null>(null);
  const [companyMembers, setCompanyMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [addMemberUsername, setAddMemberUsername] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('USER');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<any | null>(null);
  const [companyBranches, setCompanyBranches] = useState<any[]>([]);
  const [addMemberBranchId, setAddMemberBranchId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.global_user_level === 'DEVELOPER') {
      fetchCompanies();
      fetchSupervisors();
    }
  }, [user]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies/');
      console.log('Companies data received:', response.data);
      console.log('Company logos:', response.data.map((company: any) => ({ 
        name: company.name, 
        logo: company.logo,
        logoUrl: company.logo ? getMediaUrl(company.logo) : null 
      })));
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/users/?role=SUPERVISOR');
      setSupervisors(response.data);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const handleCreateCompany = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newCompanyName);
      if (newCompanyContact) formData.append('contact_info', newCompanyContact);
      if (newCompanyEmail) formData.append('email', newCompanyEmail);
      if (newCompanyLocation) formData.append('location', newCompanyLocation);
      if (newCompanyLogo) formData.append('logo', newCompanyLogo);
      await api.post('/companies/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewCompanyName('');
      setNewCompanyContact('');
      setNewCompanyEmail('');
      setNewCompanyLocation('');
      setNewCompanyLogo(null);
      setIsCreating(false);
      fetchCompanies();
      toast({ title: 'Success', description: 'Company created successfully.' });
    } catch (error) {
      console.error('Error creating company:', error);
      toast({ title: 'Error', description: 'Failed to create company.', variant: 'destructive' });
    }
  };

  const resetEditForm = () => {
    setEditedCompanyName('');
    setSelectedSupervisorId('none');
    setEditedCompanyContact('');
    setEditedCompanyEmail('');
    setEditedCompanyLocation('');
    setEditedCompanyLogo(null);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setEditedCompanyName(company.name);
    setSelectedSupervisorId(company.supervisor || 'none');
    setEditedCompanyContact(company.contact_info || '');
    setEditedCompanyEmail(company.email || '');
    setEditedCompanyLocation(company.location || '');
    setEditedCompanyLogo(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateCompany = async () => {
    if (!selectedCompany) return;
    try {
      const formData = new FormData();
      formData.append('name', editedCompanyName);
      if (editedCompanyContact) formData.append('contact_info', editedCompanyContact);
      if (editedCompanyEmail) formData.append('email', editedCompanyEmail);
      if (editedCompanyLocation) formData.append('location', editedCompanyLocation);
      if (editedCompanyLogo) formData.append('logo', editedCompanyLogo);
      if (selectedSupervisorId && selectedSupervisorId !== 'none') {
        formData.append('supervisor', selectedSupervisorId);
      }
      await api.patch(`/companies/${selectedCompany.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setIsEditModalOpen(false);
      resetEditForm();
      fetchCompanies();
      toast({ title: 'Success', description: 'Company updated successfully.' });
    } catch (error) {
      console.error('Error updating company:', error);
      toast({ title: 'Error', description: 'Failed to update company.', variant: 'destructive' });
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    try {
      await api.delete(`/companies/${companyToDelete.id}/`);
      setIsDeleteModalOpen(false);
      setCompanyToDelete(null);
      fetchCompanies();
      toast({ title: 'Success', description: 'Company deleted successfully.' });
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({ title: 'Error', description: 'Failed to delete company.', variant: 'destructive' });
    }
  };

  const fetchCompanyMembers = async (companyId: string) => {
    setMembersLoading(true);
    try {
      const res = await api.get(`/companies/${companyId}/members/`);
      setCompanyMembers(res.data);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to fetch members', variant: 'destructive' });
    }
    setMembersLoading(false);
  };

  const fetchCompanyBranches = async (companyId: string) => {
    try {
      const res = await api.get(`/companies/${companyId}/branches/`);
      setCompanyBranches(res.data);
    } catch (e) {
      console.error('Failed to fetch branches', e);
    }
  };

  const handleOpenMembersDialog = (company: Company) => {
    setSelectedCompanyForMembers(company);
    setMembersDialogOpen(true);
    fetchCompanyMembers(company.id);
    fetchCompanyBranches(company.id);
    setUserSearchQuery('');
    setUserSearchResults([]);
    setSelectedUserToAdd(null);
    setAddMemberRole('USER');
    setAddMemberBranchId(null);
  };

  const handleRoleChange = async (membershipId: string, newRole: string) => {
    setRoleUpdating(membershipId);
    try {
      await api.patch(`/companies/${selectedCompanyForMembers?.id}/members/${membershipId}/`, { role: newRole });
      fetchCompanyMembers(selectedCompanyForMembers!.id);
      toast({ title: 'Success', description: 'Role updated.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
    setRoleUpdating(null);
  };

  const handleUserSearch = async () => {
    if (!userSearchQuery) return;
    setAddMemberLoading(true);
    try {
      const res = await api.get(`/users/?search=${userSearchQuery}`);
      const existingMemberIds = companyMembers.map(m => m.user);
      const results = res.data.filter((user: any) => !existingMemberIds.includes(user.id));
      setUserSearchResults(results);
      if (results.length === 0) {
        toast({ title: 'No new users found', description: 'The user might already be a member or does not exist.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to search for users', variant: 'destructive' });
    }
    setAddMemberLoading(false);
  };

  const handleAddMember = async () => {
    if (!selectedUserToAdd) {
      toast({ title: 'Error', description: 'Please select a user to add.', variant: 'destructive' });
      return;
    }
    if (['USER', 'BRANCH_MANAGER'].includes(addMemberRole) && !addMemberBranchId) {
      toast({ title: 'Error', description: 'A branch must be selected for this role.', variant: 'destructive' });
      return;
    }

    setAddMemberLoading(true);
    try {
      const payload: { user: string; role: string; branch?: string | null } = {
        user: selectedUserToAdd.id,
        role: addMemberRole,
      };
      if (['USER', 'BRANCH_MANAGER'].includes(addMemberRole)) {
        payload.branch = addMemberBranchId;
      }

      await api.post(`/companies/${selectedCompanyForMembers?.id}/members/`, payload);

      setUserSearchQuery('');
      setUserSearchResults([]);
      setSelectedUserToAdd(null);
      setAddMemberRole('USER');
      setAddMemberBranchId(null);

      fetchCompanyMembers(selectedCompanyForMembers!.id);
      toast({ title: 'Success', description: 'Member added.' });
    } catch (e: any) {
      const errorMsg = e.response?.data ? JSON.stringify(e.response.data) : 'Failed to add member';
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    }
    setAddMemberLoading(false);
  };

  if (user?.global_user_level !== 'DEVELOPER') {
    return <div>You do not have permission to view this page.</div>;
  }

  return (
    <div className="p-6">
       <Button variant="outline" size="sm" className="mb-4" onClick={() => navigate('/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Company Management</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {isCreating ? 'Cancel' : 'Add New Company'}
        </Button>
      </header>

      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="New Company Name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
              <Input
                placeholder="Contact Info (optional)"
                value={newCompanyContact}
                onChange={(e) => setNewCompanyContact(e.target.value)}
              />
              <Input
                placeholder="Email (optional)"
                type="email"
                value={newCompanyEmail}
                onChange={(e) => setNewCompanyEmail(e.target.value)}
              />
              <Input
                placeholder="Location (optional)"
                value={newCompanyLocation}
                onChange={(e) => setNewCompanyLocation(e.target.value)}
              />
              <div>
                <Label>Logo (optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={e => setNewCompanyLogo(e.target.files?.[0] || null)}
                />
              </div>
              <Button onClick={handleCreateCompany}>Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    {company.logo ? (
                      <img 
                        src={getMediaUrl(company.logo)} 
                        alt={`${company.name} logo`}
                        className="w-8 h-8 rounded object-cover"
                        onError={(e) => {
                          console.error('Company table logo failed to load:', {
                            company: company.name,
                            logo: company.logo,
                            logoUrl: getMediaUrl(company.logo),
                            error: e
                          });
                        }}
                        onLoad={() => {
                          console.log('Company logo loaded successfully:', {
                            company: company.name,
                            logo: company.logo,
                            logoUrl: getMediaUrl(company.logo)
                          });
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <Building className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{company.name}</TableCell>
                  <TableCell>{company.owner_username || 'N/A'}</TableCell>
                  <TableCell>{company.supervisor_name || 'Unassigned'}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditCompany(company)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleOpenMembersDialog(company)}>
                      Members
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => { setCompanyToDelete(company); setIsDeleteModalOpen(true); }}>
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) {
          resetEditForm();
        }
      }}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Company: {selectedCompany?.name}</DialogTitle>
            <p className="text-sm text-gray-600">Current company information is pre-filled below. Modify the fields you want to change.</p>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={editedCompanyName}
              onChange={e => setEditedCompanyName(e.target.value)}
              placeholder="Company Name"
              className="bg-gray-50"
            />
            <Label htmlFor="company-contact">Contact Info</Label>
            <Input
              id="company-contact"
              value={editedCompanyContact}
              onChange={e => setEditedCompanyContact(e.target.value)}
              placeholder="Contact Info (optional)"
              className="bg-gray-50"
            />
            <Label htmlFor="company-email">Email</Label>
            <Input
              id="company-email"
              type="email"
              value={editedCompanyEmail}
              onChange={e => setEditedCompanyEmail(e.target.value)}
              placeholder="Email (optional)"
              className="bg-gray-50"
            />
            <Label htmlFor="company-location">Location</Label>
            <Input
              id="company-location"
              value={editedCompanyLocation}
              onChange={e => setEditedCompanyLocation(e.target.value)}
              placeholder="Location (optional)"
              className="bg-gray-50"
            />
            <div>
              <Label htmlFor="supervisor">Supervisor</Label>
              <Select value={selectedSupervisorId || 'none'} onValueChange={setSelectedSupervisorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supervisor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No supervisor</SelectItem>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Logo (optional)</Label>
              {selectedCompany?.logo && (
                <div className="mb-2">
                  <p className="text-sm text-gray-600 mb-2">Current logo:</p>
                  <img 
                    src={getMediaUrl(selectedCompany.logo)} 
                    alt="Current company logo" 
                    className="w-16 h-16 rounded-lg object-cover border"
                    onError={(e) => {
                      console.error('Edit modal logo failed to load:', {
                        company: selectedCompany.name,
                        logo: selectedCompany.logo,
                        logoUrl: getMediaUrl(selectedCompany.logo),
                        error: e
                      });
                    }}
                    onLoad={() => {
                      console.log('Edit modal logo loaded successfully:', {
                        company: selectedCompany.name,
                        logo: selectedCompany.logo,
                        logoUrl: getMediaUrl(selectedCompany.logo)
                      });
                    }}
                  />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={e => setEditedCompanyLogo(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateCompany}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete the company <b>{companyToDelete?.name}</b>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCompany}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Manage Members for {selectedCompanyForMembers?.name}</DialogTitle>
          </DialogHeader>
          {membersLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <b>Current Members</b>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.user_name}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>
                          <Select
                            value={member.role}
                            onValueChange={(val) => handleRoleChange(member.id, val)}
                            disabled={roleUpdating === member.id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OWNER">Owner</SelectItem>
                              <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                              <SelectItem value="BRANCH_MANAGER">Branch Manager</SelectItem>
                              <SelectItem value="USER">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="pt-4 border-t">
                <b>Add New Member</b>
                <div className="flex gap-2 items-center mt-2">
                  <Input
                    placeholder="Search username or email..."
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    disabled={addMemberLoading}
                  />
                  <Button onClick={handleUserSearch} disabled={addMemberLoading}>
                    {addMemberLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {userSearchResults.length > 0 && !selectedUserToAdd && (
                  <div className="mt-2 space-y-1">
                    {userSearchResults.map(user => (
                      <div key={user.id} onClick={() => setSelectedUserToAdd(user)} className="p-2 border rounded-md cursor-pointer hover:bg-gray-100">
                        <p className="font-bold">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.first_name} {user.last_name} ({user.email})</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedUserToAdd && (
                  <div className="mt-4 p-4 border rounded-md bg-gray-50 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p>Adding User: <b>{selectedUserToAdd.username}</b></p>
                        <p className="text-sm text-gray-600">ID: {selectedUserToAdd.id_number}</p>
                      </div>
                      <Button variant="link" onClick={() => setSelectedUserToAdd(null)}>Change</Button>
                    </div>

                    <div className="flex gap-2 items-center">
                      <Select value={addMemberRole} onValueChange={setAddMemberRole}>
                        <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">Owner</SelectItem>
                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                          <SelectItem value="BRANCH_MANAGER">Branch Manager</SelectItem>
                          <SelectItem value="USER">User</SelectItem>
                        </SelectContent>
                      </Select>

                      {(addMemberRole === 'USER' || addMemberRole === 'BRANCH_MANAGER') && (
                        <Select onValueChange={setAddMemberBranchId} value={addMemberBranchId || ''}>
                          <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                          <SelectContent>
                            {companyBranches.map(branch => (
                              <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Button onClick={handleAddMember} disabled={addMemberLoading}>
                      {addMemberLoading ? 'Adding...' : 'Add Member to Company'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyManagement; 
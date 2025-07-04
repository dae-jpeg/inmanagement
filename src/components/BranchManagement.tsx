import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, ArrowLeft, Edit, UserPlus, UserMinus, Trash, BarChart3, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

interface Branch {
  id: string;
  name: string;
  company: string;
  manager_name: string | null;
  company_name?: string;
}

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

interface BranchStatistics {
  branch_id: string;
  branch_name: string;
  company_name: string;
  total_transactions: number;
  withdrawals: number;
  returns: number;
  unique_users: number;
  top_items: Array<{
    item_name: string;
    transaction_count: number;
  }>;
  period: string;
  date_range: {
    start: string | null;
    end: string | null;
  };
}

interface StatisticsSummary {
  statistics: BranchStatistics[];
  period: string;
  total_branches: number;
  summary: {
    total_transactions: number;
    total_withdrawals: number;
    total_returns: number;
    total_unique_users: number;
  };
}

const BranchManagement: React.FC = () => {
  const { user, selectedCompany } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editedBranchName, setEditedBranchName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  
  // Statistics state
  const [statistics, setStatistics] = useState<StatisticsSummary | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [showStatistics, setShowStatistics] = useState(false);

  const isDeveloper = user?.global_user_level === 'DEVELOPER';

  useEffect(() => {
    if (isDeveloper) {
      fetchAllBranches();
    } else if (selectedCompany) {
      fetchCompanyBranches();
      fetchAvailableUsers();
    } else {
      navigate('/dashboard');
    }
  }, [selectedCompany, isDeveloper, navigate]);

  const fetchBranchStatistics = async (period: string = 'all') => {
    setStatisticsLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (selectedCompany && !isDeveloper) {
        params.append('company', selectedCompany.company);
      }
      
      const response = await api.get(`/branch-statistics/?${params}`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching branch statistics:', error);
      toast({ title: 'Error', description: 'Failed to fetch branch statistics.', variant: 'destructive' });
    } finally {
      setStatisticsLoading(false);
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    fetchBranchStatistics(period);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'yesterday': return 'Yesterday';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'all': return 'All Time';
      default: return period;
    }
  };

  const fetchAllBranches = async () => {
    setLoading(true);
    try {
      const response = await api.get('/all-branches/');
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching all branches:', error);
      toast({ title: 'Error', description: 'Failed to fetch branches.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyBranches = async () => {
    if (!selectedCompany) return;
    setLoading(true);
    try {
      const response = await api.get(`/companies/${selectedCompany.company}/branches/`);
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({ title: 'Error', description: 'Failed to fetch branches.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    if (!selectedCompany) return;
    try {
      const response = await api.get(`/companies/${selectedCompany.company}/members/`);
      // Filter users who can be branch managers:
      // - Not supervisors
      // - Either have no branch assignment or are regular users
      const eligibleUsers = response.data.filter((member: any) => 
        member.role === 'USER' && (!member.branch || member.role !== 'BRANCH_MANAGER')
      );
      setAvailableUsers(eligibleUsers.map((member: any) => ({
        id: member.id,
        username: member.user_name,
        first_name: '',
        last_name: ''
      })));
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast({ title: 'Error', description: 'Failed to fetch available users.', variant: 'destructive' });
    }
  };

  const handleCreateBranch = async () => {
    if (!selectedCompany) {
      toast({ title: 'Error', description: 'No company selected to add a branch to.', variant: 'destructive' });
      return;
    }
    try {
      await api.post(`/companies/${selectedCompany.company}/branches/`, { name: newBranchName, company: selectedCompany.company });
      setNewBranchName('');
      setIsCreating(false);
      fetchCompanyBranches();
      toast({ title: 'Success', description: 'Branch created successfully.' });
    } catch (error) {
      console.error('Error creating branch:', error);
      toast({ title: 'Error', description: 'Failed to create branch.', variant: 'destructive' });
    }
  };

  const handleEditBranch = async () => {
    if (!editingBranch || !selectedCompany) return;
    try {
      await api.patch(
        `/companies/${selectedCompany.company}/branches/${editingBranch.id}/`,
        { name: editedBranchName }
      );
      setIsEditDialogOpen(false);
      fetchCompanyBranches();
      toast({ title: 'Success', description: 'Branch updated successfully.' });
    } catch (error) {
      console.error('Error updating branch:', error);
      toast({ title: 'Error', description: 'Failed to update branch.', variant: 'destructive' });
    }
  };

  const handleAssignUser = async () => {
    if (!editingBranch || !selectedCompany || !selectedUserId) return;
    try {
      console.log('Starting user assignment with:', {
        companyId: selectedCompany.company,
        userId: selectedUserId,
        branchId: editingBranch.id
      });

      // First, find the membership ID for the selected user
      const response = await api.get(`/companies/${selectedCompany.company}/members/`);
      console.log('Members response:', response.data);
      
      const membership = response.data.find((m: any) => m.id === selectedUserId);
      console.log('Found membership:', membership);
      
      if (!membership) {
        toast({ title: 'Error', description: 'Selected user membership not found.', variant: 'destructive' });
        return;
      }

      // Update the membership with new branch and role
      console.log('Sending PATCH request with data:', {
        branch: editingBranch.id,
        role: 'BRANCH_MANAGER'
      });

      const updateResponse = await api.patch(
        `/companies/${selectedCompany.company}/members/${selectedUserId}/`,
        {
          branch: editingBranch.id,
          role: 'BRANCH_MANAGER'
        }
      );

      console.log('Update response:', updateResponse);
      setIsAssignDialogOpen(false);
      fetchCompanyBranches();
      fetchAvailableUsers();
      toast({ title: 'Success', description: 'User assigned as branch manager successfully.' });
    } catch (error: any) {
      console.error('Error assigning user:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      console.error('Error config:', error.config);
      
      // Try to get a more detailed error message
      let errorMessage = 'Failed to assign user to branch.';
      if (error.response) {
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.branch) {
            errorMessage = error.response.data.branch;
          } else {
            errorMessage = JSON.stringify(error.response.data);
          }
        }
      }
      
      toast({ 
        title: 'Error', 
        description: errorMessage,
        variant: 'destructive' 
      });
    }
  };

  const handleRemoveManager = async (branch: Branch) => {
    if (!selectedCompany || !branch.manager_name) return;
    try {
      // Find the membership for the current manager
      const response = await api.get(`/companies/${selectedCompany.company}/members/`);
      const managerMembership = response.data.find((m: any) => m.branch === branch.id && m.role === 'BRANCH_MANAGER');
      if (!managerMembership) {
        toast({ title: 'Error', description: 'No branch manager found for this branch.', variant: 'destructive' });
        return;
      }
      await api.patch(`/companies/${selectedCompany.company}/members/${managerMembership.id}/`, {
        role: 'USER'
      });
      fetchCompanyBranches();
      toast({ title: 'Success', description: 'Branch manager removed.' });
    } catch (error) {
      console.error('Error removing manager:', error);
      toast({ title: 'Error', description: 'Failed to remove branch manager.', variant: 'destructive' });
    }
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setEditedBranchName(branch.name);
    setIsEditDialogOpen(true);
  };

  const openAssignDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setSelectedUserId('');
    setIsAssignDialogOpen(true);
  };

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;
    try {
      await api.delete(`/branches/${branchToDelete.id}/`);
      setIsDeleteDialogOpen(false);
      setBranchToDelete(null);
      if (isDeveloper) {
        fetchAllBranches();
      } else {
        fetchCompanyBranches();
      }
      toast({ title: 'Success', description: 'Branch deleted successfully.' });
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast({ title: 'Error', description: 'Failed to delete branch.', variant: 'destructive' });
    }
  };

  // Boss can view, but creation is tied to a company context for now.
  const canManage = isDeveloper || (selectedCompany && (selectedCompany.role === 'OWNER' || selectedCompany.role === 'SUPERVISOR'));
  const canCreate = !isDeveloper && canManage;
  
  const title = isDeveloper ? "System-Wide Branch Management" : `Branch Management for ${selectedCompany?.company_name}`;
  const cardTitle = isDeveloper ? "All System Branches" : "Company Branches";

  if (!canManage) {
    return <div>You do not have permission to view this page.</div>;
  }

  return (
    <div className="p-6">
      <Button variant="outline" size="sm" className="mb-4" onClick={() => navigate('/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setShowStatistics(!showStatistics);
              if (!showStatistics && !statistics) {
                fetchBranchStatistics(selectedPeriod);
              }
            }}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showStatistics ? 'Hide Statistics' : 'Show Statistics'}
          </Button>
          {canCreate && (
            <Button onClick={() => setIsCreating(!isCreating)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {isCreating ? 'Cancel' : 'Add New Branch'}
            </Button>
          )}
        </div>
      </header>

      {/* Branch Statistics Section */}
      {showStatistics && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Branch Transaction Statistics
              </CardTitle>
              <div className="flex gap-2">
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statisticsLoading ? (
              <div className="text-center py-8">Loading statistics...</div>
            ) : statistics ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{statistics.summary.total_transactions}</div>
                      <div className="text-sm text-muted-foreground">Total Transactions</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">{statistics.summary.total_withdrawals}</div>
                      <div className="text-sm text-muted-foreground">Withdrawals</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">{statistics.summary.total_returns}</div>
                      <div className="text-sm text-muted-foreground">Returns</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">{statistics.summary.total_unique_users}</div>
                      <div className="text-sm text-muted-foreground">Unique Users</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Branch Statistics Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Branch Performance ({getPeriodLabel(selectedPeriod)})
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Branch</TableHead>
                        {isDeveloper && <TableHead>Company</TableHead>}
                        <TableHead>Total Transactions</TableHead>
                        <TableHead>Withdrawals</TableHead>
                        <TableHead>Returns</TableHead>
                        <TableHead>Unique Users</TableHead>
                        <TableHead>Top Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statistics.statistics.map((stat, index) => (
                        <TableRow key={stat.branch_id}>
                          <TableCell>
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              #{index + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{stat.branch_name}</TableCell>
                          {isDeveloper && <TableCell>{stat.company_name}</TableCell>}
                          <TableCell className="font-bold">{stat.total_transactions}</TableCell>
                          <TableCell className="text-green-600">{stat.withdrawals}</TableCell>
                          <TableCell className="text-orange-600">{stat.returns}</TableCell>
                          <TableCell>{stat.unique_users}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {stat.top_items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="text-xs">
                                  {item.item_name} ({item.transaction_count})
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No statistics available for the selected period.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isCreating && canCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="New Branch Name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
              />
              <Button onClick={handleCreateBranch}>Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading branches...</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                {isDeveloper && <TableHead>Company</TableHead>}
                <TableHead>Manager</TableHead>
                {canManage && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>{branch.name}</TableCell>
                  {isDeveloper && <TableCell>{branch.company_name}</TableCell>}
                  <TableCell>
                    {branch.manager_name || 'Unassigned'}
                    {branch.manager_name && canManage && !isDeveloper && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2"
                        title="Remove as Manager"
                        onClick={() => handleRemoveManager(branch)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex gap-2">
                        {(isDeveloper || !isDeveloper) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(branch)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                        {isDeveloper && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => { setBranchToDelete(branch); setIsDeleteDialogOpen(true); }}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        )}
                        {!isDeveloper && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(branch)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign Manager
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Branch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update the branch name and save your changes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-4">
              <Input
                placeholder="Branch Name"
                value={editedBranchName}
                onChange={(e) => setEditedBranchName(e.target.value)}
              />
              <Button onClick={handleEditBranch}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Manager Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Branch Manager</DialogTitle>
            <DialogDescription>
              Select a user to assign as the manager for this branch.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAssignUser} disabled={!selectedUserId}>
              Assign as Manager
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete the branch <b>{branchToDelete?.name}</b>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteBranch}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchManagement; 
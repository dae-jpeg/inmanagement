import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getMediaUrl } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { X, ChevronsUpDown, ArrowLeft } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Dialog } from './ui/dialog';
import { Label } from './ui/label';

// Full roles for Boss Developer
const ALL_ROLES = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'USER', label: 'User' },
];

// Limited roles for Supervisor
const SUPERVISOR_ROLES = [
    { value: 'USER', label: 'User' },
];

interface Company {
  id: string;
  name: string;
}

interface Branch {
    id: string;
    name: string;
}

// Move UserFormFields OUTSIDE AddNewUser
const UserFormFields = ({ form, handleInputChange }: {
  form: {
    username: string;
    password: string;
    email: string;
    first_name: string;
    last_name: string;
    id_number: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input name="username" placeholder="Username" value={form.username} onChange={handleInputChange} required />
    <Input name="id_number" placeholder="ID Number (must be unique)" value={form.id_number} onChange={handleInputChange} required />
    <Input name="password" type="password" placeholder="Password" value={form.password} onChange={handleInputChange} required />
    <Input name="email" type="email" placeholder="Email (optional)" value={form.email} onChange={handleInputChange} />
    <Input name="first_name" placeholder="First Name (optional)" value={form.first_name} onChange={handleInputChange} />
    <Input name="last_name" placeholder="Last Name (optional)" value={form.last_name} onChange={handleInputChange} />
  </div>
);

const AddNewUser: React.FC = () => {
  const { user, selectedCompany } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isDeveloper = user?.global_user_level === 'DEVELOPER';
  
  // State for Boss Developer
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [memberships, setMemberships] = useState<{
    company: string;
    role: string;
    branch?: string;
  }[]>([]);
  const [companyBranches, setCompanyBranches] = useState<Record<string, Branch[]>>({});
  const [popoverOpen, setPopoverOpen] = useState(false);

  // State for Supervisor
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Common State
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    id_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);
  const [createdQrCode, setCreatedQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (isDeveloper) {
      api.get('/companies/').then(res => setAllCompanies(res.data));
    } else if (selectedCompany) {
      // Supervisor: fetch branches for their company
      api.get(`/companies/${selectedCompany.company}/branches/`).then(res => setBranches(res.data));
    }
  }, [user, isDeveloper, selectedCompany]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Fetch branches for a company when assigned
  const fetchBranchesForCompany = async (companyId: string) => {
    if (!companyBranches[companyId]) {
      const res = await api.get(`/companies/${companyId}/branches/`);
      setCompanyBranches(prev => ({ ...prev, [companyId]: res.data }));
    }
  };

  const addMembership = async (companyId: string) => {
    if (!memberships.some(m => m.company === companyId)) {
      await fetchBranchesForCompany(companyId);
      setMemberships([...memberships, { company: companyId, role: 'USER', branch: '' }]);
    }
    setPopoverOpen(false);
  };

  const removeMembership = (companyId: string) => {
    setMemberships(memberships.filter(m => m.company !== companyId));
  };

  const updateMembershipRole = async (companyId: string, role: string) => {
    const updated = memberships.map(m => {
      if (m.company === companyId) {
        // If switching to USER, fetch branches if not already
        if (role === 'USER') fetchBranchesForCompany(companyId);
        // Only include branch for USER and BRANCH_MANAGER roles
        if (role === 'USER' || role === 'BRANCH_MANAGER') {
          return { ...m, role, branch: '' };
        } else {
          // Remove branch field entirely for other roles
          const { branch, ...rest } = m;
          return { ...rest, role };
        }
      }
      return m;
    });
    setMemberships(updated);
  };

  const updateMembershipBranch = (companyId: string, branchId: string) => {
    setMemberships(memberships.map(m => m.company === companyId ? { ...m, branch: branchId } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isDeveloper) {
      if (memberships.length === 0) {
        toast({ title: "Validation Error", description: "Please assign the user to at least one company.", variant: "destructive" });
        setLoading(false);
        return;
      }
      // Validate branch for USER role
      for (const m of memberships) {
        if (m.role === 'USER' && (!m.branch || m.branch === '')) {
          toast({ title: "Validation Error", description: `Please select a branch for ${allCompanies.find(c => c.id === m.company)?.name}.`, variant: "destructive" });
          setLoading(false);
          return;
        }
      }
      // Clean up memberships - only include branch for USER and BRANCH_MANAGER
      const cleanedMemberships = memberships.map(m => {
        if (m.role === 'USER' || m.role === 'BRANCH_MANAGER') {
          return { company: m.company, role: m.role, branch: m.branch };
        } else {
          return { company: m.company, role: m.role };
        }
      });
      // Debug log
      console.log('Submitting memberships:', cleanedMemberships);
      try {
        const res = await api.post('/users/create-with-memberships/', { ...form, memberships: cleanedMemberships });
        setCreatedUsername(res.data.username);
        setCreatedQrCode(res.data.qr_code || null);
        setSuccessModalOpen(true);
        toast({ title: "Success", description: "User created and assigned successfully!" });
      } catch (err: any) {
        const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to create user.';
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    } else { // Supervisor workflow
      if (!selectedCompany) {
        toast({ title: "Error", description: "No company selected.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (!selectedBranch) {
        toast({ title: "Validation Error", description: "Please assign the user to a branch.", variant: "destructive" });
        setLoading(false);
        return;
      }
      try {
        const res = await api.post('/users/create-for-company/', { 
          ...form,
          company_id: selectedCompany.company,
          branch_id: selectedBranch,
          role: 'USER' 
        });
        setCreatedUsername(res.data.username);
        setCreatedQrCode(res.data.qr_code || null);
        setSuccessModalOpen(true);
        toast({ title: "Success", description: `User created in ${selectedCompany.company_name}.` });
      } catch (err: any) {
        const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to create user for company.';
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
  };
  
  if (!isDeveloper && !(selectedCompany && ['OWNER', 'SUPERVISOR'].includes(selectedCompany.role))) {
    return <div>You do not have permission to add users.</div>;
  }
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Button variant="outline" size="sm" className="mb-4" onClick={() => navigate('/users')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to User List
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>
            {isDeveloper ? "Add New User and Assign Companies" : `Add New User to ${selectedCompany?.company_name}`}
          </CardTitle>
          <CardDescription>
            {isDeveloper 
              ? "Create a new global user and assign them to one or more companies with specific roles."
              : "Create a new user and assign them to a branch within your company."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={handleSubmit}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            <UserFormFields form={form} handleInputChange={handleInputChange} />
            
            {isDeveloper ? (
              <div>
                <label className="block font-medium mb-2">Company Assignments</label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between">
                      Assign a company...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search company..." />
                      <CommandList>
                        <CommandEmpty>No company found.</CommandEmpty>
                        <CommandGroup>
                          {allCompanies.filter(c => !memberships.some(m => m.company === c.id)).map(company => (
                            <CommandItem key={company.id} onSelect={() => addMembership(company.id)}>
                              {company.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <div className="mt-4 space-y-2">
                  {memberships.map(membership => {
                    const company = allCompanies.find(c => c.id === membership.company);
                    return (
                      <div key={membership.company} className="flex flex-col md:flex-row md:items-center justify-between p-2 border rounded-md gap-2">
                        <span className="font-medium">{company?.name || 'Unknown Company'}</span>
                        <div className="flex items-center gap-2">
                          <Select value={membership.role} onValueChange={role => updateMembershipRole(membership.company, role)}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ALL_ROLES.map(role => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {/* Show branch dropdown if role is USER or BRANCH_MANAGER */}
                          {(membership.role === 'USER' || membership.role === 'BRANCH_MANAGER') && companyBranches[membership.company] && (
                            <Select value={membership.branch || ''} onValueChange={branchId => updateMembershipBranch(membership.company, branchId)}>
                              <SelectTrigger className="w-40"><SelectValue placeholder="Select branch" /></SelectTrigger>
                              <SelectContent>
                                {companyBranches[membership.company].map(branch => (
                                  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => removeMembership(membership.company)}>
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <label className="block font-medium mb-2">Assign to Branch</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger><SelectValue placeholder="Select a branch..." /></SelectTrigger>
                    <SelectContent>
                        {branches.map(branch => (
                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" disabled={loading || (isDeveloper && memberships.some(m => m.role === 'USER' && (!m.branch || m.branch === '')))} className="w-full mt-4">
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal/Section */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-2">User Created Successfully!</h2>
            {createdUsername && <p className="mb-2">Username: <span className="font-mono">{createdUsername}</span></p>}
            {createdQrCode ? (
              <>
                <p className="mb-2">Scan this QR code to login:</p>
                <img src={getMediaUrl(createdQrCode)} alt="User QR Code" className="w-40 h-40 mb-4 border" />
              </>
            ) : (
              <p className="mb-4 text-red-500">No QR code available.</p>
            )}
            <Button
              className="w-full mt-2"
              onClick={() => {
                setSuccessModalOpen(false);
                setCreatedUsername(null);
                setCreatedQrCode(null);
                navigate('/users');
              }}
            >
              Go to User List
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddNewUser; 
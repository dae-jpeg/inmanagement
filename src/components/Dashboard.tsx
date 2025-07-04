import React from 'react';  
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Package, History, Users, User, LogOut, Building, GitBranch, ArrowLeftRight, HardHat, PlusCircle, ClipboardList } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { getMediaUrl } from '../utils/api';

const BossDeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const adminCards = [
    {
      title: 'User Management',
      description: 'Manage all user accounts.',
      icon: Users,
      path: '/users',
      color: 'text-orange-500'
    },
    {
      title: 'Company Management',
      description: 'Manage all companies.',
      icon: Building,
      path: '/companies',
      color: 'text-red-500'
    },
    {
      title: 'Branch Management',
      description: 'Manage all branches.',
      icon: GitBranch,
      path: '/branches',
      color: 'text-cyan-500'
    },
    {
      title: 'Inventory Management',
      description: 'Manage all inventory items.',
      icon: Package,
      path: '/items',
      color: 'text-green-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <HardHat className="mr-3 text-blue-600"/>
                BOSS DEVELOPER DASHBOARD
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.username}. System-wide administrative access enabled.
              </p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">System Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminCards.map((card) => (
            <Card 
              key={card.path}
              className="bg-white border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer group border-2 border-transparent hover:border-gray-200"
              onClick={() => navigate(card.path)}
            >
              <CardHeader className="flex flex-row items-center space-y-0">
                  <div className="p-3 rounded-lg bg-gray-100 transition-all duration-300 group-hover:bg-gray-200 group-hover:shadow-lg">
                    <card.icon className={`h-6 w-6 ${card.color} transition-transform duration-300 group-hover:scale-110`} />
                  </div>
                  <div className="ml-4">
                    <CardTitle className="text-lg font-semibold transition-colors duration-300 group-hover:text-gray-700">{card.title}</CardTitle>
                  </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="transition-colors duration-300 group-hover:text-gray-600">{card.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, logout, selectedCompany, selectCompany, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleCompanyChange = (companyId: string) => {
    const newSelectedCompany = user?.company_memberships.find(m => m.company === companyId);
    if (newSelectedCompany) {
      selectCompany(newSelectedCompany);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }
  
  if (user?.global_user_level === 'DEVELOPER') {
    // Always show the system-wide dashboard for developer
    return <BossDeveloperDashboard />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'items-management',
      title: 'Items Management',
      description: 'View and manage inventory items',
      icon: Package,
      path: '/items',
      color: 'bg-green-500',
      allowedRoles: ['OWNER', 'SUPERVISOR', 'MEMBER', 'BRANCH_MANAGER']
    },
    {
      key: 'transaction-history',
      title: 'Transaction History',
      description: 'View all transactions for this company',
      icon: History,
      path: '/history',
      color: 'bg-purple-500',
      allowedRoles: ['OWNER', 'SUPERVISOR', 'MEMBER', 'BRANCH_MANAGER']
    },
    {
      key: 'user-management',
      title: 'User Management',
      description: 'Manage users in this company',
      icon: Users,
      path: '/users',
      color: 'bg-orange-500',
      allowedRoles: ['OWNER', 'SUPERVISOR']
    },
    {
      key: 'branch-management',
      title: 'Branch Management',
      description: 'Manage branches for this company',
      icon: GitBranch,
      path: '/branches',
      color: 'bg-cyan-500',
      allowedRoles: ['OWNER', 'SUPERVISOR'] // Also allow supervisor
    },
    {
      key: 'add-new-item',
      title: 'Add New Item',
      description: 'Add a new item to the inventory system',
      icon: PlusCircle,
      path: '/items/new',
      color: 'bg-indigo-600',
      allowedRoles: ['OWNER', 'SUPERVISOR', 'BRANCH_MANAGER']
    },
    {
      key: 'profile',
      title: 'Profile',
      description: 'View and edit your profile',
      icon: User,
      path: '/profile',
      color: 'bg-indigo-500',
      isGlobal: true // Accessible to all authenticated users
    },
  ];

  const availableMenuItems = menuItems.filter(item => {
    if (item.isGlobal) return true;
    if (!user || !selectedCompany) return false;
    if (item.allowedRoles) return item.allowedRoles.includes(selectedCompany.role);
    return false;
  });

  // Filter out duplicate menu items for branch-level users
  let filteredMenuItems = availableMenuItems;
  if (selectedCompany && ['BRANCH_MANAGER', 'MEMBER'].includes(selectedCompany.role)) {
    filteredMenuItems = availableMenuItems.filter(item =>
      !['/items', '/history'].includes(item.path) && item.title !== 'Inventory Management'
    );
  }

  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Select a Company</h1>
          <p className="text-gray-600 mb-8">You have access to multiple companies. Please choose one to manage.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user?.company_memberships.map((membership) => {
              console.log('Company membership data:', membership); // Debug log
              return (
                <Card 
                  key={membership.company} 
                  className="hover:shadow-lg transition-shadow cursor-pointer text-left"
                  onClick={() => selectCompany(membership)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      {membership.company_logo && (
                        <img 
                          src={getMediaUrl(membership.company_logo)} 
                          alt={`${membership.company_name} logo`}
                          className="w-12 h-12 rounded-lg object-cover border"
                          onError={(e) => console.error('Logo failed to load:', membership.company_logo)} // Debug error
                        />
                      )}
                      <div>
                        <CardTitle>{membership.company_name}</CardTitle>
                        <CardDescription>Your role: <span className="font-semibold capitalize">{membership.role.toLowerCase()}</span></CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
           <Button variant="outline" onClick={handleLogout} className="mt-8">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
        </div>
      </div>
    );
  }

  // Branch-specific dashboard section
  let branchId = null;
  if (user && user.company_memberships && user.company_memberships.length > 0) {
    branchId = user.company_memberships[0].branch;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {selectedCompany.company_logo && (
                <img 
                  src={getMediaUrl(selectedCompany.company_logo)} 
                  alt={`${selectedCompany.company_name} logo`}
                  className="w-12 h-12 rounded-lg object-cover border"
                  onError={(e) => console.error('Main dashboard logo failed to load:', selectedCompany.company_logo)} // Debug error
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedCompany.company_name}
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.username}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Company Selector Dropdown */}
              {user && user.company_memberships.length > 1 && (
                <Select onValueChange={handleCompanyChange} value={selectedCompany.company}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Switch Company" />
                  </SelectTrigger>
                  <SelectContent>
                    {user.company_memberships.map(membership => (
                      <SelectItem key={membership.company} value={membership.company}>
                        {membership.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <span className="text-sm font-bold text-gray-700 capitalize">
                {selectedCompany.role.replace('_', ' ')}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Branch-specific dashboard section */}
      {branchId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <p className="text-gray-700 mb-2">You are managing branch: <span className="font-semibold">{selectedCompany.branch_name || branchId}</span></p>
            <p className="text-gray-500 text-sm">Use the quick actions below to manage inventory and view transactions for your branch.</p>
          </div>
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Branch Inventory & Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer group border-2 border-transparent hover:border-gray-200" onClick={() => navigate('/items')}>
              <CardHeader className="flex flex-row items-center space-y-0">
                <div className="p-3 rounded-lg bg-green-500 transition-all duration-300 group-hover:brightness-110 group-hover:shadow-lg">
                  <Package className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-lg font-semibold transition-colors duration-300 group-hover:text-gray-700">View Inventory</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm transition-colors duration-300 group-hover:text-gray-600">
                  See all items available in your branch's inventory.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer group border-2 border-transparent hover:border-gray-200" onClick={() => navigate('/history')}>
              <CardHeader className="flex flex-row items-center space-y-0">
                <div className="p-3 rounded-lg bg-purple-500 transition-all duration-300 group-hover:brightness-110 group-hover:shadow-lg">
                  <History className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-lg font-semibold transition-colors duration-300 group-hover:text-gray-700">Transaction History</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm transition-colors duration-300 group-hover:text-gray-600">
                  View all withdrawals and returns for your branch.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer group border-2 border-transparent hover:border-gray-200" onClick={() => navigate('/actions')}>
              <CardHeader className="flex flex-row items-center space-y-0">
                <div className="p-3 rounded-lg bg-blue-500 transition-all duration-300 group-hover:brightness-110 group-hover:shadow-lg">
                  <ArrowLeftRight className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-lg font-semibold transition-colors duration-300 group-hover:text-gray-700">Withdraw/Return Item</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm transition-colors duration-300 group-hover:text-gray-600">
                  Quickly withdraw or return items from your branch's inventory.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((item) => (
            <Card 
              key={item.key || item.path} 
              className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer group border-2 border-transparent hover:border-gray-200"
              onClick={() => navigate(item.path)}
            >
              <CardHeader className="flex flex-row items-center space-y-0">
                <div className={`p-3 rounded-lg ${item.color} transition-all duration-300 group-hover:brightness-110 group-hover:shadow-lg`}>
                  <item.icon className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="ml-4">
                  <CardTitle className="text-lg font-semibold transition-colors duration-300 group-hover:text-gray-700">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm transition-colors duration-300 group-hover:text-gray-600">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

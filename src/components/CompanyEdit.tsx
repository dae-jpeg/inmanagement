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
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import api, { getMediaUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Edit, 
  Building, 
  Upload, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Camera,
  ArrowLeft,
  Save,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ui/use-toast';

interface Company {
  id: string;
  name: string;
  description?: string;
  contact_info?: string;
  email?: string;
  location?: string;
  logo?: string;
}

const CompanyEdit: React.FC = () => {
  const { user, selectedCompany } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedContact, setEditedContact] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedLogo, setEditedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyDetails();
    }
  }, [selectedCompany]);

  const fetchCompanyDetails = async () => {
    if (!selectedCompany) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/companies/${selectedCompany.company}/`);
      setCompany(response.data);
    } catch (error) {
      console.error('Error fetching company details:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch company details.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    if (!company) return;
    
    setEditedName(company.name);
    setEditedDescription(company.description || '');
    setEditedContact(company.contact_info || '');
    setEditedEmail(company.email || '');
    setEditedLocation(company.location || '');
    setEditedLogo(null);
    setLogoPreview(null);
    setIsEditModalOpen(true);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditedLogo(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateCompany = async () => {
    if (!company) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', editedName);
      if (editedDescription) formData.append('description', editedDescription);
      if (editedContact) formData.append('contact_info', editedContact);
      if (editedEmail) formData.append('email', editedEmail);
      if (editedLocation) formData.append('location', editedLocation);
      if (editedLogo) formData.append('logo', editedLogo);

      await api.patch(`/companies/${company.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setIsEditModalOpen(false);
      fetchCompanyDetails();
      toast({ 
        title: 'Success', 
        description: 'Company information updated successfully.' 
      });
    } catch (error) {
      console.error('Error updating company:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update company information.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLogo = () => {
    setEditedLogo(null);
    setLogoPreview(null);
  };

  if (!selectedCompany || !company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
                <p className="text-sm text-gray-600">Manage your company information and branding</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              Company Owner
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Company Information */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      Company Information
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Current company details and settings
                    </p>
                  </div>
                  <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={handleEditClick} 
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Company
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                          Edit Company Information
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Company Logo */}
                        <div className="space-y-3">
                          <Label htmlFor="logo" className="text-sm font-medium">
                            Company Logo
                          </Label>
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {(logoPreview || company.logo) && (
                                <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                                  <img
                                    src={logoPreview || getMediaUrl(company.logo!)}
                                    alt="Company logo"
                                    className="w-full h-full object-cover"
                                  />
                                  {logoPreview && (
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                      onClick={handleRemoveLogo}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <Input
                                id="logo"
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('logo')?.click()}
                                className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400"
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                {company.logo ? 'Change Logo' : 'Upload Logo'}
                              </Button>
                              <p className="text-xs text-gray-500 mt-1">
                                Recommended: 200x200px, PNG or JPG
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Company Name */}
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">
                            Company Name *
                          </Label>
                          <Input
                            id="name"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Enter company name"
                            className="h-11"
                            required
                          />
                        </div>

                        {/* Company Description */}
                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-sm font-medium">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            placeholder="Tell us about your company..."
                            rows={3}
                            className="resize-none"
                          />
                        </div>

                        <Separator />

                        {/* Contact Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact" className="text-sm font-medium flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Contact Information
                            </Label>
                            <Input
                              id="contact"
                              value={editedContact}
                              onChange={(e) => setEditedContact(e.target.value)}
                              placeholder="Phone number or contact details"
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email Address
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={editedEmail}
                              onChange={(e) => setEditedEmail(e.target.value)}
                              placeholder="company@example.com"
                              className="h-11"
                            />
                          </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                          <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                          </Label>
                          <Input
                            id="location"
                            value={editedLocation}
                            onChange={(e) => setEditedLocation(e.target.value)}
                            placeholder="Company address or location"
                            className="h-11"
                          />
                        </div>
                      </div>

                      <DialogFooter className="pt-6">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditModalOpen(false)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdateCompany}
                          disabled={loading || !editedName.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Update Company
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Company Logo Display */}
                {company.logo && (
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 border-2 border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={getMediaUrl(company.logo)}
                        alt="Company logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Company Logo</p>
                      <p className="text-xs text-gray-500">Uploaded and active</p>
                    </div>
                  </div>
                )}

                {/* Company Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Company Name
                      </Label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{company.name}</p>
                    </div>
                    
                    {company.description && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Description
                        </Label>
                        <p className="text-sm text-gray-700 mt-1">{company.description}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {company.contact_info && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Contact Information
                        </Label>
                        <p className="text-sm text-gray-700 mt-1">{company.contact_info}</p>
                      </div>
                    )}
                    
                    {company.email && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </Label>
                        <p className="text-sm text-gray-700 mt-1">{company.email}</p>
                      </div>
                    )}
                    
                    {company.location && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </Label>
                        <p className="text-sm text-gray-700 mt-1">{company.location}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/branches')}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Manage Branches
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/users')}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/items')}
                >
                  <Building className="h-4 w-4 mr-2" />
                  View Inventory
                </Button>
              </CardContent>
            </Card>

            {/* Company Stats */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Company Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Company ID</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {company.id.slice(0, 8)}...
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyEdit; 
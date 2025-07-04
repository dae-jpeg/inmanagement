import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Save, Download } from 'lucide-react';
import api, { getMediaUrl } from '../utils/api';
import { toast } from './ui/use-toast';

interface ItemFormData {
  item_id?: string; // Optional since it's auto-generated for new items
  name: string;
  description: string;
  category: string;
  status: string;
  qr_code?: string;
  barcode?: string;
  barcode_number?: string;
  stock_quantity: number;
  minimum_stock: number;
  branch?: string;
  photo?: File | string | null; // Add photo field
}

interface Category {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
  company_name: string;
}

const ItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { selectedCompany, user } = useAuth();

  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    category: 'OTHER',
    status: 'AVAILABLE',
    stock_quantity: 0,
    minimum_stock: 0,
  });

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Check if user is a supervisor (no specific branch assigned)
  const isSupervisor = user?.company_memberships?.some(membership => 
    membership.role === 'SUPERVISOR' && !membership.branch
  );

  // Check if user is a branch manager (has specific branch assigned)
  const isBranchManager = user?.company_memberships?.some(membership => 
    membership.role === 'BRANCH_MANAGER' && membership.branch
  );

  // Get the user's assigned branch if they are a branch manager
  const userBranch = user?.company_memberships?.find(membership => 
    membership.role === 'BRANCH_MANAGER' && membership.branch
  )?.branch;

  // Check if user can select branches (Supervisors and Owners)
  const canSelectBranch = user?.company_memberships?.some(membership => 
    membership.role === 'SUPERVISOR' || membership.role === 'OWNER'
  );

  useEffect(() => {
    const fetchPrerequisites = async () => {
      if (!selectedCompany) {
        toast({ title: 'Error', description: 'No company selected.', variant: 'destructive' });
        navigate('/dashboard');
        return;
      }
      try {
        // Fetch branches for the selected company
        const branchRes = await api.get(`/companies/${selectedCompany.company}/branches/`);
        setBranches(branchRes.data);

        // Fetch categories for the selected company
        const categoryRes = await api.get(`/categories/?company=${selectedCompany.company}`);
        setCategories(categoryRes.data);

        if (id) { // If editing, fetch item details
          const itemRes = await api.get(`/items/${id}/`);
          const itemData = itemRes.data;
          // Pre-fill the form with item data
          setFormData(prev => ({
            ...prev,
            name: itemData.name,
            item_id: itemData.item_id, // Include item_id for editing
            description: itemData.description,
            branch: itemData.branch,
            category: itemData.category,
            stock_quantity: itemData.stock_quantity,
            minimum_stock: itemData.minimum_stock,
            barcode_number: itemData.barcode_number,
            photo: itemData.photo, // Pre-fill photo if available
          }));
          setShowQR(!!itemData.qr_code);
          setSelectedBranch(itemData.branch);
        } else {
          // If creating new item and user is a branch manager, auto-set their branch
          if (isBranchManager && userBranch) {
            setSelectedBranch(userBranch);
            handleChange('branch', userBranch);
          }
        }
      } catch (error) {
        console.error("Failed to fetch prerequisites", error);
        toast({ title: 'Error', description: 'Failed to load form data.', variant: 'destructive' });
      }
    };
    fetchPrerequisites();
  }, [id, selectedCompany, navigate, isBranchManager, userBranch]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        photo: e.target.files![0],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Determine which branch to use
      let branchId = selectedBranch;
      if (!isSupervisor && selectedCompany?.branch) {
        branchId = selectedCompany.branch;
      }

      if (!branchId) {
        throw new Error('No branch selected. Please select a branch.');
      }

      // Use FormData for file upload
      const form = new FormData();
      form.append('name', formData.name);
      form.append('description', formData.description);
      form.append('category', formData.category);
      form.append('status', formData.status);
      form.append('stock_quantity', String(formData.stock_quantity));
      form.append('minimum_stock', String(formData.minimum_stock));
      form.append('branch', branchId);
      if (formData.barcode_number) form.append('barcode_number', formData.barcode_number);
      if (isEditing && formData.item_id) form.append('item_id', formData.item_id);
      if (formData.photo && typeof formData.photo !== 'string') form.append('photo', formData.photo);

      console.log('Submitting form data:', form);
      let response;
      if (isEditing) {
        response = await api.put(`/items/${id}/`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        response = await api.post('/items/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      setFormData(response.data);
      setShowQR(true);
      setSaving(false);
      toast({
        title: "Item created successfully!",
        description: `${response.data.name} has been created with ID: ${response.data.item_id}`,
      });
      setTimeout(() => {
        const qrSection = document.getElementById('qr-barcode-section');
        if (qrSection) {
          qrSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    } catch (error: any) {
      console.error('Error saving item:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.detail || 
        Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ') || 
        error.message;
      toast({
        title: "Error saving item",
        description: errorMessage,
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  const handleChange = (
    field: keyof ItemFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDownloadQR = () => {
    if (formData.qr_code) {
      // Create a temporary link to download the QR code
      const link = document.createElement('a');
      link.href = formData.qr_code;
      link.download = `qr_${formData.item_id || 'item'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadBarcode = () => {
    if (formData.barcode) {
      const link = document.createElement('a');
      link.href = formData.barcode;
      link.download = `barcode_${formData.item_id || 'item'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleAddCategory = async () => {
    if (!customCategory.trim() || !selectedCompany) return;
    
    // Determine which branch to use for category creation
    let branchId = selectedCompany.branch;
    if (isSupervisor && selectedBranch) {
      branchId = selectedBranch;
    }
    
    try {
      const response = await api.post('/categories/', {
        name: customCategory.trim(),
        company: selectedCompany.company,
        branch: branchId,
      });
      setCategories([...categories, response.data]);
      setFormData((prev) => ({ ...prev, category: response.data.id }));
      setSelectedCategory(response.data.id);
      setIsAddingCategory(false);
      setCustomCategory('');
      toast({ title: 'Category added', description: response.data.name });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add category', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${categoryId}/`);
      setCategories(categories.filter((cat) => cat.id !== categoryId));
      if (formData.category === categoryId) {
        setFormData((prev) => ({ ...prev, category: '' }));
        setSelectedCategory('');
      }
      toast({ title: 'Category deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Item' : 'Add New Item'}
        </h1>
      </header>

      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            {!isEditing && (
              <CardDescription>
                Item ID will be automatically generated when you save this item.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {isEditing && formData.item_id && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Item ID
                  </label>
                  <Input
                    value={formData.item_id}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Item ID cannot be changed once created.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Barcode Number
                </label>
                <Input
                  value={formData.barcode_number || ''}
                  onChange={(e) => handleChange('barcode_number', e.target.value)}
                  placeholder="Enter custom barcode number (optional)"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {isEditing 
                    ? "Leave blank to keep the current barcode number."
                    : "Leave blank to use the auto-generated item ID as the barcode number."
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Item Photo</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {formData.photo && typeof formData.photo === 'string' && (
                  <img src={getMediaUrl(formData.photo)} alt="Item" className="w-32 h-32 object-cover mt-2 rounded" />
                )}
                {formData.photo && typeof formData.photo !== 'string' && (
                  <img src={URL.createObjectURL(formData.photo)} alt="Item" className="w-32 h-32 object-cover mt-2 rounded" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Name
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter item description"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <Select
                  value={isAddingCategory ? 'CUSTOM' : formData.category}
                  onValueChange={(value) => {
                    if (value === 'CUSTOM') {
                      setIsAddingCategory(true);
                      setCustomCategory('');
                    } else {
                      setIsAddingCategory(false);
                      handleChange('category', value);
                      setSelectedCategory(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center justify-between">
                          <span>{cat.name}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="ml-2 text-red-500 hover:bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat.id);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="CUSTOM">Add new category...</SelectItem>
                  </SelectContent>
                </Select>
                {isAddingCategory && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      placeholder="Enter new category name"
                    />
                    <Button
                      type="button"
                      onClick={handleAddCategory}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setCustomCategory('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                    <SelectItem value="MAINTENANCE">Under Maintenance</SelectItem>
                    <SelectItem value="RETIRED">Retired</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Note: Available, Low Stock, and Out of Stock statuses are automatically updated based on stock quantity.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Branch
                </label>
                {isBranchManager ? (
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <p className="text-sm text-gray-700">
                      {branches.find(b => b.id === selectedBranch)?.name || 'Your assigned branch'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      As a Branch Manager, items will be created in your assigned branch.
                    </p>
                  </div>
                ) : canSelectBranch ? (
                  <>
                    <Select
                      value={selectedBranch}
                      onValueChange={(value) => {
                        setSelectedBranch(value);
                        handleChange('branch', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name} ({branch.company_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select which branch this item will be added to.
                    </p>
                  </>
                ) : (
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <p className="text-sm text-gray-700">
                      {branches.find(b => b.id === selectedBranch)?.name || 'Default branch'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Items will be created in the default branch for your role.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Stock Quantity
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                    handleChange('stock_quantity', isNaN(value) ? 0 : value);
                  }}
                  placeholder="Enter current stock quantity"
                />
                {formData.stock_quantity === 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Warning:</strong> Creating an item with 0 stock will prevent returns until stock is added.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      The system needs to know the original stock quantity to track returns properly. 
                      Consider adding initial stock or updating it later.
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  This sets both the current stock and the original stock quantity for tracking returns.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Minimum Stock Level
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minimum_stock}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                    handleChange('minimum_stock', isNaN(value) ? 0 : value);
                  }}
                  placeholder="Enter minimum stock level"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  When stock falls below this level, it will be marked as low stock.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : (isEditing ? 'Update Item' : 'Create Item')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {showQR && formData.qr_code && (
          <Card id="qr-barcode-section">
            <CardHeader>
              <CardTitle>Item QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <img
                src={getMediaUrl(formData.qr_code)}
                alt="Item QR Code"
                className="w-64 h-64 object-contain mb-4"
              />
              <p className="text-sm text-muted-foreground mb-4">
                This QR code can be used to quickly withdraw or return this item.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleDownloadQR}
                className="w-full md:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </CardFooter>
          </Card>
        )}

        {showQR && formData.barcode && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Item Barcode</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <img
                src={getMediaUrl(formData.barcode)}
                alt="Item Barcode"
                className="w-64 h-24 object-contain mb-4 bg-white p-2 border"
              />
              <p className="text-sm text-muted-foreground mb-4">
                This barcode can be used to quickly identify this item with a barcode scanner.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleDownloadBarcode}
                className="w-full md:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Barcode
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ItemForm; 
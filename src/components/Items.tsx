import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { PlusCircle, Search, Edit, Trash, Download, QrCode, Barcode, ArrowLeft, Printer, Plus, Minus, Package } from 'lucide-react';
import api, { getMediaUrl } from '../utils/api';
import { toast } from './ui/use-toast';

interface Item {
  id: string;
  item_id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  qr_code: string;
  barcode: string;
  barcode_number: string;
  stock_quantity: number;
  original_stock_quantity: number;
  minimum_stock: number;
  company_name?: string;
  branch_name?: string;
  created_by_username?: string;
  category_name?: string;
}

interface Category {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
}

const Items = () => {
  const navigate = useNavigate();
  const { user, selectedCompany } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSize, setSelectedSize] = useState('A4');
  const [printType, setPrintType] = useState<'qr' | 'barcode'>('qr');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [updateStockModalOpen, setUpdateStockModalOpen] = useState(false);
  const [selectedItemForStockUpdate, setSelectedItemForStockUpdate] = useState<Item | null>(null);
  const [newOriginalStock, setNewOriginalStock] = useState<string>('');
  const [updatingStock, setUpdatingStock] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add');
  const [stockItem, setStockItem] = useState<Item | null>(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockNotes, setStockNotes] = useState('');
  const [stockLoading, setStockLoading] = useState(false);

  const isDeveloper = user?.global_user_level === 'DEVELOPER';

  const printSizes = [
    { value: 'A4', label: 'A4 (210 x 297 mm)', width: '210mm', height: '297mm' },
    { value: 'A5', label: 'A5 (148 x 210 mm)', width: '148mm', height: '210mm' },
    { value: 'A6', label: 'A6 (105 x 148 mm)', width: '105mm', height: '148mm' },
    { value: 'label-small', label: 'Small Label (40 x 20 mm)', width: '40mm', height: '20mm' },
    { value: 'label-medium', label: 'Medium Label (60 x 30 mm)', width: '60mm', height: '30mm' },
    { value: 'label-large', label: 'Large Label (80 x 40 mm)', width: '80mm', height: '40mm' },
    { value: 'sticker', label: 'Sticker (50 x 50 mm)', width: '50mm', height: '50mm' },
  ];

  useEffect(() => {
    if (isDeveloper) {
      fetchCompanies();
    }
    fetchCategories();
    fetchBranches();
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies/');
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchCategories = async () => {
    if (!selectedCompany) return;
    try {
      const response = await api.get(`/categories/?company=${selectedCompany.company}`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBranches = async () => {
    if (!selectedCompany) return;
    try {
      const response = await api.get(`/companies/${selectedCompany.company}/branches/`);
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  useEffect(() => {
    if (isDeveloper) {
      fetchAllItems();
    } else if (selectedCompany) {
      fetchCompanyItems();
    } else {
      navigate('/dashboard');
    }
  }, [isDeveloper, selectedCompany, navigate, selectedCategory, selectedBranch, selectedCompanyId]);

  const fetchAllItems = async () => {
    setLoading(true);
    try {
      let url = '/all-items/';
      const params: any = {};
      if (selectedCompanyId !== 'all') params['branch__company'] = selectedCompanyId;
      if (selectedBranch !== 'all') params['branch'] = selectedBranch;
      if (selectedCategory !== 'all') params['category'] = selectedCategory;
      const query = new URLSearchParams(params).toString();
      if (query) url += `?${query}`;
      const response = await api.get(url);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching all items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyItems = async (query = '') => {
    if (!selectedCompany) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('branch__company', selectedCompany.company);
      if (query) {
        params.append('search', query);
      }
      const response = await api.get(`/items/?${params.toString()}`);
      setItems(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch company items", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let url = '/items/';
      const params: any = {};
      if (searchQuery) params['search'] = searchQuery;
      if (selectedCategory !== 'all') params['category'] = selectedCategory;
      if (selectedBranch !== 'all') params['branch'] = selectedBranch;
      const query = new URLSearchParams(params).toString();
      if (query) url += `?${query}`;
      const response = await api.get(url);
      setItems(response.data);
    } catch (error) {
      console.error('Error searching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/items/${id}/`);
        if (isDeveloper) {
          fetchAllItems();
        } else {
          fetchCompanyItems();
        }
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleDownloadQR = (item: Item) => {
    if (item.qr_code) {
      const link = document.createElement('a');
      link.href = item.qr_code;
      link.download = `qr_${item.item_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadBarcode = (item: Item) => {
    if (item.barcode) {
      const link = document.createElement('a');
      link.href = item.barcode;
      link.download = `barcode_${item.item_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrintQR = (item: Item) => {
    if (item.qr_code) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print QR Code - ${item.name}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: Arial, sans-serif;
                  text-align: center;
                }
                .qr-container {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 10px;
                }
                .qr-code {
                  max-width: 300px;
                  max-height: 300px;
                }
                .item-info {
                  margin-top: 10px;
                  font-size: 14px;
                }
                @media print {
                  body { margin: 0; }
                  .qr-container { page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <h2>${item.name}</h2>
                <img src="${getMediaUrl(item.qr_code)}" alt="QR Code" class="qr-code" />
                <div class="item-info">
                  <p><strong>Item ID:</strong> ${item.item_id}</p>
                  <p><strong>Category:</strong> ${item.category}</p>
                  <p><strong>Status:</strong> ${item.status}</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  const handlePrintBarcode = (item: Item) => {
    if (item.barcode) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Barcode - ${item.name}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: Arial, sans-serif;
                  text-align: center;
                }
                .barcode-container {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 10px;
                }
                .barcode {
                  max-width: 400px;
                  max-height: 100px;
                }
                .item-info {
                  margin-top: 10px;
                  font-size: 14px;
                }
                @media print {
                  body { margin: 0; }
                  .barcode-container { page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                <h2>${item.name}</h2>
                <img src="${getMediaUrl(item.barcode)}" alt="Barcode" class="barcode" />
                <div class="item-info">
                  <span style="font-size: 1.5em; font-family: monospace;">${item.barcode_number}</span>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  const openPrintModal = (item: Item, type: 'qr' | 'barcode') => {
    setSelectedItem(item);
    setPrintType(type);
    setPrintModalOpen(true);
  };

  const handlePrintWithSize = () => {
    if (!selectedItem) return;

    if (printType === 'qr') {
      handlePrintQR(selectedItem);
    } else {
      handlePrintBarcode(selectedItem);
    }
    setPrintModalOpen(false);
  };

  const handleEdit = (id: string) => {
    navigate(`/items/edit/${id}`);
  };

  const handleUpdateOriginalStock = async () => {
    if (!selectedItemForStockUpdate || !newOriginalStock) return;
    
    const quantity = parseInt(newOriginalStock);
    if (isNaN(quantity) || quantity < 0) {
      alert('Please enter a valid positive number');
      return;
    }
    
    setUpdatingStock(true);
    try {
      await api.post(`/items/${selectedItemForStockUpdate.id}/update-original-stock/`, {
        original_stock_quantity: quantity
      });
      
      // Refresh the items list
      if (isDeveloper) {
        fetchAllItems();
      } else {
        fetchCompanyItems();
      }
      
      setUpdateStockModalOpen(false);
      setSelectedItemForStockUpdate(null);
      setNewOriginalStock('');
      alert('Original stock quantity updated successfully!');
    } catch (error: any) {
      console.error('Error updating original stock:', error);
      alert(error.response?.data?.error || 'Failed to update original stock quantity');
    } finally {
      setUpdatingStock(false);
    }
  };

  const openUpdateStockModal = (item: Item) => {
    setSelectedItemForStockUpdate(item);
    setNewOriginalStock(item.stock_quantity.toString());
    setUpdateStockModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'text-green-600';
      case 'Low Stock':
        return 'text-yellow-600';
      case 'Out of Stock':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStockStatus = (item: Item) => {
    if (item.stock_quantity <= 0) return 'Out of Stock';
    if (item.stock_quantity <= item.minimum_stock) return 'Low Stock';
    return 'In Stock';
  };
  
  const canAddItem = isDeveloper || (selectedCompany && ['OWNER', 'SUPERVISOR'].includes(selectedCompany.role));
  const title = isDeveloper ? "System-Wide Inventory Management" : `Inventory for ${selectedCompany?.company_name}`;

  const openStockModal = (item: Item, action: 'add' | 'remove') => {
    setStockAction(action);
    setStockItem(item);
    setStockModalOpen(true);
  };

  const handleStockChange = async () => {
    if (!stockItem || !stockAction) return;
    const quantity = parseInt(stockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid positive quantity');
      return;
    }
    setStockLoading(true);
    try {
      const url = `/items/${stockItem.id}/${stockAction === 'add' ? 'add_stock' : 'remove_stock'}/`;
      await api.post(url, { quantity, notes: stockNotes });
      if (isDeveloper) {
        fetchAllItems();
      } else {
        fetchCompanyItems();
      }
      setStockModalOpen(false);
      setStockItem(null);
      setStockAction(null);
      setStockQuantity('');
      setStockNotes('');
      alert('Stock updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update stock');
    } finally {
      setStockLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        <div>
          <Button variant="outline" size="sm" className="mr-2" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          {canAddItem && (
            <Button onClick={() => navigate('/items/new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Item
            </Button>
          )}
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search by item name, ID, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-grow"
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isDeveloper && (
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Item List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading items...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-xs">{item.item_id}</TableCell>
                        <TableCell className="font-semibold">{item.name}</TableCell>
                        <TableCell>{item.branch_name || 'N/A'}</TableCell>
                        <TableCell>{item.created_by_username || 'N/A'}</TableCell>
                        <TableCell>{item.category_name || 'N/A'}</TableCell>
                        <TableCell className="text-center">{item.stock_quantity}</TableCell>
                        <TableCell className={`text-center font-bold ${getStatusColor(status)}`}>{status}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <QrCode className="h-5 w-5 text-blue-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent aria-describedby={undefined}>
                              <DialogHeader>
                                <DialogTitle>QR Code for {item.name}</DialogTitle>
                              </DialogHeader>
                              <div className="flex flex-col items-center justify-center p-4">
                                <img src={getMediaUrl(item.qr_code)} alt="QR Code" className="w-64 h-64" />
                                <Button className="mt-4" onClick={() => handleDownloadQR(item)}>
                                  <Download className="mr-2 h-4 w-4" /> Download
                                </Button>
                                <Button className="mt-2" variant="outline" onClick={() => openPrintModal(item, 'qr')}>
                                  <Printer className="mr-2 h-4 w-4" /> Print
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Barcode className="h-5 w-5 text-purple-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent aria-describedby={undefined}>
                              <DialogHeader>
                                <DialogTitle>Barcode for {item.name}</DialogTitle>
                              </DialogHeader>
                              <div className="flex flex-col items-center justify-center p-4">
                                <img src={getMediaUrl(item.barcode)} alt="Barcode" className="w-64 h-24 bg-white p-2 border rounded object-contain mx-auto" />
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-lg font-mono">{item.barcode_number}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  If the barcode can't be scanned, enter this number.
                                </p>
                                <div className="flex gap-2 mt-4">
                                  <Button onClick={() => handleDownloadBarcode(item)}>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                  </Button>
                                  <Button variant="outline" onClick={() => openPrintModal(item, 'barcode')}>
                                    <Printer className="mr-2 h-4 w-4" /> Print
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item.id)}>
                            <Edit className="h-5 w-5 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash className="h-5 w-5 text-red-500" />
                          </Button>
                          {item.original_stock_quantity === 0 && (
                            <Button variant="outline" size="sm" className="ml-2 text-xs text-yellow-700 border-yellow-400" onClick={() => openUpdateStockModal(item)}>
                              Set Original Stock
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openStockModal(item, 'add')} title="Add Stock">
                            <Plus className="h-5 w-5 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openStockModal(item, 'remove')} title="Remove Stock">
                            <Minus className="h-5 w-5 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Print Size</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select onValueChange={setSelectedSize} defaultValue={selectedSize}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a paper size" />
              </SelectTrigger>
              <SelectContent>
                {printSizes.map(size => (
                  <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handlePrintWithSize}>Print</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={updateStockModalOpen} onOpenChange={setUpdateStockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Original Stock Quantity</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2 text-sm text-gray-700">Set the original stock quantity for <b>{selectedItemForStockUpdate?.name}</b> (Item ID: {selectedItemForStockUpdate?.item_id})</p>
            <Input
              type="number"
              min="0"
              value={newOriginalStock}
              onChange={e => setNewOriginalStock(e.target.value)}
              className="mb-4"
              placeholder="Enter original stock quantity"
            />
            <Button onClick={handleUpdateOriginalStock} disabled={updatingStock}>
              {updatingStock ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{stockAction === 'add' ? 'Add Stock' : 'Remove Stock'} for {stockItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              min="1"
              value={stockQuantity}
              onChange={e => setStockQuantity(e.target.value)}
              className="mb-4"
              placeholder="Enter quantity"
            />
            <Input
              type="text"
              value={stockNotes}
              onChange={e => setStockNotes(e.target.value)}
              className="mb-4"
              placeholder="Optional notes"
            />
            <Button onClick={handleStockChange} disabled={stockLoading}>
              {stockLoading ? 'Processing...' : (stockAction === 'add' ? 'Add Stock' : 'Remove Stock')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Items; 
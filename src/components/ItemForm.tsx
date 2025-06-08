import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from './ui/card';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Save, Download } from 'lucide-react';
import api from '../utils/api';

interface ItemFormData {
  item_id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  qr_code?: string;
}

const ItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<ItemFormData>({
    item_id: '',
    name: '',
    description: '',
    category: 'OTHER',
    status: 'AVAILABLE',
  });

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await api.get(`/items/${id}/`);
      setFormData(response.data);
      setShowQR(!!response.data.qr_code);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching item:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let response;
      if (isEditing) {
        response = await api.put(`/items/${id}/`, formData);
      } else {
        response = await api.post('/items/', formData);
      }
      
      // Update form data with response (including QR code)
      setFormData(response.data);
      setShowQR(true);
      setSaving(false);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
      setSaving(false);
    }
  };

  const handleChange = (
    field: keyof ItemFormData,
    value: string
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
      link.download = `qr_${formData.item_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
          onClick={() => navigate('/items')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Items
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Item' : 'Add New Item'}
        </h1>
      </header>

      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Item ID
                </label>
                <Input
                  required
                  value={formData.item_id}
                  onChange={(e) => handleChange('item_id', e.target.value)}
                  placeholder="Enter unique item ID"
                />
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
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELECTRONICS">Electronics</SelectItem>
                    <SelectItem value="ACCESSORIES">Accessories</SelectItem>
                    <SelectItem value="AUDIO">Audio</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="IN_USE">In Use</SelectItem>
                    <SelectItem value="MAINTENANCE">Under Maintenance</SelectItem>
                    <SelectItem value="RETIRED">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Item'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {showQR && formData.qr_code && (
          <Card>
            <CardHeader>
              <CardTitle>Item QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <img
                src={formData.qr_code}
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
      </div>
    </div>
  );
};

export default ItemForm; 
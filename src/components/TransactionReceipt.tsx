import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, Download, Printer, Package, User, Calendar, Hash, Building, MapPin, Mail, Phone } from "lucide-react";
import api from "../utils/api";

interface TransactionReceiptProps {
  transactionId: string;
  onClose: () => void;
}

interface ReceiptData {
  id: string;
  reference_number: string;
  transaction_type: string;
  quantity: number;
  timestamp: string;
  notes: string;
  item_name: string;
  item_id: string;
  item_category: string;
  item_status: string;
  item_stock_quantity: number;
  user_name: string;
  user_full_name: string;
  user_id_number: string;
  user_department: string;
  user_level: string;
  branch_name: string;
  company_name: string;
  company_contact_info?: string;
  company_email?: string;
  company_location?: string;
  company_logo?: string;
}

const TransactionReceipt: React.FC<TransactionReceiptProps> = ({ transactionId, onClose }) => {
  const [receipt, setReceipt] = React.useState<ReceiptData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/transactions/${transactionId}/receipt/`);
        setReceipt(response.data);
      } catch (err) {
        console.error("Failed to fetch receipt:", err);
        setError("Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [transactionId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      full: date.toLocaleString()
    };
  };

  const getTransactionTypeDisplay = (type: string) => {
    switch (type) {
      case "WITHDRAW":
        return { label: "WITHDRAWN", color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "RETURN":
        return { label: "RETURNED", color: "bg-green-100 text-green-800 border-green-200" };
      case "CREATE":
        return { label: "ITEM CREATED", color: "bg-purple-100 text-purple-800 border-purple-200" };
      case "UPDATE":
        return { label: "ITEM UPDATED", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
      case "DELETE":
        return { label: "ITEM DELETED", color: "bg-red-100 text-red-800 border-red-200" };
      case "ADD_STOCK":
        return { label: "STOCK ADDED", color: "bg-teal-100 text-teal-800 border-teal-200" };
      case "REMOVE_STOCK":
        return { label: "STOCK REMOVED", color: "bg-orange-100 text-orange-800 border-orange-200" };
      default:
        return { label: type, color: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!receipt) return;
    
    const receiptText = `
TRANSACTION RECEIPT
==================

Reference Number: ${receipt.reference_number}
Date: ${formatDate(receipt.timestamp).date}
Time: ${formatDate(receipt.timestamp).time}
Transaction Type: ${getTransactionTypeDisplay(receipt.transaction_type).label}

COMPANY INFORMATION
------------------
Company: ${receipt.company_name}
Branch: ${receipt.branch_name}
${receipt.company_location ? `Location: ${receipt.company_location}` : ''}
${receipt.company_contact_info ? `Contact: ${receipt.company_contact_info}` : ''}
${receipt.company_email ? `Email: ${receipt.company_email}` : ''}

ITEM DETAILS
------------
Item Name: ${receipt.item_name}
Item ID: ${receipt.item_id}
Category: ${receipt.item_category}
Status: ${receipt.item_status}
Current Stock: ${receipt.item_stock_quantity}
Quantity: ${receipt.quantity}

USER INFORMATION
----------------
Name: ${receipt.user_full_name || receipt.user_name}
ID Number: ${receipt.user_id_number}
Department: ${receipt.user_department}
User Level: ${receipt.user_level}

NOTES
-----
${receipt.notes || 'No notes provided'}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.reference_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error || "Receipt not found"}</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  const dateInfo = formatDate(receipt.timestamp);
  const transactionType = getTransactionTypeDisplay(receipt.transaction_type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-bold">Transaction Receipt</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="space-y-6">
            {/* Company Header with Logo */}
            <div className="text-center border-b-2 border-gray-200 pb-6">
              {receipt.company_logo ? (
                <img src={receipt.company_logo} alt={receipt.company_name} className="w-20 h-20 mx-auto mb-4 rounded-full" />
              ) : (
                // Placeholder for company logo - you can replace this with actual logo
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Building className="h-10 w-10 text-gray-500" />
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{receipt.company_name}</h1>
              <div className="space-y-1 text-sm text-gray-600">
                {receipt.company_location && (
                  <div className="flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{receipt.company_location}</span>
                  </div>
                )}
                {receipt.company_contact_info && (
                  <div className="flex items-center justify-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{receipt.company_contact_info}</span>
                  </div>
                )}
                {receipt.company_email && (
                  <div className="flex items-center justify-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{receipt.company_email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Reference Number</span>
                </div>
                <p className="text-xl font-mono font-bold">{receipt.reference_number}</p>
              </div>
              <Badge className={transactionType.color}>
                {transactionType.label}
              </Badge>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{dateInfo.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-medium">{dateInfo.time}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Branch</p>
                <p className="font-medium">{receipt.branch_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Processed By</p>
                <p className="font-medium">{receipt.user_full_name || receipt.user_name}</p>
              </div>
            </div>

            {/* Item Details Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-900">Item Details</h3>
              </div>
              <div className="divide-y">
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-gray-600">Item Name:</span>
                  <span className="font-medium">{receipt.item_name}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-gray-600">Item ID:</span>
                  <span className="font-medium font-mono">{receipt.item_id}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{receipt.item_category}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline" className="text-xs">
                    {receipt.item_status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="font-medium">{receipt.item_stock_quantity} units</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 bg-blue-50">
                  <span className="text-gray-600 font-medium">Quantity {transactionType.label.split(' ')[0].toLowerCase()}:</span>
                  <span className="font-bold text-lg">{receipt.quantity} units</span>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-900">User Information</h3>
              </div>
              <div className="divide-y">
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{receipt.user_full_name || receipt.user_name}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-gray-600">ID Number:</span>
                  <span className="font-medium font-mono">{receipt.user_id_number}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">{receipt.user_department || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-gray-600">User Level:</span>
                  <span className="font-medium">{receipt.user_level}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {receipt.notes && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-900">Notes</h3>
                </div>
                <div className="px-4 py-3">
                  <p className="text-gray-700">{receipt.notes}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t">
              <p>Receipt generated on {new Date().toLocaleString()}</p>
              <p className="mt-1">Thank you for using our inventory system</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionReceipt; 
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle, ArrowLeft, Download, Printer, Hash, Package, User, Calendar, Building } from "lucide-react";
import TransactionReceipt from "./TransactionReceipt";
import api from "../utils/api";

interface TransactionSuccessPageProps {
  mode: 'withdraw' | 'return';
}

interface TransactionData {
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

const TransactionSuccessPage: React.FC<TransactionSuccessPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        
        // Get transaction ID from navigation state if available
        const transactionId = location.state?.transactionId;
        
        if (transactionId) {
          // Fetch specific transaction receipt
          const response = await api.get(`/transactions/${transactionId}/receipt/`);
          setTransaction(response.data);
        } else {
          // Fallback: Fetch the latest transaction for the current user
          const response = await api.get('/transactions/', {
            params: {
              transaction_type: mode.toUpperCase(),
              limit: 1,
              ordering: '-timestamp'
            }
          });
          
          if (response.data.results && response.data.results.length > 0) {
            setTransaction(response.data.results[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch transaction:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [mode, location.state]);

  const getTransactionTypeDisplay = (type: string) => {
    switch (type) {
      case "WITHDRAW":
        return { label: "WITHDRAWN", color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "RETURN":
        return { label: "RETURNED", color: "bg-green-100 text-green-800 border-green-200" };
      default:
        return { label: type, color: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      full: date.toLocaleString()
    };
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  const handleViewReceipt = () => {
    if (transaction) {
      setShowReceipt(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!transaction) return;
    
    const receiptText = `
TRANSACTION RECEIPT
==================

Reference Number: ${transaction.reference_number}
Date: ${formatDate(transaction.timestamp).date}
Time: ${formatDate(transaction.timestamp).time}
Transaction Type: ${getTransactionTypeDisplay(transaction.transaction_type).label}

COMPANY INFORMATION
------------------
Company: ${transaction.company_name}
Branch: ${transaction.branch_name}
${transaction.company_location ? `Location: ${transaction.company_location}` : ''}
${transaction.company_contact_info ? `Contact: ${transaction.company_contact_info}` : ''}
${transaction.company_email ? `Email: ${transaction.company_email}` : ''}

ITEM DETAILS
------------
Item Name: ${transaction.item_name}
Item ID: ${transaction.item_id}
Category: ${transaction.item_category}
Status: ${transaction.item_status}
Current Stock: ${transaction.item_stock_quantity}
Quantity: ${transaction.quantity}

USER INFORMATION
----------------
Name: ${transaction.user_full_name || transaction.user_name}
ID Number: ${transaction.user_id_number}
Department: ${transaction.user_department}
User Level: ${transaction.user_level}

NOTES
-----
${transaction.notes || 'No notes provided'}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${transaction.reference_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  const transactionType = getTransactionTypeDisplay(transaction?.transaction_type || mode.toUpperCase());
  const dateInfo = transaction ? formatDate(transaction.timestamp) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-600">
              Successfully {mode === 'withdraw' ? 'Withdrawn' : 'Returned'}!
            </CardTitle>
            <CardDescription className="text-lg">
              Your transaction has been completed successfully.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Transaction Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reference Number */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Reference Number</p>
                  <p className="text-xl font-mono font-bold text-blue-900">
                    {transaction?.reference_number || 'Transaction completed successfully'}
                  </p>
                </div>
                <Badge className={transactionType.color}>
                  {transactionType.label}
                </Badge>
              </div>
            </div>

            {/* Transaction Info */}
            {transaction ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Date</span>
                  </div>
                  <p className="font-medium">{dateInfo?.date}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="h-4 w-4" />
                    <span>Item</span>
                  </div>
                  <p className="font-medium">{transaction.item_name}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Processed By</span>
                  </div>
                  <p className="font-medium">{transaction.user_full_name || transaction.user_name}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="h-4 w-4" />
                    <span>Branch</span>
                  </div>
                  <p className="font-medium">{transaction.branch_name}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600">Transaction details will be available shortly.</p>
              </div>
            )}

            {/* Quantity Highlight */}
            {transaction ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Quantity {mode === 'withdraw' ? 'Withdrawn' : 'Returned'}</p>
                  <p className="text-2xl font-bold text-green-800">{transaction.quantity} units</p>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">Quantity {mode === 'withdraw' ? 'Withdrawn' : 'Returned'}</p>
                  <p className="text-2xl font-bold text-green-800">1 unit</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleViewReceipt}
            className="flex-1"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            View Full Receipt
          </Button>
          <Button 
            onClick={handlePrint}
            className="flex-1"
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button 
            onClick={handleContinue}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue
          </Button>
        </div>

        {/* Receipt Modal */}
        {showReceipt && transaction && (
          <TransactionReceipt
            transactionId={transaction.id}
            onClose={() => setShowReceipt(false)}
          />
        )}
      </div>
    </div>
  );
};

export default TransactionSuccessPage; 
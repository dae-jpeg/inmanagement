import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowLeft, Package, PackageCheck, Search, Filter, Calendar, User, Tag, PlusCircle, ArrowUpRight, Trash2, ArrowDownLeft, Receipt } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import api from "../utils/api";
import { useAuth } from '../context/AuthContext';
import TransactionReceipt from './TransactionReceipt';

interface Transaction {
  id: string;
  // Item information (flat structure from backend)
  item_name: string;
  item_id: string;
  item_category: string;
  item_status: string;
  item_stock_quantity: number;
  // User information (flat structure from backend)
  user_name: string;
  user_full_name: string;
  user_id_number: string;
  user_department: string;
  user_level: string;
  // Transaction information
  transaction_type: "WITHDRAW" | "RETURN" | "CREATE" | "UPDATE" | "DELETE" | "ADD_STOCK" | "REMOVE_STOCK";
  timestamp: string;
  notes: string;
  region_name: string;
  quantity: number;
  reference_number: string;
}

const History = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const { user, selectedCompany } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  const eventTypeOptions = [
    { value: "all", label: "All Events" },
    { value: "CREATE", label: "Created" },
    { value: "UPDATE", label: "Updated" },
    { value: "DELETE", label: "Deleted" },
    { value: "ADD_STOCK", label: "Stock Added" },
    { value: "REMOVE_STOCK", label: "Stock Removed" },
    { value: "WITHDRAW", label: "Withdrawn" },
    { value: "RETURN", label: "Returned" },
  ];

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        let url = '/transactions/';
        const params = new URLSearchParams();

        if (user?.global_user_level !== 'DEVELOPER' && selectedCompany) {
          params.append('branch__company', selectedCompany.company);
        }
        
        const response = await api.get(`${url}?${params.toString()}`);
        setTransactions(response.data.results || response.data);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user, selectedCompany]);

  // Filter transactions based on search term and filter type
  const filteredTransactions = transactions.filter(
    (transaction) => {
      const itemName = transaction.item_name || '';
      const itemId = transaction.item_id || '';
      const itemCategory = transaction.item_category || '';
      const userId = transaction.user_id_number || '';
      const userName = transaction.user_full_name || transaction.user_name || '';
      const userDepartment = transaction.user_department || '';
      const referenceNumber = transaction.reference_number || '';
      
      const matchesSearch = (
        itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesFilter = filterType === "all" || transaction.transaction_type === filterType;
      
      return matchesSearch && matchesFilter;
    }
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Get status color for item status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'LOW_STOCK':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'RETIRED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleBackToActions = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex justify-center items-center h-full">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBackToActions}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Transaction History</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {filteredTransactions.length} transactions
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by item name, ID, category, user name, ID, department, or reference number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-800 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Date & Time
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      Item Details
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Action</th>
                  <th className="text-left py-3 px-4 font-medium">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      User Details
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Notes</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => {
                    console.log('Rendering transaction:', transaction); // Debug log for each transaction
                    return (
                      <tr
                        key={transaction.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatDate(transaction.timestamp)}
                            </div>
                            {transaction.reference_number && (
                              <div className="text-xs text-gray-500 font-mono">
                                {transaction.reference_number}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {transaction.item_name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">
                              ID: {transaction.item_id || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Quantity: {transaction.quantity || 0} units
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={(() => {
                              switch (transaction.transaction_type) {
                                case "WITHDRAW":
                                  return "bg-blue-100 text-blue-800 border-blue-200";
                                case "RETURN":
                                  return "bg-green-100 text-green-800 border-green-200";
                                case "CREATE":
                                  return "bg-purple-100 text-purple-800 border-purple-200";
                                case "UPDATE":
                                  return "bg-yellow-100 text-yellow-800 border-yellow-200";
                                case "DELETE":
                                  return "bg-red-100 text-red-800 border-red-200";
                                case "ADD_STOCK":
                                  return "bg-teal-100 text-teal-800 border-teal-200";
                                case "REMOVE_STOCK":
                                  return "bg-orange-100 text-orange-800 border-orange-200";
                                default:
                                  return "bg-gray-100 text-gray-800 border-gray-200";
                              }
                            })()}
                          >
                            {(() => {
                              switch (transaction.transaction_type) {
                                case "WITHDRAW":
                                  return (<><Package className="h-3 w-3 mr-1" />Withdrawn</>);
                                case "RETURN":
                                  return (<><PackageCheck className="h-3 w-3 mr-1" />Returned</>);
                                case "CREATE":
                                  return (<><PlusCircle className="h-3 w-3 mr-1" />Created</>);
                                case "UPDATE":
                                  return (<><ArrowUpRight className="h-3 w-3 mr-1" />Updated</>);
                                case "DELETE":
                                  return (<><Trash2 className="h-3 w-3 mr-1" />Deleted</>);
                                case "ADD_STOCK":
                                  return (<><ArrowUpRight className="h-3 w-3 mr-1" />Stock Added</>);
                                case "REMOVE_STOCK":
                                  return (<><ArrowDownLeft className="h-3 w-3 mr-1" />Stock Removed</>);
                                default:
                                  return transaction.transaction_type;
                              }
                            })()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {transaction.user_full_name || transaction.user_name || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                          {transaction.notes || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReceiptId(transaction.id)}
                            className="flex items-center gap-1"
                          >
                            <Receipt className="h-3 w-3" />
                            Receipt
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No transactions found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Receipt Modal */}
      {selectedReceiptId && (
        <TransactionReceipt
          transactionId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
};

export default History;

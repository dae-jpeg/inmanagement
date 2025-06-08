import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowLeft, Package, PackageCheck, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

interface Transaction {
  id: string;
  item: {
    id: string;
    item_id: string;
    name: string;
  };
  transaction_type: "WITHDRAW" | "RETURN";
  timestamp: string;
  user: {
    id: string;
    id_number: string;
    first_name: string;
    last_name: string;
  };
  notes: string;
}

const History = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if no user data is found
  React.useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/transactions/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.item.item_id.includes(searchTerm)
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

  const handleBackToActions = () => {
    navigate("/actions");
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
        <div className="text-sm font-medium">User ID: {user?.id}</div>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by item name or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">
                    Date & Time
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Item</th>
                  <th className="text-left py-3 px-4 font-medium">Item ID</th>
                  <th className="text-left py-3 px-4 font-medium">Action</th>
                  <th className="text-left py-3 px-4 font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        {formatDate(transaction.timestamp)}
                      </td>
                      <td className="py-3 px-4">{transaction.item.name}</td>
                      <td className="py-3 px-4">{transaction.item.item_id}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={
                            transaction.transaction_type === "WITHDRAW"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }
                        >
                          {transaction.transaction_type === "WITHDRAW" ? (
                            <Package className="h-3 w-3 mr-1" />
                          ) : (
                            <PackageCheck className="h-3 w-3 mr-1" />
                          )}
                          {transaction.transaction_type === "WITHDRAW"
                            ? "Withdrawn"
                            : "Returned"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {transaction.user.first_name} {transaction.user.last_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ID: {transaction.user.id_number}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No transactions found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default History;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  LogOut,
  Package,
  PackageCheck,
  History,
  Users,
  Settings,
  PlusCircle,
  ClipboardList,
} from "lucide-react";
import QuickScan from "./QuickScan";

const ActionSelection = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'withdraw' | 'return'>('withdraw');

  // Redirect to login if no user data is found
  React.useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/");
  };

  const startScanning = (mode: 'withdraw' | 'return') => {
    setScanMode(mode);
    setIsScanning(true);
  };

  // Common actions available to all users
  const commonActions = [
    {
      title: "Withdraw Item",
      icon: <Package className="h-5 w-5 text-blue-600" />,
      description: "Scan a QR code to withdraw an item from inventory",
      action: () => startScanning('withdraw'),
      buttonText: "Start Withdrawal",
      buttonClass: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Return Item",
      icon: <PackageCheck className="h-5 w-5 text-green-600" />,
      description: "Scan a QR code to return an item to inventory",
      action: () => startScanning('return'),
      buttonText: "Start Return",
      buttonClass: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Profile",
      icon: <Package className="h-5 w-5 text-purple-600" />,
      description: "View and edit your user profile information",
      action: () => navigate("/profile"),
      buttonText: "View Profile",
      buttonClass: "bg-purple-600 hover:bg-purple-700",
    },
    {
      title: "Transaction History",
      icon: <History className="h-5 w-5 text-amber-600" />,
      description: "View your past withdrawals and returns",
      action: () => navigate("/history"),
      buttonText: "View History",
      buttonClass: "bg-amber-600 hover:bg-amber-700",
    },
  ];

  // Staff-only actions
  const staffActions = [
    {
      title: "Add New Item",
      icon: <PlusCircle className="h-5 w-5 text-indigo-600" />,
      description: "Add a new item to the inventory system",
      action: () => navigate("/items/new"),
      buttonText: "Add Item",
      buttonClass: "bg-indigo-600 hover:bg-indigo-700",
    },
    {
      title: "Inventory Management",
      icon: <ClipboardList className="h-5 w-5 text-teal-600" />,
      description: "Manage and update inventory items",
      action: () => navigate("/items"),
      buttonText: "Manage Items",
      buttonClass: "bg-teal-600 hover:bg-teal-700",
    },
  ];

  // Admin-only actions
  const adminActions = [
    {
      title: "User Management",
      icon: <Users className="h-5 w-5 text-rose-600" />,
      description: "Manage user accounts and permissions",
      action: () => navigate("/users"),
      buttonText: "Manage Users",
      buttonClass: "bg-rose-600 hover:bg-rose-700",
    },
    {
      title: "System Settings",
      icon: <Settings className="h-5 w-5 text-gray-600" />,
      description: "Configure system settings and preferences",
      action: () => navigate("/settings"),
      buttonText: "Settings",
      buttonClass: "bg-gray-600 hover:bg-gray-700",
    },
  ];

  // Get actions based on user level
  const getActions = () => {
    let actions = [...commonActions];
    if (user?.user_level === 'STAFF' || user?.user_level === 'ADMIN') {
      actions = [...actions, ...staffActions];
    }
    if (user?.user_level === 'ADMIN') {
      actions = [...actions, ...adminActions];
    }
    return actions;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Logged in as: {user?.first_name} {user?.last_name} ({user?.user_level})
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">ID: {user?.id_number}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getActions().map((action, index) => (
            <Card key={index} className="bg-white hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {action.icon}
                  {action.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {action.description}
                </p>
                <Button
                  className={`w-full ${action.buttonClass}`}
                  onClick={action.action}
                >
                  {action.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* QuickScan component */}
      <QuickScan
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        mode={scanMode}
      />
    </div>
  );
};

export default ActionSelection;

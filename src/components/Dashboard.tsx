import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Package, PackageCheck, Users, Clock } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  // Redirect to login if no user data is found
  React.useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Mock statistics data
  const stats = {
    totalItems: 42,
    availableItems: 28,
    checkedOutItems: 14,
    activeUsers: 8,
    recentTransactions: 23,
  };

  // Mock category data
  const categories = [
    { name: "Electronics", count: 18, color: "bg-blue-500" },
    { name: "Accessories", count: 12, color: "bg-green-500" },
    { name: "Audio", count: 7, color: "bg-purple-500" },
    { name: "Other", count: 5, color: "bg-amber-500" },
  ];

  const handleBackToActions = () => {
    navigate("/actions");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBackToActions}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="text-sm font-medium">ID: {user?.id_number}</div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-3xl font-bold">{stats.totalItems}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <PackageCheck className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-3xl font-bold">
                  {stats.availableItems}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Checked Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Package className="h-5 w-5 text-amber-600 mr-2" />
                <span className="text-3xl font-bold">
                  {stats.checkedOutItems}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-3xl font-bold">{stats.activeUsers}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Item Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.name} className="flex items-center">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          {category.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {category.count}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`${category.color} h-2.5 rounded-full`}
                          style={{
                            width: `${(category.count / stats.totalItems) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Laptop withdrawn</p>
                    <p className="text-sm text-muted-foreground">
                      User ID: 1234 • 10 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Keyboard returned</p>
                    <p className="text-sm text-muted-foreground">
                      User ID: 5678 • 45 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Webcam withdrawn</p>
                    <p className="text-sm text-muted-foreground">
                      User ID: 9012 • 2 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Monitor returned</p>
                    <p className="text-sm text-muted-foreground">
                      User ID: 3456 • 3 hours ago
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

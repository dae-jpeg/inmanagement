import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import routes from "tempo-routes";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import UserAuth from "./components/UserAuth";
import SignUp from "./components/SignUp";
import ActionSelection from "./components/ActionSelection";
import WithdrawItem from "./components/WithdrawItem";
import ReturnItem from "./components/ReturnItem";
import Profile from "./components/Profile";
import History from "./components/History";
import Success from "./components/Success";
import Items from "./components/Items";
import ItemForm from "./components/ItemForm";
import Users from "./components/Users";

// Staff level route protection
const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute
      checkAccess={(user) =>
        user?.user_level === "STAFF" || user?.user_level === "ADMIN"
      }
      redirectTo="/actions"
    >
      {children}
    </ProtectedRoute>
  );
};

// Admin level route protection
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute
      checkAccess={(user) => user?.user_level === "ADMIN"}
      redirectTo="/actions"
    >
      {children}
    </ProtectedRoute>
  );
};

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <>
          <Routes>
            <Route path="/" element={<UserAuth />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/actions"
              element={
                <ProtectedRoute>
                  <ActionSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/withdraw"
              element={
                <ProtectedRoute>
                  <WithdrawItem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/return"
              element={
                <ProtectedRoute>
                  <ReturnItem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route path="/success" element={<Success />} />

            {/* Staff Routes */}
            <Route
              path="/items"
              element={
                <StaffRoute>
                  <Items />
                </StaffRoute>
              }
            />
            <Route
              path="/items/new"
              element={
                <StaffRoute>
                  <ItemForm />
                </StaffRoute>
              }
            />
            <Route
              path="/items/:id/edit"
              element={
                <StaffRoute>
                  <ItemForm />
                </StaffRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        </>
      </Suspense>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserAuth from './components/UserAuth';
import Dashboard from './components/Dashboard';
import AuthActionFlow from './components/AuthActionFlow';
import Profile from './components/Profile';
import History from './components/History';
import Items from './components/Items';
import ItemForm from './components/ItemForm';
import Users from './components/Users';
import AddNewUser from './components/AddNewUser';
import CompanyManagement from './components/CompanyManagement';
import CompanyEdit from './components/CompanyEdit';
import BranchManagement from './components/BranchManagement';
import BarcodeTest from './components/BarcodeTest';
import PerformanceMonitor from './components/PerformanceMonitor';
import SuccessPage from './components/SuccessPage';
import TransactionSuccessPage from './components/TransactionSuccessPage';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<UserAuth />} />
          <Route path="/login" element={<UserAuth />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/withdraw" element={<TransactionSuccessPage mode="withdraw" />} />
          <Route path="/return" element={<TransactionSuccessPage mode="return" />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/actions" element={
            <ProtectedRoute requireCompanySelected>
              <AuthActionFlow />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/history" element={
            <ProtectedRoute requireCompanySelected>
              <History />
            </ProtectedRoute>
          } />
          
          <Route path="/items" element={
            <ProtectedRoute>
              <Items />
            </ProtectedRoute>
          } />

          <Route path="/items/new" element={
            <ProtectedRoute requireCompanySelected>
              <ItemForm />
            </ProtectedRoute>
          } />

          <Route path="/items/edit/:id" element={
            <ProtectedRoute requireCompanySelected>
              <ItemForm />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          } />

          <Route path="/users/new" element={
            <ProtectedRoute>
              <AddNewUser />
            </ProtectedRoute>
          } />

          <Route path="/companies" element={
            <ProtectedRoute>
              <CompanyManagement />
            </ProtectedRoute>
          } />

          <Route path="/company-edit" element={
            <ProtectedRoute requireCompanySelected>
              <CompanyEdit />
            </ProtectedRoute>
          } />

          <Route path="/branches" element={
            <ProtectedRoute>
              <BranchManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/test" element={
            <ProtectedRoute>
              <BarcodeTest />
            </ProtectedRoute>
          } />
          
          <Route path="/performance" element={
            <ProtectedRoute>
              <PerformanceMonitor />
            </ProtectedRoute>
          } />
          
          {/* Redirect any unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;

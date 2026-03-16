import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/authStore';
import { Header } from './components/common';
import { LoginPage } from './pages/LoginPage';
import { ProductListPage } from './pages/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { AdminPage } from './pages/AdminPage';

const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/products" replace />;
  return children;
};

const Layout = ({ children }) => (
  <>
    <Header />
    {children}
  </>
);

const AppRoutes = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/products" replace /> : <LoginPage />}
      />
      <Route
        path="/products"
        element={
          <PrivateRoute>
            <Layout><ProductListPage /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <PrivateRoute>
            <Layout><ProductDetailPage /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/my/orders"
        element={
          <PrivateRoute>
            <Layout><MyOrdersPage /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout><AdminPage /></Layout>
          </AdminRoute>
        }
      />
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

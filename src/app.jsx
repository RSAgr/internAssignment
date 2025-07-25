import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProductManagement from './pages/ProductManagement';
import PrivateRoute from './routes/PrivateRoute';
import PublicRoute from './routes/PublicRoute';

const App = () => {
  const { token } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Root redirect */}
      <Route 
        path="/" 
        element={
          token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />
      
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/products"
        element={
          <PrivateRoute>
            <ProductManagement />
          </PrivateRoute>
        }
      />
      {/* Catch all other routes and redirect based on auth state */}
      <Route 
        path="*" 
        element={
          token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
};

export default App;

import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const authState = useSelector((state) => state.auth);
  const { token, user } = authState;
  
  console.log('PrivateRoute - token:', token);
  console.log('PrivateRoute - user:', user);
  console.log('PrivateRoute - full auth state:', authState);
  
  return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;

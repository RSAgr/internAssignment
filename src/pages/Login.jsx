import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('michaelw');
  const [password, setPassword] = useState('michaelwpass');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Login attempt with:', { username, password });
    
    const result = await dispatch(loginUser({ username, password }));
    console.log('Login result:', result);
    
    if (result.meta.requestStatus === 'fulfilled') {
      console.log('Login successful, navigating to dashboard');
      navigate('/dashboard');
    } else {
      console.log('Login failed:', result.error || result.payload);
    }
  };

  return (
    <div className="login-container min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 px-4">
      <div className="login-card w-full max-w-md backdrop-blur-md bg-white/20 border border-white/30 shadow-2xl rounded-2xl p-8">
        <h2 className="login-title text-3xl font-bold text-white text-center mb-6 drop-shadow-md">Login to Your Account</h2>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="login-input w-full px-4 py-3 rounded-xl border border-white/50 bg-white/30 placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-white backdrop-blur-md"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="login-input w-full px-4 py-3 rounded-xl border border-white/50 bg-white/30 placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-white backdrop-blur-md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`login-button w-full py-3 rounded-xl text-white font-bold transition-all duration-300 ${
              loading
                ? "bg-white/40 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-[1.02]"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <p className="error-message text-red-200 text-center text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;

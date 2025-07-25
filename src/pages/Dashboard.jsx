import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    salesData: [],
    revenueData: [],
    customerData: {
      newCustomers: 0,
      returningCustomers: 0,
      totalCustomers: 0
    },
    productData: [],
    users: [],
    carts: [],
    loading: true
  });

  useEffect(() => {
    // We are fetching data from API and ignoring the locally new added products, though we can easily modify to use local data too
    const fetchDashboardData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true }));

        // Fetch multiple endpoints in parallel
        const [usersRes, productsRes, cartsRes] = await Promise.all([
          axios.get('https://dummyjson.com/users?limit=20'),
          axios.get('https://dummyjson.com/products?limit=30'),
          axios.get('https://dummyjson.com/carts?limit=20')
        ]);

        const users = usersRes.data.users;
        const products = productsRes.data.products;
        const carts = cartsRes.data.carts;

        // Process sales data based on carts (monthly sales simulation)
        const monthlyData = [
          { month: 'Jan', sales: carts.slice(0, 3).reduce((acc, cart) => acc + cart.total, 0), revenue: Math.floor(Math.random() * 50000) + 30000 },
          { month: 'Feb', sales: carts.slice(3, 6).reduce((acc, cart) => acc + cart.total, 0), revenue: Math.floor(Math.random() * 50000) + 25000 },
          { month: 'Mar', sales: carts.slice(6, 9).reduce((acc, cart) => acc + cart.total, 0), revenue: Math.floor(Math.random() * 50000) + 40000 },
          { month: 'Apr', sales: carts.slice(9, 12).reduce((acc, cart) => acc + cart.total, 0), revenue: Math.floor(Math.random() * 50000) + 35000 },
          { month: 'May', sales: carts.slice(12, 15).reduce((acc, cart) => acc + cart.total, 0), revenue: Math.floor(Math.random() * 50000) + 45000 },
          { month: 'Jun', sales: carts.slice(15, 18).reduce((acc, cart) => acc + cart.total, 0), revenue: Math.floor(Math.random() * 50000) + 38000 },
          { month: 'Jul', sales: carts.slice(18, 20).reduce((acc, cart) => acc + cart.total, 0), revenue: Math.floor(Math.random() * 50000) + 42000 }
        ];

        // Generate revenue data for bar chart
        const revenueData = monthlyData.map(item => item.revenue);

        // Customer data based on users
        const totalUsers = users.length;
        const newCustomers = Math.floor(totalUsers * 0.3); // 30% new customers
        const returningCustomers = totalUsers - newCustomers;

        // Product categories from actual product data
        const categoryMap = {};
        products.forEach(product => {
          const category = product.category;
          categoryMap[category] = (categoryMap[category] || 0) + 1;
        });

        const productData = Object.entries(categoryMap).map(([category, count]) => ({
          category: category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' & '),
          value: count
        }));

        setDashboardData({
          salesData: monthlyData,
          revenueData,
          customerData: {
            newCustomers,
            returningCustomers,
            totalCustomers: totalUsers
          },
          productData,
          users,
          carts,
          loading: false
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Chart configurations
  const salesLineChartData = {
    labels: dashboardData.salesData.map(item => item.month),
    datasets: [
      {
        label: 'Sales',
        data: dashboardData.salesData.map(item => item.sales),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Revenue',
        data: dashboardData.salesData.map(item => item.revenue),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const revenueBarChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Monthly Revenue ($)',
        data: dashboardData.revenueData,
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const customerDoughnutData = {
    labels: ['New Customers', 'Returning Customers'],
    datasets: [
      {
        data: [
          dashboardData.customerData.newCustomers,
          dashboardData.customerData.returningCustomers
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            Welcome back, {user?.firstName} {user?.lastName}!
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/products')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Manage Products
          </button>
          <button 
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#007bff', margin: '0 0 0.5rem 0' }}>Total Revenue</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
            {dashboardData.loading ? 'Loading...' : 
             `$${dashboardData.revenueData.reduce((a, b) => a + b, 0).toLocaleString()}`}
          </p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#28a745', margin: '0 0 0.5rem 0' }}>Total Customers</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
            {dashboardData.loading ? 'Loading...' : 
             dashboardData.customerData.totalCustomers?.toLocaleString()}
          </p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#ffc107', margin: '0 0 0.5rem 0' }}>Total Sales</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
            {dashboardData.loading ? 'Loading...' : 
             dashboardData.salesData.reduce((a, b) => a + b.sales, 0).toLocaleString()}
          </p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#17a2b8', margin: '0 0 0.5rem 0' }}>Products</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
            {dashboardData.loading ? 'Loading...' : 
             dashboardData.productData.reduce((a, b) => a + b.value, 0)}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '2rem' 
      }}>
        {/* Sales & Revenue Line Chart */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>Sales & Revenue Trends</h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            width: '100%', 
            height: '300px',
            marginTop: '1rem'
          }}>
            <div style={{ width: '100%', height: '250px' }}>
              <Line 
                data={salesLineChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>Monthly Revenue</h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            width: '100%', 
            height: '300px',
            marginTop: '1rem'
          }}>
            <div style={{ width: '100%', height: '250px' }}>
              <Bar 
                data={revenueBarChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Customer Distribution Doughnut Chart */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>Customer Distribution</h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            width: '100%', 
            height: '300px',
            marginTop: '1rem'
          }}>
            <div style={{ width: '250px', height: '250px' }}>
              <Doughnut 
                data={customerDoughnutData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      align: 'start',
                      labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 15,
                        textAlign: 'left',
                        font: {
                          size: 12
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        
      </div>

      {/* Recent Activity Table */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '2rem'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>Recent Activity</h3>
        {dashboardData.loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading recent activity...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#495057', width: '15%', minWidth: '100px' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#495057', width: '25%', minWidth: '120px' }}>Customer</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#495057', width: '20%', minWidth: '100px' }}>Action</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#495057', width: '20%', minWidth: '100px' }}>Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#495057', width: '20%', minWidth: '120px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.carts.slice(0, 5).map((cart, index) => {
                  const user = dashboardData.users.find(u => u.id === cart.userId);
                  const statuses = ['Completed', 'Processing', 'Completed', 'Completed', 'Processing'];
                  const actions = ['Purchase', 'Purchase', 'Refund', 'Purchase', 'Purchase'];
                  const dates = [
                    '2025-01-20', '2025-01-19', '2025-01-18', '2025-01-17', '2025-01-16'
                  ];
                  
                  return (
                    <tr key={cart.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '0.75rem', color: '#495057', whiteSpace: 'nowrap' }}>{dates[index] || '2025-01-15'}</td>
                      <td style={{ padding: '0.75rem', color: '#495057' }}>
                        {user ? `${user.firstName} ${user.lastName}` : `Customer ${cart.userId}`}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#495057' }}>{actions[index] || 'Purchase'}</td>
                      <td style={{ padding: '0.75rem', color: '#495057', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        ${cart.total.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          backgroundColor: statuses[index] === 'Completed' ? '#d4edda' : 
                                         statuses[index] === 'Processing' ? '#fff3cd' : '#d1ecf1',
                          color: statuses[index] === 'Completed' ? '#155724' : 
                                 statuses[index] === 'Processing' ? '#856404' : '#0c5460',
                          whiteSpace: 'nowrap'
                        }}>
                          {statuses[index] || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

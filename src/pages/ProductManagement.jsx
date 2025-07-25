import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProductManagement.css';

const ProductManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [localProducts, setLocalProducts] = useState([]); // Track locally added products
  const [nextLocalId, setNextLocalId] = useState(1001); // Start local IDs from 1001
  const productsPerPage = 6;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '', // Stores the original price before discount since from API we get discounted price so we need to calculate it
    discountPercentage: '',
    rating: '',
    stock: '',
    brand: '',
    category: '',
    thumbnail: ''
  });

  // Fetch products from API
  const fetchProducts = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
      const skip = (page - 1) * productsPerPage;
      let url = `https://dummyjson.com/products?limit=${productsPerPage}&skip=${skip}`;
      
      if (search) {
        url = `https://dummyjson.com/products/search?q=${search}&limit=${productsPerPage}&skip=${skip}`;
      }

      const response = await axios.get(url);
      // Calculate and store original prices for API products
      const apiProducts = response.data.products.map(product => {
        // Calculate original price only once when fetching
        const originalPrice = product.discountPercentage > 0 && product.discountPercentage < 100
          ? (product.price / (1 - product.discountPercentage / 100))
          : product.price;
        
        return {
          ...product,
          originalPrice: parseFloat(originalPrice.toFixed(2))
        };
      });
      
      // Filter local products based on search if needed
      const filteredLocalProducts = search 
        ? localProducts.filter(product => 
            product.title.toLowerCase().includes(search.toLowerCase()) ||
            product.description.toLowerCase().includes(search.toLowerCase()) ||
            product.category.toLowerCase().includes(search.toLowerCase()) ||
            product.brand.toLowerCase().includes(search.toLowerCase())
          )
        : localProducts;

      // Since we can't manipulate the API data directly, we will handle local products separately
      if (page === 1) {
        const combinedProducts = [...filteredLocalProducts, ...apiProducts].slice(0, productsPerPage);
        setProducts(combinedProducts);
        setTotalProducts(response.data.total + localProducts.length);
      } else {
        // For subsequent pages, show only API products (local products are shown on first page)
        const adjustedSkip = skip - localProducts.length;
        if (adjustedSkip >= 0) {
          let adjustedUrl = `https://dummyjson.com/products?limit=${productsPerPage}&skip=${adjustedSkip}`;
          if (search) {
            adjustedUrl = `https://dummyjson.com/products/search?q=${search}&limit=${productsPerPage}&skip=${adjustedSkip}`;
          }
          const adjustedResponse = await axios.get(adjustedUrl);
          // Calculate and store original prices 
          const adjustedApiProducts = adjustedResponse.data.products.map(product => {
            const originalPrice = product.discountPercentage > 0 && product.discountPercentage < 100
              ? (product.price / (1 - product.discountPercentage / 100))
              : product.price;
            
            return {
              ...product,
              originalPrice: parseFloat(originalPrice.toFixed(2))
            };
          });
          setProducts(adjustedApiProducts);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  }, [localProducts, productsPerPage]);

  useEffect(() => {
    fetchProducts(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchProducts]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'originalPrice') {
      // When original price changes, recalculate the discounted price
      const newOriginalPrice = parseFloat(value) || 0;
      const discountPercentage = parseFloat(formData.discountPercentage) || 0;
      
      if (newOriginalPrice < 0) return; 
      if (discountPercentage < 0 || discountPercentage > 100) return;
      
      // 100% discount was giving infinity, handle it explicitly
      let discountedPrice;
      if (discountPercentage >= 100) {
        discountedPrice = 0; 
      } else {
        discountedPrice = newOriginalPrice - (newOriginalPrice * discountPercentage / 100);
      }
      
      setFormData(prev => ({
        ...prev,
        originalPrice: value,
        price: Math.max(0, discountedPrice).toFixed(2) 
      }));
    } else if (name === 'discountPercentage') {
      // When discount changes, recalculate the final price
      const discountPercentage = parseFloat(value) || 0;
      
      
      if (discountPercentage < 0 || discountPercentage > 100) return;
      
      
      let originalPrice = parseFloat(formData.originalPrice);
      // if (!originalPrice || originalPrice <= 0) {
      //   originalPrice = parseFloat(formData.price) || 0;
      // }
      
      // Calculate discounted price - handle 100% discount explicitly
      let discountedPrice;
      if (discountPercentage >= 100) {
        discountedPrice = 0; 
      } else {
        discountedPrice = originalPrice - (originalPrice * discountPercentage / 100);
      }
      
      setFormData(prev => ({
        ...prev,
        discountPercentage: value,
        price: Math.max(0, discountedPrice).toFixed(2),
        originalPrice: originalPrice.toString() 
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Add new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      // Create a local product with a unique ID
      const localProduct = {
        id: nextLocalId,
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice), 
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        rating: parseFloat(formData.rating) || 0,
        stock: parseInt(formData.stock),
        isLocal: true 
      };

      // Add to local products list
      setLocalProducts(prev => [...prev, localProduct]);
      
      // Add the new product to the beginning of the current view
      setProducts(prev => [localProduct, ...prev.slice(0, -1)]);
      setNextLocalId(prev => prev + 1);
      
      setShowModal(false);
      resetForm();
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product. Please try again.');
    }
  };

  // Update product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const updatedProductData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice), 
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        rating: parseFloat(formData.rating) || 0,
        stock: parseInt(formData.stock)
      };

      // Check if this is a locally added product or an API product
      if (editingProduct.isLocal) {
        // Handle local product update, without a proper backend
        const updatedProduct = {
          ...editingProduct,
          ...updatedProductData
        };

        // Update in local products list
        setLocalProducts(prev => 
          prev.map(product => 
            product.id === editingProduct.id ? updatedProduct : product
          )
        );

        // Update in current view
        setProducts(prev => 
          prev.map(product => 
            product.id === editingProduct.id ? updatedProduct : product
          )
        );

        setShowModal(false);
        setEditingProduct(null);
        resetForm();
        alert('Product updated successfully!');
      } else {
        // Handle API product update
        const response = await axios.put(`https://dummyjson.com/products/${editingProduct.id}`, updatedProductData);

        // Ensure the updated product maintains all the calculated values
        const updatedApiProduct = {
          ...response.data,
          price: updatedProductData.price,
          originalPrice: updatedProductData.originalPrice,
          discountPercentage: updatedProductData.discountPercentage
        };

        // Update the product in the list
        setProducts(prev => 
          prev.map(product => 
            product.id === editingProduct.id ? updatedApiProduct : product
          )
        );
        
        setShowModal(false);
        setEditingProduct(null);
        resetForm();
        alert('Product updated successfully!');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product. Please try again.');
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const product = products.find(p => p.id === productId);
        
        if (product?.isLocal) {
          // Handle local product deletion
          setLocalProducts(prev => prev.filter(product => product.id !== productId));
          setProducts(prev => prev.filter(product => product.id !== productId));
          alert('Product deleted successfully!');
        } else {
          // Handle API product deletion
          await axios.delete(`https://dummyjson.com/products/${productId}`);
          setProducts(prev => prev.filter(product => product.id !== productId));
          alert('Product deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
      }
    }
  };

  // Open modal for editing
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    const originalPrice = product.originalPrice ? product.originalPrice.toString() : product.price.toString();
    
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      originalPrice: originalPrice,
      discountPercentage: product.discountPercentage.toString(),
      rating: product.rating.toString(),
      stock: product.stock.toString(),
      brand: product.brand,
      category: product.category,
      thumbnail: product.thumbnail
    });
    setShowModal(true);
  };

 
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      originalPrice: '',
      discountPercentage: '',
      rating: '',
      stock: '',
      brand: '',
      category: '',
      thumbnail: ''
    });
  };


  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

// calculate total pages
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div>
          <h1>Product Management</h1>
          <p>
            Manage your product inventory, {user?.firstName}
          </p>
        </div>
        <div className="header-buttons">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <span className="total-count">
            Total: {totalProducts} products
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">
            <p>Loading products...</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="product-image"
                        />
                      </td>
                      <td>
                        <div>
                          <div className="product-title">
                            {product.title}
                            {product.isLocal && (
                              <span className="new-badge">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="product-description">
                            {product.description.substring(0, 60)}...
                          </div>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>{product.brand}</td>
                      <td>
                        <div className="price-container">
                          <div className="current-price">
                            ${product.price}
                          </div>
                          {product.discountPercentage > 0 && (
                            <div className="original-price">
                              ${product.originalPrice ? product.originalPrice.toFixed(2) : 'N/A'}
                            </div>
                          )}
                          {product.discountPercentage > 0 && (
                            <div className="discount-badge">
                              {product.discountPercentage}% OFF
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`stock-badge ${
                          product.stock > 10 ? 'stock-high' : 
                          product.stock > 0 ? 'stock-medium' : 'stock-low'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td>
                        ⭐ {product.rating}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="btn btn-edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="btn btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal for Add/Edit Product */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
              <div className="form-group">
                <label className="form-label">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="form-input form-textarea"
                />
              </div>

              <div className="form-group-grid">
                <div>
                  <label className="form-label">
                    Original Price *
                  </label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    placeholder="Enter original price"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Final Price (Auto-calculated)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    readOnly
                    step="0.01"
                    className="form-input"
                  />
                  <small className="form-helper">
                    {formData.discountPercentage > 0 
                      ? `After ${formData.discountPercentage}% discount` 
                      : 'No discount applied'}
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group-grid">
                <div>
                  <label className="form-label">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group-grid">
                <div>
                  <label className="form-label">
                    Discount %
                  </label>
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    step="0.01"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Rating
                  </label>
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max="5"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;

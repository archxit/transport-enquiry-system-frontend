import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './css/AdminDashboard.css';

const AdminDashboard = () => {
  // Existing state variables
  const [routes, setRoutes] = useState([]);
  const [transports, setTransports] = useState([]);
  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('routes');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData]     = useState({});
  const navigate = useNavigate();

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('http://localhost:8080/routes');
      setRoutes(response.data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchTransports = async () => {
    try {
      const response = await axios.get('http://localhost:8080/transports');
      setTransports(response.data);
    } catch (error) {
      console.error('Error fetching transports:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8080/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAdmin = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      setAdmin(adminInfo);
    } catch (error) {
      console.error('Error fetching admin info:', error);
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchTransports();
    fetchUsers();
    fetchAdmin();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'source' || name === 'destination') {
      handleSourceDestinationChange();
    }
  };

  
  const handleSourceDestinationChange = async () => {
    if (formData.source && formData.destination) {
      try {
        // Get coordinates for source
        const sourceResponse = await axios.get(
          `https://api.api-ninjas.com/v1/geocoding?city=${formData.source}`,
          { headers: { 'X-Api-Key': 'YOUR_API_KEY' } }
        );
        
        // Get coordinates for destination
        const destResponse = await axios.get(
          `https://api.api-ninjas.com/v1/geocoding?city=${formData.destination}`,
          { headers: { 'X-Api-Key': 'YOUR_API_KEY' } }
        );
        
        if (sourceResponse.data.length > 0 && destResponse.data.length > 0) {
          const sourceCoords = [sourceResponse.data[0].latitude, sourceResponse.data[0].longitude];
          const destCoords = [destResponse.data[0].latitude, destResponse.data[0].longitude];
          
          // Update form data with coordinates
          setFormData({
            ...formData,
            sourceCoords: sourceCoords,
            destCoords: destCoords,
            // Calculate distance (approximate)
            distance: calculateDistance(sourceCoords[0], sourceCoords[1], destCoords[0], destCoords[1])
          });
        }
      } catch (error) {
        console.error('Error getting coordinates:', error);
      }
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return Math.round(distance);
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`http://localhost:8080/routes/${editingItem.route_id}`, formData);
      } else {
        await axios.post('http://localhost:8080/routes', formData);
      }
      setEditingItem(null);
      setFormData({});
      fetchRoutes();
    } catch (error) {
      console.error('Error saving route:', error);
    }
  };

  const handleDelete = async (id, type) => {
    try {
      await axios.delete(`http://localhost:8080/${type}/${id}`);
      if (type === 'routes') {
        fetchRoutes();
      } else if (type === 'transports') {
        fetchTransports();
      } else if (type === 'users') {
        fetchUsers();
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

  const renderRouteForm = () => (
    <form onSubmit={handleSubmit} className="admin-form">
      <h3>{editingItem ? 'Edit Route' : 'Add New Route'}</h3>
      
    <div className="form-group">
    <label>Source:</label>
    <input 
        type="text" 
        name="source" 
        value={formData.source || ''} 
        onChange={(e) => {
            handleInputChange(e);
            if (formData.destination) {
              handleSourceDestinationChange();
            }
        }}
        required
    />
    </div>

    <div className="form-group">
    <label>Destination:</label>
    <input 
        type="text" 
        name="destination" 
        value={formData.destination || ''} 
        onChange={(e) => {
        handleInputChange(e);
        handleSourceDestinationChange();
        }}
        required
    />
    </div>

      
      <div className="form-group">
        <label>Distance (km):</label>
        <input 
          type="number" 
          name="distance" 
          value={formData.distance || ''} 
          onChange={handleInputChange}
        />
      </div>
      
      <div className="form-group">
        <label>Estimated Time:</label>
        <input 
          type="text" 
          name="estimatedTime" 
          value={formData.estimatedTime || ''} 
          onChange={handleInputChange}
        />
      </div>
            
      <div className="form-buttons">
        <button type="submit" className="btn-save">Save</button>
        <button type="button" className="btn-cancel" onClick={() => setEditingItem(null)}>Cancel</button>
      </div>
    </form>
  );
  const renderTransportForm = () => (
    <form onSubmit={handleSubmit} className="admin-form">
      <h3>{editingItem ? 'Edit Transport' : 'Add New Transport'}</h3>
      
      <div className="form-group">
        <label>Vehicle Type:</label>
        <input 
          type="text" 
          name="vehicle_type" 
          value={formData.vehicle_type || ''} 
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Capacity:</label>
        <input 
          type="number" 
          name="capacity" 
          value={formData.capacity || ''} 
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="form-buttons">
        <button type="submit" className="btn-save">Save</button>
        <button type="button" className="btn-cancel" onClick={() => setEditingItem(null)}>Cancel</button>
      </div>
    </form>
  );  

  // Rest of your component code...

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-info">
          <span>Welcome, {admin?.username || 'Admin'}</span>
          <button onClick={() => {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminInfo');
            navigate('/admin-login');
          }}>Logout</button>
        </div>
      </header>
      
      <div className="admin-content">
        <div className="admin-sidebar">
          <div className="admin-tabs">
            <button 
              className={activeTab === 'routes' ? 'active' : ''} 
              onClick={() => setActiveTab('routes')}
            >
              Routes
            </button>
            <button 
              className={activeTab === 'transports' ? 'active' : ''} 
              onClick={() => setActiveTab('transports')}
            >
              Transports
            </button>
            <button 
              className={activeTab === 'users' ? 'active' : ''} 
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </div>
        </div>

        <div className="admin-main">
          {activeTab === 'routes' && (
            <div className="admin-table-container">
              <h2>Routes Management</h2>
              {editingItem || (!editingItem && formData.source) ? (
                renderRouteForm()
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Destination</th>
                      <th>Distance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map(route => (
                      <tr key={route.route_id}>
                        <td>{route.source}</td>
                        <td>{route.destination}</td>
                        <td>{route.distance} km</td>
                        <td>
                          <button onClick={() => setEditingItem(route)}>Edit</button>
                          <button onClick={() => handleDelete(route.route_id)}>Delete</button>
                        </td>
                        <td>
                            <button className="btn-edit" onClick={() => setEditingItem(route)}>Edit</button>
                            <button className="btn-delete" onClick={() => handleDelete(route.route_id, 'routes')}>Delete</button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        {activeTab === 'transports' && (
            <div className="admin-table-container">
                <h2>Transports Management</h2>
                {editingItem || (!editingItem && formData.vehicle_type) ? (
                    renderTransportForm()
                    ) : (
                    <>
                    <button className="btn-add" onClick={() => setFormData({})}>Add New Transport</button>
                    <table className="admin-table">
                    <thead>
                    <tr>
                        <th>Vehicle Type</th>
                        <th>Capacity</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {transports.map(transport => (
                        <tr key={transport.transport_id}>
                        <td>{transport.vehicle_type}</td>
                        <td>{transport.capacity}</td>
                        <td>{transport.status}</td>
                        <td>
                            <button onClick={() => setEditingItem(transport)}>Edit</button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                    </table>
                    </>
                )}
            </div>
        )}

        {activeTab === 'users' && (
            <div className="admin-table-container">
                <h2>Users Management</h2>
                <table className="admin-table">
                <thead>
                    <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                    <tr key={user.user_id}>
                        <td>{user.username}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td>
                        <button className="btn-delete" onClick={() => handleDelete(user.user_id, 'users')}>Delete</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        )}


          {/* Other tabs... */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

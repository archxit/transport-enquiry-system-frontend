import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polyline } from 'react-leaflet';
import { LayoutDashboard, Map, Users, Plus, Edit, Trash, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './css/AdminDashboard.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapComponent({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
function ViewOnlyMapComponent() {

  return null;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('routes');
  //for routes tab
  const [routes, setRoutes] = useState([]);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [sourceMarker, setSourceMarker] = useState(null);
  const [destMarker, setDestMarker] = useState(null);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [isLoadingPath, setIsLoadingPath] = useState(false);
  const mapRef = useRef(null);
  
  //for admin tab
  const [admin, setAdmin] = useState(null);
  //for users tab
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [username, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [userRole, setUserRole] = useState('USER');
  const [editingUser, setEditingUser] = useState(null);

  //for transports tab
  const [transports, setTransports] = useState([]);
  const [showAddTransport, setShowAddTransport] = useState(false);
  const [transportType, setTransportType] = useState('');
  const [transportCapacity, setTransportCapacity] = useState('');
  const [transportRegistration, setTransportRegistration] = useState('');
  const [transportStatus, setTransportStatus] = useState('Active');
  const [editingTransport, setEditingTransport] = useState(null);

  useEffect(() => {
    // Check admin authentication
    const adminInfo = localStorage.getItem('adminInfo');
    if (!adminInfo) {
      navigate('/admin-login');      
      return;
    }
    
    const adminData =JSON.parse(adminInfo);
    setAdmin({
      username: adminData.name || adminData.username, // Handle both old and new format
      email: adminData.email,
      role: adminData.role
    });
    fetchData();
  }, [navigate]);

  // Clear selected route when changing tabs or when showing the add route form
  useEffect(() => {
    setSelectedRoute(null);
    setRoutePath([]);
  }, [activeTab, showAddRoute]);

  useEffect(() => {
    if (selectedRoute && mapRef.current) {
      // Center map on the route
      const bounds = L.latLngBounds([selectedRoute.sourceCoords, selectedRoute.destCoords]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selectedRoute]);

  useEffect(() => {
    if (routePath.length > 0) {
      console.log('Route path updated with', routePath.length, 'points');
    }
  }, [routePath]);
    
  const fetchData = async () => {
    try {
      const [routesResponse, transportsResponse, usersResponse] = await Promise.all([
        axios.get('http://localhost:8080/routes'),
        axios.get('http://localhost:8080/transport'),
        axios.get('http://localhost:8080/users')
      ]);
      //console.log('Routes data:', routesResponse.data);
      // routesResponse.data.forEach(route => {
      //   console.log(`Route ID: ${route.routeId}, Source: ${route.source}, Destination: ${route.destination}, Distance: ${route.distance}`);
      // });
      // console.log('Transports data:', transportsResponse.data);
      //console.log('Users data:', usersResponse.data);
      // usersResponse.data.forEach(user => {
      //   console.log(`User ID: ${user.userId}, Username: ${user.username}, Email: ${user.email}`);
      // });
      //console.log('Raw routes data:', routesResponse.data);
      const transformedRoutes = routesResponse.data.map(route => ({
        ...route,
        sourceCoords: [parseFloat(route.sourceLat) , parseFloat(route.sourceLng)],
        destCoords: [parseFloat(route.destLat), parseFloat(route.destLng)]
      }));
      
      //console.log('Transformed routes data:', transformedRoutes);
      setRoutes(transformedRoutes);

      setTransports(transportsResponse.data);

      const mappedUsers = usersResponse.data.map(user => ({
        userId: user.userId,
        name: user.username, // Changed from username to name
        email: user.email,
        role: user.role || 'USER'
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchRoutePath = async (sourceCoords, destCoords) => {
    setIsLoadingPath(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${sourceCoords[1]},${sourceCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.routes && data.routes[0] && data.routes[0].geometry) {
        const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRoutePath(coordinates);
      }
    } catch (error) {
      console.error('Error fetching route path:', error);
      setRoutePath([sourceCoords, destCoords]);
    }finally {
      setIsLoadingPath(false);
    }
  };
  

  const handleLocationSelect = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'User-Agent': 'TransportInquirySystem' } } // Add User-Agent header
      );
      
      if (response.data && response.data.display_name) {
        const locationName = response.data.display_name.split(',')[0];
  
        if (!sourceMarker) {
          setSourceMarker([lat, lng]);
          setSource(locationName);
        } else if (!destMarker) {
          setDestMarker([lat, lng]);
          setDestination(locationName);
          
          // Calculate distance
          const distance = calculateDistance(sourceMarker[0], sourceMarker[1], lat, lng);
          console.log(`Distance: ${distance.toFixed(2)} km`);
        }
      } else {
        console.error('Invalid response from geocoding service');
      }
    } catch (error) {
      console.error('Error getting location name:', error);
      // Use coordinates as fallback
      if (!sourceMarker) {
        setSourceMarker([lat, lng]);
        setSource(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } else if (!destMarker) {
        setDestMarker([lat, lng]);
        setDestination(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        
        const distance = calculateDistance(sourceMarker[0], sourceMarker[1], lat, lng);
        console.log(`Distance: ${distance.toFixed(2)} km`);
      }
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const resetRouteForm = () => {
    setSource('');
    setDestination('');
    setSourceMarker(null);
    setDestMarker(null);
    setEditingItem(null);
  };

  const handleSaveRoute = async () => {
    if (!sourceMarker || !destMarker || !source || !destination) {
      console.error('Source or destination marker is missing');
      return;
    }
  
    const distance = calculateDistance(
      sourceMarker[0],
      sourceMarker[1],
      destMarker[0],
      destMarker[1]
    );
  
    console.log('Calculated distance:', distance);
    
    const formattedDistance = parseFloat(distance.toFixed(2));
    if (isNaN(formattedDistance)) {
      console.error('Invalid distance calculated');
      alert('Error calculating distance. Please try again.');
      return;
    }
  
    try {
      const routeData = {
        source,
        destination,
        sourceLat: sourceMarker[0],
        sourceLng: sourceMarker[1],
        destLat: destMarker[0],
        destLng: destMarker[1],
        distance: calculateDistance(sourceMarker[0],sourceMarker[1], destMarker[0] , destMarker[1])
      };
  
      if (editingItem) {
        await axios.put(`http://localhost:8080/routes/${editingItem.routeId}`, routeData);
      } else {
        await axios.post('http://localhost:8080/routes', routeData);
      }
  
      console.log('Route saved successfully with distance:', formattedDistance);
      fetchData();
      setShowAddRoute(false);
      resetRouteForm();
      setSourceMarker(null);
      setDestMarker(null);
      setSource('');
      setDestination('');
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving route:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
      }
    }
  };
  
  const handleRouteClick = (route) => {
    console.log('Route clicked:', route);
    setSelectedRoute(route);
    
    if (route.sourceCoords && route.destCoords) {
      console.log('Fetching path for coordinates:', route.sourceCoords, route.destCoords);
      fetchRoutePath(route.sourceCoords, route.destCoords);
    } else {
      console.error('Missing coordinates for route:', route);
    }
  };

  const handleEditRoute = (route) => {
    setEditingItem(route);
    setSource(route.source);
    setDestination(route.destination);
    setShowAddRoute(true);
    // Note: We don't have the original coordinates, so markers won't be set
  };

  const handleEditTransport = (transport) => {
    setEditingTransport(transport);
    setTransportType(transport.vehicleType);
    setTransportCapacity(transport.capacity);
    setTransportRegistration(transport.registrationNumber);
    setTransportStatus(transport.status);
    setShowAddTransport(true);
  };

  const resetTransportForm = () => {
    setTransportType('');
    setTransportCapacity('');
    setTransportRegistration('');
    setTransportStatus('Active');
    setEditingTransport(null);
  };

  const resetUserForm = () => {
    setUsername('');
    setUserEmail('');
    setUserPassword('');
    setUserRole('USER');
    setEditingUser(null);
  };

  const handleSaveUser = async () => {
    if (!username || !userEmail || (!userPassword && !editingUser)) {
      alert('Please fill in all required fields');
      return;
    }
  
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      alert('Please enter a valid email address');
      return;
    }
  
    try {
      const userData = {
        username,
        email: userEmail,
        role: userRole,
        ...(userPassword && { password: userPassword }) // Only include password if it's provided
      };
      
      console.log(`Saving user with role ${userRole}: ${username}, ${userEmail}`);
      
      let response;
      if (editingUser) {
        // For editing, use PUT request
        response = await axios.put(`http://localhost:8080/users/${editingUser.userId}`, userData);
      } else {
        // For new users, use POST request to register endpoint
        response = await axios.post('http://localhost:8080/users/register', {
          ...userData,
          password: userPassword // Password is required for new users
        });
      }
      
      console.log('User saved successfully:', response.data);
      
      fetchData(); // Refresh the users list
      setShowAddUser(false);
      resetUserForm();
    } 
    catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`Error saving user: ${errorMessage}`);
    }
  };
  
  const handleEditUser = (user) => {
    setEditingUser(user);
    setUsername(user.username);
    setUserEmail(user.email);
    setUserPassword(''); // Don't populate password for security reasons
    setUserRole(user.role || 'USER');
    setShowAddUser(true);
  };
  

  const handleSaveTransport = async () => {
    if (!transportType || !transportCapacity || !transportRegistration) {
      alert('Please fill in all required fields');
      return;
    }
    if (isNaN(parseInt(transportCapacity)) || parseInt(transportCapacity) <= 0) {
      alert('Capacity must be a positive number');
      return;
    }  
    try {
      const statusMapping = {
        'Active': 'ACTIVE',
        'Inactive': 'INACTIVE',
        'Maintenance': 'MAINTENANCE'
      };

      const transportData = {
        vehicleType: transportType,
        capacity: parseInt(transportCapacity),
        registrationNumber: transportRegistration,
        status: statusMapping[transportStatus] || 'ACTIVE'
      };

  
      if (editingTransport) {
        await axios.put(`http://localhost:8080/transport/${editingTransport.transportId}`, transportData);
      } else {
        await axios.post('http://localhost:8080/transport', transportData);
      }
  
      fetchData();
      setShowAddTransport(false);
      resetTransportForm();
    } catch (error) {
      console.error('Error saving transport:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      alert('Error saving transport: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id, type) => {
    if (!id) {
      console.error(`Cannot delete ${type}: Missing ID`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      try {
        if (type === 'routes') {
          await axios.delete(`http://localhost:8080/routes/${id}`);
          fetchData();
        }
        else if(type === 'users')
        {
          await axios.delete(`http://localhost:8080/users/${id}`);
          fetchData();
        }
        else if (type === 'transports') {
          await axios.delete(`http://localhost:8080/transport/${id}`);
          fetchData();
        }
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
      }
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/admin-login');
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Transport Inquiry System - Admin</h1>
        <div className="admin-info">
          <span>Admin: {admin?.username || 'Administrator'}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>
      <div className="admin-content">
        <div className="admin-sidebar">
          <div className="admin-tabs">
            <button 
              className={activeTab === 'routes' ? 'active' : ''} 
              onClick={() => setActiveTab('routes')}
            >
              <Map size={20} />
              <span>Routes</span>
            </button>
            <button 
              className={activeTab === 'transports' ? 'active' : ''} 
              onClick={() => setActiveTab('transports')}
            >
              <LayoutDashboard size={20} />
              <span>Transport</span>
            </button>
            <button 
              className={activeTab === 'users' ? 'active' : ''} 
              onClick={() => setActiveTab('users')}
            >
              <Users size={20} />
              <span>Users</span>
            </button>
          </div>
        </div>
        <div className="admin-main">
          {activeTab === 'routes' && (
            <div className="admin-table-container">
              <div className="header-row">
                <h2>Routes Management</h2>
                <button 
                  className="btn-add-route"
                  onClick={() => {
                    setEditingItem(null);
                    setSourceMarker(null);
                    setDestMarker(null);
                    setSource('');
                    setDestination('');
                    setShowAddRoute(true);
                    setSelectedRoute(null);
                  }}
                >
                  <Plus size={20} />
                  <span>Add Route</span>
                </button>
              </div>
              {showAddRoute ? (
                <div className="route-form-container">
                  <h3>{editingItem ? 'Edit Route' : 'Add New Route'}</h3>
                  <div className="map-container">
                  <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    style={{ height: '100%', width: '100%' }}
                    whenCreated={mapInstance => {
                      mapRef.current = mapInstance;
                    }}
                    >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapComponent onLocationSelect={handleLocationSelect} />
                    
                    {selectedRoute && selectedRoute.sourceCoords && (
                      <Marker position={selectedRoute.sourceCoords} />
                    )}
                    {selectedRoute && selectedRoute.destCoords && (
                      <Marker position={selectedRoute.destCoords} />
                    )}
                      {selectedRoute && routePath.length > 0 && (
                      <Polyline
                        positions={routePath}
                        color="blue"
                        weight={3}
                      />
                    )}
                    {selectedRoute && (
                      <div className="map-overlay" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, background: 'white', padding: '5px 10px', borderRadius: '4px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
                        <p><strong>Selected Route:</strong> {selectedRoute.source} to {selectedRoute.destination}</p>
                        {isLoadingPath && <p>Loading route path...</p>}
                      </div>
                    )}
                    
                    {routePath.length === 0 && selectedRoute && !isLoadingPath && (
                      <div className="error-message" style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 1000, background: 'white', padding: '5px 10px', borderRadius: '4px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', color: 'red' }}>
                        <p>Could not load detailed route path. Showing direct line.</p>
                      </div>
                    )}
                  </MapContainer>


                    <p className="map-note">
                      {!sourceMarker  
                        ? "Click on the map to set the source location" 
                        : !destMarker 
                        ? "Click on the map to set the destination location" 
                        : "Source and destination set. You can edit the names directly in the form fields."
                      }
                    </p>
                  </div>
                  <div className="form-group">
                    <label>Source:</label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Destination:</label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                    />
                  </div>
                  {(sourceMarker || destMarker) && (
                    <div className="form-group">
                      <button 
                        className="btn-reset-markers" 
                        onClick={() => {
                          setSourceMarker(null);
                          setDestMarker(null);
                          setSource('');
                          setDestination('');
                        }}
                      >
                        Reset Map Markers
                      </button>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Calculated Distance:</label>
                    <input
                      type="text"
                      value={sourceMarker && destMarker 
                        ? `${calculateDistance(sourceMarker[0], sourceMarker[1], destMarker[0], destMarker[1]).toFixed(2)} km`
                        : 'Set both locations to calculate distance'
                      }
                      readOnly={true}
                    />
                  </div>
                  <div className="form-buttons">
                    <button className="btn-save" onClick={handleSaveRoute}>
                      Save Route
                    </button>
                    <button 
                      className="btn-cancel" 
                      onClick={() => {
                        setShowAddRoute(false);
                        setEditingItem(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Source</th>
                          <th>Destination</th>
                          <th>Distance</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routes.map((route) => (
                          <tr 
                            key={route.routeId}
                            className={`${selectedRoute?.routeId === route.routeId ? 'bg-blue-50' : ''}`}
                            onClick={() => handleRouteClick(route)}
                          >
                            <td>{route.routeId}</td>
                            <td>{route.source}</td>
                            <td>{route.destination}</td>
                            <td>{route.distance ? `${parseFloat(route.distance).toFixed(2)} km` : 'N/A'}</td>
                            <td>
                              <button className="btn-edit" onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                handleEditRoute(route);
                              }}>
                                <Edit size={20} />
                              </button>
                              <button className="btn-delete" onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                handleDelete(route.routeId, 'routes');
                              }}>
                                <Trash size={20} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="w-1/2">
                    <div className="map-container" style={{ height: '400px' }}>
                      <MapContainer
                        center={[20.5937, 78.9629]}
                        zoom={5}
                        style={{ height: '100%', width: '100%' }}
                        whenCreated={mapInstance => {
                          mapRef.current = mapInstance;
                        }}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <ViewOnlyMapComponent/>
                        {selectedRoute && selectedRoute.sourceCoords && (
                          <Marker position={selectedRoute.sourceCoords} />
                        )}
                        {selectedRoute && selectedRoute.destCoords && (
                          <Marker position={selectedRoute.destCoords} />
                        )}
                        {selectedRoute && routePath.length > 0 && (
                          <Polyline
                            positions={routePath}
                            color="blue"
                            weight={3}
                          />
                        )}
                      </MapContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transports' && (
            <div className="admin-table-container">
              <div className="header-row">
                <h2>Transport Management</h2>
                <button 
                  className="btn-add-route" 
                  onClick={() => {
                    resetTransportForm();
                    setShowAddTransport(true);
                  }}
                >
                  <PlusCircle size={20} />
                  Add Transport
                </button>
              </div>
              
              {showAddTransport ? (
                <div className="route-form-container">
                  <h3>{editingTransport ? 'Edit Transport' : 'Add New Transport'}</h3>
                  <div className="form-group">
                    <label>Registration Number:</label>
                    <input
                      type="text"
                      value={transportRegistration}
                      onChange={(e) => setTransportRegistration(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Type:</label>
                    <select
                      value={transportType}
                      onChange={(e) => setTransportType(e.target.value)}
                      required
                      >
                      <option value="">Select Type</option>
                      <option value="Bus">Bus</option>
                      <option value="Minivan">Minivan</option>
                      <option value="Car">Car</option>
                      <option value="Truck">Truck</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Capacity:</label>
                    <input
                      type="number"
                      value={transportCapacity}
                      onChange={(e) => setTransportCapacity(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Status:</label>
                    <select
                      value={transportStatus}
                      onChange={(e) => setTransportStatus(e.target.value)}
                      >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div className="form-buttons">
                    <button className="btn-save" onClick={handleSaveTransport}>
                      Save Transport
                    </button>
                    <button 
                      className="btn-cancel" 
                      onClick={() => {
                        setShowAddTransport(false);
                        resetTransportForm();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Registration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transports.map(transport => (
                      <tr key={transport.transportId || transport.transport_id}>
                        <td>{transport.transportId || transport.transport_id || 'N/A'}</td>
                        <td>{transport.vehicleType || 'N/A'}</td>
                        <td>{transport.capacity || 'N/A'}</td>
                        <td>{transport.registrationNumber || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${transport.status ? transport.status.toLowerCase().replace(/\s+/g, '-') : 'unknown'}`}>
                            {transport.status || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <button className="btn-edit" onClick={() => handleEditTransport(transport)}>
                            <Edit size={20} />
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(transport.transportId || transport.transport_id, 'transports')}>
                            <Trash size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-table-container">
              <div className="header-row">
                <h2>User Management</h2>
                <button 
                  className="btn-add-route" 
                  onClick={() => {
                    resetUserForm();
                    setShowAddUser(true);
                  }}
                >
                  <PlusCircle size={20} />
                  Add User
                </button>
              </div>
              
              {showAddUser ? (
                <div className="route-form-container">
                  <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
                  <div className="form-group">
                    <label>Username:</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password:</label>
                    <div className="password-input-container" style={{ position: 'relative' }}>
                      <input
                        type={passwordVisible ? "text" : "password"}
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        required={!editingUser}
                        placeholder={editingUser ? "Leave blank to keep current password" : ""}
                        style={{ width: '100%', paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        aria-label={passwordVisible ? "Hide password" : "Show password"}
                      >
                        {passwordVisible ? (
                          <span role="img" aria-label="Hide">*️⃣</span>
                        ) : (
                          <span role="img" aria-label="Show">👁️‍🗨️</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Role:</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="form-buttons">
                    <button className="btn-save" onClick={handleSaveUser}>
                      Save User
                    </button>
                    <button 
                      className="btn-cancel" 
                      onClick={() => {
                        setShowAddUser(false);
                        resetUserForm();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.userId || user.name}>
                        <td>{user.userId || 'N/A'}</td>
                        <td>{user.name}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td>{user.role || 'USER'}</td>
                        <td>
                          <button className="btn-edit" onClick={() => handleEditUser(user)}>
                            <Edit size={20} />
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(user.userId, 'users')}>
                            <Trash size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

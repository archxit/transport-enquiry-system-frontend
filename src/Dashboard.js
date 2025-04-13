import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './css/Dashboard.css';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const Dashboard = () => {
  const [routes, setRoutes] = useState([]);
  const [transports, setTransports] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [user, setUser] = useState(null);
  const [locations, setLocations] = useState([]);
  const [sourceLocation, setSourceLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [mapCenter] = useState([20.5937, 78.9629]); // Default to center of India
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef(null);
  const navigate = useNavigate();

  // Check authentication and fetch initial data
  useEffect(() => {
    const userInfo = localStorage.getItem('user');
    if (!userInfo) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userInfo));
    
    fetchRoutes();
    fetchTransports();
  }, [navigate]);

    useEffect(() => {
        if (routes.length > 0) {
        const uniqueLocations = new Set();
        routes.forEach(route => {
            uniqueLocations.add(route.source);
            uniqueLocations.add(route.destination);
        });
        setLocations(Array.from(uniqueLocations));
        }
    }, [routes]);
  

  // Removed duplicate declaration of fetchRouteDetails

  // Removed duplicate declaration of fetchRouteDetails

  // Extract unique locations from routes
  useEffect(() => {
    if (routes.length > 0) {
      const uniqueLocations = new Set();
      routes.forEach(route => {
        uniqueLocations.add(route.source);
        uniqueLocations.add(route.destination);
      });
      setLocations(Array.from(uniqueLocations));
    }
  }, [routes]);

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
      const response = await axios.get('http://localhost:8080/transport');
      setTransports(response.data);
    } catch (error) {
      console.error('Error fetching transports:', error);
    }
  };

  const fetchRouteDetails = useCallback(async (routeId) => {
    try {
      // Try to fetch route details from backend
      const response = await axios.get(`http://localhost:8080/routes/${routeId}/details`);
      
      if (response.data && response.data.coordinates) {
        setRouteCoordinates(response.data.coordinates);
        // Center map on route
        if (response.data.coordinates.length > 0) {
          const bounds = L.latLngBounds(response.data.coordinates);
          if (mapRef.current) {
            mapRef.current.fitBounds(bounds);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching route details:', error);
      // Fallback to dummy coordinates if API fails
      setRouteCoordinates(generateDummyCoordinates(sourceLocation, destinationLocation));
    }
  }, [sourceLocation, destinationLocation]);

  // Function to generate dummy coordinates for demo purposes
  const generateDummyCoordinates = (source, destination) => {
    // In a real app, you would get actual coordinates from your backend
    // This is just for demonstration
    const sourceCoord = [20.5937, 78.9629]; // Example coordinates
    const destCoord = [21.1458, 79.0882]; // Example coordinates
    
    // Generate a simple path between source and destination
    const points = [];
    const steps = 5;
    
    for (let i = 0; i <= steps; i++) {
      const lat = sourceCoord[0] + (destCoord[0] - sourceCoord[0]) * (i / steps);
      const lng = sourceCoord[1] + (destCoord[1] - sourceCoord[1]) * (i / steps);
      points.push([lat, lng]);
    }
    
    return points;
  };

  const handleSourceChange = (e) => {
    setSourceLocation(e.target.value);
    filterRoutes(e.target.value, destinationLocation);
  };

  const handleDestinationChange = (e) => {
    setDestinationLocation(e.target.value);
    filterRoutes(sourceLocation, e.target.value);
  };

  const filterRoutes = (source, destination) => {
    if (source && destination) {
      const filtered = routes.filter(
        route => route.source === source && route.destination === destination
      );
      setFilteredRoutes(filtered);
      
      // If we found a matching route, select it
      if (filtered.length > 0) {
        setSelectedRoute(filtered[0]);
      } else {
        setSelectedRoute(null);
        setRouteCoordinates([]);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Function to periodically refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoutes();
      if (selectedRoute) {
        fetchRouteDetails(selectedRoute.route_id);
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedRoute, fetchRouteDetails]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Transport Inquiry System</h1>
        <div className="user-info">
          <span>Welcome, {user?.name || 'User'}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="sidebar">
            <div className="sidebar-section">
                        <h3>Route Finder</h3>
            
            <div className="dropdown-container">
                <label htmlFor="source">From:</label>
                <select 
                id="source" 
                value={sourceLocation} 
                onChange={handleSourceChange}
                className="route-dropdown"
                >
                <option value="">Select source</option>
                {locations.map((location, index) => (
                    <option key={`source-${index}`} value={location}>
                    {location}
                    </option>
                ))}
                </select>
            </div>
            
            <div className="dropdown-container">
                <label htmlFor="destination">To:</label>
                <select 
                id="destination" 
                value={destinationLocation} 
                onChange={handleDestinationChange}
                className="route-dropdown"
                >
                <option value="">Select destination</option>
                {locations.map((location, index) => (
                    <option key={`dest-${index}`} value={location}>
                    {location}
                    </option>
                ))}
                </select>
            </div>
            </div>

          
          <div className="sidebar-section">
            <h3>Available Routes</h3>
            <ul className="list">
              {filteredRoutes.length > 0 ? 
                filteredRoutes.map(route => (
                  <li 
                    key={route.route_id} 
                    className={selectedRoute?.route_id === route.route_id ? 'selected' : ''}
                    onClick={() => setSelectedRoute(route)}
                  >
                    {route.source} to {route.destination}
                  </li>
                )) : 
                routes.map(route => (
                  <li 
                    key={route.route_id} 
                    className={selectedRoute?.route_id === route.route_id ? 'selected' : ''}
                    onClick={() => setSelectedRoute(route)}
                  >
                    {route.source} to {route.destination}
                  </li>
                ))
              }
            </ul>
          </div>
          
          <div className="sidebar-section">
            <h3>Transport</h3>
            <ul className="list">
              {transports.map(transport => (
                <li 
                  key={transport.transport_id} 
                  className={selectedTransport?.transport_id === transport.transport_id ? 'selected' : ''}
                  onClick={() => setSelectedTransport(transport)}
                >
                  {transport.vehicle_type} (Capacity: {transport.capacity})
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="main-content">
            <MapContainer 
                center={mapCenter} 
                zoom={5} 
                style={{ height: '400px', width: '100%' }}
                whenCreated={mapInstance => { mapRef.current = mapInstance; }}
                >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Display filtered routes as polylines */}
                {filteredRoutes.length > 0 ? (
                    filteredRoutes.map((route, index) => (
                    <Polyline 
                        key={`route-${index}`}
                        positions={route.coordinates || generateDummyCoordinates(route.source, route.destination)}
                        color="#e74c3c"
                        weight={5}
                    />
                    ))
                ) : (
                    routeCoordinates.length > 0 && (
                    <Polyline 
                        positions={routeCoordinates}
                        color="#4a90e2"
                        weight={3}
                    />
                    )
                )}
                
                {/* Display markers for source and destination */}
                {(filteredRoutes.length > 0 || routeCoordinates.length > 0) && (
                    <>
                    <Marker position={filteredRoutes.length > 0 ? 
                        filteredRoutes[0].coordinates[0] || generateDummyCoordinates(sourceLocation, destinationLocation)[0] : 
                        routeCoordinates[0]}>
                        <Popup>{sourceLocation || 'Source'}</Popup>
                    </Marker>
                    <Marker position={filteredRoutes.length > 0 ? 
                        filteredRoutes[0].coordinates[filteredRoutes[0].coordinates.length - 1] || 
                        generateDummyCoordinates(sourceLocation, destinationLocation)[1] : 
                        routeCoordinates[routeCoordinates.length - 1]}>
                        <Popup>{destinationLocation || 'Destination'}</Popup>
                    </Marker>
                    </>
                )}
            </MapContainer>


          <div className="details-container">
            {selectedRoute && (
              <div className="details-card">
                <h3>Route Details</h3>
                <table className="details-table">
                  <tbody>
                    <tr>
                      <td>Route ID:</td>
                      <td>{selectedRoute.route_id}</td>
                    </tr>
                    <tr>
                      <td>Source:</td>
                      <td>{selectedRoute.source}</td>
                    </tr>
                    <tr>
                      <td>Destination:</td>
                      <td>{selectedRoute.destination}</td>
                    </tr>
                    <tr>
                      <td>Distance:</td>
                      <td>{selectedRoute.distance || 'Not specified'} km</td>
                    </tr>
                    <tr>
                      <td>Estimated Time:</td>
                      <td>{selectedRoute.estimatedTime || 'Not specified'}</td>
                    </tr>
                    <tr>
                      <td>Status:</td>
                      <td>
                        <span className={`status-indicator ${selectedRoute.status || 'active'}`}>
                          {selectedRoute.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {selectedTransport && (
              <div className="details-card">
                <h3>Transport Details</h3>
                <table className="details-table">
                  <tbody>
                    <tr>
                      <td>Transport ID:</td>
                      <td>{selectedTransport.transport_id}</td>
                    </tr>
                    <tr>
                      <td>Vehicle Type:</td>
                      <td>{selectedTransport.vehicle_type}</td>
                    </tr>
                    <tr>
                      <td>Capacity:</td>
                      <td>{selectedTransport.capacity} passengers</td>
                    </tr>
                    <tr>
                      <td>Status:</td>
                      <td>{selectedTransport.status || 'Active'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {!selectedRoute && !selectedTransport && (
              <div className="welcome-message">
                <h3>Welcome to Transport Inquiry System</h3>
                <p>Select source and destination locations to find available routes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
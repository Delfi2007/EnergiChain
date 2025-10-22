/**
 * Geolocation and Mapping Utilities
 * GPS tracking, route calculation, and map integration
 */

class GeolocationService {
  constructor() {
    this.currentPosition = null;
    this.watchId = null;
    this.trackingCallbacks = [];
  }

  /**
   * Get current position
   */
  getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          resolve(this.currentPosition);
        },
        (error) => {
          reject(this.handleError(error));
        },
        defaultOptions
      );
    });
  }

  /**
   * Watch position changes
   */
  watchPosition(callback, options = {}) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    };

    this.trackingCallbacks.push(callback);

    if (!this.watchId) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };

          this.trackingCallbacks.forEach(cb => {
            try {
              cb(this.currentPosition);
            } catch (error) {
              console.error('Tracking callback error:', error);
            }
          });
        },
        (error) => {
          console.error('Geolocation error:', this.handleError(error));
        },
        defaultOptions
      );
    }

    return this.watchId;
  }

  /**
   * Stop watching position
   */
  stopWatching() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.trackingCallbacks = [];
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Calculate bearing between two points
   */
  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = this.toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.toRadians(lat2));
    const x = Math.cos(this.toRadians(lat1)) * Math.sin(this.toRadians(lat2)) -
              Math.sin(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.cos(dLon);
    
    const bearing = this.toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
  }

  /**
   * Get midpoint between two coordinates
   */
  getMidpoint(lat1, lon1, lat2, lon2) {
    const dLon = this.toRadians(lon2 - lon1);
    
    lat1 = this.toRadians(lat1);
    lat2 = this.toRadians(lat2);
    lon1 = this.toRadians(lon1);
    
    const Bx = Math.cos(lat2) * Math.cos(dLon);
    const By = Math.cos(lat2) * Math.sin(dLon);
    
    const lat3 = Math.atan2(
      Math.sin(lat1) + Math.sin(lat2),
      Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By)
    );
    
    const lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);
    
    return {
      latitude: this.toDegrees(lat3),
      longitude: this.toDegrees(lon3)
    };
  }

  /**
   * Check if point is within radius
   */
  isWithinRadius(centerLat, centerLon, pointLat, pointLon, radiusKm) {
    const distance = this.calculateDistance(centerLat, centerLon, pointLat, pointLon);
    return distance <= radiusKm;
  }

  /**
   * Get destination point from distance and bearing
   */
  getDestinationPoint(lat, lon, distanceKm, bearing) {
    const R = 6371; // Earth's radius in km
    const d = distanceKm / R;
    
    lat = this.toRadians(lat);
    lon = this.toRadians(lon);
    bearing = this.toRadians(bearing);
    
    const lat2 = Math.asin(
      Math.sin(lat) * Math.cos(d) +
      Math.cos(lat) * Math.sin(d) * Math.cos(bearing)
    );
    
    const lon2 = lon + Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(lat),
      Math.cos(d) - Math.sin(lat) * Math.sin(lat2)
    );
    
    return {
      latitude: this.toDegrees(lat2),
      longitude: this.toDegrees(lon2)
    };
  }

  /**
   * Get bounding box for given center and radius
   */
  getBoundingBox(centerLat, centerLon, radiusKm) {
    const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
    const lonDelta = radiusKm / (111.32 * Math.cos(this.toRadians(centerLat)));
    
    return {
      north: centerLat + latDelta,
      south: centerLat - latDelta,
      east: centerLon + lonDelta,
      west: centerLon - lonDelta
    };
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  toDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Handle geolocation errors
   */
  handleError(error) {
    const errors = {
      1: 'Permission denied',
      2: 'Position unavailable',
      3: 'Request timeout'
    };
    return new Error(errors[error.code] || 'Unknown error');
  }

  /**
   * Format coordinates as string
   */
  formatCoordinates(lat, lon, format = 'DD') {
    switch (format) {
      case 'DD': // Decimal Degrees
        return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      
      case 'DMS': // Degrees Minutes Seconds
        return `${this.toDMS(lat, 'lat')}, ${this.toDMS(lon, 'lon')}`;
      
      default:
        return `${lat}, ${lon}`;
    }
  }

  /**
   * Convert decimal to DMS
   */
  toDMS(decimal, type) {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);
    
    const direction = type === 'lat'
      ? (decimal >= 0 ? 'N' : 'S')
      : (decimal >= 0 ? 'E' : 'W');
    
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  }
}

/**
 * Route Optimizer for Delivery
 */
class RouteOptimizer {
  /**
   * Calculate optimal route using nearest neighbor algorithm
   */
  static optimizeRoute(startPoint, destinations) {
    if (destinations.length === 0) return [];
    if (destinations.length === 1) return [destinations[0]];

    const geoService = new GeolocationService();
    const route = [];
    const remaining = [...destinations];
    let currentPoint = startPoint;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const distance = geoService.calculateDistance(
          currentPoint.latitude,
          currentPoint.longitude,
          remaining[i].latitude,
          remaining[i].longitude
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0];
      route.push({
        ...nearest,
        distance: nearestDistance,
        cumulativeDistance: route.length > 0
          ? route[route.length - 1].cumulativeDistance + nearestDistance
          : nearestDistance
      });

      currentPoint = nearest;
    }

    return route;
  }

  /**
   * Calculate total route distance
   */
  static calculateRouteDistance(points) {
    if (points.length < 2) return 0;

    const geoService = new GeolocationService();
    let totalDistance = 0;

    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += geoService.calculateDistance(
        points[i].latitude,
        points[i].longitude,
        points[i + 1].latitude,
        points[i + 1].longitude
      );
    }

    return totalDistance;
  }

  /**
   * Calculate estimated travel time
   */
  static calculateTravelTime(distanceKm, avgSpeedKmh = 40) {
    const hours = distanceKm / avgSpeedKmh;
    const minutes = Math.round(hours * 60);
    return {
      hours: Math.floor(hours),
      minutes: minutes % 60,
      totalMinutes: minutes
    };
  }

  /**
   * Get route summary
   */
  static getRouteSummary(route, startPoint) {
    const totalDistance = this.calculateRouteDistance([startPoint, ...route]);
    const travelTime = this.calculateTravelTime(totalDistance);

    return {
      totalDistance: totalDistance.toFixed(2),
      totalStops: route.length,
      estimatedTime: travelTime,
      waypoints: route.map((point, index) => ({
        order: index + 1,
        ...point
      }))
    };
  }

  /**
   * 2-opt route optimization
   */
  static twoOptOptimize(route, iterations = 100) {
    if (route.length < 4) return route;

    const geoService = new GeolocationService();
    let currentRoute = [...route];
    let bestDistance = this.calculateRouteDistance(currentRoute);

    for (let iter = 0; iter < iterations; iter++) {
      let improved = false;

      for (let i = 1; i < currentRoute.length - 2; i++) {
        for (let j = i + 1; j < currentRoute.length - 1; j++) {
          const newRoute = [...currentRoute];
          
          // Reverse segment between i and j
          let segment = newRoute.slice(i, j + 1);
          segment.reverse();
          newRoute.splice(i, j - i + 1, ...segment);

          const newDistance = this.calculateRouteDistance(newRoute);

          if (newDistance < bestDistance) {
            currentRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }

      if (!improved) break;
    }

    return currentRoute;
  }
}

/**
 * Geocoding Service
 */
class GeocodingService {
  /**
   * Geocode address to coordinates
   */
  static async geocodeAddress(address) {
    // Using Nominatim (OpenStreetMap) API
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  static async reverseGeocode(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      return {
        displayName: data.display_name,
        address: data.address,
        latitude,
        longitude
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  /**
   * Search places
   */
  static async searchPlaces(query, bounds = null) {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10`;

    if (bounds) {
      url += `&viewbox=${bounds.west},${bounds.south},${bounds.east},${bounds.north}&bounded=1`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();

      return data.map(place => ({
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        displayName: place.display_name,
        type: place.type,
        importance: place.importance
      }));
    } catch (error) {
      console.error('Place search error:', error);
      throw error;
    }
  }
}

/**
 * Map Utilities
 */
class MapUtils {
  /**
   * Convert bounds to zoom level
   */
  static boundsToZoom(bounds, mapWidth, mapHeight) {
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 21;

    function latRad(lat) {
      const sin = Math.sin(lat * Math.PI / 180);
      const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    const ne = bounds.north;
    const sw = bounds.south;

    const latFraction = (latRad(ne) - latRad(sw)) / Math.PI;

    const lngDiff = bounds.east - bounds.west;
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    const latZoom = zoom(mapHeight, WORLD_DIM.height, latFraction);
    const lngZoom = zoom(mapWidth, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
  }

  /**
   * Get tile URL for map
   */
  static getTileURL(x, y, z, style = 'osm') {
    const styles = {
      osm: `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
      satellite: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
      terrain: `https://stamen-tiles.a.ssl.fastly.net/terrain/${z}/${x}/${y}.png`
    };

    return styles[style] || styles.osm;
  }

  /**
   * Convert lat/lon to tile coordinates
   */
  static latLonToTile(lat, lon, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    
    return { x, y, zoom };
  }

  /**
   * Convert tile coordinates to lat/lon
   */
  static tileToLatLon(x, y, zoom) {
    const n = Math.pow(2, zoom);
    const lon = x / n * 360 - 180;
    const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    
    return { latitude: lat, longitude: lon };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GeolocationService,
    RouteOptimizer,
    GeocodingService,
    MapUtils
  };
}

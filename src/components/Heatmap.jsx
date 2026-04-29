import { memo, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const Heatmap = memo(({ filteredNews, className = '' }) => {
  const mapRef = useRef(null);
  const heatmapRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const initMap = useCallback(() => {
    if (!apiKey) {
      console.error('Google Maps API key missing. Add VITE_GOOGLE_MAPS_API_KEY to .env');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['visualization']
    });

    loader.load().then(() => {
      const map = new google.maps.Map(mapRef.current, {
        zoom: 4,
        center: { lat: 37.0902, lng: -95.7129 }, // US center
        mapTypeId: 'terrain',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] }
        ]
      });

      // Update heatmap data
      const updateHeatmap = () => {
        if (heatmapRef.current) {
          heatmapRef.current.setMap(null);
        }

        const points = filteredNews
          .filter(news => news.location && news.location.lat && news.location.lng)
          .map(news => ({
            location: new google.maps.LatLng(news.location.lat, news.location.lng),
            weight: Math.max(0, (100 - (news.trustScore || 50)) / 100) // Red for low trust
          }));

        if (points.length > 0) {
          heatmapRef.current = new google.maps.visualization.HeatmapLayer({
            data: points,
            dissipating: true,
            radius: 20,
            opacity: 0.6,
            gradient: [
              'rgba(0, 255, 0, 0)', // green transparent
              'rgba(0, 255, 0, 0.5)', // green
              'rgba(255, 255, 0, 0.5)', // yellow
              'rgba(255, 0, 0, 0.5)' // red
            ]
          });
          heatmapRef.current.setMap(map);
        }
      };

      updateHeatmap();

      // Listen for data changes (external trigger not needed as prop change re-renders)
    }).catch(err => console.error('Google Maps load error:', err));
  }, [filteredNews, apiKey]);

  useEffect(() => {
    initMap();
  }, [initMap]);

  if (!apiKey) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center ${className}`}>
        <p className="text-gray-500">Google Maps API key required for heatmap.</p>
        <p className="text-sm text-gray-400 mt-1">Add to .env: VITE_GOOGLE_MAPS_API_KEY=your_key</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-200 ${className}`} ref={mapRef} />
  );
});

export default Heatmap;

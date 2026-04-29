import { memo, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const Heatmap = memo(({ filteredNews, className = '' }) => {
  const mapRef = useRef(null);
  const heatmapRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
console.log("ENV KEY =", import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['visualization']
    });

    loader.load().then((google) => {
      const map = new google.maps.Map(mapRef.current, {
        zoom: 4,
        center: { lat: 20.5937, lng: 78.9629 }, // India center (better for your app)
        mapTypeId: 'roadmap'
      });

      const updateHeatmap = () => {
        if (heatmapRef.current) {
          heatmapRef.current.setMap(null);
        }

        const points = filteredNews
          .filter(n => n.location?.lat && n.location?.lng)
          .map(n => ({
            location: new google.maps.LatLng(
              n.location.lat,
              n.location.lng
            ),
            weight: Math.max(0, (100 - (n.trustScore || 50)) / 100)
          }));

        if (points.length === 0) return;

        heatmapRef.current = new google.maps.visualization.HeatmapLayer({
          data: points,
          radius: 25,
          opacity: 0.6,
          gradient: [
            'rgba(0, 255, 0, 0)',
            'rgba(0, 255, 0, 0.5)',
            'rgba(255, 255, 0, 0.6)',
            'rgba(255, 0, 0, 0.7)'
          ]
        });

        heatmapRef.current.setMap(map);
      };

      updateHeatmap();
    }).catch(err => {
      console.error('Google Maps load error:', err);
    });

  }, [filteredNews, apiKey]);

  // ✅ SAFE fallback UI
  if (!apiKey) {
    return (
      <div className={`p-6 text-center bg-yellow-50 rounded-xl ${className}`}>
        🌍 Heatmap disabled — Missing Google Maps API key
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`w-full h-96 rounded-2xl shadow-lg border ${className}`}
    />
  );
});

export default Heatmap;
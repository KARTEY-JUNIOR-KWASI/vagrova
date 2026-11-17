'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteMapProps {
  height?: string;
  showLiveTruck?: boolean;
  pickupLabel?: string;
  dropoffLabel?: string;
  liveCoords?: { lat: number; lng: number } | null;
}

// Real route waypoints along N1 George W. Bush Hwy -> Accra-Tema Motorway -> Tema Port
const ROUTE_COORDS: [number, number][] = [
  [5.6148, -0.2389], // George W. Bush Hwy N246 (Lapaz / Achimota)
  [5.6185, -0.2080], // Dzorwulu / Fiesta Royale
  [5.6225, -0.1765], // Tetteh Quarshie Interchange
  [5.6335, -0.1320], // Accra-Tema Motorway West
  [5.6495, -0.0720], // Accra-Tema Motorway Mid
  [5.6615, -0.0240], // Tema Motorway Roundabout
  [5.6312, 0.0042],  // Tema Port, Container Terminal 3
];

export default function RouteMap({
  height = '240px',
  showLiveTruck = false,
  pickupLabel = 'Pickup · ~15 min',
  dropoffLabel = 'Dropoff · 28.5 km',
  liveCoords = null,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    });
    mapRef.current = map;

    // Real OpenStreetMap street tiles (no API key required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Draw Asphalt route polyline
    const routeLine = L.polyline(ROUTE_COORDS, {
      color: '#0D6D78',
      weight: 5,
      opacity: 0.9,
      lineJoin: 'round',
    }).addTo(map);

    // Subtle amber dashed overlay for freight corridor feel
    L.polyline(ROUTE_COORDS, {
      color: '#FFC600',
      weight: 2,
      opacity: 0.85,
      dashArray: '6, 8',
    }).addTo(map);

    // Pickup Marker (Weighbridge Green)
    const pickupIcon = L.divIcon({
      className: '',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
          <div style="background:#2E7D4F;color:#FFFFFF;font-family:'IBM Plex Sans',sans-serif;font-size:11px;font-weight:700;padding:4px 9px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);">
            ${pickupLabel}
          </div>
          <div style="width:14px;height:14px;border-radius:50%;background:#2E7D4F;border:2.5px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.3);margin-top:4px;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    L.marker(ROUTE_COORDS[0], { icon: pickupIcon }).addTo(map);

    // Dropoff Marker (Asphalt + Safety Amber)
    const dropoffIcon = L.divIcon({
      className: '',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
          <div style="background:#0D6D78;color:#FFC600;font-family:'IBM Plex Sans',sans-serif;font-size:11px;font-weight:700;padding:4px 9px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);">
            ${dropoffLabel}
          </div>
          <div style="width:14px;height:14px;border-radius:50%;background:#FFC600;border:2.5px solid #0D6D78;box-shadow:0 2px 6px rgba(0,0,0,0.3);margin-top:4px;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    L.marker(ROUTE_COORDS[ROUTE_COORDS.length - 1], { icon: dropoffIcon }).addTo(map);

    // Fit map cleanly to the Accra -> Tema route
    map.fitBounds(routeLine.getBounds(), { padding: [46, 36] });

    // Optional Live Animated Truck Marker along the motorway
    let interval: ReturnType<typeof setInterval> | null = null;
    if (showLiveTruck) {
      const truckIcon = L.divIcon({
        className: '',
        html: `
          <div style="transform:translate(-50%,-50%);width:32px;height:32px;border-radius:50%;background:#FFC600;border:2.5px solid #0D6D78;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(242,169,0,0.35);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D6D78" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
              <circle cx="17" cy="18" r="2"/>
              <circle cx="7" cy="18" r="2"/>
            </svg>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const truckMarker = L.marker(
        liveCoords ? [liveCoords.lat, liveCoords.lng] : ROUTE_COORDS[2],
        { icon: truckIcon },
      ).addTo(map);
      truckMarkerRef.current = truckMarker;
      let idx = 2;
      let dir = 1;
      if (!liveCoords) {
        interval = setInterval(() => {
          idx += dir;
          if (idx >= ROUTE_COORDS.length - 1 || idx <= 1) {
            dir *= -1;
          }
          truckMarker.setLatLng(ROUTE_COORDS[idx]);
        }, 1800);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      truckMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [showLiveTruck, pickupLabel, dropoffLabel]);

  useEffect(() => {
    if (liveCoords && truckMarkerRef.current) {
      truckMarkerRef.current.setLatLng([liveCoords.lat, liveCoords.lng]);
    }
  }, [liveCoords]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height,
        zIndex: 1,
      }}
    />
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import api from '../api/axios';
import { 
  Truck, Navigation, RefreshCw, Users, ShieldAlert, 
  CheckCircle2, Clock, Phone, MapPin, Package, AlertCircle
} from 'lucide-react';

// ─── MarkerCluster Subcomponent inside MapContainer ──────────────────────────
const MarkerClusterGroup = ({ partners }) => {
  const map = useMap();
  const clusterGroupRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 40,
    });

    const validCoords = [];

    partners.forEach((partner) => {
      if (!partner.currentLocation?.lat || !partner.currentLocation?.lng) return;
      const { lat, lng } = partner.currentLocation;
      validCoords.push([lat, lng]);

      const isAvailable = partner.isAvailable;
      const hasOrder = !!partner.currentOrder;
      const markerColor = isAvailable ? '#10b981' : hasOrder ? '#f59e0b' : '#64748b';

      const icon = L.divIcon({
        className: 'admin-fleet-marker',
        html: `
          <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${markerColor}; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 30px; height: 30px; background: ${markerColor}; border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20],
      });

      const popupHtml = `
        <div style="font-family: sans-serif; padding: 4px; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <strong style="font-size: 13px; color: #0f172a;">${partner.name}</strong>
              ${
                partner.isProfileComplete
                  ? `<span title="Profile Complete" style="display: inline-flex; align-items: center; color: #3b82f6;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                        <path d="m9 12 2 2 4-4" stroke="#ffffff" fill="none" />
                      </svg>
                    </span>`
                  : ''
              }
            </div>
            <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${
              isAvailable ? '#ecfdf5' : '#fffbeb'
            }; color: ${isAvailable ? '#059669' : '#d97706'}; border: 1px solid ${
        isAvailable ? '#a7f3d0' : '#fde68a'
      };">
              ${isAvailable ? 'Available' : 'On Delivery'}
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 3px;">
            <strong>Vehicle:</strong> ${partner.vehicleType}
          </div>
          ${
            partner.phone
              ? `<div style="font-size: 11px; color: #475569; margin-bottom: 3px;"><strong>Phone:</strong> ${partner.phone}</div>`
              : ''
          }
          ${
            hasOrder
              ? `
            <div style="margin-top: 6px; padding: 6px; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 11px;">
              <div style="font-weight: bold; color: #d97706; margin-bottom: 2px;">Active Order #${partner.currentOrder.id.slice(-6).toUpperCase()}</div>
              <div style="color: #64748b;">Status: <strong>${partner.currentOrder.currentStatus}</strong></div>
              <div style="color: #64748b; margin-top: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">Dest: ${partner.currentOrder.pickupAddress}</div>
            </div>
          `
              : `
            <div style="margin-top: 4px; font-size: 10px; color: #94a3b8; font-style: italic;">No active order assigned</div>
          `
          }
          <div style="margin-top: 6px; font-size: 9px; color: #94a3b8;">
            GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon });
      marker.bindPopup(popupHtml);
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    if (validCoords.length > 1) {
      map.fitBounds(L.latLngBounds(validCoords), { padding: [50, 50], maxZoom: 15 });
    } else if (validCoords.length === 1) {
      map.setView(validCoords[0], 14);
    }

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, partners]);

  return null;
};

// ─── Main AdminFleetMap Component ────────────────────────────────────────────
const AdminFleetMap = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastPolled, setLastPolled] = useState(null);

  const fetchFleet = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/partners/live-locations');
      setPartners(res.data || []);
      setLastPolled(new Date());
      setError('');
    } catch (err) {
      console.error('[AdminFleetMap] Polling failed:', err);
      setError(err.response?.data?.message || 'Failed to fetch live partner locations.');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFleet();
    // Poll every 15 seconds as specified
    const interval = setInterval(() => {
      fetchFleet();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const totalPartners = partners.length;
  const activeWithGps = partners.filter(
    (p) => p.currentLocation && typeof p.currentLocation.lat === 'number'
  ).length;
  const availablePartners = partners.filter((p) => p.isAvailable).length;
  const onDeliveryPartners = partners.filter((p) => !!p.currentOrder).length;

  const defaultCenter = [31.3260, 75.5762]; // Jalandhar facility hub default

  return (
    <div className="space-y-4">
      {/* Fleet Stats & Control Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-theme-elevated/40 p-4 rounded-2xl border border-theme">
        <div>
          <h3 className="text-base font-bold text-theme-primary font-poppins flex items-center space-x-2">
            <Truck className="h-5 w-5 text-theme-accent" />
            <span>Delivery Fleet Overview</span>
          </h3>
          <p className="text-xs text-theme-muted mt-0.5">
            Clustered geospatial view of all registered partners with active coordinates. Polling every 15s.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center">
          {lastPolled && (
            <span className="text-[11px] text-theme-muted flex items-center space-x-1 font-mono">
              <Clock className="h-3 w-3" />
              <span>Polled: {lastPolled.toLocaleTimeString()}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchFleet(true)}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-theme-elevated border border-theme text-theme-primary hover:text-theme-accent rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-theme-accent' : ''}`} />
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-theme-elevated/50 p-3 rounded-2xl border border-theme">
          <p className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Total Fleet</p>
          <p className="text-xl font-black text-theme-primary mt-0.5">{totalPartners}</p>
        </div>
        <div className="bg-theme-elevated/50 p-3 rounded-2xl border border-theme">
          <p className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Active GPS Signals</p>
          <p className="text-xl font-black text-theme-accent mt-0.5">{activeWithGps}</p>
        </div>
        <div className="bg-theme-elevated/50 p-3 rounded-2xl border border-theme">
          <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Available</p>
          <p className="text-xl font-black text-emerald-500 mt-0.5">{availablePartners}</p>
        </div>
        <div className="bg-theme-elevated/50 p-3 rounded-2xl border border-theme">
          <p className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">On Delivery</p>
          <p className="text-xl font-black text-amber-500 mt-0.5">{onDeliveryPartners}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-red-500 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full h-[480px] rounded-3xl overflow-hidden border border-theme shadow-theme-md">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={false}
          className="w-full h-full z-10"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MarkerClusterGroup partners={partners} />
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-theme-card/90 backdrop-blur-md border border-theme p-2.5 rounded-2xl shadow-theme-sm text-[11px] flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-white"></span>
            <span className="text-theme-primary font-semibold">Available Partner</span>
          </div>
          <div className="flex items-center space-x-1.5 border-l border-theme pl-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-white"></span>
            <span className="text-theme-primary font-semibold">Active Delivery</span>
          </div>
          <div className="flex items-center space-x-1.5 border-l border-theme pl-3">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block border border-white"></span>
            <span className="text-theme-primary font-semibold">Offline / Standby</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFleetMap;

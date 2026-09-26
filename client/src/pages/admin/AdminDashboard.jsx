import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Shield, Users, ClipboardList, Sparkles, 
  Loader2, Clock, CheckCircle2, AlertCircle, MessageSquare
} from 'lucide-react';
import { STATUS_COLORS } from '../customer/MyOrders';
import { DashboardTableSkeleton } from '../../components/Skeleton';
import AdminFleetMap from '../../components/AdminFleetMap';

const ALL_STATUSES = ['Placed','PickedUp','Washing','Ready','OutForDelivery','Delivered','Cancelled'];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [queue, setQueue] = useState([]);
  const [partners, setPartners] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [newService, setNewService] = useState({ name: '', category: 'Laundry', pricePerUnit: '', unit: 'kg', description: '' });
  const [newPartner, setNewPartner] = useState({ userId: '', vehicleType: 'Bike', lat: '31.3260', lng: '75.5762' });
  const [newSlot, setNewSlot] = useState({ partnerId: '', date: '', startTime: '09:00', endTime: '11:00' });
  
  // Status flags
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [suggestedSlot, setSuggestedSlot] = useState('');

  // Per-row status update: { orderId: { updating, msg, type } }
  const [rowStatus, setRowStatus] = useState({});

  // Support Tickets tab state
  const [tickets, setTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState('All');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketStatusCounts, setTicketStatusCounts] = useState({ All: 0, Pending: 0, 'In Progress': 0, Resolved: 0, Closed: 0 });
  const [ticketNotes, setTicketNotes] = useState({});
  const [ticketActionStatus, setTicketActionStatus] = useState({});

  const fetchTickets = async (filter = ticketFilter) => {
    setTicketLoading(true);
    try {
      const url = filter && filter !== 'All' ? `/support/tickets?status=${encodeURIComponent(filter)}` : '/support/tickets';
      const res = await api.get(url);
      setTickets(res.data.tickets || []);
      if (res.data.statusCounts) {
        setTicketStatusCounts(res.data.statusCounts);
      }
    } catch (err) {
      console.error('[AdminDashboard] Error fetching tickets:', err);
    } finally {
      setTicketLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    setTicketActionStatus((prev) => ({ ...prev, [ticketId]: { updating: true, msg: '', type: '' } }));
    try {
      const note = ticketNotes[ticketId] || '';
      const res = await api.patch(`/support/tickets/${ticketId}/status`, {
        status: newStatus,
        resolutionNotes: note,
      });
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? res.data.ticket : t))
      );
      setTicketActionStatus((prev) => ({
        ...prev,
        [ticketId]: { updating: false, msg: `→ ${newStatus}`, type: 'success' },
      }));
      fetchTickets(ticketFilter);
      setTimeout(() => {
        setTicketActionStatus((prev) => ({ ...prev, [ticketId]: { updating: false, msg: '', type: '' } }));
      }, 3000);
    } catch (err) {
      setTicketActionStatus((prev) => ({
        ...prev,
        [ticketId]: {
          updating: false,
          msg: err.response?.data?.message || 'Update failed',
          type: 'error',
        },
      }));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [queueRes, partnersRes, servicesRes] = await Promise.all([
        api.get('/orders/queue'),
        api.get('/partners'),
        api.get('/services')
      ]);
      setQueue(queueRes.data);
      setPartners(partnersRes.data);
      setServices(servicesRes.data);
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Error fetching administration records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets(ticketFilter);
    }
  }, [activeTab, ticketFilter]);

  const handleCreateService = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    try {
      await api.post('/services', newService);
      setMsg({ text: 'Service registered successfully!', type: 'success' });
      setNewService({ name: '', category: 'Laundry', pricePerUnit: '', unit: 'kg', description: '' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create service.', type: 'error' });
    }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    try {
      await api.post('/partners', {
        userId: newPartner.userId,
        vehicleType: newPartner.vehicleType,
        currentLocation: { lat: parseFloat(newPartner.lat), lng: parseFloat(newPartner.lng) }
      });
      setMsg({ text: 'Partner profile instantiated successfully!', type: 'success' });
      setNewPartner({ userId: '', vehicleType: 'Bike', lat: '31.3260', lng: '75.5762' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to create partner profile.', type: 'error' });
    }
  };

  const handleBookSlot = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    setSuggestedSlot('');
    try {
      await api.post('/slots', newSlot);
      setMsg({ text: 'Time slot booked successfully!', type: 'success' });
    } catch (err) {
      if (err.response?.status === 409) {
        setMsg({ text: 'Slot Conflict! The partner is already booked during this window.', type: 'error' });
        setSuggestedSlot(err.response.data.suggestedStartTime || 'None');
      } else {
        setMsg({ text: err.response?.data?.message || 'Failed to book slot.', type: 'error' });
      }
    }
  };

  // ── Per-row order status change ────────────────────────────────────────
  const handleStatusChange = async (orderId, newStatus) => {
    setRowStatus((prev) => ({ ...prev, [orderId]: { updating: true, msg: '', type: '' } }));
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setQueue((prev) =>
        prev.map((item) =>
          item.order._id === orderId
            ? { ...item, order: { ...item.order, currentStatus: newStatus } }
            : item
        )
      );
      setRowStatus((prev) => ({
        ...prev,
        [orderId]: { updating: false, msg: `→ ${newStatus}`, type: 'success' }
      }));
      setTimeout(() => {
        setRowStatus((prev) => ({ ...prev, [orderId]: { updating: false, msg: '', type: '' } }));
      }, 3000);
    } catch (err) {
      setRowStatus((prev) => ({
        ...prev,
        [orderId]: {
          updating: false,
          msg: err.response?.data?.message || 'Update failed.',
          type: 'error'
        }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 transition-colors duration-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-theme-primary font-poppins flex items-center space-x-2">
          <Shield className="h-8 w-8 text-theme-accent" />
          <span>Admin <span className="text-theme-accent">Dashboard</span></span>
        </h1>
        <p className="text-theme-muted text-sm mt-0.5">Control panel to configure partners, services, priority heap, and time slot intervals.</p>
      </div>

      {/* Notifications */}
      {msg.text && (
        <div className={`p-4 rounded-2xl flex items-center space-x-2 border text-sm max-w-2xl ${
          msg.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
          <div>
            <p className="font-bold">{msg.text}</p>
            {suggestedSlot && (
              <p className="text-xs mt-1 text-red-400">
                Algorithm suggestion for next free slot: <strong className="bg-theme-elevated border border-theme px-1.5 py-0.5 rounded font-mono text-red-500">{suggestedSlot}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Heap Queue', value: queue.length, icon: ClipboardList, color: 'text-theme-accent' },
          { label: 'Registered Partners', value: partners.length, icon: Users, color: 'text-theme-primary' },
          { label: 'Active Services', value: services.length, icon: Sparkles, color: 'text-theme-accent' }
        ].map((card, i) => (
          <div key={i} className="bg-theme-card p-6 rounded-3xl border border-theme shadow-theme-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-theme-muted uppercase font-bold tracking-widest">{card.label}</p>
              <p className="text-3xl font-black text-theme-primary mt-1">{card.value}</p>
            </div>
            <div className="bg-theme-elevated p-4 rounded-2xl border border-theme">
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-theme overflow-x-auto gap-2 no-scrollbar py-1">
        {[
          { id: 'queue', label: 'Order Queue' },
          { id: 'fleet', label: 'Live Fleet Map' },
          { id: 'partners', label: 'Partner Management' },
          { id: 'services', label: 'Services Catalogue' },
          { id: 'slots', label: 'Slot Booking' },
          { id: 'tickets', label: 'Support Tickets' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMsg({ text: '', type: '' }); setSuggestedSlot(''); }}
            className={`pb-3 px-4 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-muted hover:text-theme-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <DashboardTableSkeleton />
      ) : (
        <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-theme-sm">
          {/* Active Queue Tab */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-theme-primary font-poppins">Priority Order Queue</h3>
              {queue.length === 0 ? (
                <p className="text-sm text-theme-muted py-6 text-center">No pending orders in the heap.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm divide-y divide-theme">
                    <thead>
                      <tr className="text-theme-muted text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Order ID</th>
                        <th className="pb-3">Current Status</th>
                        <th className="pb-3 text-center">Priority</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 pl-4">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme font-mono text-xs">
                      {queue.map(({ order, priority }) => {
                        const rs = rowStatus[order._id] || {};
                        return (
                        <tr key={order._id} className="hover:bg-theme-elevated/40 transition-colors">
                          <td className="py-3.5 pl-2 font-mono text-xs font-bold text-theme-primary">{order._id.slice(-8)}</td>
                          <td className="py-3.5 font-sans">
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_COLORS[order.currentStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {order.currentStatus}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              order.isExpress ? 'bg-theme-accent-light text-theme-accent border border-theme-accent' : 'bg-theme-elevated text-theme-muted border border-theme'
                            }`}>{priority}</span>
                          </td>
                          <td className="py-3.5 text-right font-sans font-bold text-theme-primary">₹{order.totalAmount}</td>
                          <td className="py-3.5 pl-4">
                            <div className="flex flex-col gap-1.5 min-w-[160px]">
                              <select
                                disabled={rs.updating}
                                value={order.currentStatus}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                className="text-xs bg-theme-elevated border border-theme rounded-xl px-2.5 py-1.5 text-theme-primary font-semibold focus:outline-none focus:border-theme-accent transition-colors disabled:opacity-60"
                              >
                                {ALL_STATUSES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              {rs.updating && <Loader2 className="h-3.5 w-3.5 animate-spin text-theme-accent" />}
                              {!rs.updating && rs.msg && (
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${
                                  rs.type === 'success' ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  {rs.type === 'success'
                                    ? <CheckCircle2 className="h-3 w-3" />
                                    : <AlertCircle className="h-3 w-3" />
                                  }
                                  {rs.msg}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Live Fleet Overview Map Tab */}
          {activeTab === 'fleet' && (
            <AdminFleetMap />
          )}

          {/* Delivery Partners Tab */}
          {activeTab === 'partners' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Partner List Table */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-theme-primary font-poppins">Delivery Partners</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm divide-y divide-theme">
                    <thead>
                      <tr className="text-theme-muted text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Vehicle</th>
                        <th className="pb-3">Locality</th>
                        <th className="pb-3 text-center">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme text-xs font-sans">
                      {partners.map((pt) => (
                        <tr key={pt._id}>
                          <td className="py-3.5 font-bold text-theme-primary">
                            {pt.user?.name || 'Unassigned'}
                            <span className="block text-[10px] font-mono text-theme-muted font-normal">{pt.user?._id}</span>
                          </td>
                          <td className="py-3.5 text-theme-primary">{pt.vehicleType}</td>
                          <td className="py-3.5 text-theme-muted font-mono text-[10px]">
                            {pt.currentLocation?.lat?.toFixed(4)}, {pt.currentLocation?.lng?.toFixed(4)}
                          </td>
                          <td className="py-3.5 text-center font-bold text-theme-accent">★ {pt.rating || '5.0'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Partner Form */}
              <form onSubmit={handleCreatePartner} className="space-y-4 bg-theme-elevated/40 p-6 rounded-2xl border border-theme h-fit">
                <h3 className="text-sm font-bold text-theme-primary font-poppins">Add Partner Profile</h3>
                <div>
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">User ID</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter User ObjectId"
                    value={newPartner.userId}
                    onChange={(e) => setNewPartner({ ...newPartner, userId: e.target.value })}
                    className="w-full bg-theme-surface border border-theme rounded-xl p-2 text-xs font-mono text-theme-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Vehicle Type</label>
                  <select
                    value={newPartner.vehicleType}
                    onChange={(e) => setNewPartner({ ...newPartner, vehicleType: e.target.value })}
                    className="w-full bg-theme-surface border border-theme rounded-xl p-2 text-xs text-theme-primary"
                  >
                    <option>Bike</option>
                    <option>Scooter</option>
                    <option>Mini-Van</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Lat</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newPartner.lat}
                      onChange={(e) => setNewPartner({ ...newPartner, lat: e.target.value })}
                      className="w-full bg-theme-surface border border-theme rounded-xl p-2 text-xs font-mono text-theme-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Lng</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newPartner.lng}
                      onChange={(e) => setNewPartner({ ...newPartner, lng: e.target.value })}
                      className="w-full bg-theme-surface border border-theme rounded-xl p-2 text-xs font-mono text-theme-primary"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-theme-accent text-[var(--accent-text)] rounded-xl text-xs font-bold theme-btn-hover">
                  Instantiate Profile
                </button>
              </form>
            </div>
          )}

          {/* Services Catalogue Tab */}
          {activeTab === 'services' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Services List Table */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-theme-primary font-poppins">Active Services</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm divide-y divide-theme">
                    <thead>
                      <tr className="text-theme-muted text-xs font-bold uppercase tracking-wider">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3 text-right pr-2">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme text-xs font-sans">
                      {services.map((svc) => (
                        <tr key={svc._id}>
                          <td className="py-3 font-bold text-theme-primary">
                            {svc.name}
                            <span className="block text-[10px] font-normal text-theme-muted">{svc.description}</span>
                          </td>
                          <td className="py-3 capitalize text-theme-primary">{svc.category}</td>
                          <td className="py-3 text-right font-bold text-theme-primary pr-2">₹{svc.pricePerUnit} / {svc.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Service Form */}
              <form onSubmit={handleCreateService} className="space-y-4 bg-theme-elevated/40 p-6 rounded-2xl border border-theme h-fit">
                <h3 className="text-sm font-bold text-theme-primary font-poppins">Add Service</h3>
                <div>
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Service Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silk Dry Clean"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="w-full bg-theme-surface border border-theme rounded-xl p-2 text-xs text-theme-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                    className="w-full bg-theme-surface border border-theme rounded-xl p-2 text-xs text-theme-primary"
                  >
                    <option>Laundry</option>
                    <option>Dry Cleaning</option>
                    <option>Pressing</option>
                    <option>Shoes</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      required
                      value={newService.pricePerUnit}
                      onChange={(e) => setNewService({ ...newService, pricePerUnit: parseInt(e.target.value) || '' })}
                      className="w-full bg-theme-surface border border-theme rounded-xl p-2 text-xs text-theme-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Unit</label>
                    <input
                      type="text"
                      required
                      value={newService.unit}
                      onChange={(e) => setNewService({ ...newService, unit: e.target.value })}
                      className="w-full bg-theme-surface border border-theme rounded-xl p-2 text-xs text-theme-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows="2"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="w-full bg-theme-surface border border-theme rounded-xl p-2 text-xs text-theme-primary"
                    placeholder="Short description of service..."
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-theme-accent text-[var(--accent-text)] rounded-xl text-xs font-bold theme-btn-hover">
                  Register Service
                </button>
              </form>
            </div>
          )}

          {/* Slot Booking Tab */}
          {activeTab === 'slots' && (
            <div className="max-w-xl mx-auto space-y-6">
              <h3 className="text-base font-bold text-theme-primary font-poppins flex items-center space-x-1.5">
                <Clock className="h-5 w-5 text-theme-accent" />
                <span>Interval Slot Allocation</span>
              </h3>
              
              <form onSubmit={handleBookSlot} className="space-y-4 bg-theme-elevated/40 p-6 rounded-3xl border border-theme">
                <div>
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Assign Partner</label>
                  <select
                    required
                    value={newSlot.partnerId}
                    onChange={(e) => setNewSlot({ ...newSlot, partnerId: e.target.value })}
                    className="w-full bg-theme-surface border border-theme rounded-xl p-2.5 text-xs text-theme-primary"
                  >
                    <option value="">Select Partner Profile...</option>
                    {partners.map(pt => (
                      <option key={pt._id} value={pt._id}>{pt.user?.name} ({pt.vehicleType})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Schedule Date</label>
                  <input
                    type="date"
                    required
                    value={newSlot.date}
                    onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                    className="w-full bg-theme-surface border border-theme rounded-xl p-2.5 text-xs text-theme-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Start Time</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 09:00"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                      className="w-full bg-theme-surface border border-theme rounded-xl p-2.5 text-xs font-mono text-theme-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">End Time</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 11:00"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                      className="w-full bg-theme-surface border border-theme rounded-xl p-2.5 text-xs font-mono text-theme-primary"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-theme-accent text-[var(--accent-text)] rounded-2xl text-xs font-bold theme-btn-hover shadow-md">
                  Book Partner Slot
                </button>
              </form>
            </div>
          )}

          {/* Support Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-theme-primary font-poppins flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-theme-accent" />
                    <span>Customer Support Tickets</span>
                  </h3>
                  <p className="text-xs text-theme-muted mt-0.5">
                    Review incoming customer inquiries, manage status transitions, and record resolution notes.
                  </p>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex flex-wrap gap-1.5 bg-theme-elevated p-1 rounded-2xl border border-theme">
                  {['All', 'Pending', 'In Progress', 'Resolved', 'Closed'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setTicketFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        ticketFilter === st
                          ? 'bg-theme-accent text-theme-accent-text shadow-sm'
                          : 'text-theme-muted hover:text-theme-primary'
                      }`}
                    >
                      {st} ({ticketStatusCounts[st] ?? 0})
                    </button>
                  ))}
                </div>
              </div>

              {ticketLoading ? (
                <div className="py-12 flex justify-center items-center space-x-2 text-theme-muted text-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-theme-accent" />
                  <span>Loading support tickets...</span>
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-12 text-center text-theme-muted space-y-2">
                  <MessageSquare className="h-10 w-10 text-theme-muted mx-auto opacity-50" />
                  <p className="text-sm font-semibold">No tickets found in category "{ticketFilter}".</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((t) => {
                    const actionState = ticketActionStatus[t._id] || {};

                    return (
                      <div
                        key={t._id}
                        className="bg-theme-elevated/40 border border-theme rounded-2xl p-5 sm:p-6 space-y-4 hover:border-theme-accent/40 transition-colors"
                      >
                        {/* Top row: Token, date, status */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-theme pb-3">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-sm font-black text-theme-accent bg-theme-accent-light px-2.5 py-1 rounded-lg border border-theme-accent">
                              {t.ticketToken}
                            </span>
                            <span className="text-xs text-theme-muted">
                              {new Date(t.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                                t.status === 'Pending'
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                  : t.status === 'In Progress'
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                  : t.status === 'Resolved'
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                  : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                        </div>

                        {/* Middle row: Submitter, subject, message */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Customer</span>
                            <p className="text-xs font-bold text-theme-primary">{t.name}</p>
                            <a href={`mailto:${t.email}`} className="text-xs text-theme-accent hover:underline block truncate">
                              {t.email}
                            </a>
                            {t.submittedBy && (
                              <span className="inline-block text-[10px] bg-theme-elevated text-theme-muted px-1.5 py-0.5 rounded border border-theme">
                                Registered User
                              </span>
                            )}
                            {t.relatedOrderId && (
                              <div className="pt-1 text-[11px] text-theme-muted font-mono">
                                Order: #{typeof t.relatedOrderId === 'object' ? t.relatedOrderId._id?.slice(-8).toUpperCase() : t.relatedOrderId?.slice(-8).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-3 space-y-2">
                            <h4 className="text-sm font-bold text-theme-primary font-poppins">{t.subject}</h4>
                            <div className="text-xs text-theme-muted leading-relaxed bg-theme-surface border border-theme rounded-xl p-3 whitespace-pre-wrap">
                              {t.message}
                            </div>
                            {t.resolutionNotes && (
                              <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1">
                                <span className="font-bold block text-[10px] uppercase tracking-wider text-emerald-400">Existing Resolution Note:</span>
                                <span>{t.resolutionNotes}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom row: Admin Update Controls */}
                        <div className="border-t border-theme pt-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                          <div className="flex-grow">
                            <input
                              type="text"
                              placeholder="Add resolution / internal notes for customer..."
                              defaultValue={t.resolutionNotes || ''}
                              onChange={(e) => setTicketNotes((prev) => ({ ...prev, [t._id]: e.target.value }))}
                              className="w-full text-xs px-3 py-2 bg-theme-surface border border-theme rounded-xl text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent"
                            />
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <select
                              defaultValue={t.status}
                              id={`status-select-${t._id}`}
                              className="text-xs font-bold px-3 py-2 rounded-xl bg-theme-surface border border-theme text-theme-primary focus:outline-none focus:border-theme-accent"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>

                            <button
                              disabled={actionState.updating}
                              onClick={() => {
                                const selectEl = document.getElementById(`status-select-${t._id}`);
                                if (selectEl) {
                                  handleUpdateTicketStatus(t._id, selectEl.value);
                                }
                              }}
                              className="text-xs font-bold px-4 py-2 bg-theme-accent text-theme-accent-text rounded-xl shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-1.5"
                            >
                              {actionState.updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              <span>Save Status</span>
                            </button>

                            {actionState.msg && (
                              <span className={`text-xs font-bold ${actionState.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {actionState.msg}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { compressImage } from '../../utils/imageCompressor';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import WebcamCaptureModal from '../../components/WebcamCaptureModal';
import { 
  User as UserIcon, Mail, Phone, Truck, MapPin, Lock, 
  Camera, Check, X, Edit3, Trash2, AlertTriangle, 
  Sparkles, Loader2, CheckCircle2, Navigation,
  BadgeCheck, Image as ImageIcon, Video
} from 'lucide-react';

const PartnerProfile = () => {
  const { user: authUser, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Per-section edit modes
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    name: '',
    phone: '',
    vehicleType: 'Bike',
  });
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Base location edit
  const [editingBaseLocation, setEditingBaseLocation] = useState(false);
  const [baseLocationForm, setBaseLocationForm] = useState({
    address: '',
    lat: null,
    lng: null,
  });
  const [savingBaseLocation, setSavingBaseLocation] = useState(false);

  // Photo upload & capture options
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const hasWebcam = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, openUpward: false });
  const photoMenuRef = useRef(null);
  const photoBtnRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Deletion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Calculate smart popover positioning relative to viewport
  const updateMenuPosition = () => {
    if (!photoBtnRef.current) return;
    const rect = photoBtnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = hasWebcam ? 125 : 90;
    const openUpward = spaceBelow < menuHeight + 16 && rect.top > menuHeight + 16;

    const top = openUpward 
      ? Math.max(8, rect.top - menuHeight - 8)
      : Math.min(window.innerHeight - menuHeight - 8, rect.bottom + 8);

    const menuWidth = 192; // 12rem = 192px
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 16) {
      left = window.innerWidth - menuWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }

    setMenuPos({ top, left, openUpward });
  };

  // Close photo popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        photoMenuRef.current &&
        !photoMenuRef.current.contains(e.target) &&
        photoBtnRef.current &&
        !photoBtnRef.current.contains(e.target)
      ) {
        setShowPhotoMenu(false);
      }
    };
    if (showPhotoMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showPhotoMenu]);

  // Keep popover pinned to button on scroll or resize
  useEffect(() => {
    if (!showPhotoMenu) return;
    updateMenuPosition();

    const handleScrollOrResize = () => {
      updateMenuPosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showPhotoMenu]);

  const fetchPartnerProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/partners/profile');
      if (res.data) {
        setPartner(res.data);
        if (updateUser) {
          updateUser({ ...(res.data.user || {}), partner: res.data });
        }
        const u = res.data.user || {};
        setPersonalForm({
          name: u.name || '',
          phone: u.phone || '',
          vehicleType: res.data.vehicleType || 'Bike',
        });
        setBaseLocationForm({
          address: res.data.baseLocation?.address || '',
          lat: res.data.baseLocation?.lat || null,
          lng: res.data.baseLocation?.lng || null,
        });
      }
    } catch (err) {
      console.error('Failed to load partner profile:', err);
      setError('Could not load profile. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerProfile();
  }, []);

  // Completeness indicator
  const calculateCompleteness = () => {
    if (!partner) return 0;
    const u = partner.user || {};
    const checks = [
      Boolean(u.name),
      Boolean(u.email),
      Boolean(u.phone),
      Boolean(partner.profilePhoto || u.profilePhoto),
      Boolean(partner.vehicleType),
      Boolean(partner.baseLocation?.lat && partner.baseLocation?.lng),
    ];
    const total = checks.length;
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / total) * 100);
  };

  // Unified photo processing pipeline (Webcam, Camera capture, and File picker)
  const processAndUploadPhoto = async (file) => {
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setError('');
      const compressedBase64 = await compressImage(file, 400, 400, 0.82);

      const res = await api.put('/partners/profile', {
        profilePhoto: compressedBase64,
      });

      setPartner((prev) => ({
        ...prev,
        profilePhoto: compressedBase64,
        user: { ...prev.user, profilePhoto: compressedBase64 },
      }));

      // Update AuthContext & localStorage cached user
      if (updateUser) {
        updateUser({
          profilePhoto: compressedBase64,
          partner: { ...partner, profilePhoto: compressedBase64 },
        });
      } else {
        const cached = localStorage.getItem('user');
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.profilePhoto = compressedBase64;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      }

      setSuccessMsg('Partner photo updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to upload partner photo:', err);
      setError(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadPhoto(file);
    }
    e.target.value = '';
  };

  // Save personal & vehicle details
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    try {
      setSavingPersonal(true);
      setError('');

      const res = await api.put('/partners/profile', {
        name: personalForm.name,
        phone: personalForm.phone,
        vehicleType: personalForm.vehicleType,
      });

      setPartner(res.data.partner);
      if (updateUser) {
        updateUser({
          name: personalForm.name,
          phone: personalForm.phone,
          vehicleType: personalForm.vehicleType,
          partner: res.data.partner,
        });
      }
      setEditingPersonal(false);

      const cached = localStorage.getItem('user');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.name = personalForm.name;
        parsed.phone = personalForm.phone;
        localStorage.setItem('user', JSON.stringify(parsed));
      }

      setSuccessMsg('Partner details updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update details:', err);
      setError(err.response?.data?.message || 'Failed to update details.');
    } finally {
      setSavingPersonal(false);
    }
  };

  // Save base/home location
  const handleSaveBaseLocation = async (e) => {
    e.preventDefault();
    if (!baseLocationForm.lat || !baseLocationForm.lng) {
      setError('Please select an address from suggestions to capture coordinates.');
      return;
    }

    try {
      setSavingBaseLocation(true);
      setError('');

      const res = await api.put('/partners/profile', {
        baseLocation: baseLocationForm,
      });

      setPartner(res.data.partner);
      if (updateUser) {
        updateUser({
          baseLocation: baseLocationForm,
          partner: res.data.partner,
        });
      }
      setEditingBaseLocation(false);
      setSuccessMsg('Base starting location updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save base location:', err);
      setError(err.response?.data?.message || 'Failed to save base location.');
    } finally {
      setSavingBaseLocation(false);
    }
  };

  // Account deletion
  const handleDeleteAccount = async () => {
    if (!deleteConfirmation.trim()) return;
    try {
      setDeletingAccount(true);
      setError('');
      await api.delete('/partners/profile', {
        data: { confirmation: deleteConfirmation.trim() },
      });
      alert('Your partner account has been deleted. Logging you out now.');
      logout();
      navigate('/');
    } catch (err) {
      console.error('Account deletion error:', err);
      setError(err.response?.data?.message || 'Account deletion failed.');
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-theme-accent mx-auto" />
          <p className="text-sm text-theme-muted font-medium">Loading partner profile...</p>
        </div>
      </div>
    );
  }

  const u = partner?.user || {};
  const completeness = calculateCompleteness();
  const currentPhoto = partner?.profilePhoto || u?.profilePhoto;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Notifications */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-2xl text-sm flex items-center justify-between animate-in fade-in">
          <span>{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:text-red-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-2xl text-sm flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header Partner Hero Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 shadow-theme-sm relative"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Avatar with Upload */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-theme-elevated border-2 border-theme-accent flex items-center justify-center overflow-hidden shadow-inner">
              {currentPhoto ? (
                <img 
                  src={currentPhoto} 
                  alt={u?.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Truck className="w-12 h-12 text-theme-muted" />
              )}
            </div>

            <button 
              ref={photoBtnRef}
              type="button"
              onClick={() => {
                if (!showPhotoMenu) {
                  updateMenuPosition();
                }
                setShowPhotoMenu((prev) => !prev);
              }}
              disabled={uploadingPhoto}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-theme-accent text-[var(--accent-text)] shadow-theme-accent cursor-pointer hover:scale-105 transition-transform disabled:opacity-60"
              title="Change partner photo"
            >
              {uploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>

            {/* Hidden native inputs for Camera capture and File picker */}
            <input 
              ref={cameraInputRef}
              type="file" 
              accept="image/*" 
              capture="user"
              onChange={handlePhotoUpload} 
              className="hidden" 
              disabled={uploadingPhoto}
            />
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
              disabled={uploadingPhoto}
            />

            {/* Photo Selection Popover Menu (Portaled to document.body to prevent parent clipping) */}
            {typeof document !== 'undefined' && createPortal(
              <AnimatePresence>
                {showPhotoMenu && (
                  <motion.div
                    ref={photoMenuRef}
                    initial={{ opacity: 0, scale: 0.92, y: menuPos.openUpward ? 6 : -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: menuPos.openUpward ? 6 : -6 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'fixed',
                      top: `${menuPos.top}px`,
                      left: `${menuPos.left}px`,
                    }}
                    className="w-48 bg-theme-card border border-theme rounded-2xl shadow-2xl p-1.5 z-[9999] space-y-1 backdrop-blur-md"
                  >
                    {hasWebcam && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowPhotoMenu(false);
                          setShowWebcamModal(true);
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-theme-primary hover:bg-theme-elevated transition-colors text-left"
                      >
                        <Video className="w-4 h-4 text-theme-accent shrink-0" />
                        <span>Use Webcam</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhotoMenu(false);
                        cameraInputRef.current?.click();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-theme-primary hover:bg-theme-elevated transition-colors text-left"
                    >
                      <Camera className="w-4 h-4 text-theme-accent shrink-0" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhotoMenu(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-theme-primary hover:bg-theme-elevated transition-colors text-left"
                    >
                      <ImageIcon className="w-4 h-4 text-theme-muted shrink-0" />
                      <span>Choose from Files</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}

            {/* Webcam Live Capture Modal */}
            <WebcamCaptureModal
              isOpen={showWebcamModal}
              onClose={() => setShowWebcamModal(false)}
              onCapture={(file) => processAndUploadPhoto(file)}
            />
          </div>

          {/* Details & Completeness */}
          <div className="flex-grow min-w-0 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0 flex flex-col items-center sm:items-start">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap max-w-full">
                  <h1 
                    className="text-2xl font-black text-theme-primary font-poppins truncate max-w-[200px] xs:max-w-[260px] sm:max-w-[340px] md:max-w-[400px]"
                    title={u?.name}
                  >
                    {u?.name}
                  </h1>
                  {completeness === 100 && (
                    <span title="Profile Complete" className="inline-flex items-center text-blue-500 shrink-0">
                      <BadgeCheck className="w-6 h-6 fill-blue-500 text-white" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-theme-muted truncate max-w-full">{u?.email}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 self-center sm:self-auto shrink-0">
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-theme-accent-light text-theme-accent border border-theme-accent shrink-0">
                  <Truck className="h-3 w-3" />
                  <span>Delivery Partner</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-theme-elevated text-theme-primary border border-theme shrink-0">
                  {partner?.vehicleType || 'Bike'}
                </span>
              </div>
            </div>

            {/* Profile Completeness */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-theme-primary flex items-center space-x-1">
                  <Sparkles className="h-3.5 w-3.5 text-theme-accent" />
                  <span>Partner Readiness: {completeness}%</span>
                </span>
                <span className="text-theme-muted text-[11px]">
                  {completeness === 100 ? 'Ready for Dispatch 🚀' : 'Set base location & details to reach 100%'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-theme-elevated overflow-hidden border border-theme">
                <div 
                  className="h-full bg-gradient-to-r from-theme-accent to-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 1: Partner Details & Vehicle */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-7 shadow-theme-sm space-y-5"
      >
        <div className="flex items-center justify-between border-b border-theme pb-4">
          <div className="flex items-center space-x-2.5">
            <UserIcon className="h-5 w-5 text-theme-accent" />
            <h2 className="text-lg font-bold text-theme-primary font-poppins">Driver &amp; Vehicle Info</h2>
          </div>
          {!editingPersonal ? (
            <button
              onClick={() => setEditingPersonal(true)}
              className="flex items-center space-x-1 text-xs font-bold text-theme-accent bg-theme-accent-light px-3 py-1.5 rounded-xl border border-theme-accent hover:opacity-90"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingPersonal(false);
                setPersonalForm({
                  name: u?.name || '',
                  phone: u?.phone || '',
                  vehicleType: partner?.vehicleType || 'Bike',
                });
              }}
              className="flex items-center space-x-1 text-xs font-bold text-theme-muted hover:text-theme-primary"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {editingPersonal ? (
          <form onSubmit={handleSavePersonal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  value={personalForm.name}
                  onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />
              </div>

              {/* Locked Email */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Email Address</label>
                  <span className="flex items-center space-x-1 text-[10px] text-theme-muted bg-theme-elevated px-1.5 py-0.5 rounded border border-theme" title="Email is locked">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Locked</span>
                  </span>
                </div>
                <input
                  type="email"
                  disabled
                  value={u?.email || ''}
                  className="w-full px-4 py-2.5 bg-theme-elevated/50 border border-theme/60 rounded-2xl text-theme-muted text-sm cursor-not-allowed opacity-75"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-1">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-1">Vehicle Type</label>
                <select
                  value={personalForm.vehicleType}
                  onChange={(e) => setPersonalForm({ ...personalForm, vehicleType: e.target.value })}
                  className="w-full px-4 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                >
                  <option value="Bike">Motorcycle / Bike</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Van">Delivery Van</option>
                  <option value="EV-Bike">Electric Scooter / EV</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPersonal}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-theme-accent text-[var(--accent-text)] text-sm font-bold shadow-theme-accent hover:opacity-90 disabled:opacity-50"
              >
                {savingPersonal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-theme-elevated p-3.5 rounded-2xl border border-theme min-w-0">
              <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">Driver Name</span>
              <p className="text-theme-primary font-semibold mt-0.5 truncate" title={u?.name}>{u?.name}</p>
            </div>

            <div className="bg-theme-elevated p-3.5 rounded-2xl border border-theme">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">Email Address</span>
                <span className="flex items-center space-x-1 text-[10px] text-theme-muted">
                  <Lock className="h-3 w-3" />
                  <span>Read-only</span>
                </span>
              </div>
              <p className="text-theme-primary font-semibold mt-0.5">{u?.email}</p>
            </div>

            <div className="bg-theme-elevated p-3.5 rounded-2xl border border-theme">
              <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">Contact Phone</span>
              <p className="text-theme-primary font-semibold mt-0.5">{u?.phone || 'Not set'}</p>
            </div>

            <div className="bg-theme-elevated p-3.5 rounded-2xl border border-theme">
              <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">Vehicle Type</span>
              <p className="text-theme-primary font-semibold mt-0.5">{partner?.vehicleType || 'Bike'}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Section 2: Base / Home Location */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-7 shadow-theme-sm space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
          <div className="flex items-start sm:items-center space-x-2.5 min-w-0 flex-1">
            <Navigation className="h-5 w-5 text-theme-accent shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-theme-primary font-poppins">Base Starting Location</h2>
              <p className="text-xs text-theme-muted break-words">
                Pre-fills your position on login for the Admin Fleet View prior to active GPS broadcast
              </p>
            </div>
          </div>
          {!editingBaseLocation ? (
            <button
              onClick={() => setEditingBaseLocation(true)}
              className="flex items-center justify-center space-x-1 text-xs font-bold text-theme-accent bg-theme-accent-light px-3.5 py-1.5 rounded-xl border border-theme-accent hover:opacity-90 shrink-0 self-start sm:self-auto min-w-[84px]"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Change</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingBaseLocation(false);
                setBaseLocationForm({
                  address: partner?.baseLocation?.address || '',
                  lat: partner?.baseLocation?.lat || null,
                  lng: partner?.baseLocation?.lng || null,
                });
              }}
              className="flex items-center justify-center space-x-1 text-xs font-bold text-theme-muted hover:text-theme-primary shrink-0 self-start sm:self-auto min-w-[72px]"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {editingBaseLocation ? (
          <form onSubmit={handleSaveBaseLocation} className="space-y-4">
            <AddressAutocomplete
              label="Search & Set Base Location"
              required
              placeholder="Search your starting depot or home address..."
              value={baseLocationForm.address}
              selectedCoords={baseLocationForm.lat ? { lat: baseLocationForm.lat, lng: baseLocationForm.lng } : null}
              onChange={(text) => {
                setBaseLocationForm({
                  address: text,
                  lat: null,
                  lng: null,
                });
              }}
              onSelect={(suggestion) => {
                if (suggestion) {
                  setBaseLocationForm({
                    address: suggestion.displayName,
                    lat: suggestion.lat,
                    lng: suggestion.lng,
                  });
                }
              }}
              helperText="&bull; Selecting a verified location ensures the fleet dispatcher knows your home hub accurately."
            />

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingBaseLocation || !baseLocationForm.lat}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-theme-accent text-[var(--accent-text)] text-sm font-bold shadow-theme-accent hover:opacity-90 disabled:opacity-50"
              >
                {savingBaseLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>Save Base Location</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-theme-elevated p-4 rounded-2xl border border-theme space-y-2">
            {partner?.baseLocation?.address ? (
              <>
                <div className="flex items-center space-x-2 text-xs font-bold text-theme-accent">
                  <MapPin className="h-4 w-4" />
                  <span>Configured Starting Point</span>
                </div>
                <p className="text-sm font-medium text-theme-primary leading-relaxed">
                  {partner.baseLocation.address}
                </p>
                <p className="text-[11px] text-theme-muted font-mono">
                  Coordinates: {partner.baseLocation.lat?.toFixed(4)}, {partner.baseLocation.lng?.toFixed(4)}
                </p>
              </>
            ) : (
              <div className="text-center py-4 space-y-1 text-theme-muted">
                <MapPin className="h-6 w-6 mx-auto text-theme-muted/60" />
                <p className="text-xs font-semibold text-theme-primary">No base location configured yet</p>
                <p className="text-[11px]">Click "Change" to set your starting dispatch hub.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Section 3: Danger Zone */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-red-500/5 border border-red-500/30 rounded-3xl p-6 sm:p-7 shadow-theme-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-red-500 font-poppins">Account Actions</h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <p className="text-sm font-semibold text-theme-primary">Delete Partner Account</p>
            <p className="text-xs text-theme-muted max-w-md">
              Permanently removes your driver profile, vehicle registration, and unlinks you from all active dispatch queues.
            </p>
          </div>
          <button
            onClick={() => {
              setDeleteConfirmation('');
              setShowDeleteModal(true);
            }}
            className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </motion.div>

      {/* Account Deletion Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-theme-card border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/30">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-theme-primary font-poppins">Delete Partner Account?</h3>
                <p className="text-xs text-theme-muted leading-relaxed">
                  This action is <strong className="text-red-500">irreversible</strong>. You will be removed from the delivery fleet and unassigned from future orders.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-theme-primary">
                  Type <span className="font-mono text-red-500">DELETE</span> or your email to confirm:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-theme-elevated border border-theme rounded-xl text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-theme-elevated text-theme-primary border border-theme hover:bg-theme-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={
                    deletingAccount || 
                    (deleteConfirmation.trim() !== 'DELETE' && deleteConfirmation.trim() !== u?.email)
                  }
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1.5"
                >
                  {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerProfile;

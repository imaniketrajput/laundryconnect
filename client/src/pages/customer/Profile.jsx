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
  User as UserIcon, Mail, Phone, Calendar, MapPin, Lock, 
  Camera, Check, X, Edit3, Trash2, Plus, Star, AlertTriangle, 
  Sparkles, Loader2, ShieldCheck, HeartHandshake, CheckCircle2,
  BadgeCheck, Image as ImageIcon, Video
} from 'lucide-react';

const Profile = () => {
  const { user: authUser, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Per-section edit modes
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
  });
  const [savingPersonal, setSavingPersonal] = useState(false);

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

  // Address management
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullAddress: '',
    lat: null,
    lng: null,
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Account deletion modal
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

  // Fetch full profile from backend
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/profile');
      if (res.data?.user) {
        setProfile(res.data.user);
        if (updateUser) updateUser(res.data.user);
        setPersonalForm({
          name: res.data.user.name || '',
          phone: res.data.user.phone || '',
          dateOfBirth: res.data.user.dateOfBirth || '',
          gender: res.data.user.gender || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError('Could not load profile. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Compute profile completeness percentage
  const calculateCompleteness = () => {
    if (!profile) return 0;
    const checks = [
      Boolean(profile.name),
      Boolean(profile.email),
      Boolean(profile.phone),
      Boolean(profile.profilePhoto),
      Boolean(profile.savedAddresses && profile.savedAddresses.length > 0),
      Boolean(profile.dateOfBirth || profile.gender),
    ];
    const totalChecks = checks.length;
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / totalChecks) * 100);
  };

  // Unified photo processing pipeline (Webcam, Camera capture, and File picker)
  const processAndUploadPhoto = async (file) => {
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setError('');
      // Client-side canvas compression (max 400x400, ~50-90KB base64)
      const compressedBase64 = await compressImage(file, 400, 400, 0.82);
      
      const res = await api.post('/users/profile/photo', { photo: compressedBase64 });
      setProfile((prev) => ({ ...prev, profilePhoto: res.data.profilePhoto }));
      
      // Update AuthContext & localStorage cached user
      if (updateUser) {
        updateUser({ profilePhoto: res.data.profilePhoto });
      } else {
        const cached = localStorage.getItem('user');
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.profilePhoto = res.data.profilePhoto;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      }

      setSuccessMsg('Profile photo updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Photo upload failed:', err);
      setError(err.message || 'Failed to update photo.');
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

  // Save personal info
  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    try {
      setSavingPersonal(true);
      setError('');
      const res = await api.put('/users/profile', personalForm);
      setProfile(res.data.user);
      if (updateUser) updateUser(res.data.user);
      setEditingPersonalInfo(false);

      // Update cached user in localStorage
      const cached = localStorage.getItem('user');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.name = res.data.user.name;
        parsed.phone = res.data.user.phone;
        localStorage.setItem('user', JSON.stringify(parsed));
      }

      setSuccessMsg('Personal details saved!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save personal info:', err);
      setError(err.response?.data?.message || 'Failed to update personal details.');
    } finally {
      setSavingPersonal(false);
    }
  };

  // Open modal to add new address
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: 'Home',
      fullAddress: '',
      lat: null,
      lng: null,
      isDefault: (profile?.savedAddresses?.length || 0) === 0,
    });
    setShowAddressModal(true);
  };

  // Open modal to edit existing address
  const handleOpenEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      label: addr.label || 'Home',
      fullAddress: addr.fullAddress,
      lat: addr.lat,
      lng: addr.lng,
      isDefault: addr.isDefault,
    });
    setShowAddressModal(true);
  };

  // Save address (add or edit)
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.fullAddress || !addressForm.lat || !addressForm.lng) {
      setError('Please select a verified address from the suggestion dropdown.');
      return;
    }

    try {
      setSavingAddress(true);
      setError('');

      const action = editingAddressId ? 'edit' : 'add';
      const payload = {
        action,
        addressId: editingAddressId,
        address: addressForm,
      };

      const res = await api.put('/users/profile/address', payload);
      setProfile((prev) => ({ ...prev, savedAddresses: res.data.savedAddresses }));
      if (updateUser) updateUser({ savedAddresses: res.data.savedAddresses });
      setShowAddressModal(false);
      setSuccessMsg(editingAddressId ? 'Address updated!' : 'Address added!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save address:', err);
      setError(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to remove this saved address?')) return;
    try {
      const res = await api.put('/users/profile/address', {
        action: 'delete',
        addressId,
      });
      setProfile((prev) => ({ ...prev, savedAddresses: res.data.savedAddresses }));
      if (updateUser) updateUser({ savedAddresses: res.data.savedAddresses });
      setSuccessMsg('Address removed.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to delete address:', err);
      setError('Failed to remove address.');
    }
  };

  // Set default address
  const handleSetDefaultAddress = async (addressId) => {
    try {
      const res = await api.put('/users/profile/address', {
        action: 'setDefault',
        addressId,
      });
      setProfile((prev) => ({ ...prev, savedAddresses: res.data.savedAddresses }));
      if (updateUser) updateUser({ savedAddresses: res.data.savedAddresses });
      setSuccessMsg('Default address updated.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to set default address:', err);
      setError('Failed to set default address.');
    }
  };

  // Account deletion
  const handleDeleteAccount = async () => {
    if (!deleteConfirmation.trim()) return;
    try {
      setDeletingAccount(true);
      setError('');
      await api.delete('/users/profile', {
        data: { confirmation: deleteConfirmation.trim() },
      });
      alert('Your account has been deleted. Logging you out now.');
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
          <p className="text-sm text-theme-muted font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const completeness = calculateCompleteness();

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

      {/* Header Profile Hero Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 shadow-theme-sm relative"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Avatar with Upload Badge */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-theme-elevated border-2 border-theme-accent flex items-center justify-center overflow-hidden shadow-inner">
              {profile?.profilePhoto ? (
                <img 
                  src={profile.profilePhoto} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-theme-muted" />
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
              title="Change profile photo"
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

          {/* User Details & Completeness */}
          <div className="flex-grow text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <h1 className="text-2xl font-black text-theme-primary font-poppins">{profile?.name}</h1>
                  {completeness === 100 && (
                    <span title="Profile Complete" className="inline-flex items-center text-blue-500 shrink-0">
                      <BadgeCheck className="w-6 h-6 fill-blue-500 text-white" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-theme-muted">{profile?.email}</p>
              </div>
              <span className="mt-2 sm:mt-0 self-center sm:self-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-theme-accent-light text-theme-accent border border-theme-accent">
                Customer Account
              </span>
            </div>

            {/* Profile Completeness Bar */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-theme-primary flex items-center space-x-1">
                  <Sparkles className="h-3.5 w-3.5 text-theme-accent" />
                  <span>Profile Strength: {completeness}%</span>
                </span>
                <span className="text-theme-muted text-[11px]">
                  {completeness === 100 ? 'All Set! 🎉' : 'Add details to reach 100%'}
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

      {/* Section 1: Personal Details */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-7 shadow-theme-sm space-y-5"
      >
        <div className="flex items-center justify-between border-b border-theme pb-4">
          <div className="flex items-center space-x-2.5">
            <UserIcon className="h-5 w-5 text-theme-accent" />
            <h2 className="text-lg font-bold text-theme-primary font-poppins">Personal Information</h2>
          </div>
          {!editingPersonalInfo ? (
            <button
              onClick={() => setEditingPersonalInfo(true)}
              className="flex items-center space-x-1 text-xs font-bold text-theme-accent bg-theme-accent-light px-3 py-1.5 rounded-xl border border-theme-accent hover:opacity-90 transition-opacity"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingPersonalInfo(false);
                setPersonalForm({
                  name: profile?.name || '',
                  phone: profile?.phone || '',
                  dateOfBirth: profile?.dateOfBirth || '',
                  gender: profile?.gender || '',
                });
              }}
              className="flex items-center space-x-1 text-xs font-bold text-theme-muted hover:text-theme-primary transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {editingPersonalInfo ? (
          <form onSubmit={handleSavePersonalInfo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={personalForm.name}
                  onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />
              </div>

              {/* Locked Email Notice */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Email Address</label>
                  <span className="flex items-center space-x-1 text-[10px] text-theme-muted bg-theme-elevated px-1.5 py-0.5 rounded border border-theme" title="Email address cannot be changed for account security">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Locked</span>
                  </span>
                </div>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full px-4 py-2.5 bg-theme-elevated/50 border border-theme/60 rounded-2xl text-theme-muted text-sm cursor-not-allowed opacity-75"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={personalForm.dateOfBirth}
                  onChange={(e) => setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-1">Gender</label>
                <select
                  value={personalForm.gender}
                  onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })}
                  className="w-full px-4 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPersonal}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-theme-accent text-[var(--accent-text)] text-sm font-bold shadow-theme-accent hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {savingPersonal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-theme-elevated p-3.5 rounded-2xl border border-theme">
              <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">Full Name</span>
              <p className="text-theme-primary font-semibold mt-0.5">{profile?.name || 'Not provided'}</p>
            </div>

            <div className="bg-theme-elevated p-3.5 rounded-2xl border border-theme relative">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">Email Address</span>
                <span className="flex items-center space-x-1 text-[10px] text-theme-muted" title="Email is permanently locked for account integrity">
                  <Lock className="h-3 w-3" />
                  <span>Read-only</span>
                </span>
              </div>
              <p className="text-theme-primary font-semibold mt-0.5">{profile?.email}</p>
            </div>

            <div className="bg-theme-elevated p-3.5 rounded-2xl border border-theme">
              <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">Phone Number</span>
              <p className="text-theme-primary font-semibold mt-0.5">{profile?.phone || 'Not provided'}</p>
            </div>

            <div className="bg-theme-elevated p-3.5 rounded-2xl border border-theme">
              <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">Date of Birth &amp; Gender</span>
              <p className="text-theme-primary font-semibold mt-0.5">
                {profile?.dateOfBirth || '—'} {profile?.gender ? `(${profile.gender})` : ''}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Section 2: Saved Delivery Addresses */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-7 shadow-theme-sm space-y-5"
      >
        <div className="flex items-center justify-between border-b border-theme pb-4">
          <div className="flex items-center space-x-2.5">
            <MapPin className="h-5 w-5 text-theme-accent" />
            <div>
              <h2 className="text-lg font-bold text-theme-primary font-poppins">Saved Delivery Addresses</h2>
              <p className="text-xs text-theme-muted">Pre-filled automatically on Schedule Pickup to skip re-entry</p>
            </div>
          </div>
          <button
            onClick={handleOpenAddAddress}
            className="flex items-center space-x-1.5 text-xs font-bold bg-theme-accent text-[var(--accent-text)] px-3.5 py-2 rounded-xl shadow-theme-accent hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            <span>Add Address</span>
          </button>
        </div>

        {/* Saved Addresses List */}
        {!profile?.savedAddresses || profile.savedAddresses.length === 0 ? (
          <div className="text-center py-8 bg-theme-elevated rounded-2xl border border-dashed border-theme space-y-2">
            <MapPin className="h-8 w-8 text-theme-muted mx-auto" />
            <p className="text-sm font-semibold text-theme-primary">No saved addresses yet</p>
            <p className="text-xs text-theme-muted max-w-sm mx-auto">
              Save your home or office address once. It will auto-fill on checkout with verified GPS coordinates!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.savedAddresses.map((addr) => (
              <div 
                key={addr._id}
                className={`p-4 rounded-2xl border transition-all relative ${
                  addr.isDefault 
                    ? 'bg-theme-elevated border-theme-accent shadow-sm' 
                    : 'bg-theme-elevated/70 border-theme hover:border-theme-muted'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-theme-accent-light text-theme-accent border border-theme-accent">
                      {addr.label || 'Home'}
                    </span>
                    {addr.isDefault && (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                        <Check className="h-3 w-3" />
                        <span>Default</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditAddress(addr)}
                      className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface transition-colors"
                      title="Edit address"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr._id)}
                      className="p-1.5 rounded-lg text-theme-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-theme-primary mt-2 font-medium leading-relaxed">
                  {addr.fullAddress}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-theme/60 text-[11px] text-theme-muted">
                  <span>GPS: {addr.lat?.toFixed(4)}, {addr.lng?.toFixed(4)}</span>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefaultAddress(addr._id)}
                      className="text-theme-accent hover:underline font-semibold"
                    >
                      Make Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Section 3: Danger Zone (Account Deletion) */}
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
            <p className="text-sm font-semibold text-theme-primary">Delete My Account</p>
            <p className="text-xs text-theme-muted max-w-md">
              Permanently scrubs your personal info and deactivates your profile. Past invoice and order records remain safely archived for accounting compliance.
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

      {/* Address Add/Edit Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-theme-card border border-theme rounded-3xl p-6 max-w-lg w-full shadow-theme-lg space-y-5"
            >
              <div className="flex items-center justify-between border-b border-theme pb-3">
                <h3 className="text-lg font-bold text-theme-primary font-poppins">
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </h3>
                <button 
                  onClick={() => setShowAddressModal(false)}
                  className="p-1 rounded-lg text-theme-muted hover:text-theme-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-1.5">
                    Address Label
                  </label>
                  <div className="flex space-x-2">
                    {['Home', 'Work', 'Other'].map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          addressForm.label === lbl
                            ? 'bg-theme-accent text-[var(--accent-text)]'
                            : 'bg-theme-elevated text-theme-muted hover:text-theme-primary border border-theme'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reusable Address Autocomplete with Nominatim */}
                <AddressAutocomplete
                  label="Search & Verify Address"
                  required
                  placeholder="Start typing street address, apartment, or locality..."
                  value={addressForm.fullAddress}
                  selectedCoords={addressForm.lat ? { lat: addressForm.lat, lng: addressForm.lng } : null}
                  onChange={(text) => {
                    setAddressForm({
                      ...addressForm,
                      fullAddress: text,
                      lat: null,
                      lng: null,
                    });
                  }}
                  onSelect={(suggestion) => {
                    if (suggestion) {
                      setAddressForm({
                        ...addressForm,
                        fullAddress: suggestion.displayName,
                        lat: suggestion.lat,
                        lng: suggestion.lng,
                      });
                    }
                  }}
                  helperText="&bull; Selecting a verified address ensures accurate distance calculation."
                />

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefaultAddr"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 text-theme-accent border-theme rounded"
                  />
                  <label htmlFor="isDefaultAddr" className="text-xs font-semibold text-theme-primary cursor-pointer">
                    Set as my default pickup address
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-theme">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress || !addressForm.lat}
                    className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-theme-accent text-[var(--accent-text)] text-xs font-bold shadow-theme-accent hover:opacity-90 disabled:opacity-50"
                  >
                    {savingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    <span>Save Address</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Deletion Confirmation Modal */}
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
                <h3 className="text-lg font-black text-theme-primary font-poppins">Delete Account Permanently?</h3>
                <p className="text-xs text-theme-muted leading-relaxed">
                  This action is <strong className="text-red-500">irreversible</strong>. You will be immediately signed out and your personal profile will be deleted.
                </p>
              </div>

              <div className="bg-theme-elevated p-3 rounded-2xl border border-theme text-xs text-theme-muted space-y-1">
                <p className="font-semibold text-theme-primary">&bull; Preserved for Audit Integrity:</p>
                <p>Past financial receipts and orders are anonymized to protect business accounting records.</p>
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
                    (deleteConfirmation.trim() !== 'DELETE' && deleteConfirmation.trim() !== profile?.email)
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

export default Profile;

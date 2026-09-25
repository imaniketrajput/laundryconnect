import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, Check, X, AlertTriangle, Loader2, Video } from 'lucide-react';

const WebcamCaptureModal = ({ isOpen, onClose, onCapture, title = 'Take Photo with Webcam' }) => {
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Helper to stop all active video tracks and turn off webcam indicator
  const stopTracks = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('Error stopping camera track:', e);
      }
      streamRef.current = null;
    }
    setStream(null);
  };

  // Start webcam stream
  const startCamera = async () => {
    setError('');
    setLoading(true);
    setCapturedDataUrl(null);
    stopTracks();

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Webcam capture is not supported in this browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 640 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      setLoading(false);
    } catch (err) {
      console.warn('getUserMedia error:', err);
      let msg = 'Unable to access camera. Please check your browser permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings to use this feature.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this machine.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application or browser tab.';
      }
      setError(msg);
      setLoading(false);
    }
  };

  // Start on modal open, ensure cleanup on close or unmount
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopTracks();
      setCapturedDataUrl(null);
      setError('');
    }

    return () => {
      stopTracks();
    };
  }, [isOpen]);

  // Keep video element synced with stream ref when rendering
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Capture still frame onto canvas
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 640;

    // Use square aspect ratio crop centered on video
    const size = Math.min(width, height);
    const startX = (width - size) / 2;
    const startY = (height - size) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Mirror horizontally so the saved photo matches the mirrored preview
    ctx.translate(size, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedDataUrl(dataUrl);
  };

  // Retake photo: discard captured frame and continue streaming
  const handleRetake = () => {
    setCapturedDataUrl(null);
  };

  // Confirm photo: convert data URL to File and pass to onCapture
  const handleConfirm = async () => {
    if (!capturedDataUrl) return;

    try {
      const res = await fetch(capturedDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopTracks();
      onClose();
      onCapture(file);
    } catch (err) {
      console.error('Failed to convert webcam capture to file:', err);
      setError('Failed to process captured image.');
    }
  };

  const handleClose = () => {
    stopTracks();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-theme-card border border-theme rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative max-h-[92dvh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-theme shrink-0">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-theme-accent-light text-theme-accent">
                <Video className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-theme-primary font-poppins">{title}</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-elevated transition-colors"
              title="Close webcam"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Viewfinder Area */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-theme flex items-center justify-center shadow-inner">
              {loading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-theme-card/90 space-y-3 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
                  <p className="text-xs font-semibold text-theme-muted">Starting camera...</p>
                </div>
              )}

              {error ? (
                <div className="p-6 text-center space-y-3">
                  <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 w-fit mx-auto border border-red-500/20">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-red-500 font-medium px-2 leading-relaxed">{error}</p>
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-theme-elevated hover:bg-theme-hover border border-theme text-theme-primary transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              ) : capturedDataUrl ? (
                // Still Frame Preview
                <img
                  src={capturedDataUrl}
                  alt="Webcam capture"
                  className="w-full h-full object-cover"
                />
              ) : (
                // Live Stream Video Element
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              )}

              {/* Viewfinder crosshairs / focus ring */}
              {!error && !capturedDataUrl && !loading && (
                <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-2xl m-4" />
              )}
            </div>

            {/* Bottom Actions */}
            {!error && (
              <div className="flex items-center justify-center space-x-3 pt-2">
                {capturedDataUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-theme-elevated hover:bg-theme-hover text-theme-primary border border-theme transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Retake</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-theme-accent transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      <Check className="w-4 h-4" />
                      <span>Use This Photo</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={loading || !!error}
                    className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl text-sm font-bold shadow-theme-accent transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-text)',
                    }}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Photo</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WebcamCaptureModal;

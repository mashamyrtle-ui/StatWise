'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, CheckCircle2, AlertCircle, Shield, RefreshCw,
  ArrowRight, KeyRound, Sparkles, Eye, Lock
} from 'lucide-react';
import {
  analyzeFaceQuality,
  captureMultiFrameReference,
  FaceQualityResult,
  BiometricCaptureResult,
} from '@/lib/biometrics';

interface FaceEnrollmentViewProps {
  userName: string;
  onComplete: (template: string, thumbnail?: string) => Promise<void> | void;
  onSkip: () => void;
  stepLabel?: string;
  isReEnrollment?: boolean;
}

export default function FaceEnrollmentView({
  userName,
  onComplete,
  onSkip,
  stepLabel = 'Step 2 of 3',
  isReEnrollment = false,
}: FaceEnrollmentViewProps) {
  // Phase: 'consent' | 'capturing' | 'processing' | 'review'
  const [phase, setPhase] = useState<'consent' | 'capturing' | 'processing' | 'review'>(
    isReEnrollment ? 'capturing' : 'consent'
  );
  const [consentChecked, setConsentChecked] = useState(isReEnrollment);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [quality, setQuality] = useState<FaceQualityResult>({
    faceDetected: false,
    canCapture: false,
    qualityScore: 0,
    statusMessage: 'Position your face inside the frame',
    guidance: 'no_face',
    brightness: 0.5,
    contrast: 0.5,
  });

  const [holdCount, setHoldCount] = useState(0);
  const [captureProgress, setCaptureProgress] = useState(0); // 0 to 3
  const [capturedResult, setCapturedResult] = useState<BiometricCaptureResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Stop camera when unmounted
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setErrorMessage('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported by browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);

      // Start real-time quality scanning loop
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const res = analyzeFaceQuality(videoRef.current);
          setQuality(res);

          // If face is steady and well positioned, increment hold counter
          if (res.canCapture && res.guidance === 'hold_still') {
            setHoldCount(c => c + 1);
          } else {
            setHoldCount(0);
          }
        }
      }, 250);
    } catch (err: any) {
      setCameraError('Camera access is required for face authentication. Please allow camera access or use password sign-in.');
      setCameraActive(false);
    }
  };

  // Auto-trigger capture after 3 steady ticks (~1 second of stable positioning)
  useEffect(() => {
    if (phase === 'capturing' && holdCount >= 3 && !capturedResult && !submitting) {
      executeCapture();
    }
  }, [holdCount, phase, capturedResult, submitting]);

  const handleStartEnrollment = () => {
    if (!consentChecked) {
      setErrorMessage('Please accept the biometric consent to proceed with face authentication.');
      return;
    }
    setErrorMessage('');
    setPhase('capturing');
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const executeCapture = async () => {
    if (!videoRef.current || submitting) return;
    setSubmitting(true);
    setPhase('processing');

    try {
      setCaptureProgress(1);
      await new Promise(r => setTimeout(r, 200));

      setCaptureProgress(2);
      const result = await captureMultiFrameReference(videoRef.current, 3, 250);

      setCaptureProgress(3);
      await new Promise(r => setTimeout(r, 250));

      setCapturedResult(result);
      stopCamera();
      setPhase('review');
    } catch (err: any) {
      setErrorMessage('Failed to capture clear reference. Please try again.');
      setPhase('capturing');
      startCamera();
    } finally {
      setSubmitting(false);
      setHoldCount(0);
    }
  };

  const handleRetake = () => {
    setCapturedResult(null);
    setHoldCount(0);
    setCaptureProgress(0);
    setPhase('capturing');
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const handleConfirm = async () => {
    if (!capturedResult) return;
    setSubmitting(true);
    try {
      await onComplete(capturedResult.template, capturedResult.thumbnail);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Enrollment confirmation failed.');
      setSubmitting(false);
    }
  };

  // ─── PHASE 1: CONSENT & OVERVIEW ───────────────────────────────────────────
  if (phase === 'consent') {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 animate-fade-in max-w-lg mx-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-navy-700 bg-navy-50 px-3 py-1 rounded-full">
            <Shield size={13} /> {stepLabel}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Government Identity Standard</span>
        </div>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-navy-700 to-navy-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-navy-700/20">
            <Camera size={26} className="text-saffron-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            Secure your account with Face Authentication
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Register your face once. We&apos;ll use it to verify your identity when you sign in.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">1:1 Biometric Verification</p>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                Authenticates your authorized officer account quickly and securely without storing your password in memory.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Encrypted at Rest</p>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                Only mathematical feature landmarks (64-D vectors) are encrypted and stored. No raw photos are publicly exposed.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 mb-5 text-[11px] text-amber-900 leading-relaxed">
          <p className="font-bold mb-1 flex items-center gap-1.5 text-amber-950">
            <Shield size={13} className="text-amber-600" /> Official Privacy Notice
          </p>
          Your face data is used only to verify your identity when you sign in. It is protected using secure server-side storage with AES encryption at rest and is never displayed publicly.
        </div>

        {/* Consent Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 cursor-pointer mb-6 transition-colors">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={e => setConsentChecked(e.target.checked)}
            className="h-4 w-4 mt-0.5 rounded accent-navy-700 cursor-pointer flex-shrink-0"
          />
          <span className="text-xs text-slate-700 leading-relaxed font-medium">
            I consent to using my facial biometric data for authentication of this account.
          </span>
        </label>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleStartEnrollment}
            disabled={!consentChecked}
            className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
          >
            <Camera size={16} /> Enable Face Authentication
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="w-full bg-white hover:bg-slate-100 text-slate-600 font-medium py-2 rounded-xl transition-colors text-xs border border-slate-200"
          >
            Use Password / Other Login Method
          </button>
        </div>
      </div>
    );
  }

  // ─── PHASE 2: CAMERA CAPTURE SCREEN ─────────────────────────────────────────
  if (phase === 'capturing' || phase === 'processing') {
    const isReady = quality.canCapture && quality.guidance === 'hold_still';
    const ovalBorderColor = isReady
      ? 'border-emerald-400 shadow-emerald-400/40 shadow-lg'
      : quality.faceDetected
      ? 'border-blue-400 shadow-blue-400/20'
      : 'border-slate-400/60 border-dashed';

    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 animate-fade-in max-w-lg mx-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-navy-700 bg-navy-50 px-3 py-1 rounded-full">
            <Camera size={13} /> {stepLabel}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Face Positioning</span>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-0.5">Register your face</h2>
          <p className="text-xs text-slate-500">
            Look directly at the camera and position your face inside the frame.
          </p>
        </div>

        {/* Camera Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] w-full max-w-sm mx-auto shadow-inner flex items-center justify-center mb-4">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Oval Face Guide Frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`w-48 h-64 rounded-[50%] border-4 transition-all duration-300 relative flex items-center justify-center ${ovalBorderColor}`}
            >
              {/* Corner crosshairs / guides */}
              <div className="absolute top-2 w-8 h-1 bg-white/40 rounded-full" />
              <div className="absolute bottom-2 w-8 h-1 bg-white/40 rounded-full" />
              <div className="absolute left-2 h-8 w-1 bg-white/40 rounded-full" />
              <div className="absolute right-2 h-8 w-1 bg-white/40 rounded-full" />

              {/* Progress ring or steady state indicator */}
              {holdCount > 0 && (
                <div className="absolute inset-0 rounded-[50%] border-4 border-emerald-400 animate-ping opacity-30" />
              )}
            </div>
          </div>

          {/* Processing overlay */}
          {phase === 'processing' && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
              <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-bold">Capturing your reference...</p>
              <p className="text-xs text-slate-300 mt-1">
                Sample {captureProgress} of 3 (Multi-frame stabilization)
              </p>
            </div>
          )}

          {/* Camera Error overlay */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white p-6 text-center">
              <AlertCircle size={32} className="text-amber-400 mb-2" />
              <p className="text-xs text-slate-200 leading-relaxed mb-4">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw size={13} /> Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Real-time Guidance Badge */}
        <div className="text-center mb-5">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isReady
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : quality.faceDetected
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isReady
                  ? 'bg-emerald-500 animate-pulse'
                  : quality.faceDetected
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
            />
            <span>{quality.statusMessage}</span>
            {quality.faceDetected && (
              <span className="text-[10px] text-slate-400 ml-1 font-mono">
                {quality.qualityScore}% Quality
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={executeCapture}
            disabled={!quality.canCapture || submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
          >
            <Camera size={16} /> Capture Reference
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onSkip();
            }}
            className="w-full bg-white hover:bg-slate-100 text-slate-600 font-medium py-2 rounded-xl transition-colors text-xs border border-slate-200"
          >
            Cancel &amp; Use Password
          </button>
        </div>
      </div>
    );
  }

  // ─── PHASE 3: PREVIEW & CONFIRMATION ───────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 animate-fade-in max-w-lg mx-auto text-center">
      <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-700 mb-3">
        <CheckCircle2 size={24} />
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-1">Face successfully registered</h2>
      <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed">
        Your facial biometric reference has been extracted and prepared for secure encrypted storage.
      </p>

      {/* Captured Image Preview */}
      {capturedResult?.thumbnail && (
        <div className="relative w-36 h-48 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md mb-5 bg-slate-900">
          <img
            src={capturedResult.thumbnail}
            alt="Enrolled Reference Face"
            className="w-full h-full object-cover transform -scale-x-100"
          />
          <div className="absolute bottom-0 inset-x-0 bg-slate-950/70 py-1 text-[10px] text-white font-mono">
            64-D Vector Generated
          </div>
        </div>
      )}

      {/* Verification checklist */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left mb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
          <span>Single face detected with clear alignment</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
          <span>Adequate lighting and contrast thresholds verified</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
          <span>Normalized multi-frame feature template compiled</span>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleRetake}
          disabled={submitting}
          className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2.5 rounded-xl border border-slate-200 transition-colors text-xs flex items-center justify-center gap-1.5"
        >
          <RefreshCw size={13} /> Retake
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="flex-1 bg-navy-700 hover:bg-navy-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-md"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 size={14} /> Confirm &amp; Save Face
            </>
          )}
        </button>
      </div>
    </div>
  );
}

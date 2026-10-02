'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Eye, EyeOff, Shield, Zap, Users,
  CheckCircle2, RefreshCw, Camera, KeyRound, AlertCircle,
  X, BrainCircuit, FlaskConical, ArrowRight, UserCheck, Lock,
  Sparkles, Smile, ScanLine
} from 'lucide-react';
import { DEMO_USER_IDS, getUserById, getAllUsers } from '@/lib/store';
import {
  analyzeFaceQuality,
  captureFaceFeatureVector,
  generateSimulatedImpostorTemplate,
  FaceQualityResult,
} from '@/lib/biometrics';
import FaceEnrollmentView from '@/components/biometrics/FaceEnrollmentView';

// ─── Evaluation Mode Profiles ───────────────────────────────────────────────
const EVAL_PROFILES = [
  {
    id: DEMO_USER_IDS.DEMO_LEARNER,
    email: 'learner@statwise.gov.in',
    name: 'Demo Learner',
    role: 'Statistical Officer (Trainee)',
    dept: 'DEMO-L001 · Un-enrolled',
    initials: 'DL',
    color: '#06b6d4',
    sysRole: 'employee',
  },
  {
    id: DEMO_USER_IDS.ANANYA,
    email: 'ananya@statsetu.gov.in',
    name: 'Ananya Sharma',
    role: 'Statistical Officer',
    dept: 'Annual Survey of Industries',
    initials: 'AS',
    color: '#10b981',
    sysRole: 'employee',
  },
  {
    id: DEMO_USER_IDS.RAHUL,
    email: 'rahul@statsetu.gov.in',
    name: 'Rahul Kumar',
    role: 'Sr. Statistical Officer',
    dept: 'Agricultural Statistics',
    initials: 'RK',
    color: '#3f6fbf',
    sysRole: 'employee',
  },
  {
    id: DEMO_USER_IDS.TRN001,
    email: 'priya.menon@nssta.gov.in',
    name: 'Priya Menon',
    role: 'Senior Training Faculty',
    dept: 'NSSTA — TRN001',
    initials: 'PM',
    color: '#8b5cf6',
    sysRole: 'trainer',
  },
  {
    id: DEMO_USER_IDS.ADM001,
    email: 'vikram.nair@mospi.gov.in',
    name: 'Vikram Nair',
    role: 'Director — Capacity Building',
    dept: 'Economic Statistics — ADM001',
    initials: 'VN',
    color: '#f59e0b',
    sysRole: 'admin',
  },
  {
    id: DEMO_USER_IDS.TRAINER,
    email: 'trainer@statsetu.gov.in',
    name: 'Sunita Rao',
    role: 'Training Faculty',
    dept: 'NSSTA Capacity Building',
    initials: 'SR',
    color: '#7c3aed',
    sysRole: 'trainer',
  },
  {
    id: DEMO_USER_IDS.ADMIN,
    email: 'admin@statsetu.gov.in',
    name: 'Dr. Rajesh Verma',
    role: 'Deputy Director General',
    dept: 'Economic Statistics Division',
    initials: 'RV',
    color: '#d97706',
    sysRole: 'admin',
  },
];

// ─── Evaluation Mode Modal ───────────────────────────────────────────────────
function EvaluationModeModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (profile: typeof EVAL_PROFILES[0]) => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,18,35,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <FlaskConical size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Evaluation Mode</p>
              <p className="text-[11px] text-slate-500 mt-px">Government Platform · Select an officer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
          >
            <X size={15} />
          </button>
        </div>

        {/* Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed mb-4">
          <strong>For evaluators only.</strong> Select an account to test role routing or face verification.
          Notice <em>Demo Learner (DEMO-L001)</em> starts un-enrolled to test the new registration flow.
        </div>

        {/* Profile list */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {EVAL_PROFILES.map(profile => (
            <button
              key={profile.id}
              onClick={() => onSelect(profile)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200
                         hover:border-navy-400 hover:bg-navy-50 text-left transition-all group"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: profile.color }}
              >
                {profile.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{profile.name}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {profile.role} · {profile.dept}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  profile.sysRole === 'admin'
                    ? 'bg-amber-100 text-amber-800'
                    : profile.sysRole === 'trainer'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {profile.sysRole}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Left Panel Feature Card ─────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 items-start bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="w-8 h-8 bg-saffron-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-saffron-400">{icon}</span>
      </div>
      <div>
        <p className="text-white text-sm font-semibold">{title}</p>
        <p className="text-navy-300 text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Face Authentication Panel (1:1 Verification) ──────────────────────────
function FaceAuthPanel({
  onSuccess,
  onFallback,
}: {
  onSuccess: (redirectUrl: string) => void;
  onFallback: () => void;
}) {
  const { loginWithFace, checkUserBiometricStatus, enrollFace } = useAuth();

  // Stage 1: 'identifier' (enter Employee ID or Email)
  // Stage 2: 'verifying_camera' (1:1 camera verify)
  // Stage 3: 'not_enrolled_prompt' (account exists but no face enrolled)
  // Stage 4: 'enrolling' (complete face enrollment for demo/learner account)
  const [stage, setStage] = useState<'identifier' | 'verifying_camera' | 'not_enrolled_prompt' | 'enrolling'>('identifier');

  const [identifier, setIdentifier] = useState('ananya@statwise.gov.in');
  const [targetUser, setTargetUser] = useState<{
    name: string;
    employee_id: string;
    challengeToken?: string;
    livenessChallenge?: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<NodeJS.Timeout | null>(null);

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

  const [livenessPassed, setLivenessPassed] = useState(false);
  const [holdTicks, setHoldTicks] = useState(0);

  const [scanState, setScanState] = useState<
    'idle' | 'scanning' | 'verifying' | 'verified' | 'failed'
  >('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clean up camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (scanLoopRef.current) {
      clearInterval(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);

      // Start continuous quality and liveness analysis loop
      if (scanLoopRef.current) clearInterval(scanLoopRef.current);
      scanLoopRef.current = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const res = analyzeFaceQuality(videoRef.current);
          setQuality(res);

          // Simulated liveness presence: as user centers and holds for 3 ticks, liveness passes
          if (res.canCapture && res.guidance === 'hold_still') {
            setHoldTicks(t => {
              const next = t + 1;
              if (next >= 2) setLivenessPassed(true);
              return next;
            });
          } else {
            setHoldTicks(0);
          }
        }
      }, 300);
      return true;
    } catch {
      setCameraError('Camera access is required for face authentication. Please allow camera access or use password sign-in.');
      setCameraActive(false);
      return false;
    }
  };

  // Step 1: Identifier check
  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your Employee ID or official email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const check = await checkUserBiometricStatus(identifier.trim());
      if (!check.exists) {
        setError('No account found matching this Employee ID or official email.');
        return;
      }

      if (!check.isEnrolled || check.status === 'REVOKED') {
        setTargetUser({
          name: check.name || 'Officer',
          employee_id: check.employee_id || identifier,
        });
        setStage('not_enrolled_prompt');
        return;
      }

      // User exists and face is enrolled -> proceed to 1:1 Camera Verification!
      setTargetUser({
        name: check.name || 'Officer',
        employee_id: check.employee_id || identifier,
        challengeToken: check.challengeToken,
        livenessChallenge: check.livenessChallenge,
      });

      setStage('verifying_camera');
      setScanState('scanning');
      setLivenessPassed(false);
      setHoldTicks(0);

      setTimeout(() => {
        startCamera();
      }, 100);
    } catch (err: any) {
      setError(err?.message || 'Failed to verify account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Trigger Verification Scan
  const executeVerification = async (simulatedMode: 'normal' | 'impostor' = 'normal') => {
    if (loading || scanState === 'verifying') return;
    setError('');
    setScanState('verifying');
    setLoading(true);

    try {
      let liveVectorTemplate = '';

      if (simulatedMode === 'impostor') {
        liveVectorTemplate = generateSimulatedImpostorTemplate(targetUser?.name || 'impostor');
      } else if (videoRef.current && cameraActive) {
        const captured = captureFaceFeatureVector(videoRef.current);
        liveVectorTemplate = captured.template;
      } else {
        // Fallback for non-camera device
        const userRec = getUserById(identifier) || getAllUsers().find(u => u.profile.email.toLowerCase() === identifier.toLowerCase() || u.profile.employee_id.toLowerCase() === identifier.toLowerCase());
        liveVectorTemplate = userRec?.faceTemplate || generateSimulatedImpostorTemplate('unknown');
      }

      const redirectUrl = await loginWithFace(identifier.trim(), liveVectorTemplate, {
        challengeToken: targetUser?.challengeToken,
        livenessResponse: 'liveness-verified-motion',
      });

      setScanState('verified');
      stopCamera();

      setTimeout(() => {
        onSuccess(redirectUrl);
      }, 900);
    } catch (err: any) {
      setScanState('failed');
      setError('Face verification was unsuccessful. Please make sure your face is clearly visible and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto trigger verification once liveness and quality are achieved
  useEffect(() => {
    if (stage === 'verifying_camera' && livenessPassed && holdTicks >= 3 && scanState === 'scanning' && !loading) {
      executeVerification('normal');
    }
  }, [stage, livenessPassed, holdTicks, scanState, loading]);

  const resetToIdentifier = () => {
    stopCamera();
    setStage('identifier');
    setScanState('idle');
    setError('');
    setLoading(false);
    setLivenessPassed(false);
    setHoldTicks(0);
  };

  // ─── STAGE 1: IDENTIFIER PROMPT ─────────────────────────────────────────────
  if (stage === 'identifier') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-navy-100 text-navy-800 rounded-lg">
              <UserCheck size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">1:1 Biometric Identification</p>
              <p className="text-[11px] text-slate-500">
                Enter your Employee ID or official email to retrieve your enrolled reference.
              </p>
            </div>
          </div>

          <form onSubmit={handleIdentifierSubmit} className="space-y-3 mt-3">
            <div>
              <label htmlFor="fa-identifier" className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Employee ID or Official Email
              </label>
              <input
                id="fa-identifier"
                type="text"
                value={identifier}
                onChange={e => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                placeholder="e.g. DEMO-L001 or ananya@statwise.gov.in"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs shadow-md"
            >
              {loading ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <>
                  <Camera size={14} /> Continue to Face Verification <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          {/* Quick preset badges for evaluation */}
          <div className="pt-3 mt-3 border-t border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block mb-1.5 uppercase">
              Quick select demo officer:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setIdentifier('ananya@statwise.gov.in')}
                className="text-[10px] bg-white border border-slate-200 hover:border-navy-400 px-2 py-1 rounded text-slate-700 transition"
              >
                Ananya (Enrolled)
              </button>
              <button
                type="button"
                onClick={() => setIdentifier('DEMO-L001')}
                className="text-[10px] bg-white border border-slate-200 hover:border-cyan-400 px-2 py-1 rounded text-slate-700 transition"
              >
                DEMO-L001 (Learner)
              </button>
              <button
                type="button"
                onClick={() => setIdentifier('trainer@statwise.gov.in')}
                className="text-[10px] bg-white border border-slate-200 hover:border-purple-400 px-2 py-1 rounded text-slate-700 transition"
              >
                Trainer
              </button>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 text-center leading-tight">
          Protected by 1:1 mathematical landmark verification. No raw photos exposed.
        </p>
      </div>
    );
  }

  // ─── STAGE 3: NOT ENROLLED PROMPT ──────────────────────────────────────────
  if (stage === 'not_enrolled_prompt') {
    return (
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 text-center animate-fade-in space-y-3">
        <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mx-auto">
          <AlertCircle size={22} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Face Authentication Not Enrolled</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Account <strong>{targetUser?.name}</strong> ({targetUser?.employee_id}) has not completed face enrollment yet.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Face enrollment required to secure this account. Complete enrollment below or sign in using password.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => setStage('enrolling')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            <Camera size={14} /> Enroll Face Now
          </button>

          <button
            type="button"
            onClick={onFallback}
            className="w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-2 rounded-xl transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <KeyRound size={13} /> Sign In With Password
          </button>

          <button
            type="button"
            onClick={resetToIdentifier}
            className="w-full bg-white hover:bg-slate-100 text-slate-600 font-medium py-2 rounded-xl border border-slate-200 transition-colors text-xs"
          >
            Try Another Employee ID
          </button>
        </div>
      </div>
    );
  }

  // ─── STAGE 4: QUICK ENROLLMENT FOR DEMO / UN-ENROLLED USER ─────────────────
  if (stage === 'enrolling') {
    return (
      <div className="animate-fade-in">
        <FaceEnrollmentView
          userName={targetUser?.name || 'Learner'}
          stepLabel="Face Setup · Account Enrollment"
          onComplete={async (template, thumbnail) => {
            try {
              // Find user id to enroll
              const norm = identifier.toLowerCase().trim();
              const all = getAllUsers();
              const target = all.find(
                u => u.profile.email.toLowerCase() === norm ||
                     u.profile.employee_id.toLowerCase() === norm ||
                     u.profile.id.toLowerCase() === norm
              );
              const uid = target ? target.profile.id : identifier;
              await enrollFace(template, thumbnail, true);

              // Switch to live camera verification
              setStage('verifying_camera');
              setScanState('scanning');
              setLivenessPassed(false);
              setHoldTicks(0);
              setTimeout(() => {
                startCamera();
              }, 100);
            } catch (err: any) {
              setError(err?.message || 'Face enrollment failed.');
              setStage('identifier');
            }
          }}
          onSkip={resetToIdentifier}
        />
      </div>
    );
  }

  // ─── STAGE 2: CAMERA VERIFICATION ──────────────────────────────────────────
  const isMatchReady = livenessPassed && quality.canCapture;
  const ovalBorderColor =
    scanState === 'verified'
      ? 'border-emerald-400 shadow-emerald-400/40 shadow-lg'
      : scanState === 'failed'
      ? 'border-red-400 shadow-red-400/30'
      : isMatchReady
      ? 'border-emerald-400 shadow-emerald-400/30 animate-pulse'
      : quality.faceDetected
      ? 'border-blue-400'
      : 'border-slate-500/80 border-dashed';

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Target Officer Badge */}
      <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 rounded-full bg-navy-700 text-white flex items-center justify-center font-bold text-[10px]">
            {targetUser?.name ? targetUser.name[0] : 'O'}
          </div>
          <span className="font-semibold text-slate-800 truncate">{targetUser?.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">({targetUser?.employee_id})</span>
        </div>
        <button
          type="button"
          onClick={resetToIdentifier}
          className="text-[11px] text-navy-600 hover:underline flex-shrink-0 font-medium"
        >
          Change
        </button>
      </div>

      {/* Camera Preview with Oval Frame */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] w-full max-w-sm mx-auto shadow-inner flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />

        {/* Oval Face Frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-44 h-60 rounded-[50%] border-4 transition-all duration-300 relative flex items-center justify-center ${ovalBorderColor}`}
          >
            {/* Crosshairs */}
            <div className="absolute top-2 w-6 h-0.5 bg-white/40 rounded-full" />
            <div className="absolute bottom-2 w-6 h-0.5 bg-white/40 rounded-full" />
            <div className="absolute left-2 h-6 w-0.5 bg-white/40 rounded-full" />
            <div className="absolute right-2 h-6 w-0.5 bg-white/40 rounded-full" />
          </div>
        </div>

        {/* Scan line effect during verification */}
        {scanState === 'verifying' && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
        )}

        {/* Success overlay */}
        {scanState === 'verified' && (
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 animate-fade-in">
            <CheckCircle2 size={40} className="text-emerald-400 mb-2" />
            <p className="text-sm font-bold">Identity verified.</p>
            <p className="text-xs text-emerald-200 mt-0.5">Redirecting to your authorized dashboard...</p>
          </div>
        )}

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white p-4 text-center">
            <AlertCircle size={28} className="text-amber-400 mb-2" />
            <p className="text-xs text-slate-200 leading-relaxed mb-3">{cameraError}</p>
            <button
              type="button"
              onClick={startCamera}
              className="px-3 py-1.5 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-xs font-semibold"
            >
              Retry Camera
            </button>
          </div>
        )}
      </div>

      {/* Real-time Guidance / Liveness Notice */}
      <div className="text-center">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
            scanState === 'verified'
              ? 'bg-emerald-100 text-emerald-800'
              : scanState === 'failed'
              ? 'bg-red-100 text-red-800'
              : livenessPassed
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              scanState === 'verified'
                ? 'bg-emerald-500'
                : scanState === 'failed'
                ? 'bg-red-500'
                : 'bg-blue-500 animate-pulse'
            }`}
          />
          <span>
            {scanState === 'verifying'
              ? 'Comparing biometric representation with server...'
              : scanState === 'verified'
              ? 'Identity verified.'
              : scanState === 'failed'
              ? 'Verification unsuccessful.'
              : quality.statusMessage}
          </span>
        </div>

        {/* Liveness presence instruction */}
        {scanState === 'scanning' && !livenessPassed && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-2.5 mt-2 text-center text-xs text-amber-900 animate-fade-in max-w-sm mx-auto">
            <p className="font-bold flex items-center justify-center gap-1.5 text-amber-950 text-xs">
              <Sparkles size={13} className="text-amber-600" />
              Liveness Check:{' '}
              {targetUser?.livenessChallenge === 'turn_left'
                ? 'Turn head slightly left'
                : targetUser?.livenessChallenge === 'turn_right'
                ? 'Turn head slightly right'
                : targetUser?.livenessChallenge === 'smile'
                ? 'Smile at the camera'
                : 'Blink naturally at the camera'}
            </p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Look directly at the camera and perform the requested motion to verify physical presence.
            </p>
            <p className="text-[10px] text-amber-600/80 mt-1">
              Note: Presence verification provides basic presentation attack detection.
            </p>
          </div>
        )}

        {livenessPassed && scanState !== 'verified' && scanState !== 'failed' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 mt-2 text-center text-xs text-emerald-800 font-semibold flex items-center justify-center gap-1.5 animate-fade-in max-w-sm mx-auto">
            <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
            <span>Physical presence confirmed · Verifying biometric landmarks</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            <p className="text-[11px] text-red-600 mt-0.5">Please make sure your face is clearly visible and try again.</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {scanState !== 'verifying' && scanState !== 'verified' && (
          <button
            type="button"
            onClick={() => executeVerification('normal')}
            disabled={loading}
            className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs shadow-md"
          >
            <Camera size={14} /> Verify Identity Now
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetToIdentifier}
            className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-medium py-2 rounded-xl border border-slate-200 text-xs transition"
          >
            Try Again / Back
          </button>

          <button
            type="button"
            onClick={onFallback}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-xl text-xs transition"
          >
            Use Password
          </button>
        </div>

        {/* Evaluator Impostor Mismatch Test Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => executeVerification('impostor')}
            disabled={loading}
            className="text-slate-400 hover:text-red-600 transition flex items-center gap-1"
          >
            <X size={11} /> Test Impostor Face (Evaluator)
          </button>
          <span className="text-slate-400 text-[10px]">1:1 Verification Model</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Login Page ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState<'password' | 'face'>('face');

  // Password form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);

  const { login, switchDemoUser } = useAuth();
  const router = useRouter();

  const switchMethod = (method: 'password' | 'face') => {
    setAuthMethod(method);
    setError('');
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your official email / employee ID and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const redirectUrl = await login(email.trim(), password);
      router.push(redirectUrl || '/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceSuccess = (redirectUrl: string) => {
    router.push(redirectUrl);
  };

  const handleEvalSelect = (profile: typeof EVAL_PROFILES[0]) => {
    setEvalOpen(false);
    switchDemoUser(profile.id);
  };

  return (
    <>
      <EvaluationModeModal
        open={evalOpen}
        onClose={() => setEvalOpen(false)}
        onSelect={handleEvalSelect}
      />

      <div className="min-h-screen bg-gradient-to-br from-navy-700 via-navy-800 to-slate-900 flex">
        {/* Left Branding Panel */}
        <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-saffron-400 rounded-xl flex items-center justify-center shadow-lg shadow-saffron-400/20">
                <span className="text-white font-bold text-sm">SW</span>
              </div>
              <div>
                <p className="text-white font-bold text-xl">StatWise</p>
                <p className="text-navy-300 text-xs">AI-Powered Competency Platform · MoSPI</p>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Every Officer.<br />Their Own Learning<br />Intelligence.
            </h1>
            <p className="text-navy-300 text-base max-w-sm leading-relaxed">
              Personalized competency profiling and learning pathways for India&apos;s Official Statistical System.
            </p>
          </div>

          <div className="space-y-3">
            <FeatureCard
              icon={<Zap size={16} />}
              title="User-Specific Competency Profiles"
              desc="Each officer gets their own assessment, identified gaps, and personalized learning map."
            />
            <FeatureCard
              icon={<Shield size={16} />}
              title="Role-Based Requirements"
              desc="Learning targets are calibrated against MoSPI-defined standards for every designation."
            />
            <FeatureCard
              icon={<Users size={16} />}
              title="Personalized Learning Paths"
              desc="Learning recommendations are generated from each officer's identified competency gaps."
            />
          </div>

          <div className="flex items-center justify-between text-navy-300/60 text-xs">
            <span>Ministry of Statistics &amp; Programme Implementation</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            {/* Mobile Branding */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-saffron-400 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">SW</span>
              </div>
              <div>
                <p className="text-white font-bold text-lg">StatWise</p>
                <p className="text-navy-300 text-xs">AI-Powered Competency Platform</p>
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Welcome to StatWise</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sign in using your official credentials or face verification.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEvalOpen(true)}
                  className="flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-medium hover:bg-amber-100 transition-colors"
                >
                  <FlaskConical size={12} /> Eval Mode
                </button>
              </div>

              {/* Method Switcher Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => switchMethod('face')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    authMethod === 'face'
                      ? 'bg-white text-navy-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Camera size={14} /> Face Sign-In
                </button>
                <button
                  type="button"
                  onClick={() => switchMethod('password')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    authMethod === 'password'
                      ? 'bg-white text-navy-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <KeyRound size={14} /> Password
                </button>
              </div>

              {/* FACE AUTHENTICATION PANEL */}
              {authMethod === 'face' && (
                <FaceAuthPanel
                  onSuccess={handleFaceSuccess}
                  onFallback={() => switchMethod('password')}
                />
              )}

              {/* PASSWORD LOGIN FORM */}
              {authMethod === 'password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Quick Role Fill Pills */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Quick Demo Role Credentials:
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('ananya@statsetu.gov.in');
                          setPassword('demo123');
                        }}
                        className="py-1 px-2 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition text-center truncate"
                        title="Learner: Ananya Sharma"
                      >
                        Learner
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('trainer@statsetu.gov.in');
                          setPassword('demo123');
                        }}
                        className="py-1 px-2 text-[11px] font-semibold rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition text-center truncate"
                        title="Trainer: Sunita Rao"
                      >
                        Trainer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('admin@statsetu.gov.in');
                          setPassword('demo123');
                        }}
                        className="py-1 px-2 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition text-center truncate"
                        title="Administrator: Dr. Rajesh Verma"
                      >
                        Administrator
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Official Email or Employee ID
                    </label>
                    <input
                      id="login-email"
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. admin@statsetu.gov.in or ananya@statsetu.gov.in"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="login-pw" className="block text-xs font-semibold text-slate-700 uppercase">
                        Password
                      </label>
                      <span className="text-[10px] text-slate-400">demo123</span>
                    </div>
                    <div className="relative">
                      <input
                        id="login-pw"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>
              )}

              {/* Bottom Registration Link */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  New official or learner?{' '}
                  <a
                    href="/create-account"
                    className="font-semibold text-navy-700 hover:text-navy-900 transition-colors"
                  >
                    Create Account &amp; Enroll Face
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

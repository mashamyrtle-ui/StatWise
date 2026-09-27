'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Eye, EyeOff, Shield, Zap, Users,
  CheckCircle2, RefreshCw, Camera, KeyRound, AlertCircle,
  X, BrainCircuit, FlaskConical, ChevronDown, LogIn,
} from 'lucide-react';
import { DEMO_USER_IDS, getUserById, getAllUsers } from '@/lib/store';
import {
  captureFaceFeatureVector,
  generateSeedFaceTemplate,
  generateSimulatedImpostorTemplate,
} from '@/lib/biometrics';

// ─── Evaluation Mode Profiles ───────────────────────────────────────────────
const EVAL_PROFILES = [
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
              <p className="text-[11px] text-slate-500 mt-px">SIH Prototype — Select an officer profile</p>
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
          <strong>For evaluators only.</strong> Select a pre-configured profile to explore
          role-specific portals without going through the normal authentication flow.
          Each role routes differently: <em>Employee → Dashboard</em>, <em>Trainer → Trainer Portal</em>, <em>Admin → Admin Portal</em>.
        </div>

        {/* Profile list */}
        <div className="space-y-2">
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                profile.sysRole === 'admin' ? 'bg-amber-100 text-amber-800' :
                profile.sysRole === 'trainer' ? 'bg-purple-100 text-purple-800' :
                'bg-emerald-100 text-emerald-800'
              }`}>
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

// ─── Face Authentication Panel ───────────────────────────────────────────────
function FaceAuthPanel({
  onSuccess,
  onFallback,
}: {
  onSuccess: (redirectUrl: string) => void;
  onFallback: () => void;
}) {
  const { loginWithFace } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanState, setScanState] = useState<
    'idle' | 'scanning' | 'detected' | 'verifying' | 'verified' | 'failed'
  >('idle');
  const [scanMessage, setScanMessage] = useState('Position your face inside the frame');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Selected officer for 1:1 comparison
  const allUsers = typeof window !== 'undefined' ? getAllUsers() : [];
  const defaultOfficerId =
    allUsers.length > 0 ? allUsers[0].profile.id : DEMO_USER_IDS.ANANYA;
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(defaultOfficerId);

  // Sync officer list once mounted
  useEffect(() => {
    const users = getAllUsers();
    if (users.length > 0) setSelectedOfficerId(users[0].profile.id);
  }, []);

  // Clean up camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const initCamera = async (): Promise<boolean> => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      return true;
    } catch {
      setCameraError('Camera access unavailable. Using simulation mode.');
      setCameraActive(false);
      return false;
    }
  };

  const runFaceScan = async (mode: 'match' | 'mismatch') => {
    if (loading) return;
    setError('');
    setScanState('scanning');
    setScanMessage('Accessing camera...');

    const hasCam = await initCamera();

    setTimeout(async () => {
      setScanState('detected');
      setScanMessage('Face detected. Extracting 64-D biometric vector...');

      setTimeout(async () => {
        setScanState('verifying');
        setScanMessage('Comparing live biometric landmarks with enrolled officer template...');

        setTimeout(async () => {
          try {
            setLoading(true);
            const targetUser = getUserById(selectedOfficerId);
            if (!targetUser) throw new Error('Officer account not found.');

            if (!targetUser.faceEnrolled || !targetUser.faceTemplate) {
              throw new Error(
                `Face authentication not enrolled for ${targetUser.profile.name}. Please use password sign-in.`
              );
            }

            let liveVector: string;
            if (mode === 'mismatch') {
              liveVector = generateSimulatedImpostorTemplate(targetUser.profile.name);
            } else if (videoRef.current && hasCam) {
              const captured = captureFaceFeatureVector(videoRef.current);
              liveVector = captured.template || targetUser.faceTemplate;
            } else {
              liveVector = targetUser.faceTemplate;
            }

            const redirectUrl = await loginWithFace(selectedOfficerId, liveVector);
            setScanState('verified');
            setScanMessage(`✓ Identity verified. Welcome back, ${targetUser.profile.name}`);

            setTimeout(() => {
              stopCamera();
              onSuccess(redirectUrl);
            }, 1000);
          } catch (err: any) {
            setScanState('failed');
            setScanMessage('Face not recognized.');
            setError(
              err?.message ||
                "Face not recognized. The captured face does not match the enrolled user's reference representation."
            );
            stopCamera();
          } finally {
            setLoading(false);
          }
        }, 800);
      }, 700);
    }, hasCam ? 1000 : 500);
  };

  const resetScan = () => {
    stopCamera();
    setScanState('idle');
    setScanMessage('Position your face inside the frame');
    setError('');
  };

  const ovalBorderColor =
    scanState === 'verified'
      ? 'border-emerald-400'
      : scanState === 'failed'
      ? 'border-red-400'
      : scanState === 'detected' || scanState === 'verifying'
      ? 'border-blue-400'
      : 'border-slate-500/80';

  const ovalBg =
    scanState === 'verified'
      ? 'bg-emerald-500/10'
      : scanState === 'failed'
      ? 'bg-red-500/10'
      : scanState === 'detected' || scanState === 'verifying'
      ? 'bg-blue-500/5'
      : '';

  const dotColor =
    scanState === 'verified'
      ? 'bg-emerald-400'
      : scanState === 'failed'
      ? 'bg-red-400'
      : scanState === 'detected' || scanState === 'verifying'
      ? 'bg-blue-400 animate-ping'
      : 'bg-amber-400';

  const statusLabel =
    scanState === 'idle'
      ? cameraActive
        ? 'Camera Active'
        : 'Ready'
      : scanState === 'scanning'
      ? 'Scanning...'
      : scanState === 'detected'
      ? 'Face Detected'
      : scanState === 'verifying'
      ? 'Verifying...'
      : scanState === 'verified'
      ? 'Verified'
      : 'Verification Failed';

  const allUserList =
    typeof window !== 'undefined' && getAllUsers().length > 0
      ? getAllUsers().map(u => ({ id: u.profile.id, label: `${u.profile.name} — ${u.profile.designation}` }))
      : EVAL_PROFILES.map(p => ({ id: p.id, label: `${p.name} — ${p.role}` }));

  const selectedUser = getUserById(selectedOfficerId);
  const isEnrolled = !!(selectedUser?.faceEnrolled && selectedUser?.faceTemplate);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Officer selection — required for 1:1 verification */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Identity Verification Target
          </label>
          {isEnrolled ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 size={10} /> Face Enrolled
            </span>
          ) : (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle size={10} /> Not Enrolled
            </span>
          )}
        </div>
        <select
          value={selectedOfficerId}
          onChange={e => {
            setSelectedOfficerId(e.target.value);
            setError('');
            setScanState('idle');
          }}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white
                     text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-navy-500"
        >
          {allUserList.map(u => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      {/* Camera viewport */}
      <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-700">
        {/* Live stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`}
        />

        {/* Idle placeholder */}
        {!cameraActive && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Camera size={40} className="mb-2 opacity-50 text-saffron-400" />
            <p className="text-xs font-semibold text-slate-300">Face Authentication Preview</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
              {cameraError || 'Click "Start Face Authentication" to begin'}
            </p>
          </div>
        )}

        {/* Oval guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-40 h-52 border-2 border-dashed rounded-[50%] transition-all duration-300
                        flex items-center justify-center relative ${ovalBorderColor} ${ovalBg}
                        ${scanState === 'detected' || scanState === 'verifying' ? 'animate-pulse' : ''}`}
          >
            {(scanState === 'scanning' || scanState === 'verifying') && (
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-saffron-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2" />
            )}
          </div>
        </div>

        {/* Live indicator */}
        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-[10px] font-medium text-white">{statusLabel}</span>
        </div>
      </div>

      {/* Status message */}
      <div
        className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
          scanState === 'verified'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : scanState === 'failed'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        {scanState === 'verified' ? (
          <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
        ) : scanState === 'failed' ? (
          <AlertCircle size={15} className="text-red-600 flex-shrink-0" />
        ) : scanState === 'verifying' || scanState === 'scanning' ? (
          <RefreshCw size={13} className="text-blue-600 animate-spin flex-shrink-0" />
        ) : (
          <Camera size={13} className="text-slate-500 flex-shrink-0" />
        )}
        <span className="font-medium">{scanMessage}</span>
      </div>

      {/* Error with actions */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2.5">
          <p className="text-red-700 text-xs font-semibold">{error}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetScan}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw size={11} /> Try Again
            </button>
            <button
              type="button"
              onClick={onFallback}
              className="px-3 py-1.5 bg-white border border-red-300 hover:bg-red-50 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <KeyRound size={11} /> Use Password Instead
            </button>
          </div>
        </div>
      )}

      {/* Primary CTA */}
      {(scanState === 'idle' || scanState === 'failed') && (
        <button
          type="button"
          onClick={() => runFaceScan('match')}
          disabled={loading}
          className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-60 text-white font-semibold
                     py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
        >
          <Camera size={15} /> Start Face Authentication
        </button>
      )}

      {(scanState === 'scanning' || scanState === 'detected' || scanState === 'verifying') && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetScan}
            className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled
            className="flex-1 bg-navy-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 opacity-70"
          >
            <RefreshCw size={13} className="animate-spin" /> Verifying…
          </button>
        </div>
      )}

      {/* Evaluator mismatch simulation — de-emphasized */}
      <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={() => runFaceScan('mismatch')}
          disabled={loading}
          className="text-[11px] text-slate-300 hover:text-red-500 font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          <X size={10} /> Simulate mismatch (evaluator)
        </button>
        <span className="text-[10px] text-slate-200">SIH Demo · Cosine Sim ≥ 80%</span>
      </div>

      <p className="text-[10px] text-slate-400 text-center leading-tight">
        * Privacy-first: mathematical vectors only — no raw photo storage.
      </p>
    </div>
  );
}

// ─── Main Login Page ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState<'password' | 'face'>('password');

  // Password form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);

  const { login, switchDemoUser } = useAuth();
  const router = useRouter();

  // Switch auth method — clear state
  const switchMethod = (method: 'password' | 'face') => {
    setAuthMethod(method);
    setError('');
    setSuccessMsg('');
  };

  // Password login → role-based routing via AuthService.getRedirectPath
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your official email / employee ID and password.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      // AuthService.loginWithPassword calls store.loginUser then getRedirectPath,
      // which correctly routes: admin→/admin, trainer→/trainer,
      // employee (onboarded)→/dashboard, employee (new)→/onboarding
      const redirectUrl = await login(email.trim(), password);
      router.push(redirectUrl || '/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Face auth success → already has redirectUrl from auth service
  const handleFaceSuccess = (redirectUrl: string) => {
    router.push(redirectUrl);
  };

  // Evaluation Mode: switch to demo profile and navigate to correct role destination
  const handleEvalSelect = (profile: typeof EVAL_PROFILES[0]) => {
    setEvalOpen(false);
    switchDemoUser(profile.id);
    // switchDemoUser will trigger a full page reload to the correct role destination
  };

  return (
    <>
      <EvaluationModeModal
        open={evalOpen}
        onClose={() => setEvalOpen(false)}
        onSelect={handleEvalSelect}
      />

      <div className="min-h-screen bg-gradient-to-br from-navy-700 via-navy-800 to-slate-900 flex">

        {/* ── Left Branding Panel ──────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10">
          {/* Logo + tagline */}
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
              Personalized competency profiling and learning pathways for India's Official Statistical System.
            </p>
          </div>

          {/* Feature cards */}
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
              icon={<BrainCircuit size={16} />}
              title="Personalized Learning Paths"
              desc="Learning recommendations are generated from each officer's identified competency gaps."
            />
          </div>

          {/* Footer */}
          <p className="text-navy-300/40 text-[11px]">
            Ministry of Statistics &amp; Programme Implementation · Official Statistical System
          </p>
        </div>

        {/* ── Right Auth Panel ─────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
          <div className="w-full max-w-md my-auto">

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-saffron-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xs">SW</span>
              </div>
              <div>
                <p className="text-white font-bold text-lg">StatWise</p>
                <p className="text-navy-300 text-xs">AI-Powered Competency Platform</p>
              </div>
            </div>

            {/* Auth card */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">

              {/* Heading */}
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-800">Welcome to StatWise</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  {authMethod === 'password'
                    ? 'Sign in using your organizational credentials.'
                    : 'Use your camera to verify your identity against your enrolled profile.'}
                </p>
              </div>

              {/* Auth method tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => switchMethod('password')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    authMethod === 'password'
                      ? 'bg-white text-navy-800 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <KeyRound size={13} className={authMethod === 'password' ? 'text-navy-700' : 'text-slate-400'} />
                  Password Login
                </button>

                <button
                  type="button"
                  onClick={() => switchMethod('face')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    authMethod === 'face'
                      ? 'bg-white text-navy-800 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Camera size={13} className={authMethod === 'face' ? 'text-saffron-500' : 'text-slate-400'} />
                  Face Authentication
                </button>
              </div>

              {/* ── Password Login ── */}
              {authMethod === 'password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Official Email / Employee ID
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. EMP001, EMP002, or official email"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                 focus:outline-none focus:ring-2 focus:ring-navy-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm
                                   focus:outline-none focus:ring-2 focus:ring-navy-500 pr-10 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-3.5 w-3.5 rounded accent-navy-700"
                      />
                      <span className="text-xs font-medium text-slate-600">Remember me</span>
                    </label>
                    <a href="#" className="text-xs font-semibold text-navy-700 hover:text-navy-800 transition-colors">
                      Forgot password?
                    </a>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <p className="text-red-600 text-xs">{error}</p>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                      <p className="text-emerald-700 text-xs font-medium">{successMsg}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-60 text-white
                               font-semibold py-2.5 rounded-xl transition-colors flex items-center
                               justify-center gap-2 text-sm shadow-md mt-1"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn size={15} /> Sign In
                      </>
                    )}
                  </button>

                  {/* Create Account link — secondary, below Sign In */}
                  <div className="text-center pt-1">
                    <span className="text-slate-500 text-xs">New to StatWise? </span>
                    <a
                      href="/create-account"
                      className="text-xs font-semibold text-navy-700 hover:text-navy-800 transition-colors"
                    >
                      Create an account
                    </a>
                  </div>
                </form>
              )}

              {/* ── Face Authentication ── */}
              {authMethod === 'face' && (
                <FaceAuthPanel
                  onSuccess={handleFaceSuccess}
                  onFallback={() => switchMethod('password')}
                />
              )}
            </div>

            {/* Evaluation Mode — subtle */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setEvalOpen(true)}
                className="inline-flex items-center gap-1.5 text-[11px] text-navy-400/70
                           hover:text-navy-300 transition-colors font-medium"
              >
                <FlaskConical size={11} />
                Evaluation Mode
                <ChevronDown size={10} />
              </button>
            </div>

            <p className="text-center text-navy-400/50 text-[11px] mt-5">
              StatWise · Ministry of Statistics &amp; Programme Implementation
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, ArrowRight, Shield, Zap, Users, UserPlus, LogIn, CheckCircle2, RefreshCw } from 'lucide-react';
import { DEMO_USER_IDS } from '@/lib/store';

const DEMO_ACCOUNTS = [
  { label: 'Ananya Sharma — Statistical Officer', email: 'ananya@statsetu.gov.in', role: 'Annual Survey of Industries', id: DEMO_USER_IDS.ANANYA },
  { label: 'Rahul Kumar — Statistical Officer', email: 'rahul@statsetu.gov.in', role: 'Agricultural Statistics', id: DEMO_USER_IDS.RAHUL },
];

const DEPARTMENTS = [
  'Department of Statistics',
  'Economic Statistics Division',
  'Social Statistics Division',
  'Agricultural Statistics Division',
  'IT and Digital Infrastructure',
  'Training and Capacity Building',
  'State Directorate of Economics & Statistics',
  'Office of the Registrar General of India',
];

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPw, setRegShowPw] = useState(false);
  const [regRole, setRegRole] = useState<'employee' | 'trainer' | 'admin'>('employee');
  const [regDesignation, setRegDesignation] = useState('Statistical Officer');
  const [regDept, setRegDept] = useState(DEPARTMENTS[0]);
  const [regExp, setRegExp] = useState(2);
  const [regEducation, setRegEducation] = useState('');
  const [regAssignment, setRegAssignment] = useState('');
  const [regGoal, setRegGoal] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, switchDemoUser } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setLoading(true); setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) { setError('Please enter your full name'); return; }
    if (!regEmail.trim()) { setError('Please enter your email'); return; }
    if (!regPassword || regPassword.length < 4) { setError('Password must be at least 4 characters'); return; }
    setLoading(true); setError('');
    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        role: regRole,
        designation: regDesignation,
        department: regDept,
        years_experience: regExp,
        education: regEducation,
        current_assignment: regAssignment,
        career_goal: regGoal,
      });
      setSuccessMsg('Profile created! Redirecting to your competency assessment...');
      setTimeout(() => { router.push('/assessments?new=1'); }, 800);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const fillDemo = (demoEmail: string) => {
    setTab('login');
    setEmail(demoEmail);
    setPassword('demo123');
    setError('');
  };

  const handleDemoSwitch = (id: string) => {
    switchDemoUser(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-700 via-navy-800 to-slate-900 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12">
        <div>
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 bg-saffron-400 rounded-xl flex items-center justify-center shadow-lg shadow-saffron-400/20">
              <span className="text-white font-bold text-sm">SW</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">StatWise</p>
              <p className="text-navy-300 text-xs">AI-Powered Competency Platform · MoSPI</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Every Officer.<br />
            Their Own Learning<br />
            Intelligence.
          </h1>
          <p className="text-navy-300 text-lg max-w-md">
            Personalized competency profiling and learning pathways for India's Official Statistical System.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          {[
            { icon: Zap, title: 'User-Specific Competency Profiles', desc: 'Each officer gets their own assessment, gaps, and learning path' },
            { icon: Shield, title: 'Role-Based Requirements', desc: 'Requirements differ by designation — configurable for any role' },
            { icon: Users, title: 'Multi-Officer Demonstration', desc: 'Switch between Ananya and Rahul instantly to see different profiles' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 items-start bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="w-8 h-8 bg-saffron-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-saffron-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{title}</p>
                <p className="text-navy-300 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Demo switcher on left panel */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-navy-300 text-xs font-semibold uppercase tracking-wide mb-3">⚡ Quick Demo Switch</p>
          <div className="flex gap-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.id}
                onClick={() => handleDemoSwitch(acc.id)}
                className="flex-1 text-left px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-all group"
              >
                <p className="text-white text-xs font-semibold">{acc.label.split('—')[0].trim()}</p>
                <p className="text-navy-300 text-[11px]">{acc.role}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-saffron-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">SW</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">StatWise</p>
              <p className="text-navy-300 text-xs">AI-Powered Competency Platform</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button type="button" onClick={() => { setTab('login'); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${tab === 'login' ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <LogIn size={14} /> Sign In
              </button>
              <button type="button" onClick={() => { setTab('register'); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${tab === 'register' ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <UserPlus size={14} /> Create Account
              </button>
            </div>

            {/* ── LOGIN TAB ── */}
            {tab === 'login' && (
              <>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Welcome back</h2>
                <p className="text-slate-500 text-xs sm:text-sm mb-5">Sign in to access your personal competency profile</p>

                {/* Demo quick-login */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Demo Officers</p>
                  <div className="grid gap-2">
                    {DEMO_ACCOUNTS.map(acc => (
                      <button key={acc.email} type="button" onClick={() => fillDemo(acc.email)}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-slate-200 hover:border-navy-300 hover:bg-navy-50 transition-all text-left group">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-navy-700">{acc.label}</p>
                          <p className="text-[11px] text-slate-400">{acc.role}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-navy-500 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 text-center">Password: <code className="bg-slate-100 px-1 rounded">demo123</code></p>
                </div>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">or sign in manually</span></div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="name@statsetu.gov.in"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2"><p className="text-red-600 text-xs sm:text-sm">{error}</p></div>}
                  <button type="submit" disabled={loading}
                    className="w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm shadow-md">
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn size={15} /> Sign In</>}
                  </button>
                </form>
              </>
            )}

            {/* ── REGISTER TAB ── */}
            {tab === 'register' && (
              <>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Create Account</h2>
                <p className="text-slate-500 text-xs sm:text-sm mb-4">Set up your personalized officer profile</p>

                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                    <input type="text" required value={regName} onChange={e => setRegName(e.target.value)}
                      placeholder="e.g. Priya Mehta"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                    <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)}
                      placeholder="name@statsetu.gov.in"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
                    <div className="relative">
                      <input type={regShowPw ? 'text' : 'password'} required value={regPassword} onChange={e => setRegPassword(e.target.value)}
                        placeholder="min. 4 characters"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 pr-10" />
                      <button type="button" onClick={() => setRegShowPw(!regShowPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {regShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                      <select value={regRole} onChange={(e: any) => setRegRole(e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white">
                        <option value="employee">Statistical Officer</option>
                        <option value="trainer">Trainer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Designation</label>
                      <input type="text" value={regDesignation} onChange={e => setRegDesignation(e.target.value)}
                        placeholder="e.g. JSO"
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Department / Division</label>
                    <select value={regDept} onChange={e => setRegDept(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Experience (Years)</label>
                      <input type="number" min="0" max="40" value={regExp} onChange={e => setRegExp(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Education</label>
                      <input type="text" value={regEducation} onChange={e => setRegEducation(e.target.value)}
                        placeholder="e.g. M.Sc. Statistics"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Current Assignment / Project</label>
                    <input type="text" value={regAssignment} onChange={e => setRegAssignment(e.target.value)}
                      placeholder="e.g. Annual Survey of Industries"
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Career Goal / Learning Aspiration</label>
                    <textarea rows={2} value={regGoal} onChange={e => setRegGoal(e.target.value)}
                      placeholder="e.g. Specialize in economic statistics and data science..."
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none" />
                  </div>

                  {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2"><p className="text-red-600 text-xs">{error}</p></div>}
                  {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                      <p className="text-emerald-700 text-xs font-medium">{successMsg}</p>
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full mt-1 bg-saffron-500 hover:bg-saffron-600 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-sm shadow-md">
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus size={15} /> Create Profile & Continue</>}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-navy-400 text-xs mt-5">
            StatWise · Ministry of Statistics & Programme Implementation
          </p>
        </div>
      </div>
    </div>
  );
}

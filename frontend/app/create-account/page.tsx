'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, UserPlus, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

interface FormFields { name: string; employeeId: string; email: string; password: string; confirmPassword: string; terms: boolean; }
interface FormErrors { name?: string; employeeId?: string; email?: string; password?: string; confirmPassword?: string; terms?: string; }

function validateForm(f: FormFields): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim()) e.name = 'Full name is required.';
  else if (f.name.trim().length < 3) e.name = 'Full name must be at least 3 characters.';
  if (!f.employeeId.trim()) e.employeeId = 'Employee ID is required.';
  else if (f.employeeId.trim().length < 3) e.employeeId = 'Please enter a valid Employee ID.';
  if (!f.email.trim()) e.email = 'Official email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Please enter a valid official email address.';
  if (!f.password) e.password = 'Password is required.';
  else if (f.password.length < 8) e.password = 'Password must be at least 8 characters.';
  if (!f.confirmPassword) e.confirmPassword = 'Please confirm your password.';
  else if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match.';
  if (!f.terms) e.terms = 'You must accept the terms to continue.';
  return e;
}

function SuccessOverlay({ name, onContinue }: { name: string; onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,18,35,0.65)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center border border-slate-100">
        <div className="inline-flex p-4 rounded-full mb-4"
          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}>
          <CheckCircle2 size={28} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Account Created Successfully ✓</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-1">Welcome to StatWise, <span className="font-bold text-slate-900">{name}</span>.</p>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">Let&apos;s build your professional learning profile.</p>
        <button onClick={onContinue} className="w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-md">Continue to Onboarding</button>
      </div>
    </div>
  );
}

const STEPS = [
  { n: '1', label: 'Create your account', active: true },
  { n: '2', label: 'Complete professional onboarding', active: false },
  { n: '3', label: 'Take baseline assessment', active: false },
  { n: '4', label: 'Receive your personalized learning path', active: false },
];

export default function CreateAccountPage() {
  const router = useRouter();
  const { register, user, isLoading } = useAuth();
  const [fields, setFields] = useState<FormFields>({ name: '', employeeId: '', email: '', password: '', confirmPassword: '', terms: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      if (user.role === 'admin') router.replace('/admin');
      else if (user.role === 'trainer') router.replace('/trainer');
      else if (user.onboardingCompleted) router.replace('/dashboard');
      else router.replace('/onboarding');
    }
  }, [user, isLoading, router]);

  const set = (field: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFields(prev => ({ ...prev, [field]: val as any }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    setServerError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ve = validateForm(fields);
    if (Object.keys(ve).length > 0) { setErrors(ve); return; }
    setSubmitting(true); setServerError('');
    try {
      await register({ name: fields.name, email: fields.email, password: fields.password, employee_id: fields.employeeId });
      setSuccessName(fields.name.trim());
    } catch (err: any) {
      const msg: string = err?.message || 'Account creation failed. Please try again.';
      if (msg.toLowerCase().includes('email')) setErrors(prev => ({ ...prev, email: msg }));
      else if (msg.toLowerCase().includes('employee id')) setErrors(prev => ({ ...prev, employeeId: msg }));
      else setServerError(msg);
    } finally { setSubmitting(false); }
  };

  const bCls = 'w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition';
  const iCls = (err?: string) => bCls + ' ' + (err ? 'border-red-300 bg-red-50/50 focus:ring-red-200' : 'border-slate-200 focus:ring-navy-200 focus:border-navy-400');

  return (
    <>
      {successName && <SuccessOverlay name={successName} onContinue={() => router.push('/onboarding')} />}
      <div className="min-h-screen bg-gradient-to-br from-navy-700 via-navy-800 to-slate-900 flex">
        <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-saffron-400 rounded-xl flex items-center justify-center shadow-lg shadow-saffron-400/20"><span className="text-white font-bold text-sm">SW</span></div>
              <div><p className="text-white font-bold text-xl">StatWise</p><p className="text-navy-300 text-xs">AI-Powered Competency Platform</p></div>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">Every Officer.<br />Their Own Learning<br />Intelligence.</h1>
            <p className="text-navy-300 text-base max-w-sm leading-relaxed">Personalized competency profiling and learning pathways for India&apos;s Official Statistical System.</p>
          </div>
          <div className="space-y-2">
            {STEPS.map(s => (
              <div key={s.n} className={'flex items-center gap-3 p-3 rounded-xl border ' + (s.active ? 'bg-white/[0.12] border-white/25' : 'bg-white/[0.05] border-white/[0.08]')}>
                <div className={'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ' + (s.active ? 'bg-saffron-400' : 'bg-white/20')}>{s.n}</div>
                <span className={'text-sm ' + (s.active ? 'text-white font-semibold' : 'text-navy-400')}>{s.label}</span>
              </div>
            ))}
          </div>
          <p className="text-navy-300/40 text-[11px]">Ministry of Statistics &amp; Programme Implementation</p>
        </div>
        <div className="flex-1 flex items-start justify-center p-6 sm:p-10 overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-saffron-400 rounded-xl flex items-center justify-center"><span className="text-white font-bold text-xs">SW</span></div>
              <div><p className="text-white font-bold text-lg">StatWise</p><p className="text-navy-300 text-xs">AI-Powered Competency Platform</p></div>
            </div>
            <a href="/login" className="inline-flex items-center gap-1.5 text-navy-300 hover:text-white text-xs font-medium mb-5 transition-colors"><ArrowLeft size={14} /> Back to Sign In</a>
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
              <div className="mb-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0"><UserPlus size={18} className="text-navy-700" /></div>
                  <h2 className="text-xl font-bold text-slate-800">Create Your StatWise Account</h2>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">Create your organizational learning account to get started.</p>
              </div>
              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs">{serverError}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="ca-name" className="block text-xs font-semibold text-slate-700">Full Name</label>
                  <input id="ca-name" type="text" value={fields.name} onChange={set('name')} placeholder="e.g. Ananya Sharma" autoComplete="off" className={iCls(errors.name)} />
                  {errors.name && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={10} />{errors.name}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="ca-empid" className="block text-xs font-semibold text-slate-700">Employee ID</label>
                  <input id="ca-empid" type="text" value={fields.employeeId} onChange={set('employeeId')} placeholder="e.g. EMP-2024-001" autoComplete="off" className={iCls(errors.employeeId)} />
                  {errors.employeeId && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={10} />{errors.employeeId}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="ca-email" className="block text-xs font-semibold text-slate-700">Official Email</label>
                  <input id="ca-email" type="email" value={fields.email} onChange={set('email')} placeholder="name@mospi.gov.in" autoComplete="off" className={iCls(errors.email)} />
                  {errors.email && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={10} />{errors.email}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="ca-pw" className="block text-xs font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <input id="ca-pw" type={showPassword ? 'text' : 'password'} value={fields.password} onChange={set('password')} placeholder="Min. 8 characters" autoComplete="new-password" className={iCls(errors.password) + ' pr-10'} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  {errors.password && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={10} />{errors.password}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="ca-cpw" className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <input id="ca-cpw" type={showConfirm ? 'text' : 'password'} value={fields.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter your password" autoComplete="new-password" className={iCls(errors.confirmPassword) + ' pr-10'} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                  {errors.confirmPassword && <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={10} />{errors.confirmPassword}</p>}
                </div>
                <div className="space-y-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input id="ca-terms" type="checkbox" checked={fields.terms} onChange={set('terms')} className="h-4 w-4 mt-0.5 flex-shrink-0 rounded accent-navy-700" />
                    <span className="text-xs text-slate-600 leading-relaxed">I agree to the StatWise <span className="font-semibold text-navy-700">terms and privacy policy</span>.</span>
                  </label>
                  {errors.terms && <p className="text-[11px] text-red-600 flex items-center gap-1 pl-6"><AlertCircle size={10} />{errors.terms}</p>}
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md mt-1">
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus size={15} /> Create Account</>}
                </button>
              </form>
            </div>
            <p className="text-center text-navy-300 text-xs mt-4">Already have an account?{' '}<a href="/login" className="font-semibold text-saffron-400 hover:text-saffron-300 transition-colors">Sign In</a></p>
          </div>
        </div>
      </div>
    </>
  );
}
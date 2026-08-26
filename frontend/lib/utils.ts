import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDuration(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours}h`;
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getGapColor(gapLabel: string) {
  switch (gapLabel) {
    case 'High': return 'text-red-600 bg-red-50 border-red-200';
    case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'Low': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
}

export function getGapBarColor(gapLabel: string) {
  switch (gapLabel) {
    case 'High': return 'bg-red-500';
    case 'Medium': return 'bg-amber-400';
    case 'Low': return 'bg-blue-400';
    default: return 'bg-emerald-500';
  }
}

export function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export function getProgressColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}

export function getLevelName(level: number) {
  const names: Record<number, string> = {
    1: 'Beginner', 2: 'Basic', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert'
  };
  return names[level] || 'Unknown';
}

export function getProviderColor(provider: string) {
  if (provider.includes('iGOT')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (provider.includes('NSSTA')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (provider.includes('TPAC')) return 'bg-teal-50 text-teal-700 border-teal-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'Beginner': case 'Easy': return 'bg-green-50 text-green-700 border-green-200';
    case 'Intermediate': case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'Advanced': case 'Hard': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function getHour(isToday: boolean) {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

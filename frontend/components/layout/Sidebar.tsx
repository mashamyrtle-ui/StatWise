'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn, getInitials } from '@/lib/utils';
import {
  LayoutDashboard, BookOpen, BarChart3, Target, Map,
  BookMarked, ClipboardList, Sparkles, MessageSquare,
  History, TrendingUp, Users, Building2, Award, Zap,
  LogOut, ChevronLeft, ChevronRight, Bell, User
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  divider?: boolean;
}

const employeeNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/competencies', label: 'My Competencies', icon: Target },
  { href: '/skill-gap', label: 'Skill Gap', icon: BarChart3 },
  { href: '/learning-path', label: 'Learning Path', icon: Map },
  { href: '/courses', label: 'Course Catalogue', icon: BookOpen },
  { href: '/assessments', label: 'Assessments', icon: ClipboardList },
  { href: '/quiz-generator', label: 'AI Quiz Generator', icon: Sparkles },
  { href: '/assistant', label: 'AI Assistant', icon: MessageSquare },
  { href: '/history', label: 'Learning History', icon: History },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminNav: NavItem[] = [
  ...employeeNav,
  { href: '/admin', label: 'Workforce Analytics', icon: Users, divider: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = user?.role === 'admin' ? adminNav : employeeNav;

  return (
    <aside
      className={cn(
        'flex flex-col bg-navy-700 text-white transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-navy-600',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex-shrink-0 w-8 h-8 bg-saffron-400 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">SW</span>
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-sm leading-none">StatWise</p>
            <p className="text-navy-300 text-xs mt-0.5">MoSPI · Prototype</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const showDivider = 'divider' in item && item.divider;

          return (
            <div key={item.href}>
              {showDivider && !collapsed && (
                <div className="mx-2 my-3 border-t border-navy-600">
                  <p className="text-navy-400 text-xs font-medium mt-2 mb-1 px-1">Administration</p>
                </div>
              )}
              {showDivider && collapsed && <div className="my-2 border-t border-navy-600" />}
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5',
                  'transition-all duration-150',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-navy-600 text-white'
                    : 'text-navy-200 hover:bg-navy-600 hover:text-white'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User profile + collapse toggle */}
      <div className="border-t border-navy-600 p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-saffron-400 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{getInitials(user.name)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.name}</p>
              <p className="text-navy-300 text-xs truncate capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <div className="flex gap-1">
          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-navy-300 hover:bg-navy-600 hover:text-white text-xs transition-all',
              collapsed ? 'w-full justify-center' : 'flex-1'
            )}
            title="Sign out"
          >
            <LogOut size={14} />
            {!collapsed && <span>Sign out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-navy-300 hover:bg-navy-600 hover:text-white transition-all"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </div>
    </aside>
  );
}

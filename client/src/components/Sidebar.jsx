import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Award,
  FileCheck,
  Briefcase,
  BarChart3,
  ShieldCheck,
  Fingerprint,
  ChevronRight,
  LogOut,
  Compass,
  GraduationCap,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', to: '/', icon: LayoutGrid },
    { name: 'My skills', to: '/skills', icon: Award },
    { name: 'Evidence', to: '/evidence', icon: FileCheck },
    { name: 'Job matching', to: '/jobs', icon: Briefcase },
    { name: 'Gap reports', to: '/reports', icon: BarChart3 },
    { name: 'Learning path', to: '/learning-path', icon: Compass },
    { name: 'Assessments', to: '/assessments', icon: GraduationCap },
    { name: 'Student profile', to: '/profile', icon: User }
  ];

  // Generate user initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ST';

  return (
    <aside className="w-64 bg-[#0E1318] border-r border-[#1B232E] flex flex-col justify-between h-screen sticky top-0 p-4 select-none">
      {/* Brand & User Profile */}
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-lg bg-[#A3E635] flex items-center justify-center text-black shadow-[0_0_15px_rgba(163,230,53,0.3)]">
            <Fingerprint className="w-6 h-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              SkillTwin
            </div>
            <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">
              AI WORKSPACE
            </div>
          </div>
        </div>

        {/* User Card */}
        <div
          onClick={() => navigate('/profile')}
          className="bg-[#141B24] border border-[#202B38] rounded-xl p-3 flex items-center justify-between hover:border-[#2D3D50] transition-colors cursor-pointer group"
          title="View & Edit Student Profile"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1F2A38] border border-[#2D3D50] flex items-center justify-center text-xs font-bold text-[#A3E635]">
              {initials}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate max-w-[110px]">
                {user?.name || 'Student Profile'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {profile?.department ? 'Student profile' : 'Undergraduate'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#A3E635] transition-colors" />
        </div>

        {/* Navigation Section */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-2 mb-2">
            Workspace
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#19241C] text-[#A3E635] border border-[#273B25]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#141B24]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-[#A3E635]' : 'text-slate-400'
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-[#A3E635] text-black'
                              : 'bg-[#202B38] text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Privacy Card & Logout */}
      <div className="space-y-3 pt-4 border-t border-[#1B232E]">
        <div className="bg-[#121A15] border border-[#1E3023] rounded-xl p-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#A3E635] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-[#D1FAE5]">
                Your evidence is private
              </div>
              <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                Only you can see files and reports.
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-[#1E1517] transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

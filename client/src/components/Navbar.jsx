import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'OVERVIEW';
      case '/skills':
        return 'MY SKILLS';
      case '/evidence':
        return 'EVIDENCE REPOSITORY';
      case '/jobs':
        return 'JOB MATCHING';
      case '/reports':
        return 'GAP REPORTS';
      default:
        return 'WORKSPACE';
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SF';

  return (
    <header className="h-16 border-b border-[#1B232E] bg-[#0E1318]/90 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Breadcrumbs & Version Alert */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span className="text-slate-500">WORKSPACE</span>
          <span className="text-slate-600">&gt;</span>
          <span className="text-white font-bold">{getPageTitle(location.pathname)}</span>
        </div>

        {/* Sync Pill from screenshot */}
        <div className="hidden lg:flex items-center gap-2 bg-[#141B24] border border-[#202B38] px-3 py-1 rounded-full text-xs text-slate-300">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>A newer version is available.</span>
          <button className="bg-white text-black hover:bg-slate-200 px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors ml-1">
            Sync
          </button>
        </div>
      </div>

      {/* Right Controls: Search, Bell, Profile */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search your workspace"
            className="w-56 bg-[#141B24] border border-[#202B38] text-xs text-white placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-[#A3E635] focus:w-64 transition-all"
          />
        </div>

        {/* Notification Bell */}
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#141B24] relative transition-colors">
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-[#A3E635] rounded-full absolute top-2 right-2 ring-2 ring-[#0E1318]" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#182619] border border-[#2E4A28] flex items-center justify-center text-xs font-bold text-[#A3E635] ring-2 ring-[#0E1318]">
          {initials}
        </div>
      </div>
    </header>
  );
}

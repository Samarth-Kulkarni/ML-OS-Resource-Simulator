import React from 'react';
import { LayoutDashboard, Cpu, ShieldAlert, HardDrive, Terminal } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cpu', label: 'CPU Scheduling', icon: Cpu },
    { id: 'deadlock', label: "Banker's Algorithm", icon: ShieldAlert },
    { id: 'disk', label: 'Disk Scheduling', icon: HardDrive },
  ];

  return (
    <header className="bg-[#161616] border-b border-[#393939] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-stretch md:items-center min-h-[48px]">
        {/* Brand Header */}
        <div className="flex items-center gap-3 py-2.5 md:py-0 border-b md:border-b-0 border-[#262626]">
          <div className="bg-[#0f62fe] p-1.5 text-white flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-white tracking-tight text-sm">ML Augmented OS Resource Simulator</h1>
            <p className="text-[11px] text-[#8d8d8d]">Process, Deadlock & Disk Management Engine</p>
          </div>
        </div>

        {/* Carbon Shell Navigation Tabs */}
        <nav className="flex overflow-x-auto no-scrollbar items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 h-12 text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#0f62fe] bg-[#262626] text-white'
                    : 'border-transparent text-[#c6c6c6] hover:bg-[#262626]/60 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0f62fe]' : 'text-[#8d8d8d]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
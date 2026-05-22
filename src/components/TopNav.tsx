import React from 'react';
import { Settings, FileText } from 'lucide-react';

interface TopNavProps {
  onOpenAdmin: () => void;
  onOpenReport: () => void;
}

export function TopNav({ onOpenAdmin, onOpenReport }: TopNavProps) {
  return (
    <header className="bg-fb-card w-full border-b border-fb-border h-14 flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-fb-blue text-white flex items-center justify-center font-bold text-lg header-logo-shadow">
          T
        </div>
        <h1 className="font-bold text-fb-text text-lg">Theory11</h1>
      </div>
      <div className="flex space-x-2">
        <button onClick={onOpenReport} className="w-10 h-10 rounded-full bg-fb-bg flex items-center justify-center hover:bg-gray-200 transition-colors" title="Reports">
          <FileText className="w-5 h-5 text-fb-text" />
        </button>
        <button onClick={onOpenAdmin} className="w-10 h-10 rounded-full bg-fb-bg flex items-center justify-center hover:bg-gray-200 transition-colors" title="Admin">
          <Settings className="w-5 h-5 text-fb-text" />
        </button>
      </div>
    </header>
  );
}

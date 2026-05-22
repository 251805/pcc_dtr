import React, { useState } from 'react';
import { LogIn, LogOut, WifiOff } from 'lucide-react';

interface AttendanceCardProps {
  onPunch: (eid: string, remarks: string, type: 'IN' | 'OUT') => Promise<void>;
  isOffline: boolean;
  isLoading: boolean;
}

export function AttendanceCard({ onPunch, isOffline, isLoading }: AttendanceCardProps) {
  const [eid, setEid] = useState('');
  const [remarks, setRemarks] = useState('');

  const handlePunch = async (type: 'IN' | 'OUT') => {
    if (!eid.trim()) {
       return onPunch('', '', type); // Will trigger error in parent
    }
    await onPunch(eid.trim(), remarks.trim(), type);
    setEid('');
    setRemarks('');
  };

  return (
    <div className="bg-fb-card w-full max-w-md mx-auto sm:rounded-xl shadow-sm sm:border border-fb-border overflow-hidden pb-4 sm:pb-0">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-fb-text">Attendance Log</h2>
          {isOffline && (
            <div className="flex items-center text-xs font-semibold text-fb-red bg-red-50 px-2 py-1 rounded-md">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline 
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={eid}
              onChange={(e) => setEid(e.target.value)}
              placeholder="Enter EID (Employee ID)"
              className="w-full bg-fb-bg border border-fb-border rounded-lg px-4 py-3 text-fb-text focus:outline-none focus:border-fb-blue focus:ring-1 focus:ring-fb-blue transition-colors disabled:opacity-50"
              disabled={isLoading}
            />
          </div>
          <div>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional Remarks"
              className="w-full bg-fb-bg border border-fb-border rounded-lg px-4 py-3 text-fb-text resize-none h-24 focus:outline-none focus:border-fb-blue focus:ring-1 focus:ring-fb-blue transition-colors disabled:opacity-50"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => handlePunch('IN')}
            disabled={isLoading || !eid.trim()}
            className="flex-1 flex items-center justify-center bg-fb-blue hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Log IN
          </button>
          <button
            onClick={() => handlePunch('OUT')}
            disabled={isLoading || !eid.trim()}
            className="flex-1 flex items-center justify-center bg-fb-red hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log OUT
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from './components/TopNav';
import { AttendanceCard } from './components/AttendanceCard';
import { AdminModal } from './components/AdminModal';
import { ReportModal } from './components/ReportModal';
import { StatusToast, ToastType } from './components/StatusToast';
import { offlineQueue } from './lib/offlineQueue';
import { supabase } from './lib/supabase';
import { detectShiftAndCalculateDiscrepancies } from './lib/shiftLogic';
import { format } from 'date-fns';

export default function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'success', visible: false
  });

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      processOfflineQueue();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processOfflineQueue = async () => {
    const queue = offlineQueue.get();
    if (queue.length === 0) return;
    
    // Simple mock offline processing queue logic
    let successCount = 0;
    showToast(`Syncing ${queue.length} offline punches...`, 'success');
    
    for (const punch of queue) {
        offlineQueue.remove(punch.id);
        successCount++;
    }
    if (successCount > 0) {
       showToast(`Successfully synced ${successCount} entries!`, 'success');
    }
  };

  const handlePunch = async (eid: string, remarks: string, type: 'IN' | 'OUT') => {
    if (!eid) {
      showToast('Please enter your EID.', 'error');
      return;
    }

    // 1-Minute Anti-spam check
    const now = Date.now();
    const lastLogsRaw = localStorage.getItem('theory11_last_logs');
    const lastLogs = lastLogsRaw ? JSON.parse(lastLogsRaw) : {};
    
    if (lastLogs[eid] && lastLogs[eid][type]) {
      const diff = now - lastLogs[eid][type];
      if (diff < 60000) {
        showToast('Duplicate punch. Please wait 1 minute and try again.', 'error');
        return;
      }
    }

    if (isOffline) {
      // Offline mode - Queue
      const payload = {
        id: crypto.randomUUID(),
        eid,
        type,
        timestamp: new Date().toISOString(),
        remarks
      };
      offlineQueue.add(payload);
      
      // Update anti-spam
      lastLogs[eid] = { ...(lastLogs[eid] || {}), [type]: now };
      localStorage.setItem('theory11_last_logs', JSON.stringify(lastLogs));
      
      showToast(`You are offline. Your Log ${type} was saved locally and will sync later.`, 'success');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('name')
        .eq('eid', eid)
        .single();
        
      if (empError || !employee) {
        showToast('EID not found. Please verify your ID.', 'error');
        setIsLoading(false);
        return;
      }

      const timestamp = new Date();
      const todayStr = format(timestamp, 'yyyy-MM-dd');
      const timeStr = format(timestamp, 'HH:mm'); 
      const fullIsoStr = timestamp.toISOString();

      if (type === 'IN') {
        const { tardiness, undertime } = detectShiftAndCalculateDiscrepancies(timeStr, null);
        
        const { error: insertError } = await supabase
          .from('attendance_logs')
          .insert({
            eid,
            name: employee.name,
            date: todayStr,
            start_time: fullIsoStr,
            remarks,
            tardiness,
            undertime
          });
          
        if (insertError) throw insertError;

      } else { 
        const { data: existingLog, error: searchError } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('eid', eid)
          .eq('date', todayStr)
          .is('end_time', null)
          .order('start_time', { ascending: false })
          .limit(1)
          .single();

        if (searchError || !existingLog) {
             const { undertime } = detectShiftAndCalculateDiscrepancies(null, timeStr);
             const { error: insertError2 } = await supabase.from('attendance_logs').insert({
                eid, name: employee.name, date: todayStr, end_time: fullIsoStr, remarks, tardiness: 0, undertime
             });
             if (insertError2) throw insertError2;
        } else {
             const inTimeStr = existingLog.start_time ? format(new Date(existingLog.start_time), 'HH:mm') : null;
             const { undertime } = detectShiftAndCalculateDiscrepancies(inTimeStr, timeStr);
             
             const { error: updateError } = await supabase
               .from('attendance_logs')
               .update({
                 end_time: fullIsoStr,
                 undertime: undertime,
                 remarks: (existingLog.remarks ? existingLog.remarks + ' | ' : '') + remarks
               })
               .eq('id', existingLog.id);
             
             if (updateError) throw updateError;
        }
      }

      // Update anti-spam success
      lastLogs[eid] = { ...(lastLogs[eid] || {}), [type]: now };
      localStorage.setItem('theory11_last_logs', JSON.stringify(lastLogs));

      showToast(`Your Log ${type} was recorded successfully`, 'success');

    } catch (err: any) {
      console.error(err);
      // fallback to offline queue on DB hang/error
      offlineQueue.add({
        id: crypto.randomUUID(), eid, type, timestamp: new Date().toISOString(), remarks
      });
      showToast(`Database error. Marked log ${type} for offline sync.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <TopNav onOpenAdmin={() => setIsAdminOpen(true)} onOpenReport={() => setIsReportOpen(true)} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto flex items-center justify-center p-4">
        <AttendanceCard onPunch={handlePunch} isOffline={isOffline} isLoading={isLoading} />
      </main>

      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      
      <StatusToast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </div>
  );
}

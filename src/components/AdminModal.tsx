import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Trash2, Plus, QrCode } from 'lucide-react';
import { AdminRole, Employee } from '../types';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [role, setRole] = useState<AdminRole>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  useEffect(() => {
    if (role && isOpen) {
      fetchEmployees();
    }
  }, [role, isOpen]);

  const handleLogin = () => {
    setErrorMsg('');
    const u = username.trim().toLowerCase();
    const p = password.trim();

    if (u === 'lee' && (p === 'metallica' || p === 'METALLICA')) {
      setRole('ROOT');
    } else if (u === 'admin' && p === '2026pcc2026') {
      setRole('TEAMS');
    } else {
      setErrorMsg('Invalid administrative credentials.');
    }
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('employees').select('*').order('name');
    if (error) {
      console.error(error);
      setErrorMsg('Failed to load employees.');
    } else {
      setEmployees(data || []);
    }
    setIsLoading(false);
  };

  const handleAddRow = () => {
    setEmployees([{ eid: '', name: '', rate_per_day: 0, philhealth: 0 }, ...employees]);
  };

  const handleEmployeeChange = (index: number, field: keyof Employee, value: string | number) => {
    const updated = [...employees];
    updated[index] = { ...updated[index], [field]: value };
    setEmployees(updated);
  };

  const handleDelete = async (index: number) => {
    const emp = employees[index];
    if (emp.id) {
      const confirmDelete = window.confirm(`Are you sure you want to delete ${emp.name}?`);
      if (!confirmDelete) return;
      setIsLoading(true);
      const { error } = await supabase.from('employees').delete().eq('id', emp.id);
      setIsLoading(false);
      if (error) {
        alert('Failed to delete employee: ' + error.message);
        return;
      }
    }
    const updated = [...employees];
    updated.splice(index, 1);
    setEmployees(updated);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const toUpsert = employees.filter(e => e.eid && e.name).map(e => ({
      id: e.id || undefined,
      eid: e.eid.trim(),
      name: e.name.trim(),
      full_name: e.name.trim(),
      rate_per_day: Number(e.rate_per_day) || 0,
      philhealth: Number(e.philhealth) || 0
    }));

    const { error } = await supabase.from('employees').upsert(toUpsert, { onConflict: 'eid' });
    setIsLoading(false);
    
    if (error) {
      setErrorMsg('Failed to save changes: ' + error.message);
    } else {
      alert('Changes saved successfully!');
      fetchEmployees();
    }
  };

  const showQrCode = (eid: string) => {
    setQrCodeData(eid);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-fb-card w-full max-w-4xl rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-fb-border">
              <h2 className="font-bold text-xl text-fb-text">
                {role ? `Admin Panel (${role})` : 'Administrative Login'}
              </h2>
              <button onClick={() => { onClose(); setQrCodeData(null); }} className="p-2 bg-fb-bg hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-fb-subtext" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
                {!role ? (
                  <div className="max-w-sm mx-auto space-y-4">
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-fb-bg border border-fb-border rounded-lg px-4 py-3 text-fb-text focus:outline-none focus:border-fb-blue focus:ring-1 focus:ring-fb-blue"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-fb-bg border border-fb-border rounded-lg px-4 py-3 text-fb-text focus:outline-none focus:border-fb-blue focus:ring-1 focus:ring-fb-blue"
                    />
                    {errorMsg && <p className="text-fb-red text-sm font-semibold">{errorMsg}</p>}
                    <button 
                      onClick={handleLogin}
                      className="w-full bg-fb-blue hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      Login
                    </button>
                  </div>
                ) : qrCodeData ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-6">
                    <h3 className="font-bold text-lg">System QR Code for EID: {qrCodeData}</h3>
                    <div className="p-4 bg-white rounded-xl shadow-sm border border-fb-border">
                       <QRCodeSVG value={qrCodeData} size={256} />
                    </div>
                    <button 
                      onClick={() => setQrCodeData(null)}
                      className="px-6 py-2 bg-fb-bg hover:bg-gray-200 text-fb-text font-medium rounded-lg transition-colors border border-fb-border"
                    >
                      Back to Roster
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Employee Roster</h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={handleAddRow}
                          className="flex items-center px-4 py-2 bg-fb-bg hover:bg-gray-200 text-fb-text font-medium rounded-lg transition-colors border border-fb-border"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add 
                        </button>
                        <button 
                          onClick={handleSave}
                          disabled={isLoading}
                          className="flex items-center px-4 py-2 bg-fb-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4 mr-2" /> Save All
                        </button>
                      </div>
                    </div>
                    {errorMsg && <p className="text-fb-red text-sm font-semibold">{errorMsg}</p>}
                    
                    <div className="overflow-x-auto border border-fb-border rounded-lg">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-fb-bg text-fb-subtext border-b border-fb-border uppercase">
                          <tr>
                            <th className="px-4 py-3 font-semibold">EID</th>
                            <th className="px-4 py-3 font-semibold">Full Name</th>
                            <th className="px-4 py-3 font-semibold text-right">Rate / Day</th>
                            <th className="px-4 py-3 font-semibold text-right">PhilHealth</th>
                            <th className="px-4 py-3 font-semibold text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-fb-border">
                          {employees.map((emp, idx) => (
                            <tr key={emp.id || `new-${idx}`} className="hover:bg-fb-bg/50 transition-colors">
                              <td className="px-4 py-2">
                                <input 
                                  type="text" 
                                  value={emp.eid} 
                                  onChange={(e) => handleEmployeeChange(idx, 'eid', e.target.value)}
                                  className="w-24 px-2 py-1 bg-white border border-fb-border rounded focus:border-fb-blue focus:outline-none"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input 
                                  type="text" 
                                  value={emp.name} 
                                  onChange={(e) => handleEmployeeChange(idx, 'name', e.target.value)}
                                  className="w-full min-w-[200px] px-2 py-1 bg-white border border-fb-border rounded focus:border-fb-blue focus:outline-none"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input 
                                  type="number" 
                                  value={emp.rate_per_day || ''} 
                                  onChange={(e) => handleEmployeeChange(idx, 'rate_per_day', e.target.value)}
                                  className="w-24 text-right px-2 py-1 bg-white border border-fb-border rounded focus:border-fb-blue focus:outline-none ml-auto block"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input 
                                  type="number" 
                                  value={emp.philhealth || ''} 
                                  onChange={(e) => handleEmployeeChange(idx, 'philhealth', e.target.value)}
                                  className="w-24 text-right px-2 py-1 bg-white border border-fb-border rounded focus:border-fb-blue focus:outline-none ml-auto block"
                                />
                              </td>
                              <td className="px-4 py-2 flex justify-center space-x-2">
                                <button 
                                  onClick={() => emp.eid && showQrCode(emp.eid)}
                                  title="Generate QR"
                                  className="p-1.5 text-fb-subtext hover:text-fb-text bg-fb-bg hover:bg-gray-200 rounded transition-colors"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(idx)}
                                  title="Delete"
                                  className="p-1.5 text-fb-red hover:text-white hover:bg-fb-red bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {employees.length === 0 && !isLoading && (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-fb-subtext">
                                No employees found in the roster. Add one to begin.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

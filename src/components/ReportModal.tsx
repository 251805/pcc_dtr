import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Download, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AttendanceLog } from '../types';
import { format, differenceInMinutes, parseISO, isValid } from 'date-fns';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [eid, setEid] = useState('');
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<AttendanceLog[]>([]);
  const [empName, setEmpName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleGenerate = async () => {
    if (!eid.trim()) {
      alert('Please enter an EID.');
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    
    // First verify EID
    const { data: emp, error: empErr } = await supabase.from('employees').select('name').eq('eid', eid).single();
    if (empErr || !emp) {
      alert('EID not found.');
      setIsLoading(false);
      setReportData([]);
      return;
    }
    
    setEmpName(emp.name);
    
    // Build date range for the month
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0); // Last day of month
    
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    const { data: logs, error: logsErr } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('eid', eid)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true });
      
    if (logsErr) {
      alert('Error fetching logs: ' + logsErr.message);
    } else {
      setReportData(logs || []);
    }
    
    setIsLoading(false);
  };

  const calculateHours = (log: AttendanceLog) => {
    if (!log.start_time || !log.end_time) return '-';
    const start = parseISO(log.start_time);
    const end = parseISO(log.end_time);
    if (!isValid(start) || !isValid(end)) return '-';
    
    const mins = differenceInMinutes(end, start);
    if (mins <= 0) return '-';
    return (mins / 60).toFixed(2);
  };

  const totalHours = reportData.reduce((acc, log) => {
    const hrs = parseFloat(calculateHours(log));
    return isNaN(hrs) ? acc : acc + hrs;
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    if (reportData.length === 0) return;
    
    let csv = `Name:,${empName}\n`;
    csv += `EID:,${eid}\n`;
    csv += `Total Hours:,${totalHours.toFixed(2)}\n\n`;
    csv += `AC no,Name,Start Time,End Time,Date,Remarks,Tardiness,Undertime,Gross No of days,Less: Deduction for Late/Undertime\n`;
    
    reportData.forEach(row => {
      const timeIn = row.start_time ? format(parseISO(row.start_time), 'H:mm') : '';
      const timeOut = row.end_time ? format(parseISO(row.end_time), 'H:mm') : '';
      const dateStr = row.date ? format(parseISO(row.date), 'MM/dd/yyyy') : '';
      const rem = (row.remarks || '').replace(/"/g, '""');
      
      csv += `${eid},"${empName}",${timeIn},${timeOut},${dateStr},"${rem}",${row.tardiness || ''},${row.undertime || ''},,\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Attendance_Report_${empName.replace(/\\s/g, '_')}_${MONTHS[monthIndex]}.csv`;
    link.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 flex flex-col items-center justify-center p-4 backdrop-blur-sm print:bg-white print:p-0 print:block"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-fb-card w-full max-w-4xl rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden print:shadow-none print:max-w-full print:max-h-full print:rounded-none"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-fb-border print:hidden">
              <h2 className="font-bold text-xl text-fb-text">Monthly Attendance Report</h2>
              <button onClick={onClose} className="p-2 bg-fb-bg hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-fb-subtext" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto print:overflow-visible print:p-4">
              
              <div className="flex flex-col md:flex-row gap-4 mb-6 print:hidden">
                <input 
                  type="text"
                  placeholder="Enter EID"
                  value={eid}
                  onChange={(e) => setEid(e.target.value)}
                  className="flex-1 bg-fb-bg border border-fb-border rounded-lg px-4 py-2 text-fb-text focus:outline-none focus:border-fb-blue focus:ring-1 focus:ring-fb-blue"
                />
                <select 
                  value={monthIndex}
                  onChange={(e) => setMonthIndex(Number(e.target.value))}
                  className="bg-fb-bg border border-fb-border rounded-lg px-4 py-2 text-fb-text focus:outline-none focus:border-fb-blue focus:ring-1 focus:ring-fb-blue"
                >
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select 
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="bg-fb-bg border border-fb-border rounded-lg px-4 py-2 text-fb-text focus:outline-none focus:border-fb-blue focus:ring-1 focus:ring-fb-blue"
                >
                  {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button 
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex items-center justify-center bg-fb-blue hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isLoading ? 'Searching...' : 'Generate'}
                </button>
              </div>

              {hasSearched && !isLoading && (
                <div className="report-container">
                  {reportData.length > 0 ? (
                    <>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-fb-blue">Report for {empName}</h3>
                          <p className="text-fb-subtext mt-1">{MONTHS[monthIndex]} {year} • EID: <span className="font-semibold text-fb-text">{eid}</span></p>
                          <p className="text-fb-text mt-2 text-lg">Total Hours Worked: <span className="font-bold">{totalHours.toFixed(2)}</span></p>
                        </div>
                        <div className="flex space-x-3 mt-4 md:mt-0 print:hidden">
                           <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-fb-bg hover:bg-gray-200 text-fb-text font-medium rounded-lg border border-fb-border transition-colors">
                             <Printer className="w-4 h-4 mr-2" /> Print
                           </button>
                           <button onClick={handleDownloadCsv} className="flex items-center px-4 py-2 bg-[#31a24c] hover:bg-[#2b9043] text-white font-medium rounded-lg transition-colors">
                             <Download className="w-4 h-4 mr-2" /> CSV
                           </button>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto border border-fb-border rounded-lg print:border-none print:overflow-visible mt-4">
                        <table className="w-full text-left text-sm print:text-xs border-collapse">
                          <thead className="bg-fb-bg text-fb-subtext uppercase print:bg-gray-100 print:text-black">
                            <tr>
                              <th className="px-4 py-3 font-semibold print:px-2 print:py-1 border border-fb-border print:border-black">AC no</th>
                              <th className="px-4 py-3 font-semibold print:px-2 print:py-1 border border-fb-border print:border-black">Name</th>
                              <th className="px-4 py-3 font-semibold print:px-2 print:py-1 border border-fb-border print:border-black">Start Time</th>
                              <th className="px-4 py-3 font-semibold print:px-2 print:py-1 border border-fb-border print:border-black">End Time</th>
                              <th className="px-4 py-3 font-semibold print:px-2 print:py-1 border border-fb-border print:border-black">Date</th>
                              <th className="px-4 py-3 font-semibold print:px-2 print:py-1 border border-fb-border print:border-black">Remarks</th>
                              <th className="px-4 py-3 font-semibold print:px-2 print:py-1 border border-fb-border print:border-black">Tardiness</th>
                              <th className="px-4 py-3 font-semibold print:px-2 print:py-1 border border-fb-border print:border-black">Undertime</th>
                              <th className="px-4 py-3 font-semibold print:px-2 print:py-1 border border-fb-border print:border-black">Gross No of days</th>
                              <th className="px-4 py-3 font-semibold print:px-2 print:py-1 border border-fb-border print:border-black">Less: Deduction for Late/Undertime</th>
                            </tr>
                          </thead>
                          <tbody className="print:divide-y-0">
                            {reportData.map((row, i) => (
                              <tr key={i} className="hover:bg-fb-bg/50 print:hover:bg-transparent">
                                <td className="px-4 py-3 print:px-2 print:py-1 whitespace-nowrap border border-fb-border print:border-black">{eid}</td>
                                <td className="px-4 py-3 print:px-2 print:py-1 whitespace-nowrap border border-fb-border print:border-black">{empName}</td>
                                <td className="px-4 py-3 print:px-2 print:py-1 whitespace-nowrap border border-fb-border print:border-black">{row.start_time ? format(parseISO(row.start_time), 'H:mm') : ''}</td>
                                <td className="px-4 py-3 print:px-2 print:py-1 whitespace-nowrap border border-fb-border print:border-black">{row.end_time ? format(parseISO(row.end_time), 'H:mm') : ''}</td>
                                <td className="px-4 py-3 print:px-2 print:py-1 whitespace-nowrap border border-fb-border print:border-black">{row.date ? format(parseISO(row.date), 'MM/dd/yyyy') : ''}</td>
                                <td className="px-4 py-3 print:px-2 print:py-1 border border-fb-border print:border-black">{row.remarks || ''}</td>
                                <td className="px-4 py-3 print:px-2 print:py-1 whitespace-nowrap border border-fb-border print:border-black">{row.tardiness || ''}</td>
                                <td className="px-4 py-3 print:px-2 print:py-1 whitespace-nowrap border border-fb-border print:border-black">{row.undertime || ''}</td>
                                <td className="px-4 py-3 print:px-2 print:py-1 whitespace-nowrap border border-fb-border print:border-black"></td>
                                <td className="px-4 py-3 print:px-2 print:py-1 whitespace-nowrap border border-fb-border print:border-black"></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                     <div className="text-center py-12 border border-dashed border-fb-border rounded-lg bg-fb-bg/30">
                        <p className="text-fb-subtext">No logs found for this period.</p>
                     </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

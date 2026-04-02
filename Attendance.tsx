import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { Clock, RefreshCw, AlertTriangle, FileText, CheckCircle, XCircle } from 'lucide-react';
import { AttendanceRecord, AttendanceAppeal } from '../types';

export const Attendance: React.FC = () => {
  const { currentUser, attendanceRecords, syncAttendanceRecords, checkAttendanceAnomalies, submitAttendanceAppeal, t } = useAppContext();
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [appealForm, setAppealForm] = useState<Omit<AttendanceAppeal, 'status' | 'submittedAt'>>({
    type: 'both',
    reason: '',
    actualClockIn: '',
    actualClockOut: '',
    location: ''
  });

  if (!currentUser) return null;

  const userRecords = attendanceRecords
    .filter(r => r.userId === currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAppealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    submitAttendanceAppeal(selectedRecord.id, appealForm);
    setSelectedRecord(null);
    setAppealForm({ type: 'both', reason: '', actualClockIn: '', actualClockOut: '', location: '' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">打卡紀錄 (Attendance)</h1>
        <div className="flex space-x-2">
          <button
            onClick={checkAttendanceAnomalies}
            className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            檢查異常 (Check Anomalies)
          </button>
          <button
            onClick={() => syncAttendanceRecords(currentUser.id)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            同步紀錄 (Sync)
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">
            員工編號: {currentUser.attendanceId || '未設定 (Not set)'}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            顯示最近的打卡紀錄。
          </p>
        </div>
        
        {userRecords.length === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">
            <Clock className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p>暫無打卡紀錄。請點擊「同步紀錄」獲取最新資料。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">日期 (Date)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">上班 (Clock In)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">下班 (Clock Out)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">工時 (Hours)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">狀態 (Status)</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {userRecords.map((record) => {
                  const isAnomaly = !record.clockIn || !record.clockOut || (record.workHours !== undefined && record.workHours < 6);
                  return (
                  <tr key={record.id} className={isAnomaly && !record.appeal ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white flex items-center">
                      {isAnomaly && !record.appeal && <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />}
                      {record.date}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${!record.clockIn ? 'text-red-500 font-bold' : 'text-slate-500 dark:text-slate-300'}`}>
                      {record.clockIn ? format(new Date(record.clockIn), 'HH:mm') : 'Missing'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${!record.clockOut ? 'text-red-500 font-bold' : 'text-slate-500 dark:text-slate-300'}`}>
                      {record.clockOut ? format(new Date(record.clockOut), 'HH:mm') : 'Missing'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${record.workHours !== undefined && record.workHours < 6 ? 'text-red-500 font-bold' : 'text-slate-500 dark:text-slate-300'}`}>
                      {record.workHours !== undefined ? record.workHours : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.appeal ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.appeal.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          record.appeal.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {record.appeal.status === 'Approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {record.appeal.status === 'Rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {record.appeal.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                          Appeal {record.appeal.status}
                        </span>
                      ) : isAnomaly ? (
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setAppealForm({
                              type: !record.clockIn && !record.clockOut ? 'both' : !record.clockIn ? 'clock-in' : 'clock-out',
                              reason: '',
                              actualClockIn: '',
                              actualClockOut: '',
                              location: ''
                            });
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          提交申訴 (Appeal)
                        </button>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">Normal</span>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              打卡異常申訴 (Attendance Appeal) - {selectedRecord.date}
            </h2>
            <form onSubmit={handleAppealSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  申訴類型 (Appeal Type)
                </label>
                <select
                  required
                  value={appealForm.type}
                  onChange={(e) => setAppealForm({ ...appealForm, type: e.target.value as any })}
                  className="w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-slate-500 focus:ring-slate-500"
                >
                  <option value="clock-in">欠缺上班打卡 (Missing Clock-in)</option>
                  <option value="clock-out">欠缺下班打卡 (Missing Clock-out)</option>
                  <option value="both">欠缺上下班打卡 (Missing Both)</option>
                </select>
              </div>

              {(appealForm.type === 'clock-in' || appealForm.type === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    實際上班時間 (Actual Clock-in Time)
                  </label>
                  <input
                    type="time"
                    required
                    value={appealForm.actualClockIn}
                    onChange={(e) => setAppealForm({ ...appealForm, actualClockIn: e.target.value })}
                    className="w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-slate-500 focus:ring-slate-500"
                  />
                </div>
              )}

              {(appealForm.type === 'clock-out' || appealForm.type === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    實際下班時間 (Actual Clock-out Time)
                  </label>
                  <input
                    type="time"
                    required
                    value={appealForm.actualClockOut}
                    onChange={(e) => setAppealForm({ ...appealForm, actualClockOut: e.target.value })}
                    className="w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-slate-500 focus:ring-slate-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  地點 (Location)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office, Site A, Work from Home"
                  value={appealForm.location}
                  onChange={(e) => setAppealForm({ ...appealForm, location: e.target.value })}
                  className="w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-slate-500 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  原因 (Reason)
                </label>
                <textarea
                  required
                  rows={3}
                  value={appealForm.reason}
                  onChange={(e) => setAppealForm({ ...appealForm, reason: e.target.value })}
                  className="w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-slate-500 focus:ring-slate-500"
                  placeholder="Please explain why the clock-in/out was missed..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                >
                  取消 (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 rounded-md shadow-sm"
                >
                  提交 (Submit)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useAppContext } from '../context/AppContext';
import { format, parseISO } from 'date-fns';
import { Check, X, Clock, MapPin, FileText } from 'lucide-react';

export const Approvals: React.FC = () => {
  const { currentUser, getPendingApprovals, approveLeave, users, attendanceRecords, processAttendanceAppeal, t } = useAppContext();

  const pendingRequests = getPendingApprovals(currentUser?.id || '').sort((a, b) => 
    new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
  );

  const pendingAppeals = attendanceRecords.filter(r => 
    r.appeal && 
    r.appeal.status === 'Pending' && 
    users.find(u => u.id === r.userId)?.managerIds.includes(currentUser?.id || '')
  );

  const handleApprove = (id: string) => {
    approveLeave(id, 'Approved', currentUser!.id);
  };

  const handleReject = (id: string) => {
    approveLeave(id, 'Rejected', currentUser!.id);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('appr.title')}</h2>

      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-md border border-slate-200 dark:border-slate-700">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">
            請假審批 (Leave Approvals)
          </h3>
        </div>
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {pendingRequests.length === 0 ? (
            <li className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
              {t('appr.empty')}
            </li>
          ) : (
            pendingRequests.map((request) => {
              const user = users.find(u => u.id === request.userId);
              return (
                <li key={request.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {user?.name}
                        </p>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          {t(`leave.${request.leaveType}`)}
                        </span>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {t('hist.applied_at')} {format(parseISO(request.appliedAt), 'yyyy/MM/dd HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                          {format(parseISO(request.startDate), 'yyyy/MM/dd')} ({t(`time.${request.startPeriod}`)})
                          <span className="mx-2">{t('time.to')}</span>
                          {format(parseISO(request.endDate), 'yyyy/MM/dd')} ({t(`time.${request.endPeriod}`)})
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-slate-500 dark:text-slate-400 sm:mt-0">
                        <p>
                          {t('hist.total')} <span className="font-bold text-slate-900 dark:text-slate-100">{request.days}</span> {t('time.days')}
                        </p>
                      </div>
                    </div>
                    {request.remarks && (
                      <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {t('apply.remarks')}: {request.remarks}
                      </div>
                    )}
                    {request.proofUrl && (
                      <div className="mt-2">
                        <a href={request.proofUrl} target="_blank" rel="noreferrer" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 underline">
                          {t('hist.view_proof')}
                        </a>
                      </div>
                    )}
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t('appr.approve')}
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t('appr.reject')}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-md border border-slate-200 dark:border-slate-700 mt-8">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">
            打卡異常申訴 (Attendance Appeals)
          </h3>
        </div>
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {pendingAppeals.length === 0 ? (
            <li className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
              暫無待處理的申訴 (No pending appeals)
            </li>
          ) : (
            pendingAppeals.map((record) => {
              const user = users.find(u => u.id === record.userId);
              const appeal = record.appeal!;
              return (
                <li key={record.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {user?.name}
                        </p>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          {appeal.type === 'clock-in' ? '上班打卡 (Clock In)' : appeal.type === 'clock-out' ? '下班打卡 (Clock Out)' : '上下班打卡 (Both)'}
                        </span>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {format(parseISO(appeal.submittedAt), 'yyyy/MM/dd HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 space-y-1">
                      <p className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        日期 (Date): {record.date}
                      </p>
                      {appeal.actualClockIn && (
                        <p className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          實際上班 (Actual In): {appeal.actualClockIn}
                        </p>
                      )}
                      {appeal.actualClockOut && (
                        <p className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          實際下班 (Actual Out): {appeal.actualClockOut}
                        </p>
                      )}
                      <p className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        地點 (Location): {appeal.location}
                      </p>
                      <p className="flex items-start">
                        <FileText className="w-4 h-4 mr-2 mt-0.5" />
                        原因 (Reason): {appeal.reason}
                      </p>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => processAttendanceAppeal(record.id, 'Approved', currentUser!.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t('appr.approve')}
                      </button>
                      <button
                        onClick={() => processAttendanceAppeal(record.id, 'Rejected', currentUser!.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t('appr.reject')}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
};

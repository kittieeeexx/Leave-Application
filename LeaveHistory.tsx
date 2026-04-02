import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { format, parseISO } from 'date-fns';
import { CheckCircle, Clock, XCircle, FileText, Calendar as CalendarIcon, Copy } from 'lucide-react';

export const LeaveHistory: React.FC = () => {
  const { currentUser, getLeaveRequests, cancelLeave, t } = useAppContext();
  const [showCalendarSync, setShowCalendarSync] = useState(false);

  const requests = getLeaveRequests(currentUser?.id || '').sort((a, b) => 
    new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'Rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Cancelled': return <XCircle className="h-5 w-5 text-slate-400" />;
      default: return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Cancelled': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
      default: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
  };

  const calendarUrl = `${window.location.origin}/api/calendar/${currentUser?.id}.ics`;

  const copyCalendarUrl = () => {
    navigator.clipboard.writeText(calendarUrl);
    alert('URL copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('hist.title')}</h2>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCalendarSync(!showCalendarSync)}
            className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {t('hist.sync_calendar')}
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors">
            <FileText className="h-4 w-4 mr-2" />
            {t('hist.report')}
          </button>
        </div>
      </div>

      {showCalendarSync && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
            {t('hist.sync_calendar_desc')}
          </p>
          <div className="flex items-center mt-1">
            <input 
              type="text" 
              readOnly 
              value={calendarUrl} 
              className="flex-1 block w-full rounded-md border-blue-300 dark:border-blue-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2"
            />
            <button 
              onClick={copyCalendarUrl}
              className="ml-3 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-md border border-slate-200 dark:border-slate-700">
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {requests.length === 0 ? (
            <li className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
              {t('hist.empty')}
            </li>
          ) : (
            requests.map((request) => (
              <li key={request.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {t(`leave.${request.leaveType}`)}
                      </p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                        {t(`status.${request.status}`)}
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
                  {request.status !== 'Cancelled' && request.status !== 'Rejected' && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (window.confirm(t('hist.confirm_cancel'))) {
                            cancelLeave(request.id);
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 shadow-sm text-xs font-medium rounded text-red-700 dark:text-red-400 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        {t('hist.cancel_request')}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

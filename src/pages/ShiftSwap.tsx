import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar, ArrowRightLeft, Check, X } from 'lucide-react';

export const ShiftSwap: React.FC = () => {
  const { currentUser, users, shiftSwaps, applyShiftSwap, approveShiftSwap, cancelShiftSwap, t } = useAppContext();
  
  const [targetUserId, setTargetUserId] = useState('');
  const [requesterDate, setRequesterDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [reason, setReason] = useState('');

  // Only alternating schedule employees can swap shifts
  if (currentUser?.workSchedule !== 'alternating') {
    return (
      <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">{t('swap.title')}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t('swap.not_eligible')}</p>
      </div>
    );
  }

  const alternatingUsers = users.filter(u => u.workSchedule === 'alternating' && u.id !== currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !requesterDate || !targetDate || !currentUser) return;
    
    applyShiftSwap({
      requesterId: currentUser.id,
      targetUserId,
      originalDate: requesterDate,
      proposedDate: targetDate,
      reason,
    });
    
    setTargetUserId('');
    setRequesterDate('');
    setTargetDate('');
    setReason('');
  };

  const myRequests = shiftSwaps.filter(s => s.requesterId === currentUser.id);
  const requestsForMe = shiftSwaps.filter(s => s.targetUserId === currentUser.id);

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('swap.title')}</h2>

      <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
          <ArrowRightLeft className="h-5 w-5 mr-2 text-slate-500" />
          {t('swap.apply')}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('swap.my_shift')}</label>
              <input
                type="date"
                required
                value={requesterDate}
                onChange={(e) => setRequesterDate(e.target.value)}
                className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('swap.target_user')}</label>
              <select
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="">{t('swap.select_user')}</option>
                {alternatingUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('swap.target_shift')}</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('swap.reason')}</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-800 dark:bg-slate-600 hover:bg-slate-900 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              {t('swap.submit')}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests for me */}
        <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="px-4 py-5 sm:px-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">
              {t('swap.requests_for_me')}
            </h3>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {requestsForMe.length === 0 ? (
              <li className="px-4 py-4 sm:px-6 text-sm text-slate-500 dark:text-slate-400">
                {t('swap.no_requests')}
              </li>
            ) : (
              requestsForMe.map((req) => (
                <li key={req.id} className="px-4 py-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {getUserName(req.requesterId)}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                        req.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                        req.status === 'Cancelled' ? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {t(`status.${req.status}`)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex flex-col text-sm text-slate-500 dark:text-slate-400">
                      <p className="flex items-center">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                        {t('swap.their_shift')}: {req.originalDate}
                      </p>
                      <p className="flex items-center mt-1">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                        {t('swap.your_shift')}: {req.proposedDate}
                      </p>
                      {req.reason && (
                        <p className="mt-2 text-xs italic text-slate-500">
                          {t('swap.reason')}: {req.reason}
                        </p>
                      )}
                    </div>
                    {req.status === 'Pending' && (
                      <div className="mt-2 flex items-center space-x-2 sm:mt-0">
                        <button
                          onClick={() => approveShiftSwap(req.id, true)}
                          className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          title={t('swap.approve')}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => approveShiftSwap(req.id, false)}
                          className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title={t('swap.reject')}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* My Requests */}
        <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="px-4 py-5 sm:px-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">
              {t('swap.my_requests')}
            </h3>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {myRequests.length === 0 ? (
              <li className="px-4 py-4 sm:px-6 text-sm text-slate-500 dark:text-slate-400">
                {t('swap.no_requests')}
              </li>
            ) : (
              myRequests.map((req) => (
                <li key={req.id} className="px-4 py-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {t('swap.to')}: {getUserName(req.targetUserId)}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                        req.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                        req.status === 'Cancelled' ? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {t(`status.${req.status}`)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex flex-col text-sm text-slate-500 dark:text-slate-400">
                      <p className="flex items-center">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                        {t('swap.my_shift')}: {req.requesterDate}
                      </p>
                      <p className="flex items-center mt-1">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                        {t('swap.their_shift')}: {req.targetDate}
                      </p>
                    </div>
                    {req.status === 'Pending' && (
                      <div className="mt-2 flex items-center space-x-2 sm:mt-0">
                        <button
                          onClick={() => cancelShiftSwap(req.id)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 shadow-sm text-xs font-medium rounded text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                        >
                          {t('swap.cancel')}
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
    </div>
  );
};

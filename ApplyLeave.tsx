import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LeaveType, Period } from '../types';
import { AlertCircle, Upload } from 'lucide-react';

export const ApplyLeave: React.FC = () => {
  const { currentUser, applyLeave, balances, calculateDays, t } = useAppContext();
  const navigate = useNavigate();

  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [startPeriod, setStartPeriod] = useState<Period>('am');
  const [endDate, setEndDate] = useState('');
  const [endPeriod, setEndPeriod] = useState<Period>('pm');
  const [remarks, setRemarks] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [error, setError] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [deductSaturday, setDeductSaturday] = useState(false);

  const userBalance = balances.find(b => b.userId === currentUser?.id);

  useEffect(() => {
    if (startDate && endDate) {
      const days = calculateDays(startDate, startPeriod, endDate, endPeriod, currentUser?.id, deductSaturday);
      setCalculatedDays(days);
    } else {
      setCalculatedDays(0);
    }
  }, [startDate, startPeriod, endDate, endPeriod, calculateDays, currentUser?.id, deductSaturday]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError(t('apply.err_dates'));
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError(t('apply.err_order'));
      return;
    }

    if (calculatedDays <= 0) {
      setError(t('apply.err_days'));
      return;
    }

    const needsProof = leaveType === 'Sick Leave' || leaveType === '4/5 Sick Leave';
    if (needsProof && !proofUrl) {
      setError(t('apply.proof_req'));
      return;
    }

    if (userBalance) {
      let hasEnoughBalance = true;
      let balanceType = '';
      let available = 0;

      switch (leaveType) {
        case 'Sick Leave':
        case '4/5 Sick Leave':
          available = userBalance.sickLeave;
          balanceType = t('leave.Sick Leave');
          break;
        case 'Annual Leave':
          available = userBalance.annualLeave;
          balanceType = t('leave.Annual Leave');
          break;
        case 'Compensation Leave':
          available = userBalance.compensationLeave;
          balanceType = t('leave.Compensation Leave');
          break;
        case 'Paternity Leave':
          available = userBalance.paternityLeave;
          balanceType = t('leave.Paternity Leave');
          break;
        case 'Unpaid Leave':
          available = Infinity;
          break;
      }

      if (calculatedDays > available) {
        setError(`${t('apply.err_balance')} (${balanceType}: ${available.toFixed(2)} ${t('time.days')})`);
        return;
      }
    }

    applyLeave({
      userId: currentUser!.id,
      leaveType,
      startDate,
      startPeriod,
      endDate,
      endPeriod,
      days: calculatedDays,
      deductSaturday: currentUser?.workSchedule === 'alternating' ? deductSaturday : undefined,
      proofUrl,
      remarks,
    });

    navigate('/history');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const needsProof = leaveType === 'Sick Leave' || leaveType === '4/5 Sick Leave';

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">{t('apply.title')}</h2>

      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="leaveType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('apply.type')}
              </label>
              <select
                id="leaveType"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="Annual Leave">{t('leave.Annual Leave')}</option>
                <option value="Sick Leave">{t('leave.Sick Leave')}</option>
                <option value="4/5 Sick Leave">{t('leave.4/5 Sick Leave')}</option>
                <option value="Compensation Leave">{t('leave.Compensation Leave')}</option>
                <option value="Paternity Leave">{t('leave.Paternity Leave')}</option>
                <option value="Unpaid Leave">{t('leave.Unpaid Leave')}</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('apply.start')}</label>
                <div className="mt-1 flex space-x-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  <select
                    value={startPeriod}
                    onChange={(e) => setStartPeriod(e.target.value as Period)}
                    className="block w-24 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="am">{t('time.am')}</option>
                    <option value="pm">{t('time.pm')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('apply.end')}</label>
                <div className="mt-1 flex space-x-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  <select
                    value={endPeriod}
                    onChange={(e) => setEndPeriod(e.target.value as Period)}
                    className="block w-24 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="am">{t('time.am')}</option>
                    <option value="pm">{t('time.pm')}</option>
                  </select>
                </div>
              </div>
            </div>

            {currentUser?.workSchedule === 'alternating' && (
              <div className="flex items-center mt-4">
                <input
                  id="deductSaturday"
                  type="checkbox"
                  checked={deductSaturday}
                  onChange={(e) => setDeductSaturday(e.target.checked)}
                  className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded dark:border-slate-600 dark:bg-slate-700"
                />
                <label htmlFor="deductSaturday" className="ml-2 block text-sm text-slate-900 dark:text-slate-100">
                  {t('apply.deduct_saturday')}
                </label>
              </div>
            )}

            {calculatedDays > 0 && (
              <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md p-4">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {t('apply.total')} <span className="font-bold text-lg text-slate-900 dark:text-slate-100">{calculatedDays}</span> {t('time.days')}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('apply.proof')} {needsProof && <span className="text-red-500">*</span>}
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md bg-slate-50 dark:bg-slate-700/30">
                <div className="space-y-1 text-center">
                  {proofUrl ? (
                    <div className="flex flex-col items-center">
                      <img src={proofUrl} alt="Proof" className="h-32 object-contain mb-2 rounded" />
                      <button type="button" onClick={() => setProofUrl('')} className="text-sm text-red-600 dark:text-red-400 hover:text-red-500">
                        {t('apply.remove')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
                      <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-slate-500 px-3 py-1 border border-slate-300 dark:border-slate-600"
                        >
                          <span>{t('apply.upload')}</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileUpload} />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('apply.remarks')}
              </label>
              <div className="mt-1">
                <textarea
                  id="remarks"
                  name="remarks"
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="shadow-sm focus:ring-slate-500 focus:border-slate-500 block w-full sm:text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="bg-white dark:bg-slate-800 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  {t('apply.cancel')}
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-800 dark:bg-slate-600 hover:bg-slate-900 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  {t('apply.submit')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

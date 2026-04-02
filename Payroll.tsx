import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SalaryType, CalcMethod, PaymentMethod, PaymentStatus } from '../types';
import { Save, FileText, Banknote, Download, Clock } from 'lucide-react';
import { format, parseISO, getDaysInMonth } from 'date-fns';

export const Payroll: React.FC = () => {
  const { currentUser, users, payrolls, addPayroll, t, requests, calculateDays, payrollSettings, attendanceRecords } = useAppContext();
  
  const isAdmin = currentUser?.role === 'admin';
  const isManager = users.some(u => u.managerIds.includes(currentUser?.id || ''));
  const canCreate = isAdmin || isManager;

  const [selectedUser, setSelectedUser] = useState<string>(users[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [workingDays, setWorkingDays] = useState<number>(0);
  const [salaryType, setSalaryType] = useState<SalaryType>('Monthly');
  const [calcMethod, setCalcMethod] = useState<CalcMethod>('Monthly');
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [overtimeRate, setOvertimeRate] = useState<number>(0);
  const [deductionUnpaidLeave, setDeductionUnpaidLeave] = useState<number>(0);
  const [deductionOthers, setDeductionOthers] = useState<number>(0);
  const [mpfDeduction, setMpfDeduction] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [status, setStatus] = useState<PaymentStatus>('Unpaid');
  const [calculatedLeaveDays, setCalculatedLeaveDays] = useState({ unpaid: 0, fourFifths: 0 });

  useEffect(() => {
    const user = users.find(u => u.id === selectedUser);
    if (user) {
      setSalaryType(user.wageType === 'daily' ? 'Daily' : 'Monthly');
      if (user.baseSalary) {
        setBasicSalary(user.baseSalary);
      }
    }
  }, [selectedUser, users]);

  // Filters
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const overtimePay = Math.round(overtimeHours * overtimeRate * 100) / 100;
  const basePay = salaryType === 'Daily' ? basicSalary * workingDays : basicSalary;
  const netSalary = basePay + overtimePay - deductionUnpaidLeave - deductionOthers - mpfDeduction;

  const calculateFromAttendance = () => {
    if (!startDate || !endDate) {
      alert('請先選擇計薪週期 (Please select period first)');
      return;
    }
    
    const user = users.find(u => u.id === selectedUser);
    if (!user || !user.attendanceId) {
      alert('該員工未設定打卡系統編號 (User has no attendance ID set)');
      return;
    }

    const start = new Date(startDate).getTime();
    // Set end date to end of day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const endTime = end.getTime();

    const recordsInPeriod = attendanceRecords.filter(r => {
      if (r.userId !== selectedUser) return false;
      const recordTime = new Date(r.date).getTime();
      return recordTime >= start && recordTime <= endTime;
    });

    if (recordsInPeriod.length === 0) {
      alert('此期間無打卡紀錄 (No attendance records found in this period)');
      return;
    }

    if (salaryType === 'Daily') {
      // For daily workers, count days with > 0 work hours
      const daysWorked = recordsInPeriod.filter(r => (r.workHours || 0) > 0).length;
      setWorkingDays(daysWorked);
      
      // Calculate overtime (assuming > 8 hours is overtime)
      let totalOvertime = 0;
      recordsInPeriod.forEach(r => {
        if ((r.workHours || 0) > 8) {
          totalOvertime += (r.workHours || 0) - 8;
        }
      });
      setOvertimeHours(Number(totalOvertime.toFixed(1)));
      
      alert(`已根據打卡紀錄計算：工作日數 ${daysWorked} 天，加班 ${totalOvertime.toFixed(1)} 小時`);
    } else {
      // For monthly workers, we might calculate deductions based on missing days
      // Let's just calculate overtime for now
      let totalOvertime = 0;
      recordsInPeriod.forEach(r => {
        if ((r.workHours || 0) > 8) {
          totalOvertime += (r.workHours || 0) - 8;
        }
      });
      setOvertimeHours(Number(totalOvertime.toFixed(1)));
      
      alert(`已根據打卡紀錄計算：加班 ${totalOvertime.toFixed(1)} 小時`);
    }
  };

  // Auto calculate Deductions based on Leave Requests
  useEffect(() => {
    if (!startDate || !endDate || !basicSalary || basicSalary <= 0) {
      setCalculatedLeaveDays({ unpaid: 0, fourFifths: 0 });
      return;
    }

    try {
      const payStart = parseISO(startDate);
      const payEnd = parseISO(endDate);

      if (payEnd < payStart) return;

      // Calculate Daily Rate
      let dailyRate = 0;
      if (salaryType === 'Monthly') {
        if (payrollSettings.dailyRateMethod === 'fixed30') {
          dailyRate = basicSalary / 30;
        } else if (payrollSettings.dailyRateMethod === 'workingDays22') {
          dailyRate = basicSalary / 22;
        } else {
          const daysInMonth = getDaysInMonth(payStart);
          dailyRate = basicSalary / daysInMonth;
        }
      } else {
        dailyRate = basicSalary; // For daily wage, basicSalary is the daily rate
      }

      // Get user's approved leaves
      const userLeaves = requests.filter(r => r.userId === selectedUser && r.status === 'Approved');

      let unpaidDays = 0;
      let fourFifthsDays = 0;

      userLeaves.forEach(req => {
        const reqStart = parseISO(req.startDate);
        const reqEnd = parseISO(req.endDate);

        if (reqEnd < payStart || reqStart > payEnd) return; // No overlap

        const overlapStart = reqStart < payStart ? payStart : reqStart;
        const overlapEnd = reqEnd > payEnd ? payEnd : reqEnd;

        let sPeriod = req.startPeriod;
        if (reqStart < payStart) sPeriod = 'am';

        let ePeriod = req.endPeriod;
        if (reqEnd > payEnd) ePeriod = 'pm';

        const days = calculateDays(format(overlapStart, 'yyyy-MM-dd'), sPeriod, format(overlapEnd, 'yyyy-MM-dd'), ePeriod, selectedUser, req.deductSaturday);

        if (req.leaveType === 'Unpaid Leave') {
          unpaidDays += days;
        } else if (req.leaveType === '4/5 Sick Leave') {
          fourFifthsDays += days;
        }
      });

      setCalculatedLeaveDays({ unpaid: unpaidDays, fourFifths: fourFifthsDays });

      const calcUnpaidDeduction = Math.round(unpaidDays * dailyRate * payrollSettings.unpaidLeaveMultiplier * 100) / 100;
      const calcOthersDeduction = Math.round(fourFifthsDays * dailyRate * payrollSettings.sickLeaveMultiplier * 100) / 100;

      setDeductionUnpaidLeave(calcUnpaidDeduction);
      setDeductionOthers(calcOthersDeduction);
    } catch (e) {
      console.error("Error calculating deductions", e);
    }
  }, [selectedUser, startDate, endDate, basicSalary, salaryType, requests, calculateDays, payrollSettings]);

  // Auto calculate MPF based on HK rules
  useEffect(() => {
    if (!basicSalary || basicSalary <= 0) {
      setMpfDeduction(0);
      return;
    }

    let calculatedMpf = 0;
    const basePay = salaryType === 'Daily' ? basicSalary * workingDays : basicSalary;
    const relevantIncome = basePay + overtimePay - deductionUnpaidLeave - deductionOthers;

    if (relevantIncome <= 0) {
      setMpfDeduction(0);
      return;
    }

    if (salaryType === 'Monthly') {
      if (relevantIncome < 7100) {
        calculatedMpf = 0;
      } else if (relevantIncome > 30000) {
        calculatedMpf = 1500;
      } else {
        calculatedMpf = relevantIncome * 0.05;
      }
    } else if (salaryType === 'Daily') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const dailyAvg = relevantIncome / days;

        if (dailyAvg < 280) {
          calculatedMpf = 0;
        } else if (dailyAvg > 1000) {
          calculatedMpf = 50 * days;
        } else {
          calculatedMpf = relevantIncome * 0.05;
        }
      }
    }

    setMpfDeduction(Math.round(calculatedMpf * 100) / 100);
  }, [basicSalary, overtimePay, salaryType, startDate, endDate, deductionUnpaidLeave, deductionOthers]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert(t('apply.err_dates'));
      return;
    }
    
    addPayroll({
      userId: selectedUser,
      startDate,
      endDate,
      basicSalary,
      workingDays: salaryType === 'Daily' ? workingDays : undefined,
      salaryType,
      calcMethod,
      overtimeHours,
      overtimeRate,
      overtimePay,
      deductionUnpaidLeave,
      deductionOthers,
      mpfDeduction,
      netSalary,
      paymentMethod,
      status
    });
    
    alert(t('payroll.msg_saved'));
    // Reset form
    setStartDate('');
    setEndDate('');
    setBasicSalary(0);
    setOvertimeHours(0);
    setOvertimeRate(0);
    setDeductionUnpaidLeave(0);
    setDeductionOthers(0);
    setMpfDeduction(0);
  };

  const myPayrolls = payrolls.filter(p => p.userId === currentUser?.id).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const allPayrolls = payrolls.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  let displayPayrolls = canCreate ? allPayrolls : myPayrolls;

  if (filterUser !== 'all') {
    displayPayrolls = displayPayrolls.filter(p => p.userId === filterUser);
  }

  if (filterStartDate) {
    const start = new Date(filterStartDate).getTime();
    displayPayrolls = displayPayrolls.filter(p => new Date(p.startDate).getTime() >= start);
  }

  if (filterEndDate) {
    const end = new Date(filterEndDate).getTime();
    displayPayrolls = displayPayrolls.filter(p => new Date(p.endDate).getTime() <= end);
  }

  const exportToCSV = () => {
    if (displayPayrolls.length === 0) return;

    const headers = [
      'Employee Name',
      'Period Start',
      'Period End',
      'Basic Salary / Daily Rate',
      'Working Days',
      'Overtime Pay',
      'Deductions (Unpaid Leave)',
      'Deductions (Others)',
      'MPF',
      'Net Salary',
      'Payment Method',
      'Status'
    ];

    const rows = displayPayrolls.map(record => {
      const user = users.find(u => u.id === record.userId);
      return [
        user?.name || 'Unknown',
        record.startDate,
        record.endDate,
        record.basicSalary.toFixed(2),
        record.salaryType === 'Daily' ? (record.workingDays || 0).toString() : 'N/A',
        record.overtimePay.toFixed(2),
        record.deductionUnpaidLeave.toFixed(2),
        record.deductionOthers.toFixed(2),
        record.mpfDeduction.toFixed(2),
        record.netSalary.toFixed(2),
        record.paymentMethod,
        record.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('payroll.title')}</h2>
      </div>

      {canCreate && (
        <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <Banknote className="h-5 w-5 mr-2 text-slate-500" />
              {t('payroll.create')}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('admin.select_user')}
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {users.filter(u => u.role !== 'admin').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.period')} ({t('apply.start')})</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">({t('apply.end')})</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <button
                    type="button"
                    onClick={calculateFromAttendance}
                    className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    從打卡紀錄計算工時 (Calculate from Attendance)
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {salaryType === 'Daily' ? t('payroll.daily_rate') : t('payroll.basic_salary')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={basicSalary || ''}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {salaryType === 'Daily' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.working_days')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={workingDays || ''}
                      onChange={(e) => setWorkingDays(Number(e.target.value))}
                      className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.salary_type')}</label>
                    <select
                      value={salaryType}
                      onChange={(e) => setSalaryType(e.target.value as SalaryType)}
                      className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Daily">{t('payroll.type_daily')}</option>
                      <option value="Monthly">{t('payroll.type_monthly')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.calc_method')}</label>
                    <select
                      value={calcMethod}
                      onChange={(e) => setCalcMethod(e.target.value as CalcMethod)}
                      className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Daily">{t('payroll.calc_daily')}</option>
                      <option value="Monthly">{t('payroll.calc_monthly')}</option>
                      <option value="Yearly">{t('payroll.calc_yearly')}</option>
                    </select>
                  </div>
                </div>

                {/* Overtime Section */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.overtime_hours')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={overtimeHours || ''}
                      onChange={(e) => setOvertimeHours(Number(e.target.value))}
                      className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.overtime_rate')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={overtimeRate || ''}
                      onChange={(e) => setOvertimeRate(Number(e.target.value))}
                      className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  {overtimePay > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        + {t('payroll.overtime_pay')}: {overtimePay.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.unpaid_leave')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deductionUnpaidLeave || ''}
                    onChange={(e) => setDeductionUnpaidLeave(Number(e.target.value))}
                    className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  {calculatedLeaveDays.unpaid > 0 && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      {t('payroll.auto_unpaid').replace('{days}', calculatedLeaveDays.unpaid.toString())}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.others')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deductionOthers || ''}
                    onChange={(e) => setDeductionOthers(Number(e.target.value))}
                    className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  {calculatedLeaveDays.fourFifths > 0 && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      {t('payroll.auto_others').replace('{days}', calculatedLeaveDays.fourFifths.toString())}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.mpf')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={mpfDeduction || ''}
                    onChange={(e) => setMpfDeduction(Number(e.target.value))}
                    className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.payment_method')}</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Cash">{t('payroll.pm_cash')}</option>
                      <option value="Cheque">{t('payroll.pm_cheque')}</option>
                      <option value="Bank Transfer">{t('payroll.pm_bank')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.status')}</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                      className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Unpaid">{t('payroll.status_unpaid')}</option>
                      <option value="Paid">{t('payroll.status_paid')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('payroll.net_salary')}</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">HK$ {netSalary.toFixed(2)}</span>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-800 dark:bg-slate-600 hover:bg-slate-900 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t('payroll.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-md border border-slate-200 dark:border-slate-700">
        <div className="px-4 py-5 border-b border-slate-200 dark:border-slate-700 sm:px-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">
            {t('payroll.history')}
          </h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {canCreate && (
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">{t('payroll.all_users')}</option>
                {users.filter(u => u.role !== 'admin').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder={t('apply.start')}
              />
              <span className="text-slate-500 dark:text-slate-400">-</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder={t('apply.end')}
              />
            </div>
            <button
              onClick={exportToCSV}
              disabled={displayPayrolls.length === 0}
              className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('payroll.export')}
            </button>
          </div>
        </div>
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {displayPayrolls.length === 0 ? (
            <li className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
              {t('payroll.empty')}
            </li>
          ) : (
            displayPayrolls.map((record) => {
              const user = users.find(u => u.id === record.userId);
              return (
                <li key={record.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          {user?.name}
                        </p>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'Paid' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {record.status === 'Paid' ? t('payroll.status_paid') : t('payroll.status_unpaid')}
                        </span>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          HK$ {record.netSalary.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                          {format(parseISO(record.startDate), 'yyyy/MM/dd')} <span className="mx-2">{t('time.to')}</span> {format(parseISO(record.endDate), 'yyyy/MM/dd')}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-slate-500 dark:text-slate-400 sm:mt-0 space-x-4">
                        <span>{record.salaryType === 'Daily' ? t('payroll.type_daily') : t('payroll.type_monthly')}</span>
                        <span>&bull;</span>
                        <span>{record.calcMethod === 'Daily' ? t('payroll.calc_daily') : record.calcMethod === 'Monthly' ? t('payroll.calc_monthly') : t('payroll.calc_yearly')}</span>
                        <span>&bull;</span>
                        <span>{record.paymentMethod === 'Cash' ? t('payroll.pm_cash') : record.paymentMethod === 'Cheque' ? t('payroll.pm_cheque') : t('payroll.pm_bank')}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        {record.salaryType === 'Daily' 
                          ? `${t('payroll.daily_rate')}: ${record.basicSalary.toFixed(2)} × ${record.workingDays || 0} ${t('time.days')}`
                          : `${t('payroll.basic_salary')}: ${record.basicSalary.toFixed(2)}`
                        }
                      </span>
                      {record.overtimePay > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {t('payroll.overtime_pay')}: +{record.overtimePay.toFixed(2)}
                        </span>
                      )}
                      {(record.deductionUnpaidLeave > 0 || record.deductionOthers > 0) && (
                        <span className="text-red-500 dark:text-red-400">
                          {t('payroll.deductions')}: -{(record.deductionUnpaidLeave + record.deductionOthers).toFixed(2)}
                        </span>
                      )}
                      {record.mpfDeduction > 0 && (
                        <span className="text-red-500 dark:text-red-400">
                          MPF: -{record.mpfDeduction.toFixed(2)}
                        </span>
                      )}
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

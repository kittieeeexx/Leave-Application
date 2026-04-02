import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, LeaveBalance } from '../types';
import { Save, Calculator, User as UserIcon } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { users, balances, updateHierarchy, updateBalance, updateUser, t, calculateLeaveAllowance, approvalReminderDays, setApprovalReminderDays, payrollSettings, setPayrollSettings } = useAppContext();
  const [selectedUser, setSelectedUser] = useState<string>(users[0]?.id || '');

  const user = users.find(u => u.id === selectedUser);
  const balance = balances.find(b => b.userId === selectedUser);

  const [managerIds, setManagerIds] = useState<string[]>(user?.managerIds || []);
  const [editBalance, setEditBalance] = useState<Partial<LeaveBalance>>(balance || {});
  const [editPolicy, setEditPolicy] = useState<Partial<User>>({});
  const [reminderDays, setReminderDays] = useState<number>(approvalReminderDays);
  
  const [editPayrollSettings, setEditPayrollSettings] = useState(payrollSettings);

  React.useEffect(() => {
    if (user) {
      setManagerIds(user.managerIds);
      setEditPolicy({
        joinDate: user.joinDate || '',
        baseAnnualLeave: user.baseAnnualLeave || 0,
        annualLeaveIncreaseAfterYears: user.annualLeaveIncreaseAfterYears || 0,
        annualLeaveIncreasePerYear: user.annualLeaveIncreasePerYear || 0,
        annualPaidSickLeave: user.annualPaidSickLeave || 0,
        phone: user.phone || '',
        workSchedule: user.workSchedule || '5-day',
        wageType: user.wageType || 'monthly',
        longWeekParity: user.longWeekParity || 'even',
        attendanceId: user.attendanceId || '',
        baseSalary: user.baseSalary || 0,
      });
    }
    if (balance) setEditBalance(balance);
  }, [selectedUser, user, balance]);

  const handleManagerToggle = (managerId: string) => {
    if (managerIds.includes(managerId)) {
      setManagerIds(managerIds.filter(id => id !== managerId));
    } else {
      setManagerIds([...managerIds, managerId]);
    }
  };

  const handleSaveHierarchy = () => {
    updateHierarchy(selectedUser, managerIds);
    alert(t('admin.msg_hierarchy'));
  };

  const handleSaveBalance = () => {
    updateBalance(selectedUser, editBalance);
    alert(t('admin.msg_balance'));
  };

  const handleSavePolicy = () => {
    updateUser(selectedUser, editPolicy);
    alert(t('admin.msg_policy'));
  };

  const handleSaveReminderDays = () => {
    setApprovalReminderDays(reminderDays);
    alert(t('admin.msg_reminder_days'));
  };

  const handleSavePayrollSettings = () => {
    setPayrollSettings(editPayrollSettings);
    alert(t('admin.msg_reminder_days')); // Reusing alert for simplicity, or we can add a new one
  };

  const calculatedAllowance = user ? calculateLeaveAllowance({ ...user, ...editPolicy }) : { annualLeave: 0, sickLeave: 0 };

  const applyCalculatedToBalance = () => {
    setEditBalance({
      ...editBalance,
      annualLeave: calculatedAllowance.annualLeave,
      sickLeave: calculatedAllowance.sickLeave
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('admin.title')}</h2>

      <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">{t('admin.system_settings')}</h3>
        <div className="flex items-end space-x-4 mb-6">
          <div className="flex-1">
            <label htmlFor="reminderDays" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('admin.reminder_days')}
            </label>
            <input
              id="reminderDays"
              type="number"
              min="1"
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            onClick={handleSaveReminderDays}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-800 dark:bg-slate-600 hover:bg-slate-900 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {t('admin.save_settings')}
          </button>
        </div>

        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 pt-4 border-t border-slate-200 dark:border-slate-700">{t('admin.payroll_settings')}</h3>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('admin.daily_rate_method')}
            </label>
            <select
              value={editPayrollSettings.dailyRateMethod}
              onChange={(e) => setEditPayrollSettings({...editPayrollSettings, dailyRateMethod: e.target.value as any})}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="calendarDays">{t('admin.daily_rate_calendar')}</option>
              <option value="fixed30">{t('admin.daily_rate_fixed30')}</option>
              <option value="workingDays22">{t('admin.daily_rate_working22')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('admin.unpaid_multiplier')}
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={editPayrollSettings.unpaidLeaveMultiplier}
              onChange={(e) => setEditPayrollSettings({...editPayrollSettings, unpaidLeaveMultiplier: Number(e.target.value)})}
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('admin.sick_multiplier')}
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={editPayrollSettings.sickLeaveMultiplier}
              onChange={(e) => setEditPayrollSettings({...editPayrollSettings, sickLeaveMultiplier: Number(e.target.value)})}
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSavePayrollSettings}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-800 dark:bg-slate-600 hover:bg-slate-900 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {t('admin.save_settings')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <label htmlFor="userSelect" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('admin.select_user')}
        </label>
        <select
          id="userSelect"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        >
          {users.filter(u => u.role !== 'admin').map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {user && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leave Policy Settings */}
          <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg p-6 border border-slate-200 dark:border-slate-700 md:col-span-2">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-slate-500" />
              {t('admin.policy')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('admin.policy_desc')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">1) {t('leave.Annual Leave')}</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.join_date')}</label>
                  <input
                    type="date"
                    value={editPolicy.joinDate || ''}
                    onChange={(e) => setEditPolicy({ ...editPolicy, joinDate: e.target.value })}
                    className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.base_annual')}</label>
                  <input
                    type="number"
                    min="0"
                    value={editPolicy.baseAnnualLeave || 0}
                    onChange={(e) => setEditPolicy({ ...editPolicy, baseAnnualLeave: Number(e.target.value) })}
                    className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.annual_increase_years')}</label>
                    <input
                      type="number"
                      min="0"
                      value={editPolicy.annualLeaveIncreaseAfterYears || 0}
                      onChange={(e) => setEditPolicy({ ...editPolicy, annualLeaveIncreaseAfterYears: Number(e.target.value) })}
                      className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.annual_increase_days')}</label>
                    <input
                      type="number"
                      min="0"
                      value={editPolicy.annualLeaveIncreasePerYear || 0}
                      onChange={(e) => setEditPolicy({ ...editPolicy, annualLeaveIncreasePerYear: Number(e.target.value) })}
                      className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">2) {t('leave.Sick Leave')}</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.annual_sick')}</label>
                  <input
                    type="number"
                    min="0"
                    value={editPolicy.annualPaidSickLeave || 0}
                    onChange={(e) => setEditPolicy({ ...editPolicy, annualPaidSickLeave: Number(e.target.value) })}
                    className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium mr-2">{t('admin.calculated_allowance')}:</span>
                {t('leave.Annual Leave')}: <span className="font-bold text-emerald-600 dark:text-emerald-400">{calculatedAllowance.annualLeave}</span> {t('time.days')}, 
                <span className="ml-2">{t('leave.Sick Leave')}</span>: <span className="font-bold text-emerald-600 dark:text-emerald-400">{calculatedAllowance.sickLeave}</span> {t('time.days')}
              </div>
              <div className="space-x-4">
                <button
                  onClick={applyCalculatedToBalance}
                  className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  {t('admin.apply_to_balance')}
                </button>
                <button
                  onClick={handleSavePolicy}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-800 dark:bg-slate-600 hover:bg-slate-900 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t('admin.save_policy')}
                </button>
              </div>
            </div>
          </div>

          {/* Work Schedule & Payroll Info */}
          <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg p-6 border border-slate-200 dark:border-slate-700 md:col-span-2">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-slate-500" />
              Employee Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <input
                  type="text"
                  value={editPolicy.phone || ''}
                  onChange={(e) => setEditPolicy({ ...editPolicy, phone: e.target.value })}
                  className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">打卡系統編號 (Attendance ID)</label>
                <input
                  type="text"
                  value={editPolicy.attendanceId || ''}
                  onChange={(e) => setEditPolicy({ ...editPolicy, attendanceId: e.target.value })}
                  className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">基本薪資 (Base Salary)</label>
                <input
                  type="number"
                  value={editPolicy.baseSalary || 0}
                  onChange={(e) => setEditPolicy({ ...editPolicy, baseSalary: Number(e.target.value) })}
                  className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Wage Type</label>
                <select
                  value={editPolicy.wageType || 'monthly'}
                  onChange={(e) => setEditPolicy({ ...editPolicy, wageType: e.target.value as any })}
                  className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="monthly">Monthly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Work Schedule</label>
                <select
                  value={editPolicy.workSchedule || '5-day'}
                  onChange={(e) => setEditPolicy({ ...editPolicy, workSchedule: e.target.value as any })}
                  className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="5-day">5-day Work Week</option>
                  <option value="6-day">6-day Work Week</option>
                  <option value="alternating">Alternating Weeks (長短週)</option>
                </select>
              </div>
              {editPolicy.workSchedule === 'alternating' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Long Week Parity</label>
                  <select
                    value={editPolicy.longWeekParity || 'even'}
                    onChange={(e) => setEditPolicy({ ...editPolicy, longWeekParity: e.target.value as any })}
                    className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="even">Even Weeks (雙數週)</option>
                    <option value="odd">Odd Weeks (單數週)</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
              <button
                onClick={handleSavePolicy}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-800 dark:bg-slate-600 hover:bg-slate-900 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {t('admin.save_policy')}
              </button>
            </div>
          </div>

          {/* Hierarchy Settings */}
          <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">{t('admin.hierarchy')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('admin.hierarchy_desc')}</p>
            
            <div className="space-y-2 mb-6">
              {users.filter(u => u.id !== user.id && u.role !== 'admin').map(u => (
                <div key={u.id} className="flex items-center">
                  <input
                    id={`manager-${u.id}`}
                    type="checkbox"
                    checked={managerIds.includes(u.id)}
                    onChange={() => handleManagerToggle(u.id)}
                    className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                  />
                  <label htmlFor={`manager-${u.id}`} className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
                    {u.name}
                  </label>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleSaveHierarchy}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-800 dark:bg-slate-600 hover:bg-slate-900 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {t('admin.save_hierarchy')}
            </button>
          </div>

          {/* Balance Settings */}
          <div className="bg-white dark:bg-slate-800 shadow sm:rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">{t('admin.balance')}</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('leave.Annual Leave')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={editBalance.annualLeave || 0}
                  onChange={(e) => setEditBalance({ ...editBalance, annualLeave: Number(e.target.value) })}
                  className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('leave.Sick Leave')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={editBalance.sickLeave || 0}
                  onChange={(e) => setEditBalance({ ...editBalance, sickLeave: Number(e.target.value) })}
                  className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('leave.Compensation Leave')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={editBalance.compensationLeave || 0}
                  onChange={(e) => setEditBalance({ ...editBalance, compensationLeave: Number(e.target.value) })}
                  className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('leave.Paternity Leave')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={editBalance.paternityLeave || 0}
                  onChange={(e) => setEditBalance({ ...editBalance, paternityLeave: Number(e.target.value) })}
                  className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              onClick={handleSaveBalance}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-800 dark:bg-slate-600 hover:bg-slate-900 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {t('admin.save_balance')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

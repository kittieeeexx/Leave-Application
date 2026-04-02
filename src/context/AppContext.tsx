import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LeaveBalance, LeaveRequest, LeaveType, Period, LeaveStatus, PayrollRecord, Notification, PayrollSettings, ShiftSwapRequest, ShiftSwapStatus, AttendanceRecord, Meeting, AttendanceAppeal } from '../types';
import { Language, translations } from '../i18n';
import { hkHolidays2026 } from '../utils/holidays';

type Theme = 'light' | 'dark';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  balances: LeaveBalance[];
  requests: LeaveRequest[];
  payrolls: PayrollRecord[];
  notifications: Notification[];
  shiftSwaps: ShiftSwapRequest[];
  attendanceRecords: AttendanceRecord[];
  meetings: Meeting[];
  language: Language;
  theme: Theme;
  approvalReminderDays: number;
  payrollSettings: PayrollSettings;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setApprovalReminderDays: (days: number) => void;
  setPayrollSettings: (settings: PayrollSettings) => void;
  t: (key: string) => string;
  login: (userId: string) => void;
  logout: () => void;
  applyLeave: (request: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>) => void;
  approveLeave: (requestId: string, status: LeaveStatus, approverId: string) => void;
  cancelLeave: (requestId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  updateHierarchy: (userId: string, managerIds: string[]) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  updateBalance: (userId: string, balance: Partial<LeaveBalance>) => void;
  addPayroll: (payroll: Omit<PayrollRecord, 'id' | 'createdAt'>) => void;
  getLeaveRequests: (userId: string) => LeaveRequest[];
  getPendingApprovals: (userId: string) => LeaveRequest[];
  calculateDays: (startDate: string, startPeriod: Period, endDate: string, endPeriod: Period, userId?: string) => number;
  calculateLeaveAllowance: (user: User) => { annualLeave: number; sickLeave: number };
  checkReminders: () => void;
  applyShiftSwap: (request: Omit<ShiftSwapRequest, 'id' | 'status' | 'createdAt'>) => void;
  approveShiftSwap: (swapId: string, status: ShiftSwapStatus, approverId: string) => void;
  cancelShiftSwap: (swapId: string) => void;
  syncAttendanceRecords: (userId: string) => void;
  checkAttendanceAnomalies: () => void;
  submitAttendanceAppeal: (recordId: string, appeal: Omit<AttendanceAppeal, 'status' | 'submittedAt'>) => void;
  processAttendanceAppeal: (recordId: string, status: 'Approved' | 'Rejected', approverId: string) => void;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdBy'>) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
}

const mockUsers: User[] = [
  { id: 'u1', name: '員工 A (Employee)', email: 'a@company.com', phone: '91234567', role: 'employee', managerIds: ['u2', 'u3'], joinDate: '2023-01-01', baseAnnualLeave: 12, annualLeaveIncreaseAfterYears: 1, annualLeaveIncreasePerYear: 1, annualPaidSickLeave: 12, workSchedule: '5-day', wageType: 'monthly', attendanceId: '001', baseSalary: 20000 },
  { id: 'u2', name: '主管 B (Manager)', email: 'b@company.com', phone: '92345678', role: 'employee', managerIds: ['u4'], joinDate: '2021-05-15', baseAnnualLeave: 14, annualLeaveIncreaseAfterYears: 1, annualLeaveIncreasePerYear: 1, annualPaidSickLeave: 12, workSchedule: 'alternating', wageType: 'monthly', longWeekParity: 'even', attendanceId: '002', baseSalary: 30000, canManageMeetings: true },
  { id: 'u3', name: '主管 C (Manager)', email: 'c@company.com', phone: '93456789', role: 'employee', managerIds: ['u4'], joinDate: '2020-03-10', baseAnnualLeave: 14, annualLeaveIncreaseAfterYears: 1, annualLeaveIncreasePerYear: 1, annualPaidSickLeave: 12, workSchedule: '6-day', wageType: 'monthly', attendanceId: '003', baseSalary: 25000 },
  { id: 'u4', name: '總監 D (Director)', email: 'd@company.com', phone: '94567890', role: 'employee', managerIds: [], joinDate: '2018-08-01', baseAnnualLeave: 20, annualLeaveIncreaseAfterYears: 2, annualLeaveIncreasePerYear: 1, annualPaidSickLeave: 12, workSchedule: '5-day', wageType: 'monthly', attendanceId: '004', baseSalary: 50000, canManageMeetings: true },
  { id: 'u5', name: '兼職 E (Part-time)', email: 'e@company.com', phone: '95678901', role: 'employee', managerIds: ['u2'], joinDate: '2024-01-01', baseAnnualLeave: 7, annualLeaveIncreaseAfterYears: 1, annualLeaveIncreasePerYear: 1, annualPaidSickLeave: 12, workSchedule: '5-day', wageType: 'daily', attendanceId: '005', baseSalary: 600 },
  { id: 'admin', name: '系統管理員 (Admin)', email: 'admin@company.com', role: 'admin', managerIds: [], joinDate: '2022-01-01', baseAnnualLeave: 14, annualLeaveIncreaseAfterYears: 1, annualLeaveIncreasePerYear: 1, annualPaidSickLeave: 12, workSchedule: '5-day', wageType: 'monthly', canManageMeetings: true },
];

const mockBalances: LeaveBalance[] = [
  { userId: 'u1', sickLeave: 12, annualLeave: 14.5, compensationLeave: 0, paternityLeave: 0, unpaidLeave: 0 },
  { userId: 'u2', sickLeave: 12, annualLeave: 18, compensationLeave: 2, paternityLeave: 0, unpaidLeave: 0 },
  { userId: 'u3', sickLeave: 12, annualLeave: 18, compensationLeave: 0, paternityLeave: 0, unpaidLeave: 0 },
  { userId: 'u4', sickLeave: 12, annualLeave: 24, compensationLeave: 0, paternityLeave: 0, unpaidLeave: 0 },
  { userId: 'u5', sickLeave: 12, annualLeave: 7, compensationLeave: 0, paternityLeave: 0, unpaidLeave: 0 },
];

const mockRequests: LeaveRequest[] = [
  {
    id: 'r1',
    userId: 'u1',
    leaveType: 'Annual Leave',
    startDate: '2026-03-15',
    startPeriod: 'am',
    endDate: '2026-03-16',
    endPeriod: 'pm',
    days: 2,
    status: 'Pending',
    appliedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'r2',
    userId: 'u2',
    leaveType: 'Sick Leave',
    startDate: '2026-03-10',
    startPeriod: 'am',
    endDate: '2026-03-10',
    endPeriod: 'pm',
    days: 1,
    status: 'Approved',
    appliedAt: '2026-03-09T08:00:00Z',
    approvedBy: 'u4',
  }
];

const mockPayrolls: PayrollRecord[] = [
  {
    id: 'p1',
    userId: 'u1',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    basicSalary: 20000,
    salaryType: 'Monthly',
    calcMethod: 'Monthly',
    overtimeHours: 0,
    overtimeRate: 0,
    overtimePay: 0,
    deductionUnpaidLeave: 0,
    deductionOthers: 0,
    mpfDeduction: 1000,
    netSalary: 19000,
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    createdAt: '2026-03-01T10:00:00Z',
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(mockUsers[0]);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [balances, setBalances] = useState<LeaveBalance[]>(mockBalances);
  const [requests, setRequests] = useState<LeaveRequest[]>(mockRequests);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(mockPayrolls);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [shiftSwaps, setShiftSwaps] = useState<ShiftSwapRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [language, setLanguage] = useState<Language>('zh-HK');
  const [theme, setTheme] = useState<Theme>('light');
  const [approvalReminderDays, setApprovalReminderDays] = useState<number>(3);
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>({
    dailyRateMethod: 'calendarDays',
    unpaidLeaveMultiplier: 1.0,
    sickLeaveMultiplier: 0.2
  });

  const checkReminders = React.useCallback(() => {
    const now = new Date().getTime();
    const reminderMs = approvalReminderDays * 24 * 60 * 60 * 1000;
    
    const newNotifications: Notification[] = [];
    const adminUsers = users.filter(u => u.role === 'admin');

    requests.forEach(req => {
      if (req.status === 'Pending') {
        const appliedTime = new Date(req.appliedAt).getTime();
        if (now - appliedTime >= reminderMs) {
          // Check if we already reminded recently (in a real app we'd track this per request)
          // For this demo, we'll just generate the notification if it's past the time
          // To avoid spamming, we could add a "remindedAt" field to the request, but let's keep it simple
          // and just trigger it once when the user logs in or periodically.
          
          const user = users.find(u => u.id === req.userId);
          if (user) {
            const message = `Reminder: Leave request from ${user.name} (${req.leaveType}, ${req.startDate} to ${req.endDate}) has been pending for over ${approvalReminderDays} days.`;
            
            // Notify managers
            user.managerIds.forEach(managerId => {
              newNotifications.push({
                id: `rem-${req.id}-${managerId}-${Date.now()}`,
                userId: managerId,
                message,
                createdAt: new Date().toISOString(),
                read: false,
              });
            });

            // Notify admins
            adminUsers.forEach(admin => {
              newNotifications.push({
                id: `rem-${req.id}-${admin.id}-${Date.now()}`,
                userId: admin.id,
                message,
                createdAt: new Date().toISOString(),
                read: false,
              });
            });
          }
        }
      }
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => {
        // Filter out duplicates based on message and userId to avoid spamming on every render
        const filteredNew = newNotifications.filter(nNew => 
          !prev.some(nPrev => nPrev.userId === nNew.userId && nPrev.message === nNew.message)
        );
        if (filteredNew.length === 0) return prev;
        return [...filteredNew, ...prev];
      });
    }
  }, [approvalReminderDays, users, requests]);

  const checkAttendanceAnomalies = React.useCallback(() => {
    const newNotifications: Notification[] = [];
    const adminUsers = users.filter(u => u.role === 'admin');
    const now = new Date().toISOString();

    attendanceRecords.forEach(record => {
      const user = users.find(u => u.id === record.userId);
      if (!user) return;

      let anomalyMessage = '';

      if (!record.clockIn && !record.clockOut) {
        anomalyMessage = `Missing both clock-in and clock-out on ${record.date}.`;
      } else if (!record.clockIn) {
        anomalyMessage = `Missing clock-in on ${record.date}.`;
      } else if (!record.clockOut) {
        anomalyMessage = `Missing clock-out on ${record.date}.`;
      } else if (record.workHours !== undefined && record.workHours < 6) {
        anomalyMessage = `Unusually low work hours (${record.workHours}h) on ${record.date}.`;
      }

      if (anomalyMessage) {
        const userMessage = `Attendance Anomaly: ${anomalyMessage} Please submit an appeal with the reason, time, and location.`;
        const managerMessage = `Attendance Anomaly for ${user.name}: ${anomalyMessage}`;
        
        // Notify the user
        newNotifications.push({
          id: `anom-user-${record.id}-${Date.now()}`,
          userId: user.id,
          message: userMessage,
          createdAt: now,
          read: false,
        });

        // Notify managers
        user.managerIds.forEach(managerId => {
          newNotifications.push({
            id: `anom-mgr-${record.id}-${managerId}-${Date.now()}`,
            userId: managerId,
            message: managerMessage,
            createdAt: now,
            read: false,
          });
        });

        // Notify admins
        adminUsers.forEach(admin => {
          newNotifications.push({
            id: `anom-adm-${record.id}-${admin.id}-${Date.now()}`,
            userId: admin.id,
            message: managerMessage,
            createdAt: now,
            read: false,
          });
        });
      }
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => {
        // Filter out duplicates based on message and userId
        const filteredNew = newNotifications.filter(nNew => 
          !prev.some(nPrev => nPrev.userId === nNew.userId && nPrev.message === nNew.message)
        );
        if (filteredNew.length === 0) return prev;
        return [...filteredNew, ...prev];
      });
    }
  }, [attendanceRecords, users]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync requests to server for calendar subscription
  useEffect(() => {
    if (currentUser) {
      const userRequests = requests.filter(r => r.userId === currentUser.id);
      fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, requests: userRequests })
      }).catch(err => console.error('Failed to sync calendar', err));
    }
  }, [requests, currentUser]);

  const t = (key: string) => translations[key]?.[language] || key;

  const login = (userIdOrPhone: string) => {
    const user = users.find(u => u.id === userIdOrPhone || u.phone === userIdOrPhone);
    if (user) setCurrentUser(user);
  };

  const logout = () => setCurrentUser(null);

  const calculateDays = (startDate: string, startPeriod: Period, endDate: string, endPeriod: Period, userId?: string, deductSaturday?: boolean) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let days = 0;
    const user = userId ? users.find(u => u.id === userId) : null;
    const workSchedule = user?.workSchedule || '5-day';

    // Iterate through each day
    let current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      const isSaturday = dayOfWeek === 6;
      const isSunday = dayOfWeek === 0;

      const dateKey = current.toISOString().split('T')[0];
      const isHoliday = !!hkHolidays2026[dateKey];

      let isWorkingDay = true;
      if (isSunday || isHoliday) {
        isWorkingDay = false; // Assume Sunday and public holidays are always off
      } else if (isSaturday) {
        if (workSchedule === '5-day') {
          isWorkingDay = false;
        } else if (workSchedule === '6-day') {
          isWorkingDay = true;
        } else if (workSchedule === 'alternating') {
          isWorkingDay = deductSaturday ?? false;
        }
      }

      if (isWorkingDay) {
        // Calculate partial days for start and end dates
        if (current.getTime() === start.getTime() && current.getTime() === end.getTime()) {
          if (startPeriod === 'am' && endPeriod === 'pm') days += 1;
          else days += 0.5;
        } else if (current.getTime() === start.getTime()) {
          days += startPeriod === 'am' ? 1 : 0.5;
        } else if (current.getTime() === end.getTime()) {
          days += endPeriod === 'pm' ? 1 : 0.5;
        } else {
          days += 1;
        }
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const applyLeave = (request: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>) => {
    const newRequest: LeaveRequest = {
      ...request,
      id: `r${Date.now()}`,
      status: 'Pending',
      appliedAt: new Date().toISOString(),
    };
    setRequests([...requests, newRequest]);

    // Notify managers
    const user = users.find(u => u.id === request.userId);
    if (user && user.managerIds.length > 0) {
      const newNotifications = user.managerIds.map(managerId => ({
        id: `n${Date.now()}-${managerId}`,
        userId: managerId,
        message: `New leave request from ${user.name} (${request.leaveType}, ${request.startDate} to ${request.endDate}).`,
        createdAt: new Date().toISOString(),
        read: false,
      }));
      setNotifications(prev => [...newNotifications, ...prev]);
    }
  };

  const approveLeave = (requestId: string, status: LeaveStatus, approverId: string) => {
    setRequests(requests.map(req => {
      if (req.id === requestId) {
        if (status === 'Approved') {
          const balance = balances.find(b => b.userId === req.userId);
          if (balance) {
            const newBalance = { ...balance };
            if (req.leaveType === 'Sick Leave' || req.leaveType === '4/5 Sick Leave') newBalance.sickLeave -= req.days;
            else if (req.leaveType === 'Annual Leave') newBalance.annualLeave -= req.days;
            else if (req.leaveType === 'Compensation Leave') newBalance.compensationLeave -= req.days;
            else if (req.leaveType === 'Paternity Leave') newBalance.paternityLeave -= req.days;
            else if (req.leaveType === 'Unpaid Leave') newBalance.unpaidLeave += req.days;
            
            setBalances(balances.map(b => b.userId === req.userId ? newBalance : b));
          }
        }
        return { ...req, status, approvedBy: approverId };
      }
      return req;
    }));
  };

  const cancelLeave = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    // Refund balance if it was approved
    if (request.status === 'Approved') {
      const balance = balances.find(b => b.userId === request.userId);
      if (balance) {
        const newBalance = { ...balance };
        if (request.leaveType === 'Sick Leave' || request.leaveType === '4/5 Sick Leave') newBalance.sickLeave += request.days;
        else if (request.leaveType === 'Annual Leave') newBalance.annualLeave += request.days;
        else if (request.leaveType === 'Compensation Leave') newBalance.compensationLeave += request.days;
        else if (request.leaveType === 'Paternity Leave') newBalance.paternityLeave += request.days;
        else if (request.leaveType === 'Unpaid Leave') newBalance.unpaidLeave -= request.days;
        
        setBalances(balances.map(b => b.userId === request.userId ? newBalance : b));
      }
    }

    setRequests(requests.map(req => req.id === requestId ? { ...req, status: 'Cancelled' } : req));

    // Notify managers and approver
    const user = users.find(u => u.id === request.userId);
    if (user) {
      const notifyIds = new Set<string>(user.managerIds);
      if (request.approvedBy) {
        notifyIds.add(request.approvedBy);
      }
      
      if (notifyIds.size > 0) {
        const newNotifications = Array.from(notifyIds).map(notifyId => ({
          id: `n${Date.now()}-${notifyId}-${Math.random().toString(36).substr(2, 9)}`,
          userId: notifyId,
          message: `Employee ${user.name} has cancelled their leave request (${request.leaveType}, ${request.startDate} to ${request.endDate}).`,
          createdAt: new Date().toISOString(),
          read: false,
        }));
        setNotifications(prev => [...newNotifications, ...prev]);
      }
    }
  };

  const applyShiftSwap = (request: Omit<ShiftSwapRequest, 'id' | 'status' | 'createdAt'>) => {
    const newRequest: ShiftSwapRequest = {
      ...request,
      id: `s${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    setShiftSwaps([newRequest, ...shiftSwaps]);
    
    // Notify target user
    const newNotification: Notification = {
      id: `n${Date.now()}-${request.targetUserId}`,
      userId: request.targetUserId,
      message: `You have a new shift swap request from ${users.find(u => u.id === request.requesterId)?.name}.`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const approveShiftSwap = (swapId: string, status: ShiftSwapStatus, approverId: string) => {
    const swap = shiftSwaps.find(s => s.id === swapId);
    if (!swap) return;

    setShiftSwaps(shiftSwaps.map(req => req.id === swapId ? { ...req, status, approvedBy: approverId } : req));

    // Notify requester
    const newNotification: Notification = {
      id: `n${Date.now()}-${swap.requesterId}`,
      userId: swap.requesterId,
      message: `Your shift swap request has been ${status.toLowerCase()}.`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const cancelShiftSwap = (swapId: string) => {
    const swap = shiftSwaps.find(s => s.id === swapId);
    if (!swap) return;

    setShiftSwaps(shiftSwaps.map(req => req.id === swapId ? { ...req, status: 'Cancelled' } : req));
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications(notifications.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const updateHierarchy = (userId: string, managerIds: string[]) => {
    setUsers(users.map(u => u.id === userId ? { ...u, managerIds } : u));
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const updateBalance = (userId: string, newBalance: Partial<LeaveBalance>) => {
    setBalances(balances.map(b => b.userId === userId ? { ...b, ...newBalance } : b));
  };

  const addPayroll = (payroll: Omit<PayrollRecord, 'id' | 'createdAt'>) => {
    const newPayroll: PayrollRecord = {
      ...payroll,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPayrolls([newPayroll, ...payrolls]);
  };

  const getLeaveRequests = (userId: string) => {
    return requests.filter(r => r.userId === userId);
  };

  const getPendingApprovals = (userId: string) => {
    const managedUserIds = users.filter(u => u.managerIds.includes(userId)).map(u => u.id);
    return requests.filter(r => managedUserIds.includes(r.userId) && r.status === 'Pending');
  };

  const calculateLeaveAllowance = (user: User) => {
    if (!user.joinDate || user.baseAnnualLeave === undefined) {
      return { annualLeave: 0, sickLeave: user.annualPaidSickLeave || 0 };
    }

    const joinDate = new Date(user.joinDate);
    const today = new Date();
    
    let yearsOfService = today.getFullYear() - joinDate.getFullYear();
    const m = today.getMonth() - joinDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < joinDate.getDate())) {
      yearsOfService--;
    }

    let annualLeave = user.baseAnnualLeave;
    if (user.annualLeaveIncreaseAfterYears !== undefined && user.annualLeaveIncreasePerYear !== undefined) {
      if (yearsOfService >= user.annualLeaveIncreaseAfterYears) {
        const extraYears = yearsOfService - user.annualLeaveIncreaseAfterYears + 1;
        annualLeave += extraYears * user.annualLeaveIncreasePerYear;
      }
    }

    return {
      annualLeave,
      sickLeave: user.annualPaidSickLeave || 0
    };
  };

  const syncAttendanceRecords = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.attendanceId) return;

    // Simulate fetching from an external system
    const newRecords: AttendanceRecord[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // Skip weekends randomly to simulate real data
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      const dateStr = d.toISOString().split('T')[0];
      
      // Check if already exists
      if (attendanceRecords.some(r => r.userId === userId && r.date === dateStr)) continue;

      // Generate random clock in (08:30 - 09:30) and clock out (17:30 - 18:30)
      const clockIn = new Date(d);
      clockIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
      
      const clockOut = new Date(d);
      clockOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);

      let workHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      
      let finalClockIn: string | undefined = clockIn.toISOString();
      let finalClockOut: string | undefined = clockOut.toISOString();

      // Introduce anomalies randomly (e.g., 10% chance)
      const rand = Math.random();
      if (rand < 0.03) {
        finalClockIn = undefined; // Missing clock in
        workHours = 0;
      } else if (rand < 0.06) {
        finalClockOut = undefined; // Missing clock out
        workHours = 0;
      } else if (rand < 0.1) {
        // Unusually low hours
        clockOut.setHours(11, 0, 0); // Left early
        finalClockOut = clockOut.toISOString();
        workHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      }

      newRecords.push({
        id: `att-${user.attendanceId}-${dateStr}`,
        userId,
        attendanceId: user.attendanceId,
        date: dateStr,
        clockIn: finalClockIn,
        clockOut: finalClockOut,
        workHours: Number(workHours.toFixed(2))
      });
    }

    setAttendanceRecords(prev => [...prev, ...newRecords]);
  };

  const submitAttendanceAppeal = (recordId: string, appeal: Omit<AttendanceAppeal, 'status' | 'submittedAt'>) => {
    setAttendanceRecords(prev => prev.map(record => {
      if (record.id === recordId) {
        return {
          ...record,
          appeal: {
            ...appeal,
            status: 'Pending',
            submittedAt: new Date().toISOString()
          }
        };
      }
      return record;
    }));

    // Notify managers
    const record = attendanceRecords.find(r => r.id === recordId);
    if (record && currentUser) {
      const newNotifications: Notification[] = currentUser.managerIds.map(managerId => ({
        id: `n${Date.now()}-${managerId}`,
        userId: managerId,
        message: `${currentUser.name} has submitted an attendance appeal for ${record.date}.`,
        createdAt: new Date().toISOString(),
        read: false,
      }));
      setNotifications(prev => [...newNotifications, ...prev]);
    }
  };

  const processAttendanceAppeal = (recordId: string, status: 'Approved' | 'Rejected', approverId: string) => {
    setAttendanceRecords(prev => prev.map(record => {
      if (record.id === recordId && record.appeal) {
        // If approved, we might want to update the actual clockIn/clockOut
        let updatedRecord = { ...record, appeal: { ...record.appeal, status, approvedBy: approverId } };
        if (status === 'Approved') {
          const dateStr = record.date;
          if (record.appeal.actualClockIn) {
            const [hours, minutes] = record.appeal.actualClockIn.split(':');
            const d = new Date(dateStr);
            d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            updatedRecord.clockIn = d.toISOString();
          }
          if (record.appeal.actualClockOut) {
            const [hours, minutes] = record.appeal.actualClockOut.split(':');
            const d = new Date(dateStr);
            d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            updatedRecord.clockOut = d.toISOString();
          }
          // Recalculate work hours if both are present
          if (updatedRecord.clockIn && updatedRecord.clockOut) {
            const inTime = new Date(updatedRecord.clockIn).getTime();
            const outTime = new Date(updatedRecord.clockOut).getTime();
            updatedRecord.workHours = Number(((outTime - inTime) / (1000 * 60 * 60)).toFixed(2));
          }
        }
        return updatedRecord;
      }
      return record;
    }));

    // Notify user
    const record = attendanceRecords.find(r => r.id === recordId);
    if (record && record.appeal) {
      const newNotification: Notification = {
        id: `n${Date.now()}-${record.userId}`,
        userId: record.userId,
        message: `Your attendance appeal for ${record.date} has been ${status.toLowerCase()}.`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const addMeeting = (meeting: Omit<Meeting, 'id' | 'createdBy'>) => {
    if (!currentUser) return;
    const newMeeting: Meeting = {
      ...meeting,
      id: `m${Date.now()}`,
      createdBy: currentUser.id,
    };
    setMeetings(prev => [...prev, newMeeting]);
  };

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMeeting = (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, balances, requests, payrolls, notifications, shiftSwaps, attendanceRecords, meetings,
      language, setLanguage, theme, setTheme, approvalReminderDays, setApprovalReminderDays, payrollSettings, setPayrollSettings, t,
      login, logout, applyLeave, approveLeave, cancelLeave, markNotificationRead, updateHierarchy, updateUser, updateBalance, addPayroll,
      getLeaveRequests, getPendingApprovals, calculateDays, calculateLeaveAllowance, checkReminders,
      applyShiftSwap, approveShiftSwap, cancelShiftSwap, syncAttendanceRecords, checkAttendanceAnomalies,
      submitAttendanceAppeal, processAttendanceAppeal,
      addMeeting, updateMeeting, deleteMeeting
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

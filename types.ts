export type Role = 'employee' | 'admin';
export type LeaveType = 'Sick Leave' | '4/5 Sick Leave' | 'Annual Leave' | 'Compensation Leave' | 'Paternity Leave' | 'Unpaid Leave';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type Period = 'am' | 'pm';

export type SalaryType = 'Daily' | 'Monthly';
export type CalcMethod = 'Daily' | 'Monthly' | 'Yearly';
export type PaymentMethod = 'Cash' | 'Cheque' | 'Bank Transfer';
export type PaymentStatus = 'Unpaid' | 'Paid';
export type DailyRateMethod = 'calendarDays' | 'fixed30' | 'workingDays22';

export type WorkSchedule = '5-day' | '6-day' | 'alternating';
export type WageType = 'monthly' | 'daily';
export type LongWeekParity = 'even' | 'odd'; // For alternating weeks: which week of the year is their long week (working Saturday)

export interface PayrollSettings {
  dailyRateMethod: DailyRateMethod;
  unpaidLeaveMultiplier: number;
  sickLeaveMultiplier: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  managerIds: string[]; // Who can approve this user's leave
  joinDate?: string;
  baseAnnualLeave?: number;
  annualLeaveIncreaseAfterYears?: number;
  annualLeaveIncreasePerYear?: number;
  annualPaidSickLeave?: number;
  workSchedule?: WorkSchedule;
  wageType?: WageType;
  longWeekParity?: LongWeekParity;
  attendanceId?: string; // ID in the external attendance system
  baseSalary?: number; // Daily rate or monthly salary
  canManageMeetings?: boolean; // Permission to manage meetings
}

export type MeetingType = 'Site Progress Meeting' | 'Coordination Meeting' | 'Ad-hoc Meeting' | 'Internal Meeting';
export type NotificationFrequency = 'None' | '1 day before' | '2 days before' | '1 week before';

export interface Meeting {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  projectNumber?: string;
  meetingType?: MeetingType;
  remarks?: string;
  participants?: string[];
  notificationFrequency?: NotificationFrequency;
  notifyOnDay?: boolean;
  createdBy: string;
}

export interface AttendanceAppeal {
  type: 'clock-in' | 'clock-out' | 'both';
  reason: string;
  actualClockIn?: string; // HH:mm
  actualClockOut?: string; // HH:mm
  location: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  approvedBy?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  attendanceId: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // ISO string
  clockOut?: string; // ISO string
  workHours?: number;
  appeal?: AttendanceAppeal;
}

export type ShiftSwapStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  targetUserId: string;
  originalDate: string; // The date the requester is currently scheduled to work
  proposedDate: string; // The date the requester wants to work instead (which the target user is currently scheduled to work)
  reason?: string;
  status: ShiftSwapStatus;
  createdAt: string;
  approvedBy?: string;
}

export interface LeaveBalance {
  userId: string;
  sickLeave: number;
  annualLeave: number;
  compensationLeave: number;
  paternityLeave: number;
  unpaidLeave: number; // Track taken days
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: string; // yyyy-mm-dd
  startPeriod: Period;
  endDate: string; // yyyy-mm-dd
  endPeriod: Period;
  days: number;
  deductSaturday?: boolean;
  proofUrl?: string;
  remarks?: string;
  status: LeaveStatus;
  appliedAt: string;
  approvedBy?: string;
}

export interface PayrollRecord {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  basicSalary: number;
  workingDays?: number;
  salaryType: SalaryType;
  calcMethod: CalcMethod;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  deductionUnpaidLeave: number;
  deductionOthers: number;
  mpfDeduction: number;
  netSalary: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
}

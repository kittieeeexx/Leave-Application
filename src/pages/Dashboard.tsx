import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isWithinInterval, getWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, X, Plus, Trash2, Edit2, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { hkHolidays2026 } from '../utils/holidays';
import { Meeting, MeetingType, NotificationFrequency } from '../types';

export const Dashboard: React.FC = () => {
  const { currentUser, balances, requests, users, t, language, meetings, addMeeting, updateMeeting, deleteMeeting } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Meeting form state
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingProjectNumber, setMeetingProjectNumber] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('Internal Meeting');
  const [meetingRemarks, setMeetingRemarks] = useState('');
  const [meetingParticipants, setMeetingParticipants] = useState<string[]>([]);
  const [meetingNotificationFreq, setMeetingNotificationFreq] = useState<NotificationFrequency>('None');
  const [meetingNotifyOnDay, setMeetingNotifyOnDay] = useState(false);

  const userBalance = balances.find(b => b.userId === currentUser?.id);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = monthStart;
  const endDate = monthEnd;
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getLeaveForDay = (day: Date) => {
    return requests.filter(req => {
      const reqStart = parseISO(req.startDate);
      const reqEnd = parseISO(req.endDate);
      return isWithinInterval(day, { start: reqStart, end: reqEnd }) && req.status !== 'Rejected';
    });
  };

  const getMeetingsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return meetings.filter(m => m.date === dateStr);
  };

  const resetMeetingForm = () => {
    setShowMeetingForm(false);
    setEditingMeeting(null);
    setMeetingTitle('');
    setMeetingProjectNumber('');
    setMeetingType('Internal Meeting');
    setMeetingRemarks('');
    setMeetingParticipants([]);
    setMeetingNotificationFreq('None');
    setMeetingNotifyOnDay(false);
  };

  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !meetingTitle.trim()) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const meetingData = {
      title: meetingTitle,
      projectNumber: meetingProjectNumber,
      meetingType,
      remarks: meetingRemarks,
      participants: meetingParticipants,
      notificationFrequency: meetingNotificationFreq,
      notifyOnDay: meetingNotifyOnDay
    };

    if (editingMeeting) {
      updateMeeting(editingMeeting.id, meetingData);
    } else {
      addMeeting({
        date: dateStr,
        ...meetingData
      });
    }
    
    resetMeetingForm();
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setMeetingTitle(meeting.title);
    setMeetingProjectNumber(meeting.projectNumber || '');
    setMeetingType(meeting.meetingType || 'Internal Meeting');
    setMeetingRemarks(meeting.remarks || '');
    setMeetingParticipants(meeting.participants || []);
    setMeetingNotificationFreq(meeting.notificationFrequency || 'None');
    setMeetingNotifyOnDay(meeting.notifyOnDay || false);
    setShowMeetingForm(true);
  };

  const handleDeleteMeeting = (id: string) => {
    if (window.confirm('確定要刪除此會議嗎？(Are you sure you want to delete this meeting?)')) {
      deleteMeeting(id);
    }
  };

  const dayNames = [t('day.sun'), t('day.mon'), t('day.tue'), t('day.wed'), t('day.thu'), t('day.fri'), t('day.sat')];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('dash.title')}</h2>

      {/* Balance Summary */}
      {userBalance && (
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">{t('dash.balance')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{t('leave.Annual Leave')}</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">{userBalance.annualLeave.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{t('leave.Sick Leave')}</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">{userBalance.sickLeave.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{t('leave.Compensation Leave')}</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">{userBalance.compensationLeave.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{t('leave.Paternity Leave')}</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">{userBalance.paternityLeave.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t('dash.calendar')}</h3>
          <div className="flex items-center space-x-4">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{format(currentDate, 'yyyy / MM')}</span>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {dayNames.map((day, idx) => (
              <div key={day} className={`bg-slate-50 dark:bg-slate-800 py-2 text-center text-xs font-semibold uppercase tracking-wider ${idx === 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {day}
              </div>
            ))}
            {/* Add empty slots for the first day of the month */}
            {Array.from({ length: startDate.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white dark:bg-slate-800 min-h-[100px]" />
            ))}
            {days.map((day) => {
              const dayLeaves = getLeaveForDay(day);
              const dayMeetings = getMeetingsForDay(day);
              const dateKey = format(day, 'yyyy-MM-dd');
              const holiday = hkHolidays2026[dateKey];
              const isSunday = day.getDay() === 0;
              const isSaturday = day.getDay() === 6;
              const isRedDay = isSunday || !!holiday;
              
              const longWeekColleagues = isSaturday ? users.filter(u => {
                if (u.workSchedule !== 'alternating') return false;
                const weekNum = getWeek(day);
                const isEvenWeek = weekNum % 2 === 0;
                return (u.longWeekParity === 'even' && isEvenWeek) || (u.longWeekParity === 'odd' && !isEvenWeek);
              }) : [];
              
              return (
                <div
                  key={day.toString()}
                  onClick={() => {
                    setSelectedDate(day);
                    resetMeetingForm();
                  }}
                  className={`bg-white dark:bg-slate-800 min-h-[100px] p-2 border-t border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    !isSameMonth(day, monthStart) ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <time dateTime={dateKey} className={`font-medium text-sm w-7 h-7 flex items-center justify-center rounded-full ${
                      isSameDay(day, new Date()) 
                        ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900' 
                        : isRedDay ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {format(day, dateFormat)}
                    </time>
                    {holiday && (
                      <span className="text-[10px] leading-tight text-red-500 dark:text-red-400 mt-0.5 truncate" title={holiday[language]}>
                        {holiday[language]}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    {dayMeetings.length > 0 && (
                      <div className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 truncate font-semibold flex items-center">
                        <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                        {dayMeetings.length} 會議 (Meetings)
                      </div>
                    )}
                    {longWeekColleagues.length > 0 && (
                      <div className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 truncate" title={longWeekColleagues.map(u => u.name).join(', ')}>
                        {longWeekColleagues.length} {t('dash.long_week')}
                      </div>
                    )}
                    {dayLeaves.map(leave => {
                      const user = users.find(u => u.id === leave.userId);
                      const isPending = leave.status === 'Pending';
                      return (
                        <div key={leave.id} className={`text-xs px-1.5 py-0.5 rounded truncate ${
                          isPending 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        }`}>
                          {user?.name.split(' ')[0]} ({isPending ? t('status.Pending_short') : t('status.Approved_short')})
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {format(selectedDate, 'yyyy-MM-dd')} 詳細資訊 (Details)
              </h3>
              <button onClick={() => {
                setSelectedDate(null);
                resetMeetingForm();
              }} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Meetings Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-500" />
                    會議 (Meetings)
                  </h4>
                  {currentUser?.canManageMeetings && !showMeetingForm && (
                    <button 
                      onClick={() => setShowMeetingForm(true)}
                      className="text-xs flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Plus className="h-3 w-3 mr-1" /> 新增 (Add)
                    </button>
                  )}
                </div>

                {showMeetingForm ? (
                  <form onSubmit={handleSaveMeeting} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 mb-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">標題 (Title)</label>
                        <input 
                          type="text" 
                          required
                          value={meetingTitle}
                          onChange={e => setMeetingTitle(e.target.value)}
                          className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">項目編號 (Project Number)</label>
                        <input 
                          type="text" 
                          value={meetingProjectNumber}
                          onChange={e => setMeetingProjectNumber(e.target.value)}
                          className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">會議類型 (Meeting Type)</label>
                        <select 
                          value={meetingType}
                          onChange={e => setMeetingType(e.target.value as MeetingType)}
                          className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Site Progress Meeting">1) Site Progress Meeting</option>
                          <option value="Coordination Meeting">2) Coordination Meeting</option>
                          <option value="Ad-hoc Meeting">3) Ad-hoc Meeting</option>
                          <option value="Internal Meeting">4) Internal Meeting</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">備註 (Remarks)</label>
                        <textarea 
                          value={meetingRemarks}
                          onChange={e => setMeetingRemarks(e.target.value)}
                          rows={2}
                          className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">參與人士 (Participants)</label>
                        <div className="max-h-32 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-800">
                          {users.map(u => (
                            <label key={u.id} className="flex items-center space-x-2 py-1">
                              <input 
                                type="checkbox" 
                                checked={meetingParticipants.includes(u.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setMeetingParticipants([...meetingParticipants, u.id]);
                                  } else {
                                    setMeetingParticipants(meetingParticipants.filter(id => id !== u.id));
                                  }
                                }}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-300">{u.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">通知頻率 (Notification)</label>
                          <select 
                            value={meetingNotificationFreq}
                            onChange={e => setMeetingNotificationFreq(e.target.value as NotificationFrequency)}
                            className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="None">無 (None)</option>
                            <option value="1 day before">1天前 (1 day before)</option>
                            <option value="2 days before">2天前 (2 days before)</option>
                            <option value="1 week before">1週前 (1 week before)</option>
                          </select>
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={meetingNotifyOnDay}
                              onChange={e => setMeetingNotifyOnDay(e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">會議當天通知 (Notify on day)</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <button 
                          type="button" 
                          onClick={resetMeetingForm}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          取消 (Cancel)
                        </button>
                        <button 
                          type="submit"
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                        >
                          儲存 (Save)
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {getMeetingsForDay(selectedDate).length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">無會議 (No meetings)</p>
                    ) : (
                      getMeetingsForDay(selectedDate).map(meeting => (
                        <div key={meeting.id} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                          <div className="flex justify-between items-start">
                            <h5 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                              {meeting.projectNumber && <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded mr-2">{meeting.projectNumber}</span>}
                              {meeting.title}
                            </h5>
                            {currentUser?.canManageMeetings && (
                              <div className="flex space-x-1">
                                <button onClick={() => handleEditMeeting(meeting)} className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button onClick={() => handleDeleteMeeting(meeting.id)} className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="mt-1.5 space-y-1">
                            {meeting.meetingType && (
                              <p className="text-xs text-slate-600 dark:text-slate-400"><span className="font-medium">類型:</span> {meeting.meetingType}</p>
                            )}
                            {meeting.remarks && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap"><span className="font-medium">備註:</span> {meeting.remarks}</p>
                            )}
                            {meeting.participants && meeting.participants.length > 0 && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                <span className="font-medium">參與人士:</span> {meeting.participants.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ')}
                              </p>
                            )}
                            {(meeting.notificationFrequency !== 'None' || meeting.notifyOnDay) && (
                              <p className="text-xs text-slate-500 dark:text-slate-500">
                                <span className="font-medium">通知:</span> {[
                                  meeting.notificationFrequency !== 'None' ? meeting.notificationFrequency : null,
                                  meeting.notifyOnDay ? '當天' : null
                                ].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <hr className="border-slate-200 dark:border-slate-700" />

              {/* Leaves Section */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                  <span className="w-4 h-4 mr-2 rounded-full bg-emerald-100 flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-emerald-500"></span></span>
                  請假紀錄 (Leave Records)
                </h4>
                {getLeaveForDay(selectedDate).length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">{t('dash.no_leave')}</p>
                ) : (
                  <div className="space-y-3">
                    {getLeaveForDay(selectedDate).map(leave => {
                      const user = users.find(u => u.id === leave.userId);
                      return (
                        <div key={leave.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{user?.name}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${leave.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                              {t(`status.${leave.status}`)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            <p className="font-medium">{t(`leave.${leave.leaveType}`)}</p>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                              {leave.startDate} ({t(`time.${leave.startPeriod}`)}) - {leave.endDate} ({t(`time.${leave.endPeriod}`)})
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Long Week Duty Section */}
              {selectedDate.getDay() === 6 && (
                <>
                  <hr className="border-slate-200 dark:border-slate-700" />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                      <span className="w-4 h-4 mr-2 rounded-full bg-indigo-100 flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-indigo-500"></span></span>
                      長週當值 (Long Week Duty)
                    </h4>
                    {(() => {
                      const weekNum = getWeek(selectedDate);
                      const isEvenWeek = weekNum % 2 === 0;
                      const longWeekColleagues = users.filter(u => {
                        if (u.workSchedule !== 'alternating') return false;
                        return (u.longWeekParity === 'even' && isEvenWeek) || (u.longWeekParity === 'odd' && !isEvenWeek);
                      });

                      if (longWeekColleagues.length === 0) {
                        return <p className="text-sm text-slate-500 dark:text-slate-400 italic">無人當值 (No duty)</p>;
                      }

                      return (
                        <div className="flex flex-wrap gap-2">
                          {longWeekColleagues.map(u => (
                            <span key={u.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                              {u.name}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

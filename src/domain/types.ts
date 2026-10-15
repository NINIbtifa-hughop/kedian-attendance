export type ID = string
export type AttendanceStatus = 'present' | 'late' | 'leave' | 'absent'
export type LessonStatus = 'pending' | 'held' | 'all_absent' | 'cancelled'

export interface ClassRoom { id: ID; name: string; note?: string; archivedAt?: string; createdAt: string; updatedAt: string }
export interface Student { id: ID; classId: ID; name: string; note?: string; archivedAt?: string; createdAt: string; updatedAt: string }
export interface RecurringSchedule { id: ID; classId: ID; weekday: number; startTime: string; effectiveFrom: string; effectiveTo?: string; createdAt: string; updatedAt: string }
export interface Lesson { id: ID; classId: ID; scheduleId?: ID; generationKey: string; localDate: string; startTime: string; source: 'scheduled' | 'manual'; status: LessonStatus; cancellationReason?: string; note?: string; createdAt: string; updatedAt: string }
export interface AttendanceRecord { id: ID; lessonId: ID; studentId: ID; studentNameSnapshot: string; status: AttendanceStatus; updatedAt: string }
export interface AppMetadata { key: string; value: string }
export interface MonthlyStats { planned: number; held: number; allAbsent: number; cancelled: number; pending: number; attendance: Record<AttendanceStatus, number>; attendanceTotal: number }

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = { present: '出勤', late: '迟到', leave: '请假', absent: '缺勤' }
export const LESSON_LABELS: Record<LessonStatus, string> = { pending: '待确认', held: '已上课', all_absent: '全员未到 / 未开课', cancelled: '其他取消' }
export const WEEKDAY_LABELS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']

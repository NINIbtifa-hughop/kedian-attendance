import { eachDayOfInterval, endOfMonth, format, getISODay, isAfter, isBefore, parseISO, startOfMonth } from 'date-fns'
import type { AttendanceRecord, AttendanceStatus, Lesson, LessonStatus, MonthlyStats, RecurringSchedule } from './types'

export function newId(): string { return crypto.randomUUID() }
export function nowIso(): string { return new Date().toISOString() }
export function monthBounds(month: string) {
  const start = startOfMonth(parseISO(`${month}-01`))
  return { start: format(start, 'yyyy-MM-dd'), end: format(endOfMonth(start), 'yyyy-MM-dd') }
}

export function buildLessons(schedules: RecurringSchedule[], month: string, existingKeys: Set<string> = new Set(), now = nowIso()): Lesson[] {
  const bounds = monthBounds(month)
  const days = eachDayOfInterval({ start: parseISO(bounds.start), end: parseISO(bounds.end) })
  const lessons: Lesson[] = []
  for (const schedule of schedules) {
    for (const day of days) {
      const localDate = format(day, 'yyyy-MM-dd')
      if (getISODay(day) !== schedule.weekday) continue
      if (isBefore(day, parseISO(schedule.effectiveFrom))) continue
      if (schedule.effectiveTo && isAfter(day, parseISO(schedule.effectiveTo))) continue
      const generationKey = `${schedule.id}:${localDate}:${schedule.startTime}`
      if (existingKeys.has(generationKey)) continue
      existingKeys.add(generationKey)
      lessons.push({ id: newId(), classId: schedule.classId, scheduleId: schedule.id, generationKey, localDate, startTime: schedule.startTime, source: 'scheduled', status: 'pending', createdAt: now, updatedAt: now })
    }
  }
  return lessons
}

export function validateLessonSubmission(status: LessonStatus, records: Array<{ status: AttendanceStatus }>, cancellationReason = ''): string | null {
  if (status === 'pending') return '请确认本节课程状态'
  if (status === 'cancelled' && !cancellationReason.trim()) return '其他取消必须填写原因'
  if (status === 'cancelled' && records.length) return '取消课程不应保存出勤记录'
  const allAbsent = records.length > 0 && records.every((record) => record.status === 'absent')
  if (allAbsent && status !== 'held' && status !== 'all_absent') return '全员缺勤时，请明确确认课程是否实际开课'
  return null
}

export function calculateMonthlyStats(lessons: Lesson[], attendance: AttendanceRecord[]): MonthlyStats {
  const attendanceCounts: Record<AttendanceStatus, number> = { present: 0, late: 0, leave: 0, absent: 0 }
  const lessonIds = new Set(lessons.map((lesson) => lesson.id))
  attendance.filter((record) => lessonIds.has(record.lessonId)).forEach((record) => { attendanceCounts[record.status] += 1 })
  return {
    planned: lessons.length,
    held: lessons.filter((lesson) => lesson.status === 'held').length,
    allAbsent: lessons.filter((lesson) => lesson.status === 'all_absent').length,
    cancelled: lessons.filter((lesson) => lesson.status === 'cancelled').length,
    pending: lessons.filter((lesson) => lesson.status === 'pending').length,
    attendance: attendanceCounts,
    attendanceTotal: Object.values(attendanceCounts).reduce((sum, value) => sum + value, 0),
  }
}

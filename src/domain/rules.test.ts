import { describe, expect, it, vi } from 'vitest'
import type { AttendanceRecord, Lesson, RecurringSchedule } from './types'
import { buildLessons, calculateMonthlyStats, validateLessonSubmission } from './rules'

vi.stubGlobal('crypto', { randomUUID: () => `id-${Math.random()}` })
const schedule = (overrides: Partial<RecurringSchedule> = {}): RecurringSchedule => ({ id: 's1', classId: 'c1', weekday: 1, startTime: '16:30', effectiveFrom: '2024-01-01', createdAt: '', updatedAt: '', ...overrides })
const lesson = (id: string, status: Lesson['status']): Lesson => ({ id, classId: 'c1', generationKey: id, localDate: '2024-02-01', startTime: '10:00', source: 'manual', status, createdAt: '', updatedAt: '' })

describe('课表生成', () => {
  it('正确处理闰年并保持幂等', () => {
    const items = buildLessons([schedule({ weekday: 4 })], '2024-02')
    expect(items.map((item) => item.localDate)).toEqual(['2024-02-01', '2024-02-08', '2024-02-15', '2024-02-22', '2024-02-29'])
    expect(buildLessons([schedule({ weekday: 4 })], '2024-02', new Set(items.map((item) => item.generationKey)))).toHaveLength(0)
  })
  it('遵守生效起止日期', () => expect(buildLessons([schedule({ effectiveFrom: '2024-02-10', effectiveTo: '2024-02-20' })], '2024-02').map((item) => item.localDate)).toEqual(['2024-02-12', '2024-02-19']))
})
describe('点名确认', () => {
  it('要求取消原因且不保存虚假点名', () => { expect(validateLessonSubmission('cancelled', [], '')).toBeTruthy(); expect(validateLessonSubmission('cancelled', [{ status: 'present' }], '节假日')).toBeTruthy(); expect(validateLessonSubmission('cancelled', [], '节假日')).toBeNull() })
  it('全员缺勤允许显式确认已上课或未开课', () => { expect(validateLessonSubmission('held', [{ status: 'absent' }])).toBeNull(); expect(validateLessonSubmission('all_absent', [{ status: 'absent' }])).toBeNull() })
})
describe('月度统计', () => {
  it('按照四种课程和出勤状态统计', () => {
    const lessons = [lesson('l1', 'held'), lesson('l2', 'all_absent'), lesson('l3', 'cancelled'), lesson('l4', 'pending')]
    const records = ['present', 'late', 'leave', 'absent'].map((status, index) => ({ id: `r${index}`, lessonId: 'l1', studentId: `s${index}`, studentNameSnapshot: '同学', status, updatedAt: '' })) as AttendanceRecord[]
    expect(calculateMonthlyStats(lessons, records)).toMatchObject({ planned: 4, held: 1, allAbsent: 1, cancelled: 1, pending: 1, attendanceTotal: 4, attendance: { present: 1, late: 1, leave: 1, absent: 1 } })
  })
})

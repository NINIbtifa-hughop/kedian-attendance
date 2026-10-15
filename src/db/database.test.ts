import { afterEach, describe, expect, it } from 'vitest'
import { AttendanceDB } from './database'

describe('数据库 schema', () => {
  const databases: AttendanceDB[] = []
  afterEach(async () => { await Promise.all(databases.map((item) => item.delete())); databases.length = 0 })
  it('阻止重复生成课程和重复学生点名', async () => {
    const database = new AttendanceDB('schema-' + Math.random()); databases.push(database); const base = { classId: 'c1', localDate: '2026-10-01', startTime: '10:00', source: 'scheduled' as const, status: 'pending' as const, createdAt: '', updatedAt: '' }
    await database.lessons.add({ ...base, id: 'l1', generationKey: 'same' })
    await expect(database.lessons.add({ ...base, id: 'l2', generationKey: 'same' })).rejects.toThrow()
    await database.attendanceRecords.add({ id: 'a1', lessonId: 'l1', studentId: 's1', studentNameSnapshot: '同名学生', status: 'present', updatedAt: '' })
    await expect(database.attendanceRecords.add({ id: 'a2', lessonId: 'l1', studentId: 's1', studentNameSnapshot: '同名学生', status: 'absent', updatedAt: '' })).rejects.toThrow()
  })
})

import Dexie, { type EntityTable } from 'dexie'
import type { AppMetadata, AttendanceRecord, ClassRoom, Lesson, RecurringSchedule, Student } from '../domain/types'

export class AttendanceDB extends Dexie {
  classes!: EntityTable<ClassRoom, 'id'>
  students!: EntityTable<Student, 'id'>
  recurringSchedules!: EntityTable<RecurringSchedule, 'id'>
  lessons!: EntityTable<Lesson, 'id'>
  attendanceRecords!: EntityTable<AttendanceRecord, 'id'>
  appMetadata!: EntityTable<AppMetadata, 'key'>

  constructor(name = 'attendance-register') {
    super(name)
    this.version(1).stores({
      classes: 'id, name, archivedAt',
      students: 'id, classId, [classId+archivedAt]',
      recurringSchedules: 'id, classId, [classId+effectiveFrom]',
      lessons: 'id, classId, localDate, [classId+localDate], &generationKey',
      attendanceRecords: 'id, lessonId, studentId, &[lessonId+studentId]',
      appMetadata: 'key',
    })
  }
}

export const db = new AttendanceDB()

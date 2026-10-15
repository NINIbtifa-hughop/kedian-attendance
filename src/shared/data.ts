import Papa from 'papaparse'
import { z } from 'zod'
import { db, type AttendanceDB } from '../db/database'
import type { AttendanceRecord, ClassRoom, Lesson, RecurringSchedule, Student } from '../domain/types'

const dangerousPrefix = /^[=+-@]/
export function safeCell(value: unknown): string {
  const text = String(value ?? '')
  return dangerousPrefix.test(text) ? `'${text}` : text
}
export function csvDownload(filename: string, rows: Record<string, unknown>[]): void {
  const safeRows = rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, safeCell(value)])))
  download(filename, `\uFEFF${Papa.unparse(safeRows)}`, 'text/csv;charset=utf-8')
}
export function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url)
}

const studentRow = z.object({ name: z.string().trim().min(1, '姓名不能为空').max(80, '姓名不能超过 80 字'), note: z.string().max(300, '备注不能超过 300 字').optional().default('') })
export interface ImportResult { valid: Array<{ name: string; note: string; row: number; duplicate: boolean }>; errors: string[] }
export function parseStudentCsv(text: string): ImportResult {
  const parsed = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true, transformHeader: (header) => ({ 姓名: 'name', 备注: 'note' })[header.trim()] ?? header.trim().toLowerCase() })
  const seen = new Set<string>(); const valid: ImportResult['valid'] = []; const errors: string[] = []
  parsed.errors.forEach((error) => errors.push(`第 ${Number(error.row ?? 0) + 2} 行：${error.message}`))
  parsed.data.forEach((raw, index) => {
    const result = studentRow.safeParse(raw)
    if (!result.success) { errors.push(`第 ${index + 2} 行：${result.error.issues[0].message}`); return }
    const signature = `${result.data.name}\u0000${result.data.note}`
    valid.push({ ...result.data, row: index + 2, duplicate: seen.has(signature) }); seen.add(signature)
  })
  return { valid, errors }
}

const backupSchema = z.object({
  format: z.literal('attendance-register-backup'), version: z.literal(1), exportedAt: z.string().datetime(),
  data: z.object({ classes: z.array(z.any()), students: z.array(z.any()), recurringSchedules: z.array(z.any()), lessons: z.array(z.any()), attendanceRecords: z.array(z.any()) }),
})
export async function createBackup(database: AttendanceDB = db) {
  return { format: 'attendance-register-backup' as const, version: 1 as const, exportedAt: new Date().toISOString(), data: { classes: await database.classes.toArray(), students: await database.students.toArray(), recurringSchedules: await database.recurringSchedules.toArray(), lessons: await database.lessons.toArray(), attendanceRecords: await database.attendanceRecords.toArray() } }
}
export async function restoreBackup(input: unknown, database: AttendanceDB = db): Promise<void> {
  const backup = backupSchema.parse(input)
  const classIds = new Set((backup.data.classes as ClassRoom[]).map((item) => item.id)); const lessonIds = new Set((backup.data.lessons as Lesson[]).map((item) => item.id))
  if ((backup.data.students as Student[]).some((item) => !classIds.has(item.classId)) || (backup.data.recurringSchedules as RecurringSchedule[]).some((item) => !classIds.has(item.classId)) || (backup.data.lessons as Lesson[]).some((item) => !classIds.has(item.classId)) || (backup.data.attendanceRecords as AttendanceRecord[]).some((item) => !lessonIds.has(item.lessonId))) throw new Error('备份中的关联数据不完整')
  await database.transaction('rw', [database.classes, database.students, database.recurringSchedules, database.lessons, database.attendanceRecords], async () => {
    await Promise.all([database.attendanceRecords.clear(), database.lessons.clear(), database.recurringSchedules.clear(), database.students.clear(), database.classes.clear()])
    await database.classes.bulkAdd(backup.data.classes as ClassRoom[]); await database.students.bulkAdd(backup.data.students as Student[]); await database.recurringSchedules.bulkAdd(backup.data.recurringSchedules as RecurringSchedule[]); await database.lessons.bulkAdd(backup.data.lessons as Lesson[]); await database.attendanceRecords.bulkAdd(backup.data.attendanceRecords as AttendanceRecord[])
  })
}

import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, Save } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { db } from '../../db/database'
import { newId, nowIso, validateLessonSubmission } from '../../domain/rules'
import { ATTENDANCE_LABELS, LESSON_LABELS, type AttendanceStatus, type LessonStatus } from '../../domain/types'
import { Button, Empty } from '../../shared/ui'

export function AttendancePage() {
  const { lessonId = '' } = useParams(); const lesson = useLiveQuery(() => db.lessons.get(lessonId), [lessonId]); const classRoom = useLiveQuery(() => lesson ? db.classes.get(lesson.classId) : undefined, [lesson]); const students = useLiveQuery(() => lesson ? db.students.where('classId').equals(lesson.classId).filter((item) => !item.archivedAt).toArray() : [], [lesson]); const existing = useLiveQuery(() => db.attendanceRecords.where('lessonId').equals(lessonId).toArray(), [lessonId])
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({}); const [status, setStatus] = useState<LessonStatus>('pending'); const [note, setNote] = useState(''); const [reason, setReason] = useState(''); const [dirty, setDirty] = useState(false); const [message, setMessage] = useState('')
  useEffect(() => { if (lesson && students && existing) { setStatus(lesson.status); setNote(lesson.note ?? ''); setReason(lesson.cancellationReason ?? ''); setRecords(Object.fromEntries(students.map((student) => [student.id, existing.find((record) => record.studentId === student.id)?.status ?? 'present']))) } }, [lesson, students, existing])
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn) }, [dirty])
  const counts = useMemo(() => Object.values(records).reduce<Record<AttendanceStatus, number>>((acc, item) => { acc[item]++; return acc }, { present: 0, late: 0, leave: 0, absent: 0 }), [records])
  if (lesson === undefined || students === undefined || existing === undefined) return <div className="page loading">正在加载…</div>
  if (!lesson) return <div className="page"><Empty title="课程不存在" text="这节课程可能已经删除。" /></div>
  function changeStudent(studentId: string, next: AttendanceStatus) { setRecords((current) => ({ ...current, [studentId]: next })); setDirty(true); setMessage('') }
  async function save() {
    const list = status === 'cancelled' ? [] : (students ?? []).map((student) => ({ student, status: records[student.id] ?? 'present' }))
    const error = validateLessonSubmission(status, list, reason); if (error) { setMessage(error); return }
    const now = nowIso(); await db.transaction('rw', db.lessons, db.attendanceRecords, async () => { await db.attendanceRecords.where('lessonId').equals(lessonId).delete(); if (list.length) await db.attendanceRecords.bulkAdd(list.map(({ student, status: attendanceStatus }) => ({ id: newId(), lessonId, studentId: student.id, studentNameSnapshot: student.name, status: attendanceStatus, updatedAt: now }))); await db.lessons.update(lessonId, { status, cancellationReason: status === 'cancelled' ? reason.trim() : undefined, note: note.trim(), updatedAt: now }) }); setDirty(false); setMessage('点名结果已保存')
  }
  return <div className="attendance-page"><div className="attendance-top"><Link className="back-link" to="/lessons"><ArrowLeft />返回课程</Link><div className="attendance-title"><span>{lesson.localDate} · {lesson.startTime}</span><h1>{classRoom?.name ?? '课程点名'}</h1></div><div className="save-wrap">{dirty && <span className="unsaved">● 有未保存修改</span>}<Button onClick={() => void save()}><Save />保存点名</Button></div></div>
    <div className="count-strip">{(Object.keys(ATTENDANCE_LABELS) as AttendanceStatus[]).map((key) => <div key={key}><strong>{counts[key]}</strong><span>{ATTENDANCE_LABELS[key]}</span></div>)}</div>
    <div className="attendance-layout"><section className="panel roster"><div className="section-head"><div><h2>学生出勤</h2><p>先全部设为出勤，再调整异常学生</p></div><Button variant="secondary" onClick={() => { setRecords(Object.fromEntries((students ?? []).map((student) => [student.id, 'present']))); setDirty(true) }}><Check />全部出勤</Button></div>
      {!students?.length ? <Empty title="没有在读学生" text="请先回到班级详情添加学生。" /> : <div className="attendance-list">{students.map((student) => <div className="attendance-row" key={student.id}><div className="student-name"><span className="avatar">{student.name.slice(0, 1)}</span><div><strong>{student.name}</strong>{student.note && <small>{student.note}</small>}</div></div><div className="status-buttons">{(Object.keys(ATTENDANCE_LABELS) as AttendanceStatus[]).map((key) => <button key={key} className={key + (records[student.id] === key ? ' selected' : '')} onClick={() => changeStudent(student.id, key)}>{ATTENDANCE_LABELS[key]}</button>)}</div></div>)}</div>}
    </section><aside className="panel lesson-confirm"><h2>课程确认</h2><p>学生状态与课程是否实际进行是两个问题。</p><div className="radio-list">{(Object.keys(LESSON_LABELS) as LessonStatus[]).filter((key) => key !== 'pending').map((key) => <label key={key}><input type="radio" name="lessonStatus" checked={status === key} onChange={() => { setStatus(key); setDirty(true); setMessage('') }} /><span><strong>{LESSON_LABELS[key]}</strong><small>{key === 'held' ? '计入教师课时' : '不计入教师课时'}</small></span></label>)}</div>{status === 'cancelled' && <label>取消原因<textarea required value={reason} onChange={(e) => { setReason(e.target.value); setDirty(true) }} placeholder="例如：节假日、教师请假" /></label>}<label>本节备注<textarea value={note} onChange={(e) => { setNote(e.target.value); setDirty(true) }} placeholder="课堂情况等（选填）" /></label>{message && <div className={message.includes('已保存') ? 'success-text' : 'error-text'}>{message}</div>}<Button className="full-button" onClick={() => void save()}><Save />保存点名</Button></aside></div>
  </div>
}

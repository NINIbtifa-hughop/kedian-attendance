import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarPlus, CheckCircle2, Clock3, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../../db/database'
import { buildLessons, monthBounds, newId, nowIso } from '../../domain/rules'
import { LESSON_LABELS } from '../../domain/types'
import { todayMonth } from '../../shared/helpers'
import { Button, Empty, Form, Modal, PageHeader } from '../../shared/ui'

export function LessonsPage() {
  const classes = useLiveQuery(() => db.classes.filter((item) => !item.archivedAt).toArray(), [])
  const [classId, setClassId] = useState(''); const activeClassId = classId || classes?.[0]?.id || ''; const [month, setMonth] = useState(todayMonth()); const [notice, setNotice] = useState(''); const [manualOpen, setManualOpen] = useState(false); const [date, setDate] = useState(todayMonth() + '-01'); const [time, setTime] = useState('16:30')
  const lessons = useLiveQuery(async () => { if (!activeClassId) return []; const { start, end } = monthBounds(month); return db.lessons.where('[classId+localDate]').between([activeClassId, start], [activeClassId, end], true, true).sortBy('localDate') }, [activeClassId, month])
  async function generate() { const schedules = await db.recurringSchedules.where('classId').equals(activeClassId).toArray(); const existing = new Set((await db.lessons.where('classId').equals(activeClassId).toArray()).map((item) => item.generationKey)); const items = buildLessons(schedules, month, existing); if (items.length) await db.lessons.bulkAdd(items); setNotice(items.length ? '已生成 ' + items.length + ' 节计划课程' : schedules.length ? '本月计划已是最新，没有重复生成' : '请先在班级详情添加固定课程') }
  async function addManual(event: FormEvent) { event.preventDefault(); const now = nowIso(); await db.lessons.add({ id: newId(), classId: activeClassId, generationKey: 'manual:' + newId(), localDate: date, startTime: time, source: 'manual', status: 'pending', createdAt: now, updatedAt: now }); setManualOpen(false) }
  return <div className="page"><PageHeader eyebrow="课程中心" title="课程与历史" description="生成计划课程、完成点名，并随时修正历史记录。" />
    <div className="toolbar panel"><label>班级<select value={activeClassId} onChange={(e) => setClassId(e.target.value)}>{classes?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>月份<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label><div className="toolbar-actions"><Button variant="secondary" disabled={!activeClassId} onClick={() => void generate()}><CalendarPlus />生成 / 检查计划</Button><Button disabled={!activeClassId} onClick={() => { setDate(month + '-01'); setManualOpen(true) }}><Plus />临时加课</Button></div></div>
    {notice && <div className="notice"><CheckCircle2 />{notice}<button onClick={() => setNotice('')}>×</button></div>}
    {!classes?.length ? <Empty title="请先创建班级" text="班级和学生名单准备好后，才能安排课程。" action={<Link className="button primary" to="/classes">前往创建</Link>} /> : !lessons?.length ? <Empty title="这个月还没有课程" text="从固定课表生成计划，或临时新增一节课。" /> : <div className="lesson-list">{lessons.map((lesson) => <Link to={'/attendance/' + lesson.id} className="lesson-card" key={lesson.id}><div className="lesson-date"><strong>{lesson.localDate.slice(8)}</strong><span>{lesson.localDate.slice(5, 7)}月</span></div><div className="lesson-main"><strong>{classes.find((item) => item.id === lesson.classId)?.name}</strong><span><Clock3 />{lesson.startTime} · {lesson.source === 'scheduled' ? '固定课表' : '临时课程'}</span></div><span className={'status status-' + lesson.status}>{LESSON_LABELS[lesson.status]}</span></Link>)}</div>}
    {manualOpen && <Modal title="临时新增课程" onClose={() => setManualOpen(false)}><Form onSubmit={addManual}><label>日期<input required type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>开始时间<input required type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label><div className="form-actions"><Button type="button" variant="secondary" onClick={() => setManualOpen(false)}>取消</Button><Button type="submit">新增课程</Button></div></Form></Modal>}
  </div>
}

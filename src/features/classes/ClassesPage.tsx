import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Archive, ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../../db/database'
import { newId, nowIso } from '../../domain/rules'
import { confirmAction } from '../../shared/helpers'
import { Button, Empty, Form, Modal, PageHeader } from '../../shared/ui'

export function ClassesPage() {
  const classes = useLiveQuery(() => db.classes.filter((item) => !item.archivedAt).toArray(), [])
  const counts = useLiveQuery(async () => Object.fromEntries(await Promise.all((classes ?? []).map(async (item) => [item.id, await db.students.where('classId').equals(item.id).filter((student) => !student.archivedAt).count()]))), [classes])
  const [adding, setAdding] = useState(false); const [name, setName] = useState(''); const [note, setNote] = useState('')
  async function submit(event: FormEvent) { event.preventDefault(); const value = name.trim(); if (!value) return; const now = nowIso(); await db.classes.add({ id: newId(), name: value, note: note.trim(), createdAt: now, updatedAt: now }); setName(''); setNote(''); setAdding(false) }
  return <div className="page"><PageHeader eyebrow="教学空间" title="我的班级" description="管理学生名单，从这里开始每一次点名。" action={<Button onClick={() => setAdding(true)}><Plus />新建班级</Button>} />
    {!classes?.length ? <Empty title="还没有班级" text="新建一个班级，添加学生并安排固定课程。" action={<Button onClick={() => setAdding(true)}>创建第一个班级</Button>} /> : <div className="card-grid">{classes.map((item) => <article className="class-card" key={item.id}><div className="card-accent"/><div className="card-top"><span className="student-count">{counts?.[item.id] ?? 0} 名学生</span><button className="icon-btn" title="归档班级" aria-label={`归档 ${item.name}`} onClick={() => confirmAction(`确定归档“${item.name}”吗？历史记录会保留。`, () => db.classes.update(item.id, { archivedAt: nowIso(), updatedAt: nowIso() }))}><Archive /></button></div><h2>{item.name}</h2><p>{item.note || '暂无班级备注'}</p><Link to={`/classes/${item.id}`}>管理班级 <ArrowRight /></Link></article>)}</div>}
    {adding && <Modal title="新建班级" onClose={() => setAdding(false)}><Form onSubmit={submit}><label>班级名称<input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="例如：周六素描 A 班" required /></label><label>备注（选填）<textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="上课地点、年级等" /></label><div className="form-actions"><Button type="button" variant="secondary" onClick={() => setAdding(false)}>取消</Button><Button type="submit">保存班级</Button></div></Form></Modal>}
  </div>
}

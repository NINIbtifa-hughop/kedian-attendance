import { useState } from 'react'
import { BarChart3, BookOpenCheck, CalendarDays, Database, GraduationCap, Menu, X } from 'lucide-react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { ClassesPage } from '../features/classes/ClassesPage'
import { ClassDetailPage } from '../features/classes/ClassDetailPage'
import { LessonsPage } from '../features/lessons/LessonsPage'
import { AttendancePage } from '../features/attendance/AttendancePage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { BackupPage } from '../features/backup/BackupPage'

const nav = [
  { to: '/classes', label: '班级与学生', icon: GraduationCap },
  { to: '/lessons', label: '课程与历史', icon: CalendarDays },
  { to: '/reports', label: '月度统计', icon: BarChart3 },
  { to: '/backup', label: '备份与恢复', icon: Database },
]
export default function App() {
  const [open, setOpen] = useState(false)
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><BookOpenCheck /></div><div><strong>课点</strong><span>电子点名册</span></div></div>
      <button className="close-nav" onClick={() => setOpen(false)} aria-label="关闭导航"><X /></button>
      <nav>{nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}><Icon />{label}</NavLink>)}</nav>
      <div className="local-note"><span>● 离线可用</span><p>数据仅保存在当前设备。请定期备份，浏览器数据清除后无法找回。</p></div>
    </aside>
    {open && <button className="nav-scrim" aria-label="关闭导航" onClick={() => setOpen(false)} />}
    <main><header className="mobile-header"><button onClick={() => setOpen(true)} aria-label="打开导航"><Menu /></button><span>课点 · 电子点名册</span></header><Routes>
      <Route path="/" element={<Navigate to="/classes" replace />} />
      <Route path="/classes" element={<ClassesPage />} />
      <Route path="/classes/:classId" element={<ClassDetailPage />} />
      <Route path="/lessons" element={<LessonsPage />} />
      <Route path="/attendance/:lessonId" element={<AttendancePage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/backup" element={<BackupPage />} />
      <Route path="*" element={<Navigate to="/classes" replace />} />
    </Routes></main>
  </div>
}

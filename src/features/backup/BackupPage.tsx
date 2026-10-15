import { useRef, useState } from 'react'
import { Download, FileJson, ShieldAlert, Upload } from 'lucide-react'
import { createBackup, download, restoreBackup } from '../../shared/data'
import { Button, PageHeader } from '../../shared/ui'

export function BackupPage() {
  const fileRef = useRef<HTMLInputElement>(null); const [message, setMessage] = useState('')
  async function exportAll() { const backup = await createBackup(); download('课点完整备份-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(backup, null, 2), 'application/json'); setMessage('完整备份已导出，请妥善保管文件。') }
  async function restore(file?: File) { if (!file) return; try { const input = JSON.parse(await file.text()); if (!window.confirm('恢复会整体替换当前所有数据。建议先导出当前备份。确定继续吗？')) return; await restoreBackup(input); setMessage('恢复完成，所有关联数据已通过校验。') } catch (error) { setMessage('恢复失败：' + (error instanceof Error ? error.message : '文件无法解析')) } finally { if (fileRef.current) fileRef.current.value = '' } }
  return <div className="page"><PageHeader eyebrow="数据安全" title="备份与恢复" description="本应用不使用云端同步，请由你掌握数据副本。" /><div className="backup-grid"><section className="panel backup-card"><div className="backup-icon"><Download /></div><h2>导出完整备份</h2><p>将班级、学生、课表、课程和点名记录完整保存为 JSON 文件，可用于迁移或恢复。</p><Button onClick={() => void exportAll()}><FileJson />导出 JSON 备份</Button></section><section className="panel backup-card"><div className="backup-icon restore"><Upload /></div><h2>从备份恢复</h2><p>系统会先验证版本和所有关联关系，验证通过后才会在一个事务内整体替换数据。</p><input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(e) => void restore(e.target.files?.[0])} /><Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload />选择备份文件</Button></section></div>{message && <div className={message.startsWith('恢复失败') ? 'notice error-notice' : 'notice'}>{message}<button onClick={() => setMessage('')}>×</button></div>}<div className="privacy-callout"><ShieldAlert /><div><h3>请注意本地数据边界</h3><p>IndexedDB 和离线缓存不等于云备份。清除浏览器网站数据、使用隐私模式或设备故障都可能导致数据丢失。备份文件未加密，请勿长期留在共享设备的下载目录。</p></div></div></div>
}

import { describe, expect, it } from 'vitest'
import { parseStudentCsv, safeCell } from './data'

describe('CSV', () => {
  it('支持中文表头、重名与重复行提示', () => { const result = parseStudentCsv('姓名,备注\n王小明,一组\n王小明,二组\n王小明,一组'); expect(result.errors).toEqual([]); expect(result.valid).toHaveLength(3); expect(result.valid[1].duplicate).toBe(false); expect(result.valid[2].duplicate).toBe(true) })
  it('阻止公式注入', () => expect(['=1+1', '+cmd', '-1', '@name'].map(safeCell)).toEqual(["'=1+1", "'+cmd", "'-1", "'@name"]))
  it('报告空姓名', () => expect(parseStudentCsv('name,note\n,缺失').errors[0]).toContain('姓名不能为空'))
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './ui'

describe('Modal', () => {
  it('提供对话框语义并可通过关闭按钮操作', async () => { const onClose = vi.fn(); render(<Modal title="添加学生" onClose={onClose}><p>内容</p></Modal>); expect(screen.getByRole('dialog', { name: '添加学生' })).toBeInTheDocument(); await userEvent.click(screen.getByRole('button', { name: '关闭' })); expect(onClose).toHaveBeenCalledOnce() })
})

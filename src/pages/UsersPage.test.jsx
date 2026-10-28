import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderPage } from '../test/render'
import * as platform from '../api/platform'
import UsersPage from './UsersPage'

vi.mock('../api/platform', () => ({
  listTenants: vi.fn(),
  listUsers: vi.fn(),
  getTenant: vi.fn(),
  addMember: vi.fn(),
  pauseUser: vi.fn(),
  resumeUser: vi.fn(),
  sendPasswordLink: vi.fn(),
}))

const user = (id, status = 'active') => ({ id, name: `Person ${id}`, email: `p${id}@acme.test`, status, role: 'HR_MANAGER', email_verified: true, tenant: { id: 1, name: 'Acme' }, organisations_count: 1 })

beforeEach(() => {
  vi.mocked(platform.listTenants).mockResolvedValue({ data: [{ id: 1, name: 'Acme' }] })
  vi.mocked(platform.listUsers).mockResolvedValue({ data: [user(1), user(2, 'paused')], meta: { current_page: 1, last_page: 1, total: 2 } })
})

describe('UsersPage', () => {
  it('asks for an organisation before listing anyone', async () => {
    renderPage(<UsersPage />, { url: '/users' })
    expect(await screen.findByText('Choose an organisation to see its users.')).toBeTruthy()
    expect(platform.listUsers).not.toHaveBeenCalled()
    expect(screen.queryByText('Add user')).toBeNull()
  })

  it('lists the chosen organisation’s users', async () => {
    renderPage(<UsersPage />, { url: '/users?tenant_id=1' })
    expect(await screen.findByText('Person 1')).toBeTruthy()
    expect(platform.listUsers).toHaveBeenCalledWith(expect.objectContaining({ tenant_id: '1' }))
    expect(screen.getByText('Add user')).toBeTruthy()
  })

  it('adds someone to the organisation with a role', async () => {
    vi.mocked(platform.getTenant).mockResolvedValue({ id: 1, name: 'Acme', roles: [{ code: 'PAYROLL_OFFICER', label: 'Payroll officer' }] })
    vi.mocked(platform.addMember).mockResolvedValue({ id: 9, email: 'new@acme.test' })
    renderPage(<UsersPage />, { url: '/users?tenant_id=1' })

    fireEvent.click(await screen.findByText('Add user'))
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'new@acme.test' } })
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Nia' } })
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'PAYROLL_OFFICER' } })
    fireEvent.submit(document.getElementById('add-user'))

    await waitFor(() => expect(platform.addMember).toHaveBeenCalledWith('1', { email: 'new@acme.test', name: 'Nia', role: 'PAYROLL_OFFICER' }))
  })

  it('resumes only the paused people among those picked', async () => {
    vi.mocked(platform.resumeUser).mockResolvedValue({})
    renderPage(<UsersPage />, { url: '/users?tenant_id=1' })
    await screen.findByText('Person 1')

    fireEvent.click(screen.getByLabelText('Select all on this page'))
    expect(screen.getByText('2 selected')).toBeTruthy()
    fireEvent.click(screen.getByText('Resume (1)'))
    fireEvent.click(screen.getByText('Resume them'))

    await waitFor(() => expect(platform.resumeUser).toHaveBeenCalledTimes(1))
    expect(platform.resumeUser).toHaveBeenCalledWith(2)
  })
})

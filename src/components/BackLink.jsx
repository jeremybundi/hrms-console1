import { Link } from 'react-router-dom'
import { RiArrowLeftLine } from 'react-icons/ri'

export default function BackLink({ to, children }) {
  return <Link to={to} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--c-muted)] hover:text-[var(--c-text)]"><RiArrowLeftLine size={14} />{children}</Link>
}

import { useI18n } from '../i18n/context'
import { Badge } from './ui'

const STATUS = {
  active: ['ok', 'Active'],
  paused: ['warn', 'Paused'],
  deleted: ['bad', 'Deleted'],
  erased: ['muted', 'Erased'],
}

/** An organisation's or sign-in's state: active, paused, deleted or erased. */
export default function StatusBadge({ status }) {
  const { t } = useI18n()
  const [tone, label] = STATUS[status] ?? ['muted', status]
  return <Badge tone={tone}>{t(label)}</Badge>
}

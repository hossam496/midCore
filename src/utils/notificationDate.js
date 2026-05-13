import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * Normalize API / Pusher / Mongo-style dates to a valid Date or null.
 */
export function parseNotificationDate(notif) {
  const raw =
    notif?.createdAt ??
    notif?.updatedAt ??
    notif?.date ??
    notif?.timestamp ??
    notif?.created_at;
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === 'object' && raw !== null && raw.$date != null) {
    const inner = raw.$date;
    const d = new Date(typeof inner === 'number' ? inner : inner);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Arabic relative time, e.g. "منذ يومين" — never returns NaN. */
export function formatNotifRelative(notif) {
  const d = parseNotificationDate(notif);
  if (!d) return 'للتوّ';
  try {
    return formatDistanceToNow(d, { addSuffix: true, locale: ar });
  } catch {
    try {
      return d.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return 'للتوّ';
    }
  }
}

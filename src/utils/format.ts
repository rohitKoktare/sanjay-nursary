import { format, formatDistanceToNow } from "date-fns";

export function formatDate(iso: string, pattern = "dd MMM yyyy"): string {
  try {
    return format(new Date(iso), pattern);
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  return formatDate(iso, "dd MMM yyyy, hh:mm a");
}

export function daysAgo(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

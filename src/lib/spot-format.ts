import { Spot } from '@/types';

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 || 12;
  const ampm = h >= 12 ? 'pm' : 'am';
  return m === 0 ? `${hour}${ampm}` : `${hour}:${m.toString().padStart(2, '0')}${ampm}`;
}

export function getOpenStatus(
  hours: Spot['hours']
): { open: true; closeTime: string } | { open: false; openTime: string } | null {
  if (!hours) return null;
  const now = new Date();
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = days[now.getDay()];
  const todayHours = hours[today];
  if (!todayHours) return null;

  const currentTime = now.getHours() * 100 + now.getMinutes();
  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);
  const openTime = openH * 100 + openM;
  const closeTime = closeH * 100 + closeM;

  if (currentTime >= openTime && currentTime < closeTime) {
    return { open: true, closeTime: formatTime(todayHours.close) };
  }
  return { open: false, openTime: formatTime(todayHours.open) };
}

export function openDirections(address: string): void {
  const query = encodeURIComponent(address);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const url = isIOS
    ? `maps://maps.apple.com/?daddr=${query}`
    : `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  window.open(url, '_blank');
}

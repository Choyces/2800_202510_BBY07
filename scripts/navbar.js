document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/notifications/count');
    const { unreadCount } = await res.json();
    const badge = document.getElementById('notifBadge');
    if (unreadCount > 0) {
      badge.innerText = unreadCount;
      badge.style.display = 'inline-block';
    }
  } catch (err) {
    console.error('Failed to load notification count:', err);
  }
});

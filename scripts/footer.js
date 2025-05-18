console.log('📥 footer.js loaded');

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/notifications/messages');
    if (!res.ok) return;
    const counts = await res.json();  
    const totalUnread = counts.reduce((sum, c) => sum + c.unreadCount, 0);
    if (totalUnread > 0) {
      const link = document.getElementById('messagesLink');
      const badge = document.createElement('span');
      badge.className = 'notification-badge';
      badge.textContent = totalUnread;
      link.appendChild(badge);
    }
  } catch (err) {
    console.error('Could not load message badge', err);
  }
});

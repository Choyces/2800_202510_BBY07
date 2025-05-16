document.addEventListener('DOMContentLoaded', () => {
  const listEl     = document.getElementById('notif-list');
  const markAllBtn = document.getElementById('markAllReadBtn');

  async function loadNotifications() {
    const res    = await fetch('/notifications/data');
    const items  = await res.json();
    listEl.innerHTML = items.map(n => `
      <div class="notif-item ${n.read ? 'read' : 'unread'}"
           data-id="${n._id}"
           data-post="${n.postId || ''}">
        ${n.message}
      </div>
    `).join('');
    attachListeners();
  }

  function attachListeners() {
    document.querySelectorAll('.notif-item').forEach(el => {
      el.addEventListener('click', async () => {
        const id     = el.dataset.id;
        const postId = el.dataset.post;
        // mark this one as read
        await fetch(`/notifications/${id}/read`, { method: 'POST' });
        el.classList.replace('unread','read');
        // navigate to the post 
        // window.location.href /posts/${postId}; 
      });
    });
  }

  markAllBtn.addEventListener('click', async () => {
    await fetch('/notifications/readAll', { method: 'POST' });
    document.querySelectorAll('.notif-item.unread')
            .forEach(el => el.classList.replace('unread','read'));
  });

  loadNotifications();
});

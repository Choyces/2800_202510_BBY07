document.addEventListener('DOMContentLoaded', () => {
  const markAllBtn = document.getElementById('markAllReadBtn');

  document.querySelectorAll('.notif-avatar').forEach(img => {
    img.addEventListener('click', e => {
      e.stopPropagation();                            
      window.location.href = img.dataset.profileUrl;  
    });
  });

  document.querySelectorAll('.list-group-item').forEach(item => {
    item.addEventListener('click', async () => {
      const notifId = item.dataset.id;
      await fetch(`/notifications/${notifId}/read`, { method: 'POST' });
      const clickUrl = item.dataset.clickUrl;
      window.location.href = clickUrl;
    });
  });

  markAllBtn.addEventListener('click', async (e) => {
    e.preventDefault(); 
    await fetch('/notifications/readAll', { method: 'POST' });
    document.querySelectorAll('.list-group-item.fw-bold')
      .forEach(item => item.classList.replace('fw-bold', 'bg-light'));
  });
});

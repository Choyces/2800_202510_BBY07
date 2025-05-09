async function loadNotifications() {
  try {
    const res = await fetch('/notifications/data');
    if (!res.ok) throw new Error('Fetch failed');
    const notifications = await res.json();

    const ul = document.getElementById('notif-list');
    ul.innerHTML = '';  

    notifications.forEach(n => {
      const li = document.createElement('li');
      // Could need to change this becuase of different fields
      li.textContent = `${n.actorName || n.actor}: ${n.type} on ${new Date(n.createdAt).toLocaleString()}`;
      ul.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

window.addEventListener('DOMContentLoaded', loadNotifications);

setInterval(loadNotifications, 30_000);
document.addEventListener('DOMContentLoaded', () => {
  const convList = document.getElementById('conversationsList');
  if (convList) {
    initNewConv();
    initDeleteMode();
    convList.querySelectorAll('.conversation-card').forEach(card => {
      card.addEventListener('click', () => {
        if (!deleteMode) {
          window.location.href = `/inside_messages?conversationId=${card.dataset.id}`;
        }
      });
    });
    const searchInput = document.getElementById('searchConvosInput');
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.trim().toLowerCase();
      document
        .querySelectorAll('#conversationsList .conversation-card')
        .forEach(card => {
          const title = card
            .querySelector('strong')
            .textContent         
            .trim()
            .toLowerCase();
          card.classList.toggle('d-none', !title.includes(term));
        });
    });
  } else if (document.getElementById('messages')) {
    loadConversationMessages();
  }
});

document.body.addEventListener('click', e => {
  if (!deleteMode) return;
  const icon = e.target.closest('i.delete-icon');
  if (!icon) return;
  e.stopPropagation();   
  const id = icon.dataset.id || icon.parentElement.dataset.id;
  if (toDelete.has(id)) {
    toDelete.delete(id);
  } else {
    toDelete.add(id);
  }
  refreshDeleteIcons();
});

function refreshDeleteIcons() {
  document.querySelectorAll('.conversation-card').forEach(card => {
    const id = card.dataset.id;
    let icon = card.querySelector('.delete-icon');

    if (deleteMode) {
      if (!icon) {
        icon = document.createElement('i');
        icon.classList.add('delete-icon', 'me-2');          
        card.insertBefore(icon, card.firstChild);            
      }
      icon.classList.toggle('bi-circle', !toDelete.has(id));
      icon.classList.toggle('bi-record-circle-fill', toDelete.has(id));
      icon.classList.add('bi');
    } else {
      if (icon) icon.remove();
    }
  });
}

let deleteMode = false;
const toDelete = new Set();

// Initializes the New Conversation modal
function initNewConv() {
  const modal = document.getElementById('newConvModal');
  const btnOpen = document.getElementById('newConvBtn');
  const btnClose = document.getElementById('closeModal');
  const btnSearch = document.getElementById('searchBtn');
  const input = document.getElementById('convSearch');
  const results = document.getElementById('searchResults');
  const selectedUsers = document.getElementById('selectedUsers');
  const msgInput = document.getElementById('initialMessage');
  const sendBtn = document.getElementById('sendConvBtn');
  const usersCache = new Map();
  const selected = new Set();

  // Enables/disables the Send button
  function updateSendBtn() {
    sendBtn.disabled = selected.size === 0 || !msgInput.value.trim();
  }

  // For displaying the badges of currently selected users in the modal
  function updateSelectedDisplay() {
    selectedUsers.innerHTML = '';
    selected.forEach(id => {
      const u = usersCache.get(id);
      if (!u) return;
      const badge = document.createElement('span');
      badge.className = 'badge bg-secondary me-1';
      badge.textContent = `${u.name} (@${u.username})`;

      const x = document.createElement('i');
      x.className = 'bi bi-x-circle ms-1';
      x.style.cursor = 'pointer';
      x.addEventListener('click', () => {
        selected.delete(id);
        updateSelectedDisplay();
        updateSendBtn();
        const row = results.querySelector(`[data-id="${id}"]`);
        if (row) row.classList.remove('fw-bold');
      });

      badge.appendChild(x);
      selectedUsers.appendChild(badge);
    });
  }

  // Open modal
  btnOpen.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  // Close modal & reset
  btnClose.addEventListener('click', () => {
    modal.style.display = 'none';
    selected.clear();
    results.innerHTML = '';
    selectedUsers.innerHTML = '';
    msgInput.value = '';
    updateSendBtn();
  });

  // Search for users
  btnSearch.addEventListener('click', async () => {
    const term = input.value.trim();
    if (!term) return;

    const res = await fetch(`/users/search?term=${encodeURIComponent(term)}`);
    const users = await res.json();

    // cache them
    users.forEach(u => usersCache.set(u._id, u));

    // display results of user search
    results.innerHTML = '';
    users.forEach(u => {
      const div = document.createElement('div');
      div.className = 'list-group-item list-group-item-action';
      div.textContent = `${u.name} (@${u.username})`;
      div.dataset.id = u._id;
      if (selected.has(u._id)) div.classList.add('fw-bold');

      div.addEventListener('click', () => {
        if (selected.has(u._id)) {
          selected.delete(u._id);
          div.classList.remove('fw-bold');
        } else {
          selected.add(u._id);
          div.classList.add('fw-bold');
        }
        updateSelectedDisplay();
        updateSendBtn();
      });
      results.appendChild(div);
    });
  });

  // Enable Send when there's both participants and a message
  msgInput.addEventListener('input', updateSendBtn);

  // Send button: create convo then post first message
  sendBtn.addEventListener('click', async () => {
    const participantIds = Array.from(selected);
    const text = msgInput.value.trim();
    const res1 = await fetch('/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantIds })
    });
    const { conversationId } = await res1.json();

    // sent first message of conversation
    await fetch(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    modal.style.display = 'none';
    selected.clear();
    results.innerHTML = '';
    selectedUsers.innerHTML = '';
    msgInput.value = '';
    updateSendBtn();
    window.location.reload();
  });
}

// For deleting conversations, adds delete button.
function initDeleteMode() {
  const btnDeleteMode = document.getElementById('deleteModeBtn');

  // create the button
  const confirm = document.createElement('button');
  confirm.id = 'confirmDeleteBtn';
  confirm.textContent = 'Delete';
  confirm.className = 'btn btn-danger position-fixed end-0 m-3';
  confirm.style.bottom = '58px';
  confirm.style.display = 'none';
  document.body.appendChild(confirm);

  // toggle deleteMode
  btnDeleteMode.addEventListener('click', () => {
    deleteMode = !deleteMode;
    toDelete.clear();
    confirm.style.display = deleteMode ? 'block' : 'none';
    refreshDeleteIcons(); 
  });
  confirm.addEventListener('click', async () => {
    for (const id of toDelete) {
      await fetch(`/conversations/${id}`, { method: 'DELETE' });
    }
    deleteMode = false;
    toDelete.clear();
    confirm.style.display = 'none';
    refreshDeleteIcons(); 
    window.location.reload();
  });
}

async function loadConversationMessages() {
  const params = new URLSearchParams(window.location.search);
  const convoId = params.get('conversationId');
  if (!convoId) return;

  // find our convo and our user id
  const convsRes = await fetch('/conversations');
  const convs = await convsRes.json();
  const convo = convs.find(c => String(c._id) === convoId);
  if (!convo) return;
  const otherIds = (convo.otherIds || []).map(id => String(id));
  const currentUserId = String(
    convo.participants.find(id => !otherIds.includes(String(id)))
  );

  // set title bar
  const titleEl = document.getElementById('conversationTitle');
  titleEl.innerHTML = convo.others.map(u => `
    <a href="/${u.username}" class="d-inline-flex align-items-center me-3 text-decoration-none text-dark">
      <img
        src="${u.avatarUrl || '/img/default-avatar.png'}"
        alt="${u.name}"
        class="rounded-circle me-1"
        width="35" height="35"
      >
      <span>
        ${u.name}
      </span>
    </a>
  `).join('');

  // fetch messages
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = '';
  const res = await fetch(`/conversations/${convoId}/messages`);
  const msgs = await res.json();

  // load each message
  msgs.forEach(msg => {
    const senderId = String(msg.sender);
    const isMine = senderId === currentUserId;

    const wrapper = document.createElement('div');
    wrapper.className = isMine
      ? 'd-flex justify-content-end mb-2 align-items-start'
      : 'd-flex justify-content-start mb-2 align-items-start';
    const msgGroup = document.createElement('div');
    msgGroup.className = 'd-flex flex-column';

    // for group chat show sender name above bubble
    if (convo.others.length > 1 && !isMine) {
      const senderObj = convo.others.find(u => String(u._id) === senderId);
      const nameEl = document.createElement('div');
      nameEl.className = 'text-muted small mb-1';
      nameEl.textContent = senderObj ? senderObj.name : 'Unknown';
      msgGroup.appendChild(nameEl);
    }

    const bubble = document.createElement('div');
    bubble.className = isMine ? 'bubble-sent' : 'bubble-received';
    bubble.textContent = msg.text;
    msgGroup.appendChild(bubble);
    wrapper.appendChild(msgGroup);
    messagesDiv.appendChild(wrapper);
  });

  // mark as read
  await fetch(`/conversations/${convoId}/read`, { method: 'POST' });

  setTimeout(() => {
    const container = document.getElementById('messagesContainer');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, 0);

  // send logic: button + Enter + auto-grow
  const sendBtn = document.getElementById('sendButton');
  const inputEl = document.getElementById('messageInput');

  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = inputEl.scrollHeight + 'px';
  });

  // central send function
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    await fetch(`/conversations/${convoId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    messagesDiv.innerHTML = '';
    await loadConversationMessages();
  }
  sendBtn.onclick = sendMessage;
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
}


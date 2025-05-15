document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('conversationsList')) {
    loadConversations();
    initNewConv();
    initDeleteMode();
    const searchInput = document.getElementById('searchConvosInput');
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.trim().toLowerCase();
      const filtered = term
        ? allConversations.filter(c =>
            c.title.toLowerCase().includes(term)
          )
        : allConversations;
      renderConversations(filtered);
    });
  } else if (document.getElementById('messages')) {
    loadConversationMessages();
  }
});

window.addEventListener('pageshow', (event) => {
  if (document.getElementById('conversationsList')) {
    loadConversations();
  }
});

const listContainer = document.getElementById('conversationsList');
let selected = new Set();    
let allConversations = [];
let deleteMode = false;
const toDelete = new Set();    

// Formats date of the last message sent.
function formatTimestamp(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();

  if (d.toDateString() === now.toDateString()) {
    let hrs = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hrs >= 12 ? 'pm' : 'am';
    hrs = hrs % 12 || 12;
    return `${hrs}:${mins} ${ampm}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

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

  // cache of last‐searched users for badge rendering
  const usersCache = new Map();

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
    usersCache.clear();
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
    await loadConversations();
  });
}

// For deleting conversations, adds delete button.
function initDeleteMode() {
  const btnDeleteMode = document.getElementById('deleteModeBtn');

  // create the button
  const confirm = document.createElement('button');
  confirm.id = 'confirmDeleteBtn';
  confirm.textContent = 'Delete';
  confirm.className = 'btn btn-danger position-fixed bottom-0 end-0 m-3';
  confirm.style.display = 'none';
  document.body.appendChild(confirm);

  // toggle deleteMode
  btnDeleteMode.addEventListener('click', () => {
    deleteMode = !deleteMode;
    toDelete.clear();
    confirm.style.display = deleteMode ? 'block' : 'none';
    loadConversations();
  });
  confirm.addEventListener('click', async () => {
    for (const id of toDelete) {
      await fetch(`/conversations/${id}`, { method: 'DELETE' });
    }
    deleteMode = false;
    toDelete.clear();
    confirm.style.display = 'none';
    await loadConversations();
  });
}

// Fetch the (message)conversations list and all necessary info for displaying
async function loadConversations() {
  const [convosRes, countsRes] = await Promise.all([
    fetch('/conversations'),
    fetch('/notifications/messages')
  ]);
  const convos = await convosRes.json();
  const counts = await countsRes.json();
  const unreadMap = counts.reduce((m, c) => {
    m[c._id] = c.unreadCount;
    return m;
  }, {});

  allConversations = convos.map(conv => {
    const unread = unreadMap[conv._id] || 0;
    const title = conv.others.length === 1
      ? conv.others[0].name
      : conv.others.map(u => u.name).join(', ');
    const lastMsg = conv.lastMessage || '—';
    const ts = formatTimestamp(conv.updatedAt);
    return { ...conv, unread, title, lastMsg, ts };
  });

  renderConversations(allConversations);
}

// Display the conversastion list
function renderConversations(list) {
  listContainer.innerHTML = '';
  list.forEach(conv => {
    const card = document.createElement('div');
    card.className =
      'conversation-card d-flex justify-content-between align-items-center p-3 mb-2 border-bottom';
    card.dataset.title = conv.title.toLowerCase();

    const deleteIconHtml = deleteMode
      ? `<i class="bi bi-${toDelete.has(conv._id) ? 'record-circle-fill' : 'circle'} me-2" data-id="${conv._id}"></i>`
      : '';

    // add dot to title if unread
    const titleInner = conv.unread > 0
      ? `<span class="unread-dot-inline"></span>${escapeHtml(conv.title)}`
      : escapeHtml(conv.title);

    card.innerHTML = `
      ${deleteIconHtml}
      <div class="flex-grow-1 me-2">
        <strong>${titleInner}</strong><br>
        <span class="text-truncate d-block">${escapeHtml(conv.lastMsg)}</span>
      </div>
      <div class="flex-shrink-0 text-nowrap text-muted small">
        ${conv.ts}
      </div>
    `;
    card.addEventListener('click', () => {
      if (!deleteMode) {
        window.location = `/inside_messages?conversationId=${conv._id}`;
      }
    });
    if (deleteMode) {
      const icon = card.querySelector('i[data-id]');
      if (icon) {
        icon.addEventListener('click', e => {
          e.stopPropagation();
          const id = icon.dataset.id;
          if (toDelete.has(id)) {
            toDelete.delete(id);
            icon.classList.replace('bi-record-circle-fill','bi-circle');
          } else {
            toDelete.add(id);
            icon.classList.replace('bi-circle','bi-record-circle-fill');
          }
        });
      }
    }
    listContainer.appendChild(card);
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
  document.getElementById('conversationTitle').textContent =
    convo.others.map(u => u.name).join(', ');

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
// escape HTML
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]
  );
}

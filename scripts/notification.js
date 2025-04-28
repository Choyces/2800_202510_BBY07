// Configures Firestore connection settings
function configureFirestore(db) {
  try {
    if (db && !db._configured) {
      db.settings({
        experimentalForceLongPolling: true,
        merge: true
      });
    }
  } catch (error) {
    console.error("Error configuring Firestore:", error);
  }
}

// Displays loading spinner animation in specified container 
function showLoadingSpinner(container) {
  container.innerHTML = "<div class='text-center'><div class='spinner-border'></div></div>";
}

// Checks authentication state and returns user or displays login message
function handleAuthState(container) {
  const user = firebase.auth().currentUser;
  if (!user) {
    container.innerHTML = "<p class='text-center'>Please log in to view notifications</p>";
    return null;
  }
  return user;
}

// Enriches comment data with post title and formatted timestamp
async function fetchNotificationData(doc) {
  const comment = doc.data();
  const postDoc = await db.collection("posts").doc(comment.postId).get();
  return {
    id: doc.id,
    ...comment,
    postTitle: postDoc.data()?.title || "Deleted Post",
    timestamp: comment.timestamp.toDate(),
    postId: comment.postId
  };
}

// Registers cleanup listener to unsubscribe from real-time updates
function setupUnsubscribeListener(unsubscribe) {
  window.addEventListener("beforeunload", () => unsubscribe());
}

// Generates HTML template for notification card with data attributes
function createNotificationCard(notif) {
  return `
    <div class="card mb-3 notification-card" data-comment-id="${notif.id}" data-post-id="${notif.postId}">
      <div class="card-body">
        <h5 class="card-title">New comment on: ${notif.postTitle}</h5>
        <p class="card-text">${notif.commentText}</p>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">
            ${notif.user} - ${notif.timestamp.toLocaleString()}
          </small>
          <div>
            <button class="btn read-more-btn mark-read-btn">
              Mark Read
            </button>
            <a href="inside_post.html?postId=${notif.postId}" class="btn read-more-btn">
              View Post
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Converts array of notifications into joined HTML string
function renderNotificationList(notifications) {
  return notifications.map(notif => createNotificationCard(notif)).join("");
}

// Attaches click handlers to all mark-read buttons in notifications 
function attachMarkReadListeners() {
  document.querySelectorAll(".mark-read-btn").forEach(btn => {
    btn.addEventListener("click", handleMarkReadClick);
  });
}

// Handles mark-read button clicks with batch update and UI removal 
async function handleMarkReadClick(e) {
  const card = e.target.closest(".notification-card");
  try {
    await markCommentRead(card.dataset.postId, card.dataset.commentId);
    card.remove();
  } catch (error) {
    console.error("Mark read error:", error);
    showError("Error marking as read");
  }
}

// Processes real-time comment snapshot and updates notification display
async function handleCommentSnapshot(snapshot, container) {
  if (snapshot.empty) {
    container.innerHTML = "<p class='text-center'>No new notifications</p>";
    return;
  }

  const notifications = await Promise.all(snapshot.docs.map(fetchNotificationData));
  container.innerHTML = renderNotificationList(notifications);
  attachMarkReadListeners();
}

// Initializes real-time listener for unread comments matching post owner
function setupCommentListener(user, container) {
  const query = db.collection("all_comments")
    .where("postOwner", "==", user.uid)
    .where("read", "==", false)
    .orderBy("timestamp", "desc");

  const unsubscribe = query.onSnapshot(
    snapshot => handleCommentSnapshot(snapshot, container),
    error => {
      console.error("Notification error:", error);
      showError("Error loading notifications");
    }
  );

  setupUnsubscribeListener(unsubscribe);
}

// Main notification display flow with auth check and error handling
async function displayNotifications() {
  const container = document.getElementById("postsContainer");
  showLoadingSpinner(container);
  const user = handleAuthState(container);
  if (!user) return;

  try {
    configureFirestore(db);
    setupCommentListener(user, container);
  } catch (error) {
    console.error("Notification error:", error);
    showError(error.message);
  }
}

// Prepares batch updates for both global and post-specific comment references
function addCommentUpdatesToBatch(batch, doc) {
  batch.update(doc.ref, { read: true });
  const postCommentRef = db.collection("posts")
    .doc(doc.data().postId)
    .collection("comments")
    .doc(doc.id);
  batch.update(postCommentRef, { read: true });
}

// Marks all unread notifications as read using batch update operation
async function markAllRead() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const snapshot = await db.collection("all_comments")
    .where("postOwner", "==", user.uid)
    .where("read", "==", false)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach(doc => addCommentUpdatesToBatch(batch, doc));
  await batch.commit();
  displayNotifications();
}

// Initializes click handler for mark-all-read button
function setupMarkAllReadButton() {
  document.getElementById("markAllReadBtn")?.addEventListener("click", markAllRead);
}

// Initializes notification system and auth state monitoring on page load
document.addEventListener("DOMContentLoaded", () => {
  setupMarkAllReadButton();
  firebase.auth().onAuthStateChanged(user => {
    user ? displayNotifications() : window.location.href = "/login.html";
  });
});

// Updates read status for specific comment across both collections
async function markCommentRead(postId, commentId) {
  const batch = db.batch();
  const globalCommentRef = db.collection("all_comments").doc(commentId);
  batch.update(globalCommentRef, { read: true });
  const postCommentRef = db.collection("posts")
    .doc(postId)
    .collection("comments")
    .doc(commentId);
  batch.update(postCommentRef, { read: true });
  await batch.commit();
}

// Displays error message with retry button in notification container
function showError(message) {
  const container = document.getElementById("postsContainer");
  container.innerHTML = `
    <div class="alert alert-danger">
      ${message}<br>
      <button class="btn btn-sm btn-secondary mt-2" onclick="displayNotifications()">
        Retry
      </button>
    </div>
  `;
}
/** Post Loading Functions */
// Sets up real-time listener for post document changes 
function setupPostListener(postId) {
  const db = firebase.firestore();
  return db.collection("posts").doc(postId)
    .onSnapshot(
      postDoc => handlePostSnapshot(postDoc),
      error => handlePostError(error)
    );
}

// Handles post document snapshot updates and data validation
function handlePostSnapshot(postDoc) {
  if (!postDoc.exists) {
    handleInvalidPost();
    return;
  }
  
  const postData = postDoc.data();
  updatePostDisplay(postData);
  fetchAndDisplayAuthor(postData.owner);
}

// Updates DOM elements with post data including title, content, and formatted date
function updatePostDisplay(postData) {
  document.getElementById("postTitle").textContent = postData.title || "Untitled Post";
  document.getElementById("postContent").textContent = postData.content || "No content available.";
  
  const postDate = postData.timestamp?.toDate().toLocaleString() || "Date: Unknown";
  document.getElementById("postDate").textContent = postDate;
}

// Fetches and displays author information from Firestore using user ID
async function fetchAndDisplayAuthor(userId) {
  if (!userId) {
    document.getElementById("postAuthor").textContent = "Unknown author";
    return;
  }

  try {
    const userDoc = await firebase.firestore().collection("users").doc(userId).get();
    const userName = userDoc.exists ? userDoc.data().name : "Unknown author";
    document.getElementById("postAuthor").textContent = userName;
  } catch (error) {
    console.error("Error fetching author:", error);
    document.getElementById("postAuthor").textContent = "Unknown author";
  }
}

/** Comment System Functions */
// Initializes real-time listener for comments collection changes
function setupCommentsListener(postId) {
  const db = firebase.firestore();
  return db.collection("posts").doc(postId).collection("comments")
    .orderBy("timestamp", "asc")
    .onSnapshot(
      snapshot => handleCommentsUpdate(snapshot),
      error => handleCommentsError(error)
    );
}

// Processes comments snapshot to update UI, showing message if no comments exist 
function handleCommentsUpdate(snapshot) {
  const container = document.getElementById("commentsContainer");
  if (snapshot.empty) {
    container.innerHTML = "<p>No comments yet. Be the first to comment!</p>";
    return;
  }

  container.innerHTML = snapshot.docs
    .map(doc => createCommentElement(doc.data()))
    .join("");
}

// Creates HTML template string for comment element using comment data
function createCommentElement(data) {
  const timestamp = data.timestamp?.toDate().toLocaleString() || "Time Unknown";
  return `
    <div class="border p-2 mb-2 rounded">
      <strong>${data.user || "Anonymous"}:</strong>
      <p>${data.commentText}</p>
      <small class="text-muted">${timestamp}</small>
    </div>
  `;
}

/** Comment Submission Handler */
// Handles comment form submission with validation and Firestore batch write
async function handleCommentSubmission(e) {
  e.preventDefault();
  const commentText = document.getElementById("commentInput").value.trim();
  const urlParams = new URLSearchParams(window.location.search);
  const postId = validatePostId(urlParams.get("postId"));

  try {
    if (!commentText) throw new Error("Please enter a comment");
    if (!postId) throw new Error("Invalid post reference");
    
    const user = firebase.auth().currentUser;
    if (!user) throw new Error("You must be logged in to comment");

    const db = firebase.firestore();
    const postDoc = await db.collection("posts").doc(postId).get();
    const postOwner = postDoc.data()?.owner;

    const batch = db.batch();
    const commentRef = db.collection("posts").doc(postId)
      .collection("comments").doc();
    
    const globalCommentRef = db.collection("all_comments").doc(commentRef.id);

    const commentData = {
      user: user.displayName || "Anonymous",
      commentText: commentText,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      read: false,
      postId: postId,
      postOwner: postOwner
    };

    batch.set(commentRef, commentData);
    batch.set(globalCommentRef, commentData);
    await batch.commit();

    document.getElementById("commentInput").value = "";
  } catch (error) {
    console.error("Comment submission failed:", error);
    alert(error.message);
  }
}

/** Initialization */
// Initializes post page with content and event listeners when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = validatePostId(urlParams.get('postId'));

  if (!postId) {
    handleInvalidPost();
    return;
  }

  // Initialize post content
  setupPostListener(postId);
  setupCommentsListener(postId);

  // Setup form submission
  const commentForm = document.getElementById("commentForm");
  if (commentForm) {
    commentForm.addEventListener("submit", handleCommentSubmission);
  }
});

/** Validation Utilities */
// Validates post ID format and encoding
function validatePostId(postId) {
  if (!postId) return null;
  try {
    const decodedId = decodeURIComponent(postId);
    return /^[a-zA-Z0-9_-]{20}$/.test(decodedId) ? decodedId : null;
  } catch (e) {
    return null;
  }
}

// Handles invalid post scenario with user notification and redirect 
function handleInvalidPost() {
  console.error('Invalid post ID');
  document.getElementById("postTitle").textContent = "Post Not Found";
  setTimeout(() => window.location.href = '/', 3000);
}
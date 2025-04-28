// Initializes Firestore connection and post display when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const db = firebase.firestore();
  displayFilteredPosts(db);
});

// Displays loading spinner and status message in posts container
function showLoadingState(container) {
  container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"></div><p>Loading posts...</p></div>';
}

// Clears all content from posts container element
function clearPostsContainer(container) {
  container.innerHTML = '';
}

// Retrieves author name from Firestore with fallback to anonymous
async function getAuthorName(db, userId) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    return userDoc.exists ? userDoc.data().name || "Unknown User" : "Anonymous";
  } catch (err) {
    console.warn(`Could not fetch author name for user ID ${userId}:`, err);
    return "Anonymous";
  }
}

// Creates cloned post card element from template with populated data
function createPostCard(template, data, authorName, postDate) {
  const newCard = template.content.cloneNode(true);
  newCard.querySelector('.card-title').textContent = data.title || '';
  newCard.querySelector('.card-text').textContent = truncateText(data.content || '', 100);
  newCard.querySelector('.card-author').textContent = `Posted by: ${authorName}`;
  newCard.querySelector('.card-date').textContent = postDate;
  return newCard;
}

// Configures post view button navigation and click tracking
function setupViewButton(button, docId) {
  if (!button) return;
  
  const postId = encodeURIComponent(docId);
  button.href = `inside_post.html?postId=${postId}`;
  button.addEventListener('click', () => {
    console.log('Navigating to post:', docId);
    localStorage.setItem('lastViewedPost', docId);
  });
}

// Formats Firestore timestamp into localized date string
function formatPostDate(timestamp) {
  return timestamp?.toDate().toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) || "Date unknown";
}

// Processes individual post document for display and search filtering
async function processPostDoc(doc, searchTerm, db, postCards) {
  const data = doc.data();
  const titleLower = (data.title || '').toLowerCase();
  if (searchTerm && !titleLower.includes(searchTerm)) return false;

  const authorName = await getAuthorName(db, data.owner);
  const postDate = formatPostDate(data.timestamp);
  const cardTemplate = document.getElementById('postCardTemplate');
  
  const newCard = createPostCard(cardTemplate, data, authorName, postDate);
  const colDiv = document.createElement('div');
  colDiv.className = 'col-12 col-md-6 col-lg-4 mb-4';
  colDiv.appendChild(newCard);
  
  setupViewButton(colDiv.querySelector('.view-post-button'), doc.id);
  postCards.push(colDiv);
  return true;
}

// Redirects to empty results page if search term has no matches
function checkForNoMatches(searchTerm, hasMatches) {
  if (searchTerm && !hasMatches) {
    window.location.href = `nonexist_makepost.html?search=${encodeURIComponent(searchTerm)}`;
  }
}

// Displays error message in posts container with error details
function showPostsError(container, error) {
  console.error("Error loading posts:", error);
  container.innerHTML = `
    <div class="col-12">
      <div class="alert alert-danger" role="alert">
        Error loading posts: ${error.message}
      </div>
    </div>`;
}

// Main post display flow with search filtering and error handling 
async function displayFilteredPosts(db) {
  const urlParams = new URLSearchParams(window.location.search);
  const searchTerm = urlParams.get('search')?.toLowerCase();
  const postsContainer = document.getElementById('posts-go-here');
  
  try {
    showLoadingState(postsContainer);
    const postsSnapshot = await db.collection("posts").orderBy("timestamp", "desc").get();
    clearPostsContainer(postsContainer);

    let hasMatches = false;
    const postCards = [];
    
    for (const doc of postsSnapshot.docs) {
      const matched = await processPostDoc(doc, searchTerm, db, postCards);
      hasMatches = hasMatches || matched;
    }
    
    postCards.forEach(card => postsContainer.appendChild(card));
    checkForNoMatches(searchTerm, hasMatches);
  } catch (error) {
    showPostsError(postsContainer, error);
  }
}

// Truncates text content with ellipsis for card preview display
function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Decodes and validates post ID from URL parameters
function decodePostId() {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedId = urlParams.get('postId');
  if (!encodedId) return null;
  
  try {
    return decodeURIComponent(encodedId);
  } catch (error) {
    console.error('Invalid post ID:', error);
    return null;
  }
}
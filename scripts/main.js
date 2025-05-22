
//Gets all posts from the database
async function getPosts() {
  try {
    const res = await fetch("/post/data", {
    });
    if (!res.ok) throw new Error("Failed to fetch post data");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error loading post info:", err);
  }
}

//gets all liked posts from the database
async function getLiked() {
  try {
    const res = await fetch("/post/liked", {
    });
    if (!res.ok) throw new Error("Failed to fetch post data");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error loading post info:", err);
  }
};

// Selects random subset of posts from array ------TO BE CHANGED TO MOST VIEWED WITHIN WEEK AFTER SEARCH IS FIXED
function selectRandomPosts(postsArray) {
  return postsArray.sort(() => 0.5 - Math.random()).slice(0, 3);
}

// Creates cloned card element from template populated with post data
function createCardElement(cardTemplate, post) {
  const newCard = cardTemplate.content.cloneNode(true);
  newCard.querySelector('.card-title').innerText = post.title || "No Title";
  newCard.querySelector('.card-text').innerText = post.text || "No Content";
  newCard.querySelector('.card-author').innerText = post.authorUsername || "Unknown Author";
  newCard.querySelector('.card-author').setAttribute("href",`${post.authorUsername}`);
  newCard.querySelector('.card-date').innerText = post.createdAt.slice(0, 10) || "Unknown Date";
  newCard.querySelector('.read-more-btn').setAttribute("href",`${post.authorUsername}/post/${post._id}`);
  return newCard;
}

async function processSinglePost(posts, cardTemplate) {
  return createCardElement(cardTemplate, posts);
}


async function displayPosts() {
  const cardTemplate = document.getElementById("postCardTemplate");
  const container = document.getElementById("posts-go-here");
  if (!cardTemplate || !container) return;
  container.innerHTML = ""; 

  try {
    const postsArray = await getPosts();
    const selectedPosts = selectRandomPosts(postsArray);
    
    for (const post of selectedPosts) {
      const newCard = await processSinglePost(post, cardTemplate);
      container.appendChild(newCard);
    }
  } catch (error) {
    console.error("Error displaying posts: ", error);
  }
}

//like functions

  //load like button on page load depending on if user has liked the post or not
async function showLikebutton() {
  const postID = document.querySelector('#postContainer').getAttribute('data-post-id');
  const likeButton = document.getElementById("likebutton");
  const container = document.getElementById("posts-go-here");
  try {
    const userLiked = await getLiked();
    const selectedPosts = selectRandomPosts(postsArray);
    
    for (const post of selectedPosts) {
      const newCard = await processSinglePost(post, cardTemplate);
      container.appendChild(newCard);
    }
  } catch (error) {
    console.error("Error displaying posts: ", error);
  }
}

  //like button function
async function likePost(){
  const postID = document.querySelector('#postContainer').getAttribute('data-post-id');
  try {
    const res = await fetch(`/like/${postID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    const result = await res.json()
    if (result.success){
      if (document.getElementById('likebutton').innerText == "Liked") {
        document.getElementById('likebutton').innerText = "Like this post";
      } else {
        document.getElementById('likebutton').innerText = "Liked";
      };
    }
  } catch (err) {console.error("Error adding comment info:", err);}
};

async function addComment() {
  const commentText = document.getElementById('commentInput').value;
  const postID = document.querySelector('#postContainer').getAttribute('data-post-id');

  if (commentText.trim().length <= 0) {
    alert("enter a comment");
    return;
  }

  try {
    const res = await fetch(`/createComment/${postID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment: commentText })
    });

    const result = await res.text();
    console.log(result);
    document.getElementById('commentInput').value = "";
  } catch (err) {
    console.error("Error adding comment info:", err);
  }
}

// Initialize functions
document.addEventListener('DOMContentLoaded', () => {
  displayPosts();
});

// Fetch and display the current user's username in the greeting
async function displayUsername() {
  try {
    const res = await fetch('/profile/data'); // changed endpoint
    if (!res.ok) throw new Error("Failed to fetch profile data");

    const data = await res.json();
    if (!data.user || !data.user.name) throw new Error("User data not found");

    const nameSpan = document.getElementById("name-goes-here");
    if (nameSpan) {
      nameSpan.innerText = data.user.name;
    }
  } catch (err) {
    console.error("Error displaying username:", err);
    const fallback = document.getElementById("name-goes-here");
    if (fallback) fallback.innerText = "Guest";
  }
}

// // Fetch and display only posts from followed users
// async function displayFollowedPosts() {
//   const cardTemplate = document.getElementById("postCardTemplate");
//   const container = document.getElementById("posts-go-here");
//   if (!cardTemplate || !container) return;
//   container.innerHTML = "";

//   try {
//     const res = await fetch("/post/following"); // Backend should return followed users' posts
//     if (!res.ok) throw new Error("Failed to fetch followed posts");
//     const postsArray = await res.json();

//     if (postsArray.length === 0) {
//       container.innerHTML = `<p class="text-muted text-center">No posts from people you follow.</p>`;
//       return;
//     }

//     for (const post of postsArray) {
//       const newCard = await processSinglePost(post, cardTemplate);
//       container.appendChild(newCard);
//     }
//   } catch (err) {
//     console.error("Error displaying followed posts:", err);
//   }
// }

// Handle filter button clicks
function setupFilterButtons() {
  const exploreBtn = document.getElementById("btn-explore");
  const followBtn = document.getElementById("btn-follow");

  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      location.reload(); // reload to show random/explore posts
    });
  }

  if (followBtn) {
    followBtn.addEventListener("click", () => {
      location.reload(); // reload to show random/explore posts
    });
  }
}


document.addEventListener('DOMContentLoaded', () => {
  displayPosts();
  displayUsername();
  setupFilterButtons(); 
});


// // Initializes authentication state monitoring and user name retrieval
// function getNameFromAuth() {
//   firebase.auth().onAuthStateChanged(handleAuthStateChange);
// }

// // Handles authentication state changes and updates UI with user name
// function handleAuthStateChange(user) {
//   if (user) {
//     console.log(user.uid, user.displayName);
//     updateUserNameDisplay(user.displayName);
//   } else {
//     console.log("No user is logged in");
//   }
// }

// // Updates DOM element with current user's display name
// function updateUserNameDisplay(userName) {
//   const nameElement = document.getElementById("name-goes-here");
//   if (nameElement) nameElement.innerText = userName;
// }

// // // Retrieves all post documents from Firestore collection
// // async function fetchPosts() {
// //   try {
// //     const snapshot = await db.collection("posts").get();
// //     return snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
// //   } catch (error) {
// //     console.error("Error fetching posts: ", error);
// //     return [];
// //   }
// // }

// // Selects random subset of posts from array
// function selectRandomPosts(postsArray, count = 3) {
//   return postsArray.sort(() => 0.5 - Math.random()).slice(0, count);
// }

// // Retrieves author name from Firestore using user ID with fallback handling
// async function getPostAuthor(userId) {
//   try {
//     const userDoc = await db.collection("users").doc(userId).get();
//     return userDoc.exists ? userDoc.data().name || "Unknown User" : "Anonymous";
//   } catch (err) {
//     console.warn(`Failed to fetch user ${userId}: `, err);
//     return "Anonymous";
//   }
// }

// // Creates cloned card element from template populated with post data
// function createCardElement(cardTemplate, post, author, date) {
//   const newCard = cardTemplate.content.cloneNode(true);
//   newCard.querySelector('.card-title').innerText = post.data.title || "No Title";
//   newCard.querySelector('.card-text').innerText = post.data.content || "No Content";
//   newCard.querySelector('.card-author').innerText = `By: ${author}`;
//   newCard.querySelector('.card-date').innerText = `Posted on: ${date}`;
  
//   const readMoreBtn = newCard.querySelector('.read-more-btn');
//   readMoreBtn?.setAttribute('href', `inside_post.html?postId=${post.id}`);
//   return newCard;
// }

// // Processes individual post to create complete card element with metadata
// async function processSinglePost(post, cardTemplate) {
//   const postDate = post.data.timestamp?.toDate().toLocaleString() || "No Date";
//   const author = await getPostAuthor(post.data.owner);
//   return createCardElement(cardTemplate, post, author, postDate);
// }

// // Main display function that fetches, selects, and renders post cards
// // async function displayPosts() {
// //   const cardTemplate = document.getElementById("postCardTemplate");
// //   const container = document.getElementById("posts-go-here");
// //   if (!cardTemplate || !container) return;

// //   container.innerHTML = ""; 

// //   try {
// //     const postsArray = await fetchPosts();
// //     const selectedPosts = selectRandomPosts(postsArray);
    
// //     for (const post of selectedPosts) {
// //       const newCard = await processSinglePost(post, cardTemplate);
// //       container.appendChild(newCard);
// //     }
// //   } catch (error) {
// //     console.error("Error displaying posts: ", error);
// //   }
// // }

// // Sets up search form event listener for submission handling
// function setupSearchForm() {
//   const searchForm = document.getElementById('searchForm');
//   searchForm?.addEventListener('submit', handleSearchSubmit);
// }

// // Handles search form submission with validation and search term encoding
// async function handleSearchSubmit(e) {
//   e.preventDefault();
//   const searchInput = document.getElementById('searchInput');
//   const searchTermRaw = searchInput.value.trim();

//   if (!searchTermRaw) {
//     alert("Please enter a search term");
//     return;
//   }

//   const searchTerm = encodeURIComponent(searchTermRaw.toLowerCase());
//   window.location.href = `public_post.html?search=${searchTerm}`;
// }

//new mongo post stuff.......... keeping old firebase stuff for reference^^^^^^^^^^^^
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

// Initialize functions
document.addEventListener('DOMContentLoaded', () => {
  displayPosts();
});
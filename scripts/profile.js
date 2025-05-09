async function lookupWord() {
    const word = document.getElementById("wordInput").value.trim();
    const definitionBox = document.getElementById("definition");

    if (!word) {
      definitionBox.textContent = "Please enter a word.";
      definitionBox.className = "alert alert-warning";
      definitionBox.classList.remove("d-none");
      return;
    }

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!response.ok) {
        throw new Error("Word not found");
      }
      const data = await response.json();

      const meanings = data[0].meanings;
      const definitions = meanings.map(m => {
        const def = m.definitions[0].definition;
        const part = m.partOfSpeech;
        return `<li><strong>${part}</strong>: ${def}</li>`;
      }).join("");

      definitionBox.innerHTML = `<ul>${definitions}</ul>`;
      definitionBox.className = "alert alert-success";
      definitionBox.classList.remove("d-none");
    } catch (error) {
      definitionBox.textContent = "Definition not found.";
      definitionBox.className = "alert alert-danger";
      definitionBox.classList.remove("d-none");
    }
  }
//   document.addEventListener('DOMContentLoaded', async () => {
//     try {
//         const response = await fetch('/api/users/profile', {
//             credentials: 'include'
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const userData = await response.json();

//         document.getElementById('name').textContent = userData.name;
//         document.getElementById('bio').textContent = userData.bio || "No bio yet";
//         document.getElementById('location').querySelector('span').textContent = userData.location || "Location not set";
//         document.getElementById('avatarUrl').src = userData.avatarUrl || "/default-avatar.jpg";
        
//         document.getElementById('postCount').textContent = userData.posts?.length || 0;
//         document.getElementById('followerCount').textContent = userData.followers?.length || 0;
//         document.getElementById('followingCount').textContent = userData.following?.length || 0;
//         const postsContainer = document.getElementById('postsContainer');
//         if(userData.posts?.length > 0) {
//             userData.posts.forEach(post => {
//                 const col = document.createElement('div');
//                 col.className = 'col-lg-6 mb-2';
//                 col.innerHTML = `
//                     <div class="card">
//                         <div class="card-body">
//                             <h5 class="card-title">${post.title}</h5>
//                             <p class="card-text">${post.content.substring(0, 100)}...</p>
//                             <small class="text-muted">Posted on ${new Date(post.createdAt).toLocaleDateString()}</small>
//                         </div>
//                     </div>
//                 `;
//                 postsContainer.appendChild(col);
//             });
//         } else {
//             postsContainer.innerHTML = '<p class="text-muted">No posts yet</p>';
//         }

//     } catch (error) {
//         console.error('Error loading profile:', error);
//         const errorBanner = document.createElement('div');
//         errorBanner.className = 'alert alert-danger mx-4 mt-4';
//         errorBanner.textContent = 'Failed to load profile data';
//         document.body.prepend(errorBanner);
//     }
// });

window.onload = async () => {
  const res = await fetch('/profile/data');
  const user = await res.json();
  if (user.error) return alert(user.error);

  document.getElementById('name').textContent = user.name || '';
  // document.getElementById('email').textContent = user.email || '';
  document.getElementById('location').textContent = user.location || '';
  document.getElementById('bio').textContent = user.bio || '';
};
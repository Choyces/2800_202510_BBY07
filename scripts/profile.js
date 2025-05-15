//load on-line dictionary
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
//load profile data
// window.onload = async () => {
//   const res = await fetch('/profile/data');
//   const user = await res.json();
//   if (user.error) return alert(user.error);

//   document.getElementById('name').textContent = user.name || '';
//   // document.getElementById('email').textContent = user.email || '';
//   document.getElementById('location').textContent = user.location || '';
//   document.getElementById('bio').textContent = user.bio || '';
//   const avatar = document.getElementById('profileAvatar');
//   avatar.src = user.avatarUrl || '/img/default-avatar.png';
// };

// window.onload = async () => {
//   const res = await fetch('/profile/data');
//   const data = await res.json();
//   if (data.error) return alert(data.error);

//   document.getElementById('name').textContent = user.name || '';
//   // document.getElementById('email').textContent = user.email || '';
//   document.getElementById('location').textContent = user.location || '';
//   document.getElementById('bio').textContent = user.bio || '';
//   const avatar = document.getElementById('profileAvatar');
//   avatar.src = user.avatarUrl || '/img/default-avatar.png';

//   //post rendering
//   const posts = data.posts;
//   const postCollection = document.getElementById('postContainer');

//   if (!posts || posts.length === 0) {
//     postContainer.innerHTML = '<p class = "test-muted"> No post yet.</p>';
//     return;
//   }

//   posts.forEach((post, index) => {
//     const colDiv = document.createElement('div');
//     colDiv.className = `col-lg-6 mb-2 ${index % 2 === 0 ? 'pr-lg-1' : 'pl-lg-1'}`;

//     if (post.photoUrl) {
//       colDiv.innerHTML = `
//         <img src="${post.photoUrl}" alt="${post.title}" class="img-fluid rounded shadow-sm">
//       `;
//     } else {
//       colDiv.innerHTML = `
//         <div class="img-fluid rounded shadow-sm bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
//           <p class="text-muted p-2 text-center m-0">
//             ${post.title}<br>
//             <small>${post.text}</small>
//           </p>
//         </div>
//       `;
//     }

//     postContainer.appendChild(colDiv);
//   });
// } catch (err) {
//   console.error('Error loading profile:', err);
//   alert('Failed to load profile data');
//  }
// };

window.onload = async () => {
  try {
    const res = await fetch('/profile/data');
    const data = await res.json();
    if (data.error) return alert(data.error);

    const user = data.user; 

    // Profile info
    document.getElementById('name').textContent = user.name || '';
    // document.getElementById('email').textContent = user.email || '';
    document.getElementById('location').textContent = user.location || '';
    document.getElementById('bio').textContent = user.bio || '';
    const avatar = document.getElementById('profileAvatar');
    avatar.src = user.avatarUrl || '/img/default-avatar.png';

    // Post rendering
    const posts = data.posts;
    const postContainer = document.getElementById('postContainer'); 

    if (!posts || posts.length === 0) {
      postContainer.innerHTML = '<p class="text-muted">No posts yet.</p>';
      return;
    }

    posts.forEach((post, index) => {
      const colDiv = document.createElement('div');
      colDiv.className = `col-lg-6 mb-2 ${index % 2 === 0 ? 'pr-lg-1' : 'pl-lg-1'}`;

      const link = document.createElement('a');
      link.href = `/post/${post._id}`;
      link.className = 'text-decoration-none text-dark';
      link.style.textDecoration ="none";
      link.style.color = 'inherit';

      const card = document.createElement('div');
      card.className ='card h-100 shadow rounded';

      if (post.photoUrl) {
        const img = document.createElement('img');
        img.className = 'card-img-top';
        img.src = post.photoUrl;
        img.alt = post.title;
        img.style.objectFit = 'cover';
        img.style.height = '200px';
        card.appendChild(img);
      }
    
      // add content
      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';
    
      const title = document.createElement('h5');
      title.className = 'card-title text-primary font-weight-bold';
      title.textContent = post.title;
    
      const text = document.createElement('p');
      text.className = 'card-text text-muted';
      text.textContent = post.text || '';
    
      cardBody.appendChild(title);
      cardBody.appendChild(text);
      card.appendChild(cardBody);
      link.appendChild(card);
      colDiv.appendChild(link);
      postContainer.appendChild(colDiv);
    });
  } catch (err) {
    console.error('Error loading profile:', err);
    alert('Failed to load profile data');
  }
};


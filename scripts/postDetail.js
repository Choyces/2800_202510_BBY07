window.onload = async () => {
    const postId = window.location.pathname.split('/').pop();
    const res = await fetch(`/api/post/${postId}`);
    const post = await res.json();
  
    const container = document.getElementById('postDetail');
    container.innerHTML = `
      <div class="card shadow rounded">
        ${post.photoUrl ? `<img src="${post.photoUrl}" class="card-img-top" alt="${post.title}" style="height: 250px; object-fit: cover;">` : ''}
        <div class="card-body">
          <h4 class="card-title">${post.title}</h4>
          <p class="card-text">${post.text}</p>
          <button onclick="editPost('${post._id}')" class="btn btn-warning">Edit</button>
          <button onclick="deletePost('${post._id}')" class="btn btn-danger">Delete</button>
        </div>
      </div>
    `;
  };
  
  function editPost(id) {
    window.location.href = `/postEdit/${id}/edit`;
  }
  
  async function deletePost(id) {
    if (confirm('Are you sure you want to delete this post?')) {
      const res = await fetch(`/api/post/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Deleted');
        window.location.href = '/profile';
      } else {
        alert('Failed to delete');
      }
    }
  }
  
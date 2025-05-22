window.onload = async () => {
    const postId = window.location.pathname.split('/')[2];
    const res = await fetch(`/api/post/${postId}`);
    const post = await res.json();
  
    document.getElementById('title').value = post.title;
    document.getElementById('text').value = post.text;
  
    document.getElementById('editForm').onsubmit = async (e) => {
      e.preventDefault();
      const updated = {
        title: document.getElementById('title').value,
        text: document.getElementById('text').value,
      };
  
      const res = await fetch(`/api/post/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
  
      if (res.ok) {
        alert('Updated!');
        window.location.href = `/post/${postId}`;
      } else {
        alert('Failed to update');
      }
    };
  };

const postId = "<%= post._id %>";
document.getElementById('editForm').onsubmit = async (e) => {
  e.preventDefault();
  const updated = {
    title: document.getElementById('title').value,
    text: document.getElementById('text').value,
  };

  const res = await fetch(`/api/post/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  });

  if (res.ok) {
    alert('Updated!');
    window.location.href = `/yourposts/${postId}`;
  } else {
    alert('Failed to update');
  }
};
postActions.js

async function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this post?")) return;
  
    try {
      const res = await fetch(`/api/post/${postId}`, {
        method: 'DELETE',
      });
  
      if (res.ok) {
        alert('Post deleted!');
        window.location.href = '/userProfile'; 
      } else {
        const error = await res.text();
        alert(`Failed to delete post: ${error}`);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Something went wrong');
    }
  }

  
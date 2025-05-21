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
        window.location.href = `/yourposts/${postId}`;
      } else {
        alert('Failed to update');
      }
    };
  };
  

async function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this post?")) return;
  
    try {
      const res = await fetch(`/api/post/${postId}`, {
        method: 'DELETE',
      });
  
      if (res.ok) {
        alert('Post deleted!');
        window.location.href = '/userProfile'; // Redirect after delete
      } else {
        const error = await res.text();
        alert(`Failed to delete post: ${error}`);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Something went wrong');
    }
  }
  
  
// Initiates user logout process with Firebase authentication 
function logout() {
    firebase.auth().signOut().then(() => {
        console.log("logging out user");
      }).catch((error) => {
        // error handling omitted
      });
}

// Initializes real-time notification badge updates based on unread comments
function setupNotificationBadge() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const query = db.collection("all_comments")
    .where("postOwner", "==", user.uid)
    .where("read", "==", false);

  return query.onSnapshot(snapshot => {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      const count = snapshot.size;
      badge.textContent = count;
      badge.classList.toggle('d-none', count === 0);
    }
  });
}

// Manages notification badge state based on authentication status
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    const unsubscribe = setupNotificationBadge();
    window.addEventListener('beforeunload', () => unsubscribe());
  } else {
    const badge = document.getElementById('notificationBadge');
    if (badge) badge.classList.add('d-none');
  }
});
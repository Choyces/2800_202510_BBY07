document.getElementById("postForm").addEventListener("submit", handleFormSubmit);

// Handles form submission event, performs validation, and initiates post creation process 
function handleFormSubmit(event) {
  event.preventDefault();

  // Get elements
  const titleInput = document.getElementById("title");
  const descInput = document.getElementById("description");
  const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
  
  // Get user input values
  let title = titleInput.value.trim();
  let description = descInput.value.trim();

  // Validation function
  const showAlert = (title, message, isSuccess) => {
    const alertTitle = document.getElementById("alertTitle");
    const alertMessage = document.getElementById("alertMessage");
    
    alertTitle.textContent = title;
    alertTitle.className = `modal-title ${isSuccess ? 'text-success' : 'text-danger'}`;
    alertMessage.textContent = message;
    alertModal.show();
  };

  // Validate input fields
  if (title === "" || description === "") {
    showAlert("Validation Error", "Please fill in all fields!", false);
    return;
  }

  // Check authentication
  const user = firebase.auth().currentUser;
  if (!user) {
    showAlert("Authentication Required", "You must be logged in to create a post!", false);
    return;
  }

  // Call submission function
  submitPost(title, description, user, titleInput, descInput, showAlert);
}

// Submits new post data to Firestore
function submitPost(title, description, user, titleInput, descInput, showAlert) {
  db.collection("posts").add({
    title: title,
    content: description,
    owner: user.uid,
    comments: [],
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    showAlert("Success!", "Post added successfully!", true);
    titleInput.value = "";
    descInput.value = "";
  }).catch(error => {
    console.error("Error adding post: ", error);
    showAlert("Error", `Error adding post: ${error.message}`, false);
  });
}
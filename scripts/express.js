document.addEventListener("DOMContentLoaded", function () {

  const btn = document.getElementById("click");
  btn.addEventListener("click", (event) => {
    event.preventDefault();  // Prevent default form submission (if you were using a form)
    const forumInput = document.getElementById("fname").value;  
    getBotResponse(forumInput, event);  
    searchPostsByTitle(forumInput);
  });
});

async function getBotResponse(userMessage, event) {
  event.preventDefault()

  
  const API_KEY = "AIzaSyAUZyyox_2VLvFK9cjqcl4Fy7Tjq3byfik";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${"AIzaSyAUZyyox_2VLvFK9cjqcl4Fy7Tjq3byfik"}`;
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `Provide a small definition for the word like urban dictionary: ${userMessage}` }],  
          },
        ],
      }),
    });

    const data = await response.json();

    if (!data.candidates || !data.candidates.length) {
      throw new Error("No response from Gemini API");
    }

    const botMessage = data.candidates[0].content.parts[0].text;
document.getElementById("messages").textContent = botMessage;



   console.log(botMessage)
  } catch (error) {
    console.error("Error:", error);
    appendMessage(
      "bot",
      "Sorry, I'm having trouble responding. Please try again."
    );
  }
}


async function searchPostsByTitle(query) {
  const resultsDiv = document.getElementById("post-search-results");
  const cardTemplate = document.getElementById("postCardTemplate");
  resultsDiv.innerHTML = "";
  if (!query) {
    resultsDiv.innerHTML = "<p class='placeholder-text'>Please enter a search term.</p>";
    return;
  }
  try {
    const res = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`);
    const posts = await res.json();

    if (!posts.length) {
      resultsDiv.innerHTML = "<p class='placeholder-text'>No posts found for that slang.</p>";
      return;
    }

    posts.forEach(post => {
      const newCard = createCardElement(cardTemplate, post);
      resultsDiv.appendChild(newCard);
    });
  } catch (err) {
    resultsDiv.innerHTML = "<p class='placeholder-text'>Error searching posts.</p>";
    console.error(err);
  }
}

function createCardElement(cardTemplate, post) {
  const newCard = cardTemplate.content.cloneNode(true);
  newCard.querySelector('.card-title').innerText = post.title || "No Title";
  newCard.querySelector('.card-text').innerText = post.text || "No Content";
  newCard.querySelector('.card-author').innerText = post.authorUsername || "Unknown Author";
  newCard.querySelector('.card-author').setAttribute("href", `${post.authorUsername}`);
  newCard.querySelector('.card-date').innerText = post.createdAt.slice(0, 10) || "Unknown Date";
  newCard.querySelector('.read-more-btn').setAttribute("href", `${post.authorUsername}/post/${post._id}`);
  return newCard;
}


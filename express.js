






document.addEventListener("DOMContentLoaded", function () {


  const btn = document.getElementById("click");
  btn.addEventListener("click", (event) => {
    event.preventDefault();  // Prevent default form submission (if you were using a form)
    const forumInput = document.getElementById("fname").value;  
    getBotResponse(forumInput, event);  
  });
});
 








async function getBotResponse(userMessage, event) {
  event.preventDefault()

  
  const API_KEY = "APi key";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${"APi key"}`;
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `Provide a small definition for the word like urban dictionary: ${userMessage}` }],  // Asking for definition
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
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

window.onload = async () => {
  const res = await fetch('/profile/data');
  const user = await res.json();
  if (user.error) return alert(user.error);

  document.getElementById('name').textContent = user.name || '';
  // document.getElementById('email').textContent = user.email || '';
  document.getElementById('location').textContent = user.location || '';
  document.getElementById('bio').textContent = user.bio || '';
  const avatar = document.getElementById('profileAvatar');
  avatar.src = user.avatarUrl || '/img/default-avatar.png';
};
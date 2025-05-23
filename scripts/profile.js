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




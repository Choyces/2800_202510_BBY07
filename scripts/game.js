 // Collection of trending words
 const trendingWords = [
    "viral", "aesthetic", "vibe", "rizz", "sus", "based", "low-key", "high-key", 
    "slay", "mid", "bussin", "cringe", "ick", "pog", "cap", "no cap", "yeet", 
    "finna", "simp", "mood", "flex", "lit", "goat", "drip", "rent-free", "bet", 
    "oomf", "core", "cheugy", "main character", "hits different", "living rent-free", 
    "understood the assignment", "ratio", "soft launch", "toxic", "gaslighting",
    "algorithm", "unhinged", "baddie", "clean girl", "stan", "situationship",
    "touch grass", "ate", "iykyk", "caught in 4k", "red flag", "green flag"
];

// Sentence templates with blanks
const sentenceTemplates = [
    "That's so _____, it gives me major _____ energy.",
    "It's _____ how they just _____ without any _____.",
    "When you _____, it's basically _____ culture.",
    "The _____ vibes are _____, absolutely _____.",
    "I'm _____ about how _____ everything has become lately.",
    "This _____ moment is giving _____ _____.",
    "That _____ situation was _____, not gonna _____.",
    "The way they _____ is so _____, total _____ behavior.",
    "My _____ era is all about _____ and _____.",
    "It's _____ how we're all just _____ in this _____ economy."
];

// Global variables to track state
let currentSentences = [];
let completedSentences = [];
let allInputsFilled = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Display trending words
        displayTrendingWords();
        
        // Set up event listeners
        document.getElementById('generateBtn').addEventListener('click', generateSentences);
        document.getElementById('submitBtn').addEventListener('click', submitSentences);
        
        // Generate initial sentences
        generateSentences();
    } catch (error) {
        console.error("Initialization error:", error);
        showErrorMessage("Failed to initialize the game. Please refresh the page.");
    }
});

// Function to display trending words
function displayTrendingWords() {
    const container = document.getElementById('trendingWordsList');
    if (!container) {
        console.error("Trending words container not found");
        return;
    }
    
    container.innerHTML = ''; // Clear any existing content
    
    trendingWords.forEach(word => {
        const chip = document.createElement('span');
        chip.className = 'word-chip';
        chip.textContent = word;
        
        // Add click functionality to insert the word into the currently focused input
        chip.addEventListener('click', function() {
            const focusedInput = document.querySelector('.blank-input:focus');
            if (focusedInput) {
                focusedInput.value = word;
                // Trigger input event to check if all inputs are filled
                const event = new Event('input', { bubbles: true });
                focusedInput.dispatchEvent(event);
            }
        });
        
        container.appendChild(chip);
    });
}

// Function to display error message
function showErrorMessage(message) {
    // Create error element if it doesn't exist
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'error-message';
        document.querySelector('.container').prepend(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Function to generate random sentences with blanks
function generateSentences() {
    try {
        // Reset state
        currentSentences = [];
        completedSentences = [];
        allInputsFilled = false;
        
        // Hide feedback if visible
        const feedbackElement = document.getElementById('feedback');
        if (feedbackElement) {
            feedbackElement.style.display = 'none';
        }
        
        // Clear previous sentences
        const container = document.getElementById('sentencesContainer');
        if (!container) {
            throw new Error("Sentences container not found");
        }
        container.innerHTML = '';
        
        // Get 5 random sentence templates
        const selectedTemplates = [];
        const availableTemplates = [...sentenceTemplates]; // Create a copy to avoid modifying the original
        
        // Ensure we have enough templates
        const numToSelect = Math.min(5, availableTemplates.length);
        
        for (let i = 0; i < numToSelect; i++) {
            const randomIndex = Math.floor(Math.random() * availableTemplates.length);
            selectedTemplates.push(availableTemplates[randomIndex]);
            availableTemplates.splice(randomIndex, 1); // Remove selected template to avoid duplicates
        }
        
        // Create sentence forms
        selectedTemplates.forEach((template, index) => {
            currentSentences.push({
                template: template,
                inputs: []
            });
            
            createSentenceForm(template, index);
        });
        
        // Disable submit button initially
        const submitButton = document.getElementById('submitBtn');
        if (submitButton) {
            submitButton.disabled = true;
        }
        
    } catch (error) {
        console.error("Error generating sentences:", error);
        showErrorMessage("Failed to generate sentences. Please try again.");
    }
}

// Function to create a sentence form with blanks
function createSentenceForm(template, index) {
    const container = document.getElementById('sentencesContainer');
    if (!container) return;
    
    const sentenceContainer = document.createElement('div');
    sentenceContainer.className = 'sentence-container';
    
    // Create sentence number
    const sentenceNumber = document.createElement('div');
    sentenceNumber.innerHTML = `<strong>Sentence ${index + 1}</strong>`;
    sentenceContainer.appendChild(sentenceNumber);
    
    // Create form for the sentence
    const form = document.createElement('div');
    form.className = 'sentence-form';
    
    // Split the template by blanks
    const parts = template.split('_____');
    
    // Create input fields for each blank
    for (let i = 0; i < parts.length; i++) {
        // Add the text part
        const textSpan = document.createElement('span');
        textSpan.textContent = parts[i];
        form.appendChild(textSpan);
        
        // Add input field if not the last part
        if (i < parts.length - 1) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'blank-input';
            input.dataset.sentenceIndex = index;
            input.dataset.inputIndex = i;
            input.placeholder = 'word here';
            input.maxLength = 25; // Limit input length
            
            // Add event listener to check if all inputs are filled
            input.addEventListener('input', checkAllInputs);
            
            form.appendChild(input);
        }
    }
    
    sentenceContainer.appendChild(form);
    
    // Create element for completed sentence (initially hidden)
    const completedSentence = document.createElement('div');
    completedSentence.className = 'completed-sentence';
    completedSentence.id = `completed-${index}`;
    sentenceContainer.appendChild(completedSentence);
    
    container.appendChild(sentenceContainer);
}

// Function to check if all inputs are filled
function checkAllInputs() {
    const inputs = document.querySelectorAll('.blank-input');
    allInputsFilled = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            allInputsFilled = false;
        }
    });
    
    const submitButton = document.getElementById('submitBtn');
    if (submitButton) {
        submitButton.disabled = !allInputsFilled;
    }
}

// Function to submit sentences and get feedback
function submitSentences() {
    try {
        if (!allInputsFilled) return;
        
        // Collect all input values
        const inputs = document.querySelectorAll('.blank-input');
        
        inputs.forEach(input => {
            const sentenceIndex = parseInt(input.dataset.sentenceIndex);
            const inputIndex = parseInt(input.dataset.inputIndex);
            
            // Ensure the inputs array exists for this sentence
            if (!currentSentences[sentenceIndex].inputs) {
                currentSentences[sentenceIndex].inputs = [];
            }
            
            // Store the input value
            currentSentences[sentenceIndex].inputs[inputIndex] = input.value.trim();
        });
        
        // Generate the completed sentences
        completedSentences = currentSentences.map(sentence => {
            const parts = sentence.template.split('_____');
            let completedSentence = '';
            
            for (let i = 0; i < parts.length; i++) {
                completedSentence += parts[i];
                if (i < parts.length - 1 && sentence.inputs[i]) {
                    completedSentence += sentence.inputs[i];
                }
            }
            
            return completedSentence;
        });
        
        // Display the completed sentences
        completedSentences.forEach((sentence, index) => {
            const completedElement = document.getElementById(`completed-${index}`);
            if (completedElement) {
                completedElement.innerHTML = highlightTrendingWords(sentence);
                completedElement.style.display = 'block';
            }
        });
        
        // Generate and display feedback
        const feedback = analyzeSentences(completedSentences);
        renderFeedback(feedback);
        
        // Show feedback section
        const feedbackElement = document.getElementById('feedback');
        if (feedbackElement) {
            feedbackElement.style.display = 'block';
            
            // Scroll to feedback
            setTimeout(() => {
                feedbackElement.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
        
    } catch (error) {
        console.error("Error submitting sentences:", error);
        showErrorMessage("Failed to process feedback. Please try again.");
    }
}

// Function to highlight trending words in a sentence
function highlightTrendingWords(sentence) {
    if (!sentence) return '';
    
    let highlightedSentence = sentence;
    
    // Sort trending words by length (longest first) to prevent partial matches
    const sortedTrendingWords = [...trendingWords].sort((a, b) => b.length - a.length);
    
    sortedTrendingWords.forEach(word => {
        // Create a regex that matches the word as a whole word
        // Use word boundary \b to ensure we match whole words only
        try {
            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
            const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
            highlightedSentence = highlightedSentence.replace(regex, `<span class="word-highlight">${word}</span>`);
        } catch (error) {
            console.error(`Error highlighting word "${word}":`, error);
        }
    });
    
    return highlightedSentence;
}

// Function to analyze the sentences and generate feedback
function analyzeSentences(sentences) {
    // Count word occurrences
    const wordCounts = {};
    let userWords = new Set();
    
    sentences.forEach(sentence => {
        if (!sentence) return;
        
        // Extract words from sentence
        const words = sentence.match(/\b\w+\b/g) || [];
        
        words.forEach(word => {
            const normalizedWord = word.toLowerCase();
            userWords.add(normalizedWord);
            
            // Check if it's a trending word
            const isTrending = trendingWords.some(trendWord => 
                trendWord.toLowerCase() === normalizedWord);
            
            if (isTrending) {
                if (!wordCounts[normalizedWord]) {
                    wordCounts[normalizedWord] = 0;
                }
                wordCounts[normalizedWord]++;
            }
        });
    });
    
    // Get top trending words used
    const topWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }));
    
    // Generate metrics
    const uniqueTrendingWordsCount = Object.keys(wordCounts).length;
    const totalTrendingWordsUsed = Object.values(wordCounts).reduce((sum, count) => sum + count, 0);
    const totalWordsUsed = Array.from(userWords).length;
    
    // Calculate scores (handle edge cases)
    const trendingRatio = totalWordsUsed > 0 ? totalTrendingWordsUsed / totalWordsUsed : 0;
    const diversityScore = totalTrendingWordsUsed > 0 ? 
        Math.min((uniqueTrendingWordsCount / totalTrendingWordsUsed) * 10, 10).toFixed(1) : "0.0";
    const trendingScore = Math.min(trendingRatio * 10, 10).toFixed(1);
    const creativityScore = trendingWords.length > 0 ? 
        Math.min((uniqueTrendingWordsCount / trendingWords.length) * 20, 10).toFixed(1) : "0.0";
    
    return {
        topWords,
        totalTrendingWordsUsed,
        uniqueTrendingWordsCount,
        diversityScore,
        trendingScore,
        creativityScore,
        totalWordsUsed
    };
}

// Function to render feedback
function renderFeedback(feedback) {
    const { topWords, totalTrendingWordsUsed, uniqueTrendingWordsCount, 
            diversityScore, trendingScore, creativityScore, totalWordsUsed } = feedback;
    
    const container = document.getElementById('chart-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Top level stats
    const statsSection = document.createElement('div');
    statsSection.style.backgroundColor = '#f5f9ff';
    statsSection.style.padding = '15px';
    statsSection.style.borderRadius = '8px';
    statsSection.style.marginBottom = '20px';
    
    statsSection.innerHTML = `
        <h3>Your Trending Stats</h3>
        <p>You used <strong>${totalTrendingWordsUsed}</strong> trending words out of <strong>${totalWordsUsed}</strong> total words, 
        including <strong>${uniqueTrendingWordsCount}</strong> different trending terms.</p>
    `;
    
    // Create word usage chart
    const wordUsageChart = document.createElement('div');
    wordUsageChart.className = 'word-usage-chart';
    wordUsageChart.style.marginBottom = '20px';
    
    if (topWords.length > 0) {
        wordUsageChart.innerHTML = `<h3>Top Trending Words You Used</h3>`;
        
        // Create a bar chart container
        const barChart = document.createElement('div');
        barChart.className = 'bar-container';
        
        // Find the maximum count to scale the bars
        const maxCount = Math.max(...topWords.map(item => item.count));
        
        // Add bars with animation
        topWords.forEach(item => {
            const barContainer = document.createElement('div');
            barContainer.className = 'bar-item';
            
            const bar = document.createElement('div');
            bar.className = 'bar';
            const heightPercentage = (item.count / maxCount) * 100;
            bar.style.height = '0'; // Start with height 0 for animation
            
            const label = document.createElement('div');
            label.className = 'bar-label';
            label.textContent = item.word;
            
            const value = document.createElement('div');
            value.className = 'bar-value';
            value.textContent = item.count;
            
            barContainer.appendChild(bar);
            barContainer.appendChild(label);
            barContainer.appendChild(value);
            barChart.appendChild(barContainer);
        });
        
        wordUsageChart.appendChild(barChart);
        
        // Animate bars after a short delay
        setTimeout(() => {
            const bars = barChart.querySelectorAll('.bar');
            bars.forEach((bar, index) => {
                const heightPercentage = (topWords[index].count / maxCount) * 100;
                bar.style.height = `${heightPercentage}%`;
            });
        }, 100);
        
    } else {
        wordUsageChart.innerHTML = `
            <h3>No Trending Words Used</h3>
            <p>You didn't use any of the trending words from our list. Try using some trending words for higher scores!</p>
        `;
    }
    
    // Create scores chart
    const scoresChart = document.createElement('div');
    scoresChart.innerHTML = '<h3>Your Trendy Content Scores</h3>';
    
    const scoreItems = [
        { name: 'Diversity', score: diversityScore, description: 'How varied your trending word choices are' },
        { name: 'Trending', score: trendingScore, description: 'Proportion of trending words used' },
        { name: 'Creativity', score: creativityScore, description: 'Range of different trending terms' }
    ];
    
    const scoresContainer = document.createElement('div');
    scoresContainer.className = 'scores-container';
    
    scoreItems.forEach(item => {
        const scoreBox = document.createElement('div');
        scoreBox.className = 'score-box';
        
        // Color coding based on score
        let scoreColor = '#2c3e50'; // Default color
        if (parseFloat(item.score) >= 8) {
            scoreColor = '#27ae60'; // High score - green
        } else if (parseFloat(item.score) >= 5) {
            scoreColor = '#f39c12'; // Medium score - orange
        } else {
            scoreColor = '#e74c3c'; // Low score - red
        }
        
        const scoreValue = document.createElement('div');
        scoreValue.className = 'score-value';
        scoreValue.textContent = item.score;
        scoreValue.style.color = scoreColor;
        
        const scoreName = document.createElement('div');
        scoreName.className = 'score-name';
        scoreName.textContent = item.name;
        
        const scoreDescription = document.createElement('div');
        scoreDescription.className = 'score-description';
        scoreDescription.textContent = item.description;
        
        scoreBox.appendChild(scoreValue);
        scoreBox.appendChild(scoreName);
        scoreBox.appendChild(scoreDescription);
        scoresContainer.appendChild(scoreBox);
    });
    
    scoresChart.appendChild(scoresContainer);
    
    // Add insight text
    const insightText = document.createElement('div');
    insightText.className = 'insight-text';
    
    // Generate insight based on scores
    let insight = '';
    const avgScore = (parseFloat(diversityScore) + parseFloat(trendingScore) + parseFloat(creativityScore)) / 3;
    
    if (avgScore >= 8) {
        insight = "Your sentences are fire! Perfect blend of trending terms with creative usage. You're definitely on top of the latest slang!";
    } else if (avgScore >= 6) {
        insight = "Good use of trending words! You've got some nice slang in there. Try using even more varied trending terms for higher scores.";
    } else if (avgScore >= 3) {
        insight = "You're starting to use some trending terms, but could include more variety. Check out the trending word list for inspiration!";
    } else {
        insight = "Your sentences could use more trending words to increase your score. Try picking words from the trending list above!";
    }
    
    // Add personal suggestion based on specific scores
    let suggestion = "";
    if (parseFloat(diversityScore) < 5) {
        suggestion = " Try using a wider variety of trending words rather than repeating the same ones.";
    } else if (parseFloat(trendingScore) < 5) {
        suggestion = " Include more trending words in your sentences to boost your trending score.";
    } else if (parseFloat(creativityScore) < 5) {
        suggestion = " Experiment with more different trending terms from our list to show your creativity.";
    }
    
    insightText.innerHTML = `<strong>AI Analysis:</strong> ${insight}${suggestion}`;
    
    // Append all elements to container
    container.appendChild(statsSection);
    container.appendChild(wordUsageChart);
    container.appendChild(scoresChart);
    container.appendChild(insightText);
}
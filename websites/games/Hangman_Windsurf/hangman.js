// Game state
let word = '';
let guessedLetters = [];
let wrongGuesses = 0;
const maxWrongGuesses = 6;
let gameActive = false;

// DOM elements
const wordDisplay = document.querySelector('.word-display');
const wrongGuessesElement = document.getElementById('wrong-guesses');
const guessedLettersElement = document.getElementById('guessed-letters');
const keyboard = document.querySelector('.keyboard');
const newGameBtn = document.getElementById('new-game');
const hangmanParts = {
    head: document.querySelector('.head'),
    body: document.querySelector('.body'),
    leftArm: document.querySelector('.arm-left'),
    rightArm: document.querySelector('.arm-right'),
    leftLeg: document.querySelector('.leg-left'),
    rightLeg: document.querySelector('.leg-right'),
    figure: document.querySelector('.hangman-figure')
};

// Word bank (fruits and vegetables)
const words = [
    'APPLE', 'BANANA', 'CARROT', 'DURIAN', 'EGGPLANT',
    'FIG', 'GRAPE', 'HONEYDEW', 'ICEBERG', 'JACKFRUIT',
    'KIWI', 'LEMON', 'MANGO', 'NECTARINE', 'ORANGE',
    'PEACH', 'QUINCE', 'RADISH', 'STRAWBERRY', 'TOMATO'
];

// Initialize the game
function initGame() {
    // Reset game state
    word = words[Math.floor(Math.random() * words.length)];
    guessedLetters = [];
    wrongGuesses = 0;
    gameActive = true;
    
    // Reset UI
    wordDisplay.textContent = '_'.repeat(word.length);
    wrongGuessesElement.textContent = `0/${maxWrongGuesses}`;
    guessedLettersElement.textContent = '';
    
    // Reset hangman drawing
    if (hangmanParts.head) hangmanParts.head.classList.remove('visible');
    if (hangmanParts.body) hangmanParts.body.classList.remove('visible');
    if (hangmanParts.leftArm) hangmanParts.leftArm.classList.remove('visible');
    if (hangmanParts.rightArm) hangmanParts.rightArm.classList.remove('visible');
    if (hangmanParts.leftLeg) hangmanParts.leftLeg.classList.remove('visible');
    if (hangmanParts.rightLeg) hangmanParts.rightLeg.classList.remove('visible');
    
    // Reset keyboard
    keyboard.innerHTML = '';
    createKeyboard();
    
    // Remove game over class if it exists
    document.querySelector('.hangman-container').classList.remove('game-over');
}

// Create the on-screen keyboard
function createKeyboard() {
    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const button = document.createElement('button');
        button.textContent = letter;
        button.className = 'key';
        button.dataset.letter = letter;
        button.addEventListener('click', () => handleGuess(letter));
        keyboard.appendChild(button);
    }
}

// Handle a letter guess
function handleGuess(letter) {
    if (!gameActive) return;
    
    // Check if letter was already guessed
    if (guessedLetters.includes(letter)) return;
    
    // Add to guessed letters
    guessedLetters.push(letter);
    guessedLettersElement.textContent = guessedLetters.join(', ');
    
    // Disable the button
    const button = document.querySelector(`.key[data-letter="${letter}"]`);
    button.disabled = true;
    
    // Check if letter is in the word
    if (word.includes(letter)) {
        button.classList.add('correct');
        updateWordDisplay();
        checkWin();
    } else {
        button.classList.add('incorrect');
        wrongGuesses++;
        wrongGuessesElement.textContent = `${wrongGuesses}/${maxWrongGuesses}`;
        updateHangman();
        
        if (wrongGuesses >= maxWrongGuesses) {
            gameOver(false);
        }
    }
}

// Update the word display with correctly guessed letters
function updateWordDisplay() {
    const display = word.split('').map(letter => 
        guessedLetters.includes(letter) ? letter : '_'
    ).join(' ');
    
    wordDisplay.textContent = display;
    return display;
}

// Update the hangman drawing
function updateHangman() {
    switch(wrongGuesses) {
        case 1: hangmanParts.head.classList.add('visible'); break;
        case 2: hangmanParts.body.classList.add('visible'); break;
        case 3: hangmanParts.leftArm.classList.add('visible'); break;
        case 4: hangmanParts.rightArm.classList.add('visible'); break;
        case 5: hangmanParts.leftLeg.classList.add('visible'); break;
        case 6: 
            hangmanParts.rightLeg.classList.add('visible');
            // Show right leg and start swinging animation
            document.querySelector('.hangman-container').classList.add('game-over');
            break;
    }
}

// Check if the player has won
function checkWin() {
    const currentDisplay = updateWordDisplay().replace(/\s/g, '');
    if (currentDisplay === word) {
        gameOver(true);
    }
}

// Handle game over
function gameOver(isWin) {
    gameActive = false;
    
    if (isWin) {
        wordDisplay.textContent = 'You Win! 🎉';
    } else {
        wordDisplay.textContent = `Game Over! The word was: ${word}`;
    }
    
    // Disable all keyboard buttons
    document.querySelectorAll('.key').forEach(button => {
        button.disabled = true;
    });
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    
    const key = e.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
        handleGuess(key);
    }
});

newGameBtn.addEventListener('click', initGame);

// Start the game
initGame();

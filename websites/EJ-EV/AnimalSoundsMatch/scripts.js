// scripts.js

displayUserName();


function getUserInfoFromURL() { const params = new URLSearchParams(window.location.search); return { userName: params.get('user'), nickname: params.get('nickname') }; }
function displayUserName() { const userInfo = getUserInfoFromURL(); if (userInfo.userName) { document.getElementById('userGreeting').innerHTML = 'Hi ' + userInfo.nickname + ' <br>Animal Sounds Match Game!'; } }

document.addEventListener('DOMContentLoaded', () => {
    const originalAnimals = [
        { name: 'cat', img: 'cat.jpg', sound: 'cat.mp3' },
        { name: 'dog', img: 'dog.jpg', sound: 'dog.mp3' },
        { name: 'cow', img: 'cow.jpg', sound: 'cow.mp3' },
        { name: 'pig', img: 'pig.jpg', sound: 'pig.mp3' },
    ];
    let animals = []; // Define animals in a scope accessible by flipCard
    const gameGrid = document.querySelector('.grid');
    const resetButton = document.getElementById('reset-button');
    const resetsoundButton = document.getElementById('reset-sound-button');
    let cardChosen = [];
    let cardChosenId = [];
    let cardsWon = [];
    let currentAudio = null;

    function createBoard() {
        gameGrid.innerHTML = ''; // Clear the grid first to prevent duplication
        animals = [...originalAnimals, ...originalAnimals]; // Duplicate and use a fresh array
        animals.sort(() => 0.5 - Math.random()); // Shuffle the array

        for (let i = 0; i < animals.length; i++) {
            let card = document.createElement('div');
            card.setAttribute('data-id', i);
            card.style.backgroundImage = 'url(images/card-back.jpg)'; // Set all cards to show the back image initially
            card.addEventListener('click', flipCard);
            gameGrid.appendChild(card);
        }
    }

    function flipCard() {
        let clickedCardId = this.getAttribute('data-id');
        this.classList.add('flip');
        this.style.backgroundImage = `url(images/${animals[clickedCardId].img})`; // Show animal image on flip
        playSound(animals[clickedCardId].name);
        cardChosen.push(animals[clickedCardId].name);
        cardChosenId.push(clickedCardId);
        if (cardChosen.length === 2) {
            setTimeout(checkForMatch, 500);
        }
    }

   function checkForMatch() {
    const cards = document.querySelectorAll('.grid div');
    const optionOneId = cardChosenId[0];
    const optionTwoId = cardChosenId[1];

    if (cardChosen[0] === cardChosen[1]) {
        playAudioAndShowImage('match.mp3', 'match.jpg', 'Oh. You got a match!');
        cards[optionOneId].removeEventListener('click', flipCard);
        cards[optionTwoId].removeEventListener('click', flipCard);
        cardsWon.push(cardChosen);
    } else {
        setTimeout(() => {
            cards[optionOneId].style.backgroundImage = 'url(images/card-back.jpg)';
            cards[optionTwoId].style.backgroundImage = 'url(images/card-back.jpg)';
        }, 1000);
    }

    cardChosen = [];
    cardChosenId = [];

    if (cardsWon.length === animals.length/2) {
        playAudioAndShowImage('win.mp3', 'win.jpg', 'Good job, you found all the matches!');
    }
}

function playAudioAndShowImage(audioFile, imageFile, speechText) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    currentAudio = new Audio(`sounds/${audioFile}`);
    currentAudio.play();

    // Using the SpeechSynthesis API to speak out text
    if ('speechSynthesis' in window) {
        let speech = new SpeechSynthesisUtterance(speechText);
        window.speechSynthesis.speak(speech);
    }

    // Show the overlay and update the image source
    const overlay = document.getElementById('overlay');
    const eventImage = document.getElementById('event-image');
    overlay.style.display = 'flex'; // Show the overlay
    eventImage.src = `images/${imageFile}`;

    // Optionally, hide the overlay after some time
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 3000); // Hide after 3 seconds
}


    function playSound(animalName) {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        currentAudio = new Audio(`sounds/${animalName}.mp3`);
        currentAudio.play();
    }

    resetButton.addEventListener('click', () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        cardChosen = [];
        cardChosenId = [];
        cardsWon = [];
        createBoard();
    });

    resetsoundButton.addEventListener('click', () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
    });

    createBoard();
});

    displayUserName();


function getUserInfoFromURL() { const params = new URLSearchParams(window.location.search); return { userName: params.get('user'), nickname: params.get('nickname') }; }
function displayUserName() { const userInfo = getUserInfoFromURL(); if (userInfo.userName) { document.getElementById('userGreeting').innerHTML = 'Hi ' + userInfo.nickname + ' Speak game!'; } }

function speakText() {
    let text = document.getElementById('textInput').value;
    let speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
}

function clearText() {
    document.getElementById('textInput').value = '';
}

function speakLetters() {
    let text = document.getElementById('textInput').value;
    for (let i = 0; i < text.length; i++) {
        let speech = new SpeechSynthesisUtterance(text[i]);
        window.speechSynthesis.speak(speech);
    }
}

function selectWord() {
    let selectedWord = document.getElementById('wordList').value;
    document.getElementById('textInput').value = selectedWord;
    if (selectedWord) speakText();
}

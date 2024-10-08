let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

let playerWidth = 34;
let playerHeight = 24;
let playerX = boardWidth / 8;
let playerY = boardHeight / 2;
let playerImg;

let gravity = 0.4;  // Increased gravity
let lift = -7;  // Increased lift for more responsive jumps
let velocity = 0;

let gameStarted = false;
let gameOver = false;

let scrollSpeed = 2;  // Increased scroll speed

let currentWord = "";
let currentWordHindi = "";
let collectedLetters = [];
let letterWidth = 40;
let letterHeight = 40;
let letterSpacing = 150;  // Reduced letter spacing

let audioContext;

let letterArray = [];

let currentCategory = '';

let apiBaseUrl = 'http://localhost:3000';

let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

let hindiWords = [];

window.onload = function() {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    playerImg = new Image();
    playerImg.src = "flappybird.png";
    
    setupEventListeners();
};

function setupEventListeners() {
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', () => {
            currentCategory = button.dataset.category;
            document.getElementById('welcome-screen').style.display = 'none';
            document.getElementById('game-container').style.display = 'block';
            fetchWordData();
        });
    });

    board.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('try-again-button').addEventListener('click', resetGame);
    
    document.getElementById('back-to-menu').addEventListener('click', backToMenu);
    document.getElementById('back-to-menu-gameover').addEventListener('click', backToMenu);
}

function backToMenu() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('welcome-screen').style.display = 'block';
    resetGame();
    gameStarted = false;
    gameOver = false;
}

function fetchWordData() {
    fetch(`${apiBaseUrl}/words?category=${currentCategory}`)
        .then(response => response.json())
        .then(data => {
            hindiWords = data;
            selectNewWord();
            placeLetters();
            document.getElementById('start-screen').style.display = 'flex';
        });
}

function handleKeyDown(e) {
    if (e.code === "Space") {
        e.preventDefault();
        handleClick();
    }
}

function selectNewWord() {
    const selectedWord = hindiWords[Math.floor(Math.random() * hindiWords.length)];
    currentWordHindi = selectedWord.hindi;
    currentWord = selectedWord.english;
    collectedLetters = [];
}

function placeLetters() {
    letterArray = [];
    const letters = currentWordHindi.split('');
    
    for (let i = 0; i < letters.length; i++) {
        letterArray.push({
            char: letters[i],
            x: boardWidth + i * (letterWidth + letterSpacing),
            y: Math.random() * (boardHeight - letterHeight - 100) + 50,
            color: getRandomColor()
        });
    }
}

function getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function playAudio(audioUrl) {
    fetch(audioUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();
        });
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameStarted = true;
    velocity = 0;
    playerY = boardHeight / 2;
    lastTime = 0;
    requestAnimationFrame(gameLoop);
}

function updateLetters() {
    letterArray.forEach(letter => {
        letter.x -= scrollSpeed;
        
        if (letter.x + letterWidth < 0) {
            letter.x = boardWidth;
            letter.y = Math.random() * (boardHeight - letterHeight - 100) + 50;
        }
    });
}

function checkCollisions() {
    letterArray.forEach((letter, index) => {
        if (
            playerX < letter.x + letterWidth &&
            playerX + playerWidth > letter.x &&
            playerY < letter.y + letterHeight &&
            playerY + playerHeight > letter.y
        ) {
            if (letter.char === currentWordHindi[collectedLetters.length]) {
                collectedLetters.push(letter.char);
                playAudio(`${apiBaseUrl}/audio?char=${encodeURIComponent(letter.char)}`);
                letterArray.splice(index, 1);
                
                if (collectedLetters.length === currentWordHindi.length) {
                    completeWord();
                }
            } else {
                incorrectLetter();
            }
        }
    });
}

function gameLoop(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = currentTime - lastTime;

    if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval);

        if (gameStarted && !gameOver) {
            velocity += gravity;
            playerY += velocity;
            updateLetters();
            checkCollisions();

            if (playerY > boardHeight - playerHeight || playerY < 0) {
                endGame();
                return;
            }
        }

        context.clearRect(0, 0, boardWidth, boardHeight);
        
        context.drawImage(playerImg, playerX, playerY, playerWidth, playerHeight);

        letterArray.forEach(letter => {
            context.fillStyle = letter.color;
            context.fillRect(letter.x, letter.y, letterWidth, letterHeight);
            
            context.fillStyle = "white";
            context.font = "bold 24px Arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(letter.char, letter.x + letterWidth/2, letter.y + letterHeight/2);
        });

        context.textAlign = "left";
        context.textBaseline = "alphabetic";
        
        context.font = "24px Arial";
        context.fillStyle = "black";
        context.fillText(`Category: ${currentCategory}`, 10, 30);
        context.fillText(`Word: ${currentWordHindi}`, 10, 60);
        context.fillText(`Collected: ${collectedLetters.join("")}`, 10, 90);
        context.fillText(`English: ${currentWord}`, 10, 120);
    }

    requestAnimationFrame(gameLoop);
}

function completeWord() {
    gameOver = true;
    
    fetch(`${apiBaseUrl}/audio?word=${encodeURIComponent(currentWordHindi)}`)
        .then(response => response.json())
        .then(data => {
            let delay = 0;
            data.files.forEach((file, index) => {
                setTimeout(() => {
                    playAudio(`${apiBaseUrl}/audiofiles/${file}`);
                }, delay);
                delay += 300;
            });
        });
    
    document.getElementById('game-over-message').textContent = `Word Completed: ${currentWordHindi} (${currentWord})`;
    document.getElementById('collected-word').textContent = `Collected: ${collectedLetters.join("")}`;
    document.getElementById('try-again-button').textContent = 'Next Word';
    document.getElementById('game-over-screen').style.display = 'flex';
}

function incorrectLetter() {
    gameOver = true;
    document.getElementById('game-over-message').textContent = 'Wrong Letter! Try again!';
    document.getElementById('try-again-button').textContent = 'Try Again';
    document.getElementById('game-over-screen').style.display = 'flex';
}

function endGame() {
    gameOver = true;
    document.getElementById('game-over-message').textContent = 'Game Over!';
    document.getElementById('collected-word').textContent = `Collected: ${collectedLetters.join("")}`;
    document.getElementById('try-again-button').textContent = 'Try Again';
    document.getElementById('game-over-screen').style.display = 'flex';
}

function resetGame() {
    document.getElementById('game-over-screen').style.display = 'none';
    selectNewWord();
    placeLetters();
    gameOver = false;
    gameStarted = true;
    playerY = boardHeight / 2;
    velocity = 0;
    lastTime = 0;
    requestAnimationFrame(gameLoop);  // Restart the game loop
}

function handleClick() {
    if (!gameStarted && !gameOver) {
        startGame();
    }
    if (gameStarted && !gameOver) {
        velocity = lift;
    }
}
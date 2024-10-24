let board, context, playerImg;
let boardWidth = 800, boardHeight = 900;
let playerWidth = 68, playerHeight = 48;
let playerX = boardWidth / 8, playerY = boardHeight / 2;
let gravity = 0.4, lift = -7, velocity = 0;
let gameStarted = false, gameOver = false;
let scrollSpeed = 2;
let currentWord = "", currentWordHindi = "";
let collectedLetters = [];
let letterWidth = 60, letterHeight = 60, letterSpacing = 150;
let letterArray = [];
let currentCategory = "";
let lastTime = 0;
let animationFrameId;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function init() {
  board = document.getElementById("board");
  board.width = boardWidth;
  board.height = boardHeight;
  context = board.getContext("2d");
  playerImg = new Image();
  playerImg.src = "/imagefiles/flappybird.png";
  setupEventListeners();
}

function setupEventListeners() {
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentCategory = btn.dataset.category;
      document.getElementById("welcome-screen").style.display = "none";
      document.getElementById("game-container").style.display = "flex";
      fetchWordData();
    });
  });

  board.addEventListener("click", handleClick);
  document.addEventListener("keydown", e => {
    if (e.code === "Space") {
      e.preventDefault();
      handleClick();
    }
  });

  document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("try-again-button").addEventListener("click", restartGame);
  document.getElementById("back-to-menu").addEventListener("click", backToMenu);
  document.getElementById("back-to-menu-gameover").addEventListener("click", backToMenu);
}

async function fetchWordData() {
  try {
    const response = await fetch(`/words?category=${currentCategory}`);
    const data = await response.json();
    if (data.length > 0) {
      selectNewWord(data);
      placeLetters();
      document.getElementById("start-screen").style.display = "flex";
    }
  } catch (error) {
    console.error("Error fetching word data:", error);
  }
}

function selectNewWord(words) {
  const word = words[Math.floor(Math.random() * words.length)];
  currentWordHindi = word.hindi;
  currentWord = word.english;
  collectedLetters = [];
}

function placeLetters() {
  letterArray = currentWordHindi.split("").map((char, i) => ({
    char,
    x: boardWidth + i * (letterWidth + letterSpacing),
    y: Math.random() * (boardHeight * 0.4) + boardHeight * 0.3,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));
}

function gameLoop(currentTime) {
  if (!gameStarted || gameOver) {
    cancelAnimationFrame(animationFrameId);
    return;
  }

  const elapsed = currentTime - lastTime;
  if (elapsed > 16) {
    lastTime = currentTime;
    
    velocity += gravity;
    playerY += velocity;
    
    letterArray.forEach(letter => {
      letter.x -= scrollSpeed;
      if (letter.x + letterWidth < 0) {
        letter.x = boardWidth;
        letter.y = Math.random() * (boardHeight * 0.4) + boardHeight * 0.3;
      }
    });

    checkCollisions();
    
    if (playerY > boardHeight - playerHeight || playerY < 0) {
      endGame();
      return;
    }

    render();
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

function render() {
  context.clearRect(0, 0, boardWidth, boardHeight);
  context.drawImage(playerImg, playerX, playerY, playerWidth, playerHeight);
  
  letterArray.forEach(letter => {
    context.fillStyle = letter.color;
    context.fillRect(letter.x, letter.y, letterWidth, letterHeight);
    context.fillStyle = "white";
    context.font = "bold 36px Arial";
    context.textAlign = "center";
    context.fillText(letter.char, letter.x + letterWidth / 2, letter.y + letterHeight / 2);
  });

  context.font = "24px Arial";
  context.fillStyle = "black";
  context.textAlign = "left";
  context.fillText(`Category: ${currentCategory}`, 10, 30);
  context.fillText(`Word: ${currentWordHindi}`, 10, 60);
  context.fillText(`Collected: ${collectedLetters.join("")}`, 10, 90);
  context.fillText(`English: ${currentWord}`, 10, 120);
}

function checkCollisions() {
  letterArray.forEach((letter, index) => {
    if (playerX < letter.x + letterWidth &&
        playerX + playerWidth > letter.x &&
        playerY < letter.y + letterHeight &&
        playerY + playerHeight > letter.y) {
      if (letter.char === currentWordHindi[collectedLetters.length]) {
        collectedLetters.push(letter.char);
        playAudio(letter.char);
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

function completeWord() {
  gameOver = true;
  document.getElementById("game-over-message").textContent = `Word Completed: ${currentWordHindi} (${currentWord})`;
  document.getElementById("collected-word").textContent = `Collected: ${collectedLetters.join("")}`;
  document.getElementById("try-again-button").textContent = "Next Word";
  
  const completedWordImage = document.getElementById("completed-word-image");
  completedWordImage.src = `/imagefiles/${currentWord}.jpg`;
  completedWordImage.onerror = () => {
    completedWordImage.src = "/imagefiles/default.jpg";
  };
  completedWordImage.style.display = "block";
  document.getElementById("game-over-screen").style.display = "flex";
  
  setTimeout(() => {
    playAudio(currentWord, true);
  }, 2000);
}

function incorrectLetter() {
  gameOver = true;
  document.getElementById("game-over-message").textContent = "Wrong Letter! Try again!";
  document.getElementById("try-again-button").textContent = "Try Again";
  const errorImage = document.getElementById("completed-word-image");
  errorImage.src = "/imagefiles/tryagain.jpg";
  errorImage.onerror = () => {
    errorImage.src = "/imagefiles/default.jpg";
  };
  errorImage.style.display = "block";
  document.getElementById("game-over-screen").style.display = "flex";
}

async function playAudio(input, isWord = false) {
  try {
    const queryParam = isWord ? "word" : "char";
    const response = await fetch(`/audio?${queryParam}=${encodeURIComponent(input)}`);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (error) {
    console.error("Audio playback failed:", error);
  }
}

function endGame() {
  gameOver = true;
  document.getElementById("game-over-message").textContent = "Game Over!";
  document.getElementById("collected-word").textContent = `Collected: ${collectedLetters.join("")}`;
  document.getElementById("try-again-button").textContent = "Try Again";
  const errorImage = document.getElementById("completed-word-image");
  errorImage.src = "/imagefiles/tryagain.jpg";
  errorImage.onerror = () => {
    errorImage.src = "/imagefiles/default.jpg";
  };
  errorImage.style.display = "block";
  document.getElementById("game-over-screen").style.display = "flex";
}

function backToMenu() {
  document.getElementById("game-container").style.display = "none";
  document.getElementById("welcome-screen").style.display = "block";
  resetGame();
}

function resetGame() {
  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("completed-word-image").style.display = "none";
  gameOver = false;
  gameStarted = false;
  playerY = boardHeight / 2;
  velocity = 0;
  lastTime = 0;
  fetchWordData();
}

function restartGame() {
  resetGame();
  startGame();
}

function handleClick() {
  if (!gameStarted && !gameOver) {
    startGame();
  }
  if (gameStarted && !gameOver) {
    velocity = lift;
  }
}

function startGame() {
  document.getElementById("start-screen").style.display = "none";
  gameStarted = true;
  gameOver = false;
  playerY = boardHeight / 2;
  velocity = 0;
  collectedLetters = [];
  lastTime = performance.now();
  animationFrameId = requestAnimationFrame(gameLoop);
}

window.onload = init;
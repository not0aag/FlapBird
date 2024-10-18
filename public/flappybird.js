let board;
let boardWidth = 800;
let boardHeight = 900;
let context;

let playerWidth = 68;
let playerHeight = 48;
let playerX = boardWidth / 8;
let playerY = boardHeight / 2;
let playerImg;

let gravity = 0.4;
let lift = -7;
let velocity = 0;

let gameStarted = false;
let gameOver = false;

let scrollSpeed = 2;

let currentWord = "";
let currentWordHindi = "";
let collectedLetters = [];
let letterWidth = 60;
let letterHeight = 60;
let letterSpacing = 150;

let audioContext;

let letterArray = [];

let currentCategory = "";

const baseUrl = window.location.origin;
console.log(baseUrl);

let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

let hindiWords = [];

let animationFrameId;

function initAudio() {
  if (
    typeof window !== "undefined" &&
    (window.AudioContext || window.webkitAudioContext)
  ) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } else {
    console.log("AudioContext not available");
  }
}

function init() {
  if (typeof document !== "undefined") {
    board = document.getElementById("board");
    if (board) {
      board.width = boardWidth;
      board.height = boardHeight;
      context = board.getContext("2d");
    }

    playerImg = new Image();
    playerImg.src = "flappybird.png";

    setupEventListeners();
  }
  initAudio();
}

function setupEventListeners() {
  if (typeof document === "undefined") return;

  document.querySelectorAll(".category-btn").forEach((button) => {
    button.addEventListener("click", () => {
      currentCategory = button.dataset.category;
      document.getElementById("welcome-screen").style.display = "none";
      document.getElementById("game-container").style.display = "flex";
      fetchWordData();
    });
  });

  board.addEventListener("click", handleClick);
  document.addEventListener("keydown", handleKeyDown);

  const startButton = document.getElementById("start-button");
  if (startButton) {
    startButton.addEventListener("click", startGame);
  }

  document
    .getElementById("try-again-button")
    .addEventListener("click", restartGame);
  document.getElementById("back-to-menu").addEventListener("click", backToMenu);
  document
    .getElementById("back-to-menu-gameover")
    .addEventListener("click", backToMenu);
}

function backToMenu() {
  document.getElementById("game-container").style.display = "none";
  document.getElementById("welcome-screen").style.display = "block";
  resetGame();
  gameStarted = false;
  gameOver = false;
  document.querySelector("footer a").style.color = "";
}

function fetchWordData() {
  fetch(`${baseUrl}/words?category=${currentCategory}`)
    .then((response) => response.json())
    .then((data) => {
      hindiWords = data;
      selectNewWord();
      placeLetters();
      document.getElementById("start-screen").style.display = "flex";
    });
}

function handleKeyDown(e) {
  if (e.code === "Space") {
    e.preventDefault();
    handleClick();
  }
}

function selectNewWord() {
  const selectedWord =
    hindiWords[Math.floor(Math.random() * hindiWords.length)];
  currentWordHindi = selectedWord.hindi;
  currentWord = selectedWord.english;
  collectedLetters = [];
}

function placeLetters() {
  letterArray = [];
  const letters = currentWordHindi.split("");

  const minY = boardHeight * 0.3;
  const maxY = boardHeight * 0.7;

  for (let i = 0; i < letters.length; i++) {
    letterArray.push({
      char: letters[i],
      x: boardWidth + i * (letterWidth + letterSpacing),
      y: Math.random() * (maxY - minY) + minY,
      color: getRandomColor(),
    });
  }
}

function getRandomColor() {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
    "#9B59B6",
    "#3498DB",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function playAudio(audioUrl) {
  if (audioContext) {
    fetch(audioUrl)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
      });
  }
}

function startGame() {
  if (gameStarted) return;

  document.getElementById("start-screen").style.display = "none";
  gameStarted = true;
  gameOver = false;
  velocity = 0;
  playerY = boardHeight / 2;
  lastTime = 0;
  document.querySelector("footer a").style.color = "black";
  cancelAnimationFrame(animationFrameId);
  gameLoop();
}

function updateLetters() {
  const minY = boardHeight * 0.3;
  const maxY = boardHeight * 0.7;

  letterArray.forEach((letter) => {
    letter.x -= scrollSpeed;

    if (letter.x + letterWidth < 0) {
      letter.x = boardWidth;
      letter.y = Math.random() * (maxY - minY) + minY;
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
        playAudio(`${baseUrl}/audio?char=${encodeURIComponent(letter.char)}`);
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
  if (!gameStarted || gameOver) {
    cancelAnimationFrame(animationFrameId);
    return;
  }

  if (!lastTime) lastTime = currentTime;
  const deltaTime = currentTime - lastTime;

  if (deltaTime >= frameInterval) {
    lastTime = currentTime - (deltaTime % frameInterval);

    velocity += gravity;
    playerY += velocity;
    updateLetters();
    checkCollisions();

    if (playerY > boardHeight - playerHeight || playerY < 0) {
      endGame();
      return;
    }

    context.clearRect(0, 0, boardWidth, boardHeight);

    context.drawImage(playerImg, playerX, playerY, playerWidth, playerHeight);

    letterArray.forEach((letter) => {
      context.fillStyle = letter.color;
      context.fillRect(letter.x, letter.y, letterWidth, letterHeight);

      context.fillStyle = "white";
      context.font = "bold 36px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        letter.char,
        letter.x + letterWidth / 2,
        letter.y + letterHeight / 2
      );
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

  animationFrameId = requestAnimationFrame(gameLoop);
}

function completeWord() {
  gameOver = true;
  cancelAnimationFrame(animationFrameId);

  document.getElementById(
    "game-over-message"
  ).textContent = `Word Completed: ${currentWordHindi} (${currentWord})`;
  document.getElementById(
    "collected-word"
  ).textContent = `Collected: ${collectedLetters.join("")}`;
  document.getElementById("try-again-button").textContent = "Next Word";

  const completedWordImage = document.getElementById("completed-word-image");
  const imagePath = `imagefiles/${currentWord.toLowerCase()}.jpg`;

  completedWordImage.onerror = function () {
    this.src = "./imagefiles/default.jpg";
  };
  completedWordImage.src = imagePath;
  completedWordImage.style.display = "block";

  document.getElementById("game-over-screen").style.display = "flex";

  setTimeout(() => {
    playAudio(`/audio?word=${encodeURIComponent(currentWord)}`);
  }, 2000);
}

function incorrectLetter() {
  gameOver = true;
  cancelAnimationFrame(animationFrameId);
  document.getElementById("game-over-message").textContent =
    "Wrong Letter! Try again!";
  document.getElementById("try-again-button").textContent = "Try Again";
  const errorImage = document.getElementById("completed-word-image");
  errorImage.onerror = function () {
    this.src = "./imagefiles/default.jpg";
  };
  errorImage.src = "./imagefiles/tryagain.jpg";
  errorImage.style.display = "block";
  document.getElementById("game-over-screen").style.display = "flex";
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animationFrameId);
  document.getElementById("game-over-message").textContent = "Game Over!";
  document.getElementById(
    "collected-word"
  ).textContent = `Collected: ${collectedLetters.join("")}`;
  document.getElementById("try-again-button").textContent = "Try Again";
  const errorImage = document.getElementById("completed-word-image");
  errorImage.onerror = function () {
    this.src = "./imagefiles/default.jpg";
  };
  errorImage.src = "./imagefiles/tryagain.jpg";
  errorImage.style.display = "block";
  document.getElementById("game-over-screen").style.display = "flex";
}

function resetGame() {
  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("completed-word-image").style.display = "none";
  selectNewWord();
  placeLetters();
  gameOver = false;
  gameStarted = false;
  playerY = boardHeight / 2;
  velocity = 0;
  lastTime = 0;
  cancelAnimationFrame(animationFrameId);
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

if (typeof window !== "undefined") {
  window.onload = init;
} else {
  init();
}

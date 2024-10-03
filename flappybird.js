let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

let playerWidth = 34;
let playerHeight = 24;
let playerX = boardWidth / 8;
let playerY = boardHeight / 2; 
let playerImg;

let gravity = 0.05;
let lift = -3;
let velocity = 0;
let gameStarted = false;
let gameOver = false;

let scrollSpeed = 0.3;

let currentWord = "";
let currentWordHindi = "";
let collectedLetters = [];
let letterWidth = 40;
let letterHeight = 40;
let letterSpacing = 200;

let audioContext;

const hindiWords = [
    { hindi: "सेब", english: "seb" },
    { hindi: "आम", english: "aam" },
    { hindi: "केला", english: "kela" },
    { hindi: "अनार", english: "anaar" },
    { hindi: "अंगूर", english: "angoor" },
    { hindi: "नाशपाती", english: "nashpati" },
    { hindi: "पपीता", english: "papita" },
    { hindi: "खरबूजा", english: "kharbooja" },
    { hindi: "तरबूज", english: "tarbooj" },
    { hindi: "नींबू", english: "neembu" },
    { hindi: "संतरा", english: "santra" },
    { hindi: "अमरूद", english: "amrood" },
    { hindi: "लीची", english: "lichi" },
    { hindi: "जामुन", english: "jamun" },
    { hindi: "आलूबुखारा", english: "alubukhara" }
];

let letterArray = [];

const hindiAudioMapping = {
    'अ': 'audiofiles/1.a.mp3',
    'आ': 'audiofiles/2.aa.mp3',
    'इ': 'audiofiles/3.i..mp3',
    'ई': 'audiofiles/4.ii.mp3',
    'उ': 'audiofiles/5.u.mp3',
    'ऊ': 'audiofiles/6.oo.mp3',
    'ए': 'audiofiles/7.e.mp3',
    'ऐ': 'audiofiles/8.ai.mp3',
    'ओ': 'audiofiles/9.o.mp3',
    'औ': 'audiofiles/10.au.mp3',
    'अं': 'audiofiles/11.un.mp3',
    'अः': 'audiofiles/12.uh.mp3',
    'ऋ': 'audiofiles/13.ri.mp3',
    'क': 'audiofiles/14.ka.mp3',
    'ख': 'audiofiles/15.kha.mp3',
    'ग': 'audiofiles/16.ga.mp3',
    'घ': 'audiofiles/17.gha.mp3',
    'ङ': 'audiofiles/18.nga.mp3',
    'च': 'audiofiles/19.cha.mp3',
    'छ': 'audiofiles/20.chha.mp3',
    'ज': 'audiofiles/21.ja.mp3',
    'झ': 'audiofiles/22.jha.mp3',
    'ञ': 'audiofiles/23.nja.mp3',
    'ट': 'audiofiles/24.ta.mp3',
    'ठ': 'audiofiles/25.tha.mp3',
    'ड': 'audiofiles/26.da.mp3',
    'ढ': 'audiofiles/27.dha.mp3',
    'ण': 'audiofiles/28.na.mp3',
    'त': 'audiofiles/29.ta.mp3',
    'थ': 'audiofiles/30.tha.mp3',
    'द': 'audiofiles/31.da.mp3',
    'ध': 'audiofiles/32.dha.mp3',
    'न': 'audiofiles/33.na.mp3',
    'प': 'audiofiles/34.pa.mp3',
    'फ': 'audiofiles/35.pha.mp3',
    'ब': 'audiofiles/36.ba.mp3',
    'भ': 'audiofiles/37.bha.mp3',
    'म': 'audiofiles/38.ma.mp3',
    'य': 'audiofiles/39.ya.mp3',
    'र': 'audiofiles/40.ra.mp3',
    'ल': 'audiofiles/41.la.mp3',
    'व': 'audiofiles/42.wa.mp3',
    'श': 'audiofiles/43.sha.mp3',
    'ष': 'audiofiles/44.shha.mp3',
    'स': 'audiofiles/45.sa.mp3',
    'ह': 'audiofiles/46.ha.mp3',
    'क्ष': 'audiofiles/47.ksh.mp3',
    'त्र': 'audiofiles/48.tra.mp3',
    'ज्ञ': 'audiofiles/49.gya.mp3',
    'श्र': 'audiofiles/50.sra.mp3',
    'ी': 'audiofiles/4.ii.mp3',
    'ू': 'audiofiles/6.oo.mp3',
    'ं': 'audiofiles/11.un.mp3'
};

const fruitAudioMapping = {
    "seb": "audiofiles/seb.m4a",
    "aam": "audiofiles/aam.m4a",
    "kela": "audiofiles/kela.m4a",
    "anaar": "audiofiles/anaar.m4a",
    "angoor": "audiofiles/angoor.m4a",
    "nashpati": "audiofiles/nashpati.m4a",
    "papita": "audiofiles/papita.m4a",
    "kharbooja": "audiofiles/kahrbooja.m4a",
    "tarbooj": "audiofiles/tarbooj.m4a",
    "neembu": "audiofiles/neembu.m4a",
    "santra": "audiofiles/santara.m4a",
    "amrood": "audiofiles/amarood.m4a",
    "lichi": "audiofiles/lichi.m4a",
    "jamun": "audiofiles/jamun.m4a",
    "alubukhara": "audiofiles/aaloobukhaara.m4a"
};

window.onload = function() {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    playerImg = new Image();
    playerImg.onload = function() {
        selectNewWord();
        placeLetters();
        requestAnimationFrame(gameLoop);
    };
    
    playerImg.onerror = function() {
        context.fillStyle = "red";
        context.fillText("Error loading image!", boardWidth/2 - 60, boardHeight/2);
    };

    playerImg.src = "flappybird.png";

    board.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('try-again-button').addEventListener('click', resetGame);
};

function handleKeyDown(e) {
    if (e.code === "Space") {
        e.preventDefault();
        if (!gameStarted && !gameOver) {
            startGame();
        }
        if (gameStarted && !gameOver) {
            velocity = lift;
        }
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
    const letters = currentWord.split('');
    
    for (let i = 0; i < currentWordHindi.length; i++) {
        const hindiChar = currentWordHindi[i];
        const englishChar = letters[i] || '';
        letterArray.push({
            char: englishChar,
            hindiChar: hindiChar,
            x: boardWidth + i * (letterWidth + letterSpacing),
            y: Math.random() * (boardHeight - letterHeight - 100) + 50,
            color: getRandomColor(),
            audio: hindiAudioMapping[hindiChar] || 'audiofiles/1.a.mp3'
        });
    }
}

function getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function playAudio(audioFile) {
    const audio = new Audio(audioFile);
    audio.play().catch(e => {
        console.error("Error playing audio:", e);
        console.log("Attempted to play:", audioFile);
    });
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameStarted = true;
    velocity = lift;
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
            if (letter.hindiChar === currentWordHindi[collectedLetters.length]) {
                collectedLetters.push(letter.hindiChar);
                playAudio(letter.audio);
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

function gameLoop() {
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
        context.fillText(letter.hindiChar, letter.x + letterWidth/2, letter.y + letterHeight/2);
    });

    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    
    context.font = "24px Arial";
    context.fillStyle = "black";
    context.fillText("Word: " + currentWordHindi, 10, 30);
    context.fillText("Collected: " + collectedLetters.join(""), 10, 60);
    context.fillText("Score: " + collectedLetters.length, 10, 90);

    requestAnimationFrame(gameLoop);
}

function completeWord() {
    gameOver = true;
    document.getElementById('game-over-message').textContent = `Word Completed: ${currentWordHindi} (${currentWord})`;
    document.getElementById('collected-word').textContent = `Collected: ${collectedLetters.join("")}`;
    document.getElementById('try-again-button').textContent = 'Next Word';
    document.getElementById('game-over-screen').style.display = 'flex';
    setTimeout(() => {
        const fruitAudio = fruitAudioMapping[currentWord];
        if (fruitAudio) {
            playAudio(fruitAudio);
        }
    }, 1000);
}

function incorrectLetter() {
    gameOver = true;
    document.getElementById('game-over-message').textContent = 'Incorrect Letter! Try again!';
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
}

function handleClick(event) {
    if (gameOver) {
        const rect = board.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        if (
            clickX > boardWidth/2 - 50 &&
            clickX < boardWidth/2 + 50 &&
            clickY > boardHeight/2 + 50 &&
            clickY < boardHeight/2 + 90
        ) {
            resetGame();
        }
    }
}
const board = document.getElementById("board");
const diceResult = document.getElementById("dice-result");
const rollDiceBtn = document.getElementById("roll-dice");
const posPlayer1 = document.getElementById("pos-player1");
const posPlayer2 = document.getElementById("pos-player2");
const questionBox = document.getElementById("question-box");
const questionText = document.getElementById("question-text");
const choicesDiv = document.getElementById("choices");
const submitAnswerBtn = document.getElementById("submit-answer");
const gameStatus = document.getElementById("game-status");

const BOARD_SIZE = 100;
const COLS = 10;

let currentPlayer = 1; // 1 or 2
let positions = { 1: 1, 2: 1 };

const playersDots = {
  1: createPlayerDot('red'),
  2: createPlayerDot('yellow')
};

let isRolling = false;
let isQuestionActive = false;

// Tangga dan ular (posisi start -> posisi akhir)
const ladders = {
  3: 22,
  5: 8,
  11: 26,
  20: 29,
  27: 56,
  53: 72,
  61: 79,
  70: 90,
  80: 99
};

const snakes = {
  17: 4,
  19: 7,
  21: 9,
  43: 34,
  50: 38,
  62: 18,
  65: 52,
  87: 24,
  92: 74,
  94: 88
};

// Titik pertanyaan acak 10 titik
const questionPoints = [6, 14, 33, 36, 44, 58, 63, 75, 85, 97];

// Kumpulan soal pilihan ganda tentang pengetahuan umum Indonesia
const questionsBank = [
  {
    question: "Apa ibukota Indonesia?",
    choices: ["Jakarta", "Bandung", "Surabaya", "Medan"],
    answer: "Jakarta"
  },
  {
    question: "Pancasila terdiri dari berapa sila?",
    choices: ["3", "4", "5", "6"],
    answer: "5"
  },
  {
    question: "Gunung tertinggi di Indonesia?",
    choices: ["Rinjani", "Kerinci", "Semeru", "Puncak Jaya"],
    answer: "Puncak Jaya"
  },
  {
    question: "Pulau terbesar di Indonesia?",
    choices: ["Sumatera", "Kalimantan", "Sulawesi", "Jawa"],
    answer: "Kalimantan"
  },
  {
    question: "Bahasa resmi Indonesia adalah?",
    choices: ["Jawa", "Melayu", "Indonesia", "Sunda"],
    answer: "Indonesia"
  },
  {
    question: "Lambang negara Indonesia?",
    choices: ["Garuda", "Rajawali", "Elang", "Merpati"],
    answer: "Garuda"
  },
  {
    question: "Presiden pertama Indonesia?",
    choices: ["Sukarno", "Suharto", "Habibie", "Yudhoyono"],
    answer: "Sukarno"
  },
  {
    question: "Hari kemerdekaan Indonesia?",
    choices: ["17 Agustus", "20 Mei", "1 Juni", "28 Oktober"],
    answer: "17 Agustus"
  },
  {
    question: "Mata uang resmi Indonesia?",
    choices: ["Rupiah", "Dollar", "Euro", "Yen"],
    answer: "Rupiah"
  },
  {
    question: "Lagu kebangsaan Indonesia?",
    choices: ["Indonesia Raya", "Tanah Airku", "Bengawan Solo", "Garuda Pancasila"],
    answer: "Indonesia Raya"
  }
];

// Menyimpan pertanyaan yang sudah muncul per titik
const questionAsked = {};

// Membuat papan dan selnya
function createBoard() {
  board.innerHTML = '';
  for(let i = BOARD_SIZE; i >= 1; i--) {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    // Atur warna cell sesuai jenis
    if(ladders[i]) cell.classList.add("ladder");
    else if(snakes[i]) cell.classList.add("snake");
    else if(questionPoints.includes(i)) cell.classList.add("question");
    else cell.classList.add("normal");

    cell.dataset.position = i;
    cell.textContent = i;

    board.appendChild(cell);
  }
}

function createPlayerDot(colorClass) {
  const dot = document.createElement("div");
  dot.classList.add("player-dot", colorClass);
  board.appendChild(dot);
  return dot;
}

function getCellCoordinates(position) {
  // Hitung posisi x, y grid untuk pion
  // Papan 10x10, nomor 1 mulai dari bawah kiri ke kanan,
  // sel baris bergantian arah (snake pattern)

  let row = Math.floor((position - 1) / COLS);
  let col;
  if(row % 2 === 0) {
    col = (position - 1) % COLS;
  } else {
    col = COLS - 1 - ((position - 1) % COLS);
  }

  // Karena grid dari atas ke bawah, posisi y harus dibalik
  let x = col * (board.clientWidth / COLS);
  let y = (COLS - 1 - row) * (board.clientHeight / COLS);

  return { x, y };
}

function updatePlayerPosition(player) {
  let pos = positions[player];
  pos = Math.min(pos, BOARD_SIZE);
  let coords = getCellCoordinates(pos);

  const offset = player === 1 ? 5 : 25; // agar pion tidak tumpang tindih
  playersDots[player].style.transform = `translate(${coords.x + offset}px, ${coords.y + offset}px)`;

  if(player === 1) posPlayer1.textContent = pos;
  else posPlayer2.textContent = pos;
}

function rollDice() {
  if(isRolling || isQuestionActive) return;

  isRolling = true;
  rollDiceBtn.disabled = true;
  diceResult.textContent = "Dadu: ...";

  // Simulasi animasi dadu dengan interval singkat
  let count = 0;
  let diceInterval = setInterval(() => {
    const tempRoll = Math.floor(Math.random() * 6) + 1;
    diceResult.textContent = `Dadu: ${tempRoll}`;
    count++;
    if(count > 10) {
      clearInterval(diceInterval);
      let diceRoll = Math.floor(Math.random() * 6) + 1;
      diceResult.textContent = `Dadu: ${diceRoll}`;
      movePlayer(diceRoll);
    }
  }, 100);
}

async function movePlayer(steps) {
  let player = currentPlayer;
  let startPos = positions[player];
  let endPos = startPos + steps;

  if(endPos > BOARD_SIZE) endPos = startPos; // tidak maju jika lebih dari 100

  // Animasi perpindahan langkah demi langkah
  for(let pos = startPos + 1; pos <= endPos; pos++) {
    positions[player] = pos;
    updatePlayerPosition(player);
    await delay(300);
  }

  // Cek tangga atau ular
  if(ladders[positions[player]]) {
    await delay(300);
    positions[player] = ladders[positions[player]];
    updatePlayerPosition(player);
    gameStatus.textContent = `Pemain ${player} naik tangga ke ${positions[player]}`;
    await delay(700);
  } else if(snakes[positions[player]]) {
    await delay(300);
    positions[player] = snakes[positions[player]];
    updatePlayerPosition(player);
    gameStatus.textContent = `Pemain ${player} tergigit ular turun ke ${positions[player]}`;
    await delay(700);
  } else {
    gameStatus.textContent = "";
  }

  // Cek titik pertanyaan
  if(questionPoints.includes(positions[player])) {
    if(!questionAsked[positions[player]] || questionAsked[positions[player]] === player) {
      await showQuestion(player);
    }
  }

  // Cek menang
  if(positions[player] === BOARD_SIZE) {
    gameStatus.textContent = `Pemain ${player} MENANG! 🎉🎉🎉`;
    rollDiceBtn.disabled = true;
    isRolling = false;
    return;
  }

  // Ganti giliran pemain
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  gameStatus.textContent += ` Giliran Pemain ${currentPlayer}`;
  isRolling = false;
  rollDiceBtn.disabled = false;
}

// Delay utilitas
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function showQuestion(player) {
  return new Promise((resolve) => {
    isQuestionActive = true;
    rollDiceBtn.disabled = true;

    // Acak pertanyaan yang belum ditanyakan di titik ini
    let qIndex;
    do {
      qIndex = Math.floor(Math.random() * questionsBank.length);
    } while (questionAsked[positions[player]] && questionAsked[positions[player]].includes(qIndex));

    // Tandai pertanyaan sudah muncul di titik ini
    if(!questionAsked[positions[player]]) questionAsked[positions[player]] = [];
    questionAsked[positions[player]].push(qIndex);

    const q = questionsBank[qIndex];

    questionText.textContent = q.question;
    choicesDiv.innerHTML = '';
    submitAnswerBtn.disabled = true;

    // Buat pilihan radio button
    q.choices.forEach((choice, i) => {
      const label = document.createElement("label");
      label.classList.add("choice-label");
      label.innerHTML = `<input type="radio" name="choice" value="${choice}"> ${choice}`;
      choicesDiv.appendChild(label);
    });

    questionBox.classList.remove("hidden");

    // Enable submit jika ada pilihan dipilih
    choicesDiv.querySelectorAll("input[name='choice']").forEach(input => {
      input.addEventListener('change', () => {
        submitAnswerBtn.disabled = false;
      });
    });

    submitAnswerBtn.onclick = () => {
      const selected = document.querySelector("input[name='choice']:checked");
      if(!selected) return;

      if(selected.value === q.answer) {
        gameStatus.textContent = `Pemain ${player} benar! Lanjut...`;
        questionBox.classList.add("hidden");
        isQuestionActive = false;
        rollDiceBtn.disabled = false;
        resolve(true);
      } else {
        gameStatus.textContent = `Pemain ${player} salah, mundur 3 langkah!`;
        questionBox.classList.add("hidden");
        isQuestionActive = false;
        // mundur 3 langkah
        positions[player] = Math.max(1, positions[player] - 3);
        updatePlayerPosition(player);
        rollDiceBtn.disabled = false;
        resolve(false);
      }
    };
  });
}

// Inisialisasi game
function init() {
  createBoard();
  updatePlayerPosition(1);
  updatePlayerPosition(2);
  currentPlayer = 1;
  gameStatus.textContent = "Giliran Pemain 1";

  rollDiceBtn.onclick = rollDice;
}

init();

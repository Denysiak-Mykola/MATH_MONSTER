/* ---------- SOCKET ---------- */
const socket = io();

/* ---------- РЕСУРСИ ---------- */
const enemies = [
    "slime.png", "skeleton.jpg", "lava_monster.png", "ghost.png", "bat.png",
    "spider_keeper.png", "golem.png", "imp.png", "zombie.png", "shadow.png"
];

const bossEnemyFiles = [
    "boss1.png",
    "boss2.png",
    "boss3.png",
    "boss4.png",
    "boss5.png"
];

const hitSound = new Audio("/static/sounds/hit.wav");

/* ---------- РІВЕНЬ З URL ---------- */
let urlParams = new URLSearchParams(window.location.search);
let level = Number(urlParams.get("level")) || 1;

/* ---------- ГРАВЕЦЬ ---------- */
let playerClass = localStorage.getItem("class") || "warrior";

const classes = {
    warrior: { hp: 120, damage: 25, mana: 100 },
    mage: { hp: 80, damage: 35, mana: 150 },
    archer: { hp: 100, damage: 30, mana: 120 }
};

let maxHP = classes[playerClass].hp;
let playerHP = maxHP;
let playerDamage = classes[playerClass].damage;
let playerMana = classes[playerClass].mana;

let gold = 0;
let wave = 1;
const MAX_WAVES = 10;

/* ---------- ВОРОГ ---------- */
let bossHP;
let bossMaxHP;

/* ---------- ГРА ---------- */
let combo = 0;
let correctAnswer;

/* ---------- DOM ---------- */
const answerInput = document.getElementById("answer");
const comboBar = document.getElementById("comboBar");

answerInput.addEventListener("keydown", e => {
    if (e.key === "Enter") submitAnswer();
});

/* ---------- ГЕНЕРАЦІЯ ПИТАНЬ ---------- */
function generateQuestion() {
    let max = level * 6 + 5;
    let a = Math.floor(Math.random() * max) + 1;
    let b = Math.floor(Math.random() * max) + 1;

    if (Math.random() < 0.5) {
        correctAnswer = a * b;
        return `${a} × ${b}`;
    } else {
        let result = a * b;
        correctAnswer = result / a;
        return `${result} ÷ ${a}`;
    }
}

/* ---------- СПАУН ---------- */
function spawnEnemy() {

    // 🎨 фон
    let arenaBg = "/static/images/forest_bg.jpg";
    if (level === 2) arenaBg = "/static/images/dungeon_bg.jpg";
    if (level === 3) arenaBg = "/static/images/castle_bg.jpg";
    if (level === 4) arenaBg = "/static/images/hell_bg.jpg";
    if (level === 5) arenaBg = "/static/images/dragon_cavern_bg.jpg";

    document.getElementById("gameBody").style.backgroundImage = `url('${arenaBg}')`;

    // 👾 ворог
    if (wave < MAX_WAVES) {
        let enemy = enemies[Math.floor(Math.random() * enemies.length)];
        document.getElementById("bossImg").src = "/static/enemies/" + enemy;
        bossMaxHP = 100 + level * 20;
    } else {
        let bossFile = bossEnemyFiles[level - 1] || bossEnemyFiles[0];
        document.getElementById("bossImg").src = "/static/bosses/" + bossFile;
        bossMaxHP = 500 + level * 100;
    }

    bossHP = bossMaxHP;
    updateBars();
}

/* ---------- UI ---------- */
function updateBars() {
    if (playerHP > maxHP) playerHP = maxHP;
    if (playerHP < 0) playerHP = 0;
    if (bossHP < 0) bossHP = 0;

    document.getElementById("playerHP").style.width = (playerHP / maxHP) * 100 + "%";
    document.getElementById("bossHP").style.width = (bossHP / bossMaxHP) * 100 + "%";
}

function updateCombo() {
    comboBar.style.width = Math.min(combo * 20, 100) + "%";
}

function nextQuestion() {
    document.getElementById("question").innerText = generateQuestion();
    answerInput.value = "";
    answerInput.focus();
}

/* ---------- АТАКА ---------- */
function submitAnswer() {

    let value = Number(answerInput.value);

    if (value === correctAnswer) {

        hitSound.currentTime = 0;
        hitSound.play();

        let damage = playerDamage + combo * 5;

        // 🔥 SOCKET
        socket.emit("attack", { damage: damage });

        bossHP -= damage;
        combo++;

        gold += 10;
        document.getElementById("gold").innerText = gold;

        updateCombo();
        updateBars();

        if (bossHP <= 0) enemyKilled();

    } else {

        playerHP -= 10;
        combo = 0;

        updateCombo();
        updateBars();

        if (playerHP <= 0) gameOver();
    }

    nextQuestion();
}

/* ---------- ВБИВСТВО ---------- */
function enemyKilled() {

    if (wave < MAX_WAVES) {

        wave++;
        document.getElementById("wave").innerText = wave;
        spawnEnemy();

    } else {

        alert("🏆 Level Completed!");

        level++;
        wave = 1;

        document.getElementById("wave").innerText = wave;
        document.getElementById("level").innerText = `Level: ${level}`;

        saveGame(); // 💾 сейв

        spawnEnemy();
    }
}

/* ---------- SAVE ---------- */
function saveGame() {
    fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            level: level,
            gold: gold
        })
    });
}

/* ---------- GAME OVER ---------- */
function gameOver() {
    alert("💀 Game Over");
    location.reload();
}

/* ---------- СТАРТ ---------- */
spawnEnemy();
nextQuestion();
updateBars();
updateCombo();

document.getElementById("playerDamage").innerText = playerDamage;
document.getElementById("playerMaxHP").innerText = maxHP;
document.getElementById("playerMana") &&
    (document.getElementById("playerMana").innerText = playerMana);
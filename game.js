const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const character = {
  x: 400,
  y: 300,
  width: 90,
  height: 90,
  speed: 200,
};

const fireball = {
  width: 50,
  height: 50,
  speed: 300,
};

let isMoving = false;
let targetX, targetY;
let lastTimestamp;
let fireballs = [];
let characterImage, fireballImage, backgroundImage;

const mapWidth = 2000;
const mapHeight = 1500;

let cameraX = 0;
let cameraY = 0;

let score = 0;
let isGameOver = false;
let gameStartTime;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function updateCamera() {
  cameraX = character.x - canvas.width / 2;
  cameraY = character.y - canvas.height / 2;
  cameraX = Math.max(0, Math.min(cameraX, mapWidth - canvas.width));
  cameraY = Math.max(0, Math.min(cameraY, mapHeight - canvas.height));
}

function drawBackground() {
  if (backgroundImage) {
    ctx.drawImage(backgroundImage, -cameraX, -cameraY, mapWidth, mapHeight);
  } else {
    console.error("Background image not loaded");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  character.x = Math.min(character.x, mapWidth - character.width);
  character.y = Math.min(character.y, mapHeight - character.height);
  updateCamera();
}

async function init() {
  try {
    characterImage = await loadImage("hero.png");
    fireballImage = await loadImage("fireball.png");
    backgroundImage = await loadImage("midlane-bg.jpg");
    resizeCanvas();
    startFireballSpawner();
    resetGame();
    requestAnimationFrame(gameLoop);
  } catch (error) {
    console.error("Error loading images:", error);
  }
}

function resetGame() {
  score = 0;
  isGameOver = false;
  gameStartTime = Date.now();
  character.x = canvas.width / 2;
  character.y = canvas.height / 2;
  fireballs = [];
}

function gameLoop(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isGameOver) {
    if (isMoving) {
      moveCharacter(deltaTime);
    }

    updateCamera();
    drawBackground();
    moveFireballs(deltaTime);
    checkCollisions();

    ctx.drawImage(
      characterImage,
      character.x - cameraX,
      character.y - cameraY,
      character.width,
      character.height
    );
    drawFireballs();

    updateScore();
    drawScore();
  } else {
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

function moveCharacter(deltaTime) {
  if (!isMoving) return;

  const deltaX = targetX - character.x;
  const deltaY = targetY - character.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance < 1) {
    character.x = targetX;
    character.y = targetY;
    isMoving = false;
    return;
  }

  const moveDistance = character.speed * deltaTime;
  const ratio = moveDistance / distance;

  character.x += deltaX * ratio;
  character.y += deltaY * ratio;

  character.x = Math.max(0, Math.min(character.x, mapWidth - character.width));
  character.y = Math.max(
    0,
    Math.min(character.y, mapHeight - character.height)
  );
}

function createFireball() {
  const side = Math.floor(Math.random() * 4);
  let x, y, dx, dy;

  switch (side) {
    case 0: // top
      x = Math.random() * mapWidth;
      y = -fireball.height;
      dx = Math.random() * 2 - 1;
      dy = Math.random() * 0.5 + 0.5;
      break;
    case 1: // right
      x = mapWidth + fireball.width;
      y = Math.random() * mapHeight;
      dx = -(Math.random() * 0.5 + 0.5);
      dy = Math.random() * 2 - 1;
      break;
    case 2: // bottom
      x = Math.random() * mapWidth;
      y = mapHeight + fireball.height;
      dx = Math.random() * 2 - 1;
      dy = -(Math.random() * 0.5 + 0.5);
      break;
    case 3: // left
      x = -fireball.width;
      y = Math.random() * mapHeight;
      dx = Math.random() * 0.5 + 0.5;
      dy = Math.random() * 2 - 1;
      break;
  }

  const length = Math.sqrt(dx * dx + dy * dy);
  dx /= length;
  dy /= length;

  fireballs.push({ x, y, dx, dy });
}

function moveFireballs(deltaTime) {
  fireballs = fireballs.filter((fb) => {
    fb.x += fb.dx * fireball.speed * deltaTime;
    fb.y += fb.dy * fireball.speed * deltaTime;

    return !(
      fb.x < -fireball.width ||
      fb.x > mapWidth + fireball.width ||
      fb.y < -fireball.height ||
      fb.y > mapHeight + fireball.height
    );
  });
}

function drawFireballs() {
  fireballs.forEach((fb) => {
    ctx.drawImage(
      fireballImage,
      fb.x - cameraX,
      fb.y - cameraY,
      fireball.width,
      fireball.height
    );
  });
}

function startFireballSpawner() {
  setInterval(createFireball, 2000);
}

function checkCollisions() {
  for (let fb of fireballs) {
    if (
      character.x < fb.x + fireball.width &&
      character.x + character.width > fb.x &&
      character.y < fb.y + fireball.height &&
      character.y + character.height > fb.y
    ) {
      isGameOver = true;
      break;
    }
  }
}

function updateScore() {
  const currentTime = Date.now();
  score = Math.floor((currentTime - gameStartTime) / 1000);
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 50);

  ctx.font = "24px Arial";
  ctx.fillText(
    `Final Score: ${score}`,
    canvas.width / 2,
    canvas.height / 2 + 50
  );

  ctx.font = "18px Arial";
  ctx.fillText(
    "Press SPACE to restart",
    canvas.width / 2,
    canvas.height / 2 + 100
  );
}

function handleKeyPress(event) {
  if (event.key.toLowerCase() === "s") {
    isMoving = false;
    targetX = character.x;
    targetY = character.y;
  } else if (event.code === "Space" && isGameOver) {
    resetGame();
  }
}

canvas.addEventListener("contextmenu", function (event) {
  event.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  targetX = (event.clientX - rect.left) * scaleX + cameraX;
  targetY = (event.clientY - rect.top) * scaleY + cameraY;

  isMoving = true;
});

window.addEventListener("resize", resizeCanvas);
document.addEventListener("keydown", handleKeyPress);

init();

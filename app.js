(() => {
  const playerEl = document.getElementById('player');
  const obstaclesContainer = document.getElementById('obstacles');
  const playArea = document.getElementById('playArea');
  const scoreEl = document.getElementById('score');
  const gameOverPanel = document.getElementById('gameOverPanel');
  const finalScoreEl = document.getElementById('finalScore');
  const playAgainBtn = document.getElementById('playAgainBtn');

  let gameRunning = false;
  let gameOver = false;
  let lastFrameTime = null;
  let spawnTimer = 0;
  let spawnInterval = 1400;
  let obstacles = [];
  let score = 0;

  const GROUND_Y = 70;
  let player = { x: 60, y: 0, vy: 0, width: 64, height: 64, onGround: true };
  const GRAVITY = -2200;
  const JUMP_VELOCITY = 750;

  function applyPlayerTransform() {
    playerEl.style.bottom = `${GROUND_Y + player.y}px`;
  }

  function spawnObstacle() {
    const el = document.createElement('div');
    el.className = 'obstacle cactus';
    const width = 26 + Math.round(Math.random() * 22);
    const height = 44 + Math.round(Math.random() * 36);
    el.style.width = width + 'px';
    el.style.height = height + 'px';
    const startX = playArea.clientWidth + 40;
    el.style.transform = `translateX(${startX}px)`;
    obstaclesContainer.appendChild(el);
    const speedBase = 240;
    const speed = speedBase + Math.min(700, Math.floor(score / 5) * 8);
    const obst = { el, x: startX, width, height, speed };
    obstacles.push(obst);
    spawnInterval = Math.max(650, 1400 - Math.floor(score / 10) * 40);
  }

  function checkCollisionRect(a, b) {
    return !(a.left > b.right || a.right < b.left || a.top > b.bottom || a.bottom < b.top);
  }

  function detectCollisions() {
    const pRect = playerEl.getBoundingClientRect();
    const areaRect = playArea.getBoundingClientRect();
    const p = { left: pRect.left - areaRect.left, top: pRect.top - areaRect.top, right: pRect.right - areaRect.left, bottom: pRect.bottom - areaRect.top };
    for (let obst of obstacles) {
      const oRect = obst.el.getBoundingClientRect();
      const o = { left: oRect.left - areaRect.left + 6, top: oRect.top - areaRect.top + 4, right: oRect.right - areaRect.left - 6, bottom: oRect.bottom - areaRect.top - 2 };
      const pShrink = { left: p.left + 6, top: p.top + 6, right: p.right - 6, bottom: p.bottom - 4 };
      if (checkCollisionRect(pShrink, o)) return true;
    }
    return false;
  }

  function gameLoop(now) {
    if (!lastFrameTime) lastFrameTime = now;
    const dt = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    if (!player.onGround || player.vy !== 0) {
      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.y < 0) {
        player.y = 0;
        player.vy = 0;
        player.onGround = true;
      } else {
        player.onGround = false;
      }
      applyPlayerTransform();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed * dt;
      if (o.x + o.width < -60) {
        o.el.remove();
        obstacles.splice(i, 1);
      } else {
        o.el.style.transform = `translateX(${o.x}px)`;
      }
    }

    spawnTimer += dt * 1000;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      if (Math.random() > 0.12) spawnObstacle();
    }

    score += Math.floor(dt * 60);
    scoreEl.textContent = `Score: ${score}`;

    if (detectCollisions()) return endGame();
    if (!gameOver) requestAnimationFrame(gameLoop);
  }

  function startGame() {
    gameOver = false;
    gameRunning = true;
    lastFrameTime = null;
    spawnTimer = 0;
    spawnInterval = 1400;
    obstacles.forEach(o => o.el.remove());
    obstacles = [];
    score = 0;
    player.y = 0;
    player.vy = 0;
    player.onGround = true;
    applyPlayerTransform();
    gameOverPanel.classList.add('hidden');
    gameOverPanel.setAttribute('aria-hidden', 'true');
    scoreEl.textContent = `Score: ${score}`;
    playArea.focus();
    setTimeout(spawnObstacle, 800);
    requestAnimationFrame(gameLoop);
  }

  function endGame() {
    gameRunning = false;
    gameOver = true;
    finalScoreEl.textContent = score;
    gameOverPanel.classList.remove('hidden');
    gameOverPanel.setAttribute('aria-hidden', 'false');
  }

  function doJump() {
    if (gameOver) {
      startGame();
      return;
    }
    if (!player.onGround) return;
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (!gameRunning) startGame();
      doJump();
    } else if (e.code === 'KeyR') {
      if (gameOver) startGame();
    }
  });

  playArea.addEventListener('pointerdown', () => {
    if (!gameRunning) startGame();
    doJump();
  });

  playAgainBtn.addEventListener('click', (e) => {
    e.preventDefault();
    startGame();
  });

  window.addEventListener('load', () => {
    playArea.setAttribute('tabindex', '0');
    playArea.focus();
    scoreEl.title = 'Press Space or tap to start and jump';
  });

  window.DinoGame = { startGame, endGame, getState: () => ({ score, obstaclesCount: obstacles.length, gameOver, gameRunning }) };
})();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  levelSelect: document.getElementById("levelSelect"),
  startButton: document.getElementById("startButton"),
  restartButton: document.getElementById("restartButton"),
  nextLevelButton: document.getElementById("nextLevelButton"),
  soundButton: document.getElementById("soundButton"),
  jumpButton: document.getElementById("jumpButton"),
  menuButton: document.getElementById("menuButton"),
  closeMenuButton: document.getElementById("closeMenuButton"),
  menuPanel: document.getElementById("menuPanel"),
  hudLevel: document.getElementById("hudLevel"),
  hudStars: document.getElementById("hudStars"),
  hudBest: document.getElementById("hudBest"),
  hudStatus: document.getElementById("hudStatus"),
  hudProgress: document.getElementById("hudProgress"),
  previewTitle: document.getElementById("previewTitle"),
  previewText: document.getElementById("previewText"),
  previewBadge: document.getElementById("previewBadge"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayText: document.getElementById("overlayText")
};

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const CAMERA_OFFSET = 240;
const STORAGE_KEY = "mototjos-best-stars-v2";

const levelDefinitions = [
  {
    name: "Jordbane",
    short: "Blid start",
    intro: "Rolige bakker, små hop og masser af plads til at lande.",
    palette: {
      skyTop: "#7fd3ff",
      skyBottom: "#fff0ae",
      groundTop: "#9d6a34",
      groundBottom: "#6d4322",
      accent: "#f2c261",
      glow: "#ffd979"
    },
    length: 3400,
    finishPadding: 240,
    bumps: [
      { x: 340, w: 220, h: 24 },
      { x: 820, w: 280, h: 34 },
      { x: 1280, w: 220, h: 26 },
      { x: 1830, w: 260, h: 30 },
      { x: 2460, w: 260, h: 22 },
      { x: 2900, w: 240, h: 28 }
    ],
    ramps: [
      { x: 610, w: 150, h: 48 },
      { x: 1560, w: 160, h: 52 },
      { x: 2680, w: 170, h: 44 }
    ],
    obstacles: [
      { x: 980, w: 46, h: 34, kind: "stub" },
      { x: 2050, w: 52, h: 38, kind: "crate" },
      { x: 3140, w: 40, h: 30, kind: "stub" }
    ],
    stars: [
      { x: 510, y: 470 },
      { x: 745, y: 410 },
      { x: 1420, y: 455 },
      { x: 1680, y: 385 },
      { x: 2320, y: 450 },
      { x: 2980, y: 420 }
    ],
    scenery: "dirt"
  },
  {
    name: "Skovbane",
    short: "Bladglad tur",
    intro: "Træer, bløde ramper og stjerner mellem de grønne farver.",
    palette: {
      skyTop: "#92ecbc",
      skyBottom: "#dff8e8",
      groundTop: "#56a15b",
      groundBottom: "#32683e",
      accent: "#7dc97b",
      glow: "#b5f09d"
    },
    length: 3500,
    finishPadding: 260,
    bumps: [
      { x: 420, w: 260, h: 22 },
      { x: 980, w: 240, h: 30 },
      { x: 1570, w: 280, h: 28 },
      { x: 2180, w: 260, h: 26 },
      { x: 2860, w: 260, h: 22 }
    ],
    ramps: [
      { x: 760, w: 140, h: 42 },
      { x: 1900, w: 155, h: 40 },
      { x: 3070, w: 160, h: 40 }
    ],
    obstacles: [
      { x: 1230, w: 44, h: 28, kind: "rock" },
      { x: 2500, w: 50, h: 32, kind: "rock" },
      { x: 3290, w: 40, h: 30, kind: "rock" }
    ],
    stars: [
      { x: 390, y: 450 },
      { x: 860, y: 398 },
      { x: 1410, y: 435 },
      { x: 1990, y: 378 },
      { x: 2640, y: 430 },
      { x: 3170, y: 392 }
    ],
    scenery: "forest"
  },
  {
    name: "Solbane",
    short: "Varm finale",
    intro: "Gyldne hop, sjove farver og en ekstra glad målflag-fest.",
    palette: {
      skyTop: "#ffcb71",
      skyBottom: "#ffeec8",
      groundTop: "#f4a14f",
      groundBottom: "#cf6c30",
      accent: "#ffd36e",
      glow: "#fff0a8"
    },
    length: 3360,
    finishPadding: 260,
    bumps: [
      { x: 360, w: 220, h: 18 },
      { x: 950, w: 260, h: 22 },
      { x: 1540, w: 250, h: 20 },
      { x: 2210, w: 260, h: 24 },
      { x: 2860, w: 260, h: 20 }
    ],
    ramps: [
      { x: 690, w: 150, h: 36 },
      { x: 1740, w: 150, h: 38 },
      { x: 3000, w: 170, h: 36 }
    ],
    obstacles: [
      { x: 1180, w: 46, h: 24, kind: "toy" },
      { x: 2360, w: 48, h: 26, kind: "toy" },
      { x: 3220, w: 42, h: 26, kind: "toy" }
    ],
    stars: [
      { x: 460, y: 446 },
      { x: 810, y: 394 },
      { x: 1330, y: 432 },
      { x: 1820, y: 386 },
      { x: 2550, y: 426 },
      { x: 3090, y: 398 }
    ],
    scenery: "sun"
  }
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function makeParticle(x, y, color, forceX, forceY, size, life) {
  return { x, y, color, vx: forceX, vy: forceY, size, life, maxLife: life };
}

class AudioManager {
  constructor() {
    this.enabled = true;
    this.musicLoaded = false;
    this.musicPath = "assets/mototjos-song.mp3";
    this.music = null;
    this.setupMusic();
  }

  setupMusic() {
    const audio = new Audio(this.musicPath);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.4;

    audio.addEventListener("canplaythrough", () => {
      this.musicLoaded = true;
    });

    audio.addEventListener("error", () => {
      this.musicLoaded = false;
    });

    this.music = audio;
  }

  async startMusic() {
    if (!this.enabled || !this.musicLoaded || !this.music) {
      return false;
    }

    try {
      await this.music.play();
      return true;
    } catch (error) {
      return false;
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }
}

class Level {
  constructor(definition) {
    this.definition = definition;
    this.name = definition.name;
    this.length = definition.length;
    this.finishX = definition.length - definition.finishPadding;
    this.stars = definition.stars.map((star) => ({ ...star, collected: false }));
  }

  getGroundY(x) {
    let y = 560;

    this.definition.bumps.forEach((bump) => {
      if (x >= bump.x && x <= bump.x + bump.w) {
        const progress = (x - bump.x) / bump.w;
        y -= Math.sin(progress * Math.PI) * bump.h;
      }
    });

    this.definition.ramps.forEach((ramp) => {
      if (x >= ramp.x && x <= ramp.x + ramp.w) {
        const progress = (x - ramp.x) / ramp.w;
        y -= progress * ramp.h;
      } else if (x > ramp.x + ramp.w && x <= ramp.x + ramp.w + 170) {
        const progress = (x - (ramp.x + ramp.w)) / 170;
        y -= (1 - progress) * ramp.h;
      }
    });

    return y;
  }
}

class PlayerBike {
  constructor(level) {
    this.reset(level);
  }

  reset(level) {
    this.x = 110;
    this.y = level.getGroundY(this.x);
    this.vx = 120;
    this.vy = 0;
    this.targetSpeed = 170;
    this.jumpPower = 360;
    this.gravity = 780;
    this.onGround = true;
    this.hitTimer = 0;
    this.jumpBuffer = 0;
  }

  queueJump() {
    this.jumpBuffer = 0.14;
  }

  update(delta, level) {
    this.targetSpeed = lerp(this.targetSpeed, 188, delta * 0.22);
    this.vx = lerp(this.vx, this.targetSpeed, delta * 1.8);

    if (this.hitTimer > 0) {
      this.hitTimer -= delta;
    }

    if (this.jumpBuffer > 0) {
      this.jumpBuffer -= delta;
    }

    if (this.jumpBuffer > 0 && this.onGround) {
      this.vy = -this.jumpPower;
      this.onGround = false;
      this.jumpBuffer = 0;
    }

    this.vy += this.gravity * delta;
    this.x += this.vx * delta;
    this.y += this.vy * delta;

    const groundY = level.getGroundY(this.x);
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  }

  softenHit() {
    this.vx = Math.max(88, this.vx - 46);
    this.x = Math.max(90, this.x - 18);
    if (this.onGround) {
      this.vy = -110;
      this.onGround = false;
    }
    this.hitTimer = 0.5;
  }
}

class Game {
  constructor() {
    this.audio = new AudioManager();
    this.bestScores = this.loadBestScores();
    this.levelIndex = 0;
    this.level = new Level(levelDefinitions[this.levelIndex]);
    this.player = new PlayerBike(this.level);
    this.state = "ready";
    this.score = 0;
    this.lastTime = 0;
    this.cameraX = 0;
    this.statusTimer = 0;
    this.particles = [];
    this.clouds = this.createClouds();
    this.menuOpen = false;
    this.resizeCanvas();
    this.bindEvents();
    this.syncPreview();
    this.updateSoundButton();
    this.updateUI();
    requestAnimationFrame((time) => this.loop(time));
  }

  loadBestScores() {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  saveBestScores() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bestScores));
  }

  createClouds() {
    return Array.from({ length: 6 }, (_, index) => ({
      x: 120 + index * 220,
      y: 90 + (index % 3) * 38,
      speed: 10 + index * 2,
      size: 38 + (index % 2) * 12
    }));
  }

  bindEvents() {
    ui.startButton.addEventListener("click", () => this.startGame());
    ui.restartButton.addEventListener("click", () => this.restartLevel());
    ui.nextLevelButton.addEventListener("click", () => this.nextLevel());
    ui.soundButton.addEventListener("click", () => this.toggleSound());
    ui.menuButton.addEventListener("click", () => this.toggleMenu());
    ui.closeMenuButton.addEventListener("click", () => this.closeMenu());
    ui.levelSelect.addEventListener("change", () => this.selectLevel(Number(ui.levelSelect.value)));
    ui.jumpButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.handleJump();
    });

    window.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        this.handleJump();
      }
    });

    window.addEventListener("resize", () => this.resizeCanvas());
    document.body.addEventListener("touchmove", (event) => {
      if (this.state === "playing" || this.menuOpen) {
        event.preventDefault();
      }
    }, { passive: false });
  }

  resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = GAME_WIDTH * ratio;
    canvas.height = GAME_HEIGHT * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  selectLevel(index) {
    this.levelIndex = clamp(index, 0, levelDefinitions.length - 1);
    this.loadLevel(false);
  }

  loadLevel(autoStart) {
    this.level = new Level(levelDefinitions[this.levelIndex]);
    this.player.reset(this.level);
    this.score = 0;
    this.cameraX = 0;
    this.particles = [];
    this.state = autoStart ? "playing" : "ready";
    this.syncPreview();
    if (autoStart) {
      this.closeMenu();
    }
    this.setOverlay(autoStart ? "" : "Arthur er klar!", autoStart ? "" : this.level.definition.intro);
    this.setStatus(autoStart ? "Arthur kører!" : "Vælg bane og tryk på Start.", 2.6);
    ui.levelSelect.value = String(this.levelIndex);
    this.updateUI();
  }

  async startGame() {
    this.loadLevel(true);
    this.hideOverlay();
    await this.audio.startMusic();
    this.setStatus(`Arthur kører på ${this.level.name.toLowerCase()}!`, 2.5);
    this.updateSoundButton();
  }

  async restartLevel() {
    this.loadLevel(true);
    this.hideOverlay();
    await this.audio.startMusic();
    this.setStatus("Arthur prøver igen!", 2);
    this.updateSoundButton();
  }

  nextLevel() {
    this.levelIndex = (this.levelIndex + 1) % levelDefinitions.length;
    this.restartLevel();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    ui.menuPanel.classList.toggle("menu-open", this.menuOpen);
  }

  closeMenu() {
    this.menuOpen = false;
    ui.menuPanel.classList.remove("menu-open");
  }

  toggleSound() {
    this.audio.toggle();
    this.updateSoundButton();
  }

  updateSoundButton() {
    let label = "Lyd: Til";
    if (!this.audio.enabled) {
      label = "Lyd: Fra";
    } else if (!this.audio.musicLoaded) {
      label = "Lyd: Klar";
    }
    ui.soundButton.textContent = label;
    ui.soundButton.setAttribute("aria-pressed", String(this.audio.enabled));
  }

  handleJump() {
    if (this.state === "won") {
      this.nextLevel();
      return;
    }

    if (this.state === "ready") {
      this.startGame();
      return;
    }

    if (this.state !== "playing") {
      return;
    }

    this.player.queueJump();
    this.spawnDust(this.player.x - 12, this.player.y - 6, "#ffffff", 4);
    this.setStatus("Hop hop!", 1.1);
  }

  syncPreview() {
    const definition = levelDefinitions[this.levelIndex];
    ui.previewTitle.textContent = definition.name;
    ui.previewText.textContent = definition.intro;
    ui.previewBadge.textContent = definition.short;
  }

  setOverlay(title, text) {
    ui.overlayTitle.textContent = title;
    ui.overlayText.textContent = text;
    if (title || text) {
      ui.overlay.classList.add("show");
    } else {
      ui.overlay.classList.remove("show");
    }
  }

  hideOverlay() {
    ui.overlay.classList.remove("show");
  }

  setStatus(text, duration = 1.7) {
    ui.hudStatus.textContent = text;
    this.statusTimer = duration;
  }

  spawnDust(x, y, color, amount) {
    for (let i = 0; i < amount; i += 1) {
      this.particles.push(makeParticle(
        x,
        y,
        color,
        -30 + Math.random() * 60,
        -20 - Math.random() * 35,
        6 + Math.random() * 8,
        0.4 + Math.random() * 0.3
      ));
    }
  }

  spawnStarBurst(x, y) {
    const colors = ["#ffe36b", "#ffffff", "#ffb84d"];
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10;
      const speed = 40 + Math.random() * 55;
      this.particles.push(makeParticle(
        x,
        y,
        colors[i % colors.length],
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 10,
        6 + Math.random() * 4,
        0.7 + Math.random() * 0.2
      ));
    }
  }

  spawnWinBurst() {
    const colors = ["#ff5a63", "#ffe36b", "#4ccf6a", "#44b6ff"];
    for (let i = 0; i < 32; i += 1) {
      this.particles.push(makeParticle(
        this.player.x,
        180 + Math.random() * 220,
        colors[i % colors.length],
        -150 + Math.random() * 300,
        -60 + Math.random() * 120,
        8 + Math.random() * 6,
        1.2 + Math.random() * 0.8
      ));
    }
  }

  collectStars() {
    this.level.stars.forEach((star) => {
      if (star.collected) {
        return;
      }

      const dx = star.x - this.player.x;
      const dy = star.y - (this.player.y - 70);
      if (Math.hypot(dx, dy) < 62) {
        star.collected = true;
        this.score += 1;
        this.spawnStarBurst(star.x, star.y);
        this.setStatus("Arthur fandt en stjerne!", 1.8);
      }
    });
  }

  checkObstacles() {
    this.level.definition.obstacles.forEach((obstacle) => {
      const obstacleGround = this.level.getGroundY(obstacle.x + obstacle.w * 0.5);
      const obstacleTop = obstacleGround - obstacle.h;
      const withinX = this.player.x + 30 > obstacle.x && this.player.x - 35 < obstacle.x + obstacle.w;
      const lowEnough = this.player.y > obstacleTop - 20;

      if (withinX && lowEnough && this.player.hitTimer <= 0) {
        this.player.softenHit();
        this.spawnDust(this.player.x, this.player.y - 12, "#ffd6c8", 8);
        this.setStatus("Ups! Arthur trillede videre.", 1.8);
      }
    });
  }

  checkFinish() {
    if (this.player.x < this.level.finishX || this.state === "won") {
      return;
    }

    this.state = "won";
    this.player.vx = 0;
    this.player.targetSpeed = 0;
    this.spawnWinBurst();

    const currentBest = this.bestScores[this.level.name] || 0;
    if (this.score > currentBest) {
      this.bestScores[this.level.name] = this.score;
      this.saveBestScores();
    }

    this.setOverlay("Arthur vandt!", `Flot kørt! Stjerner: ${this.score}`);
    this.setStatus("Arthur kom i mål!", 3);
    this.updateUI();
  }

  updateParticles(delta) {
    this.particles = this.particles.filter((particle) => {
      particle.life -= delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += 80 * delta;
      return particle.life > 0;
    });
  }

  updateClouds(delta) {
    this.clouds.forEach((cloud) => {
      cloud.x += cloud.speed * delta;
      if (cloud.x > GAME_WIDTH + 100) {
        cloud.x = -120;
      }
    });
  }

  update(delta) {
    this.updateParticles(delta);
    this.updateClouds(delta);

    if (this.statusTimer > 0) {
      this.statusTimer -= delta;
      if (this.statusTimer <= 0 && this.state === "playing") {
        this.setStatus("Arthur kører fint!", 999);
      }
    }

    if (this.state !== "playing") {
      return;
    }

    this.player.update(delta, this.level);
    this.collectStars();
    this.checkObstacles();
    this.checkFinish();

    const desiredCamera = this.player.x - CAMERA_OFFSET;
    this.cameraX = clamp(desiredCamera, 0, this.level.length - GAME_WIDTH + 160);
    this.updateUI();
  }

  updateUI() {
    const totalStars = this.level.stars.length;
    const progress = Math.round(clamp(this.player.x / this.level.finishX, 0, 1) * 100);
    ui.hudLevel.textContent = this.level.name;
    ui.hudStars.textContent = `${this.score}/${totalStars}`;
    ui.hudBest.textContent = String(this.bestScores[this.level.name] || 0);
    ui.hudProgress.textContent = `${progress}%`;
  }

  drawBackground() {
    const palette = this.level.definition.palette;
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(1, palette.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.drawClouds();

    if (this.level.definition.scenery === "forest") {
      this.drawForestBackdrop();
    } else if (this.level.definition.scenery === "sun") {
      this.drawSunBackdrop();
    } else {
      this.drawDirtBackdrop();
    }
  }

  drawClouds() {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    this.clouds.forEach((cloud) => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.8, cloud.y + 8, cloud.size * 0.8, 0, Math.PI * 2);
      ctx.arc(cloud.x - cloud.size * 0.75, cloud.y + 10, cloud.size * 0.65, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawDirtBackdrop() {
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(1040, 120, 72, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(183, 123, 65, 0.34)";
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(170 + i * 250, 470, 140 + (i % 2) * 25, Math.PI, Math.PI * 2);
      ctx.fill();
    }
  }

  drawForestBackdrop() {
    ctx.fillStyle = "rgba(255,255,255,0.24)";
    ctx.beginPath();
    ctx.arc(1010, 120, 74, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 11; i += 1) {
      const x = ((50 + i * 125 - this.cameraX * 0.22) % 1450) - 100;
      ctx.fillStyle = "rgba(83, 149, 94, 0.34)";
      ctx.fillRect(x, 290, 18, 180);
      ctx.beginPath();
      ctx.arc(x + 9, 290, 56, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSunBackdrop() {
    ctx.fillStyle = "rgba(255,224,110,0.92)";
    ctx.beginPath();
    ctx.arc(1040, 120, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 6;
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10;
      ctx.beginPath();
      ctx.moveTo(1040 + Math.cos(angle) * 94, 120 + Math.sin(angle) * 94);
      ctx.lineTo(1040 + Math.cos(angle) * 130, 120 + Math.sin(angle) * 130);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(233,138,74,0.28)";
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.arc(150 + i * 220, 500, 120 + (i % 2) * 20, Math.PI, Math.PI * 2);
      ctx.fill();
    }
  }

  drawGround() {
    const palette = this.level.definition.palette;
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    ctx.fillStyle = palette.groundBottom;
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT);
    for (let x = 0; x <= this.level.length; x += 20) {
      ctx.lineTo(x, this.level.getGroundY(x));
    }
    ctx.lineTo(this.level.length, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = palette.groundTop;
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT);
    for (let x = 0; x <= this.level.length; x += 20) {
      ctx.lineTo(x, this.level.getGroundY(x) - 10);
    }
    ctx.lineTo(this.level.length, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = palette.glow;
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let x = 0; x <= this.level.length; x += 24) {
      const y = this.level.getGroundY(x) - 12;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    ctx.fillStyle = palette.accent;
    this.level.definition.ramps.forEach((ramp) => {
      const startY = this.level.getGroundY(ramp.x);
      const endY = this.level.getGroundY(ramp.x + ramp.w) - ramp.h;
      ctx.beginPath();
      ctx.moveTo(ramp.x, startY + 6);
      ctx.lineTo(ramp.x + ramp.w, endY + 6);
      ctx.lineTo(ramp.x + ramp.w, startY + 28);
      ctx.lineTo(ramp.x, startY + 28);
      ctx.closePath();
      ctx.fill();
    });

    this.drawFinishFlag();
    ctx.restore();
  }

  drawFinishFlag() {
    const x = this.level.finishX;
    const ground = this.level.getGroundY(x);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x, ground - 120);
    ctx.lineTo(x, ground - 10);
    ctx.stroke();

    ctx.fillStyle = "#ff5a63";
    ctx.beginPath();
    ctx.moveTo(x, ground - 118);
    ctx.lineTo(x + 80, ground - 96);
    ctx.lineTo(x, ground - 72);
    ctx.closePath();
    ctx.fill();
  }

  drawStars() {
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    this.level.stars.forEach((star) => {
      if (star.collected) {
        return;
      }

      const pulse = 1 + Math.sin(performance.now() * 0.006 + star.x * 0.01) * 0.08;
      this.drawStar(star.x, star.y, 18 * pulse);
    });

    ctx.restore();
  }

  drawStar(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ffe36b";
    ctx.strokeStyle = "#ffb62e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? size : size * 0.45;
      const angle = -Math.PI / 2 + (Math.PI / 5) * i;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawObstacles() {
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    this.level.definition.obstacles.forEach((obstacle) => {
      const ground = this.level.getGroundY(obstacle.x + obstacle.w * 0.5);
      const top = ground - obstacle.h;

      if (obstacle.kind === "rock") {
        ctx.fillStyle = "#7d8f84";
        ctx.beginPath();
        ctx.moveTo(obstacle.x, ground);
        ctx.lineTo(obstacle.x + obstacle.w * 0.25, top + 10);
        ctx.lineTo(obstacle.x + obstacle.w * 0.7, top);
        ctx.lineTo(obstacle.x + obstacle.w, ground);
        ctx.closePath();
        ctx.fill();
      } else if (obstacle.kind === "toy") {
        ctx.fillStyle = "#ff7c59";
        ctx.fillRect(obstacle.x, top, obstacle.w, obstacle.h);
        ctx.fillStyle = "#ffd36e";
        ctx.fillRect(obstacle.x + 10, top + 6, obstacle.w - 20, obstacle.h - 12);
      } else {
        ctx.fillStyle = "#80512f";
        ctx.fillRect(obstacle.x, top, obstacle.w, obstacle.h);
      }
    });

    ctx.restore();
  }

  drawPlayer() {
    const screenX = this.player.x - this.cameraX;
    const screenY = this.player.y;
    const bounce = this.player.onGround ? Math.sin(performance.now() * 0.01) * 2 : -6;

    ctx.save();
    ctx.translate(screenX, screenY + bounce);
    ctx.rotate(clamp(this.player.vy * 0.0012, -0.18, 0.18));

    ctx.fillStyle = "#1f2a44";
    ctx.beginPath();
    ctx.arc(-26, 0, 24, 0, Math.PI * 2);
    ctx.arc(28, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#f7f7f7";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-26, 0, 12, 0, Math.PI * 2);
    ctx.arc(28, 0, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#2c9e46";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.lineTo(10, -34);
    ctx.lineTo(36, -26);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5, -22);
    ctx.lineTo(24, -6);
    ctx.stroke();

    ctx.fillStyle = "#46b75c";
    ctx.fillRect(-6, -38, 40, 16);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(22, -30, 16, 8);

    ctx.strokeStyle = "#233448";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(34, -38);
    ctx.lineTo(50, -44);
    ctx.stroke();

    ctx.fillStyle = "#f7ae63";
    ctx.beginPath();
    ctx.arc(5, -70, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff5a63";
    ctx.beginPath();
    ctx.arc(5, -74, 17, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#233448";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(8, -54);
    ctx.lineTo(2, -32);
    ctx.lineTo(-4, -12);
    ctx.moveTo(8, -52);
    ctx.lineTo(24, -32);
    ctx.lineTo(30, -12);
    ctx.stroke();

    if (this.player.hitTimer > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.arc(0, -20, 64, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawParticles() {
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    this.particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawProgress() {
    const progress = clamp(this.player.x / this.level.finishX, 0, 1);
    const barX = 28;
    const barY = 24;
    const barW = 220;
    const barH = 18;

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = "#46b75c";
    ctx.fillRect(barX + 3, barY + 3, (barW - 6) * progress, barH - 6);

    ctx.fillStyle = "#163047";
    ctx.font = "bold 18px Trebuchet MS";
    ctx.fillText("Mål", barX + barW + 10, barY + 15);
  }

  render() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.drawBackground();
    this.drawGround();
    this.drawStars();
    this.drawObstacles();
    this.drawParticles();
    this.drawPlayer();
    this.drawProgress();
  }

  loop(time) {
    const delta = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    this.update(delta);
    this.render();
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }
}

new Game();

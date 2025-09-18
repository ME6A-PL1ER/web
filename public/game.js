const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const shieldsEl = document.getElementById("shields");
const startOverlay = document.getElementById("startOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const finalScore = document.getElementById("finalScore");
const bestScoreEl = document.getElementById("bestScore");
const audioToggle = document.getElementById("audioToggle");
const joystickEl = document.getElementById("joystick");
const joystickStick = joystickEl?.querySelector(".stick");
const touchFireButton = document.getElementById("touchFire");

const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;
let pixelRatio = window.devicePixelRatio || 1;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || BASE_WIDTH;
  const height = rect.height || BASE_HEIGHT;
  pixelRatio = window.devicePixelRatio || 1;
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", () => {
  resizeCanvas();
});

class SoundManager {
  constructor() {
    this.context = null;
    this.enabled = false;
  }

  async init() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn("Web Audio API is not supported in this browser.");
        return;
      }
      this.context = new AudioContext();
    }
    if (this.context && this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  async toggle() {
    if (!this.enabled) {
      await this.init();
      this.enabled = !!this.context;
      if (this.enabled && this.context.state === "suspended") {
        await this.context.resume();
      }
    } else if (this.context) {
      await this.context.suspend();
      this.enabled = false;
    }
    return this.enabled;
  }

  playLaser() {
    if (!this.enabled || !this.context) return;
    const time = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(620, time);
    osc.frequency.exponentialRampToValueAtTime(320, time + 0.2);
    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    osc.connect(gain).connect(this.context.destination);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  playExplosion() {
    if (!this.enabled || !this.context) return;
    const duration = 0.5;
    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, this.context.currentTime);
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.4, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    noise.connect(filter).connect(gain).connect(this.context.destination);
    noise.start();
    noise.stop(this.context.currentTime + duration);
  }

  playPowerup() {
    if (!this.enabled || !this.context) return;
    const time = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(420, time);
    osc.frequency.setValueAtTime(520, time + 0.12);
    osc.frequency.setValueAtTime(660, time + 0.24);
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain).connect(this.context.destination);
    osc.start(time);
    osc.stop(time + 0.32);
  }
}

const sounds = new SoundManager();

class Starfield {
  constructor(count) {
    this.stars = [];
    this.count = count;
    this.init();
  }

  init() {
    this.stars = new Array(this.count).fill(null).map(() => this.spawnStar());
  }

  spawnStar(offsetY = Math.random()) {
    const width = canvas.width / pixelRatio;
    const height = canvas.height / pixelRatio;
    return {
      x: Math.random() * width,
      y: offsetY * height,
      depth: Math.random() * 0.8 + 0.2,
      size: Math.random() * 1.6 + 0.4,
    };
  }

  update(dt) {
    const width = canvas.width / pixelRatio;
    const height = canvas.height / pixelRatio;
    for (const star of this.stars) {
      star.y += (30 + 140 * star.depth) * dt;
      if (star.y > height) {
        const replacement = this.spawnStar(0);
        star.x = replacement.x;
        star.y = replacement.y;
        star.depth = replacement.depth;
        star.size = replacement.size;
      }
    }
  }

  draw(context) {
    context.save();
    context.fillStyle = "#fff";
    for (const star of this.stars) {
      const alpha = 0.2 + star.depth * 0.8;
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}

class Particle {
  constructor(x, y, color, size, speed, life) {
    const angle = Math.random() * Math.PI * 2;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed * (Math.random() * 0.6 + 0.4);
    this.vy = Math.sin(angle) * speed * (Math.random() * 0.6 + 0.4);
    this.life = life;
    this.initialLife = life;
    this.size = size * (Math.random() * 0.6 + 0.6);
    this.color = color;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.98;
    this.vy *= 0.98;
  }

  draw(context) {
    if (this.life <= 0) return;
    context.save();
    context.globalAlpha = Math.max(this.life / this.initialLife, 0) * 0.9;
    const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, "rgba(2, 10, 20, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

class NovaPulse {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.maxRadius = 420;
    this.expandSpeed = 520;
    this.life = 0.65;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;
    this.radius += this.expandSpeed * dt;
    this.life -= dt;
    if (this.radius > this.maxRadius || this.life <= 0) {
      this.alive = false;
    }
  }

  draw(context) {
    if (!this.alive) return;
    const progress = Math.min(this.radius / this.maxRadius, 1);
    context.save();
    context.globalAlpha = 0.65 * (1 - progress);
    const gradient = context.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
    gradient.addColorStop(0, "rgba(108, 240, 255, 0.8)");
    gradient.addColorStop(0.5, "rgba(108, 240, 255, 0.3)");
    gradient.addColorStop(1, "rgba(108, 240, 255, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

class Projectile {
  constructor(x, y, vx, vy, radius = 5, friendly = true) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.friendly = friendly;
    this.life = 2.5;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(context) {
    context.save();
    if (this.friendly) {
      const gradient = context.createLinearGradient(this.x, this.y, this.x, this.y + this.radius * 3);
      gradient.addColorStop(0, "rgba(108, 240, 255, 1)");
      gradient.addColorStop(1, "rgba(108, 240, 255, 0)");
      context.fillStyle = gradient;
    } else {
      context.fillStyle = "rgba(255, 120, 140, 0.9)";
    }
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

class Hazard {
  constructor(type, x, y, size, speed, level) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.level = level;
    this.rotation = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 1.6;
    this.health = type === "asteroid" ? Math.max(1, Math.round(size / 18)) : 2 + level * 0.4;
    this.fireCooldown = Math.random() * 2 + 1.2;
    this.vx = (Math.random() - 0.5) * 60;
    if (this.type === "asteroid") {
      const points = 8 + Math.floor(Math.random() * 4);
      this.shape = [];
      for (let i = 0; i < points; i += 1) {
        const angle = (i / points) * Math.PI * 2;
        const radius = this.size * (0.6 + Math.random() * 0.35);
        this.shape.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
      }
    } else {
      this.shape = null;
    }
  }

  get radius() {
    return this.type === "asteroid" ? this.size * 0.55 : this.size * 0.5;
  }

  update(dt) {
    this.y += this.speed * dt;
    this.rotation += this.spin * dt;
    if (this.type === "asteroid") {
      this.x += Math.sin(this.rotation * 0.7) * dt * 45 + this.vx * dt;
    } else {
      this.x += this.vx * dt;
      this.fireCooldown -= dt;
      if (this.fireCooldown < 0) {
        this.fireCooldown = 1.8 + Math.random() * 1.6;
        return new Projectile(this.x, this.y + this.size * 0.3, 0, 220 + Math.random() * 40, 6, false);
      }
    }
    return null;
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.rotation);
    if (this.type === "asteroid") {
      context.fillStyle = "#384459";
      context.strokeStyle = "rgba(108, 240, 255, 0.25)";
      context.lineWidth = 2;
      context.beginPath();
      if (this.shape && this.shape.length) {
        context.moveTo(this.shape[0].x, this.shape[0].y);
        for (let i = 1; i < this.shape.length; i += 1) {
          context.lineTo(this.shape[i].x, this.shape[i].y);
        }
      }
      context.closePath();
      context.fill();
      context.stroke();
    } else {
      const gradient = context.createLinearGradient(0, -this.size * 0.5, 0, this.size);
      gradient.addColorStop(0, "rgba(255, 160, 180, 0.9)");
      gradient.addColorStop(1, "rgba(220, 70, 110, 0.9)");
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(0, -this.size * 0.6);
      context.lineTo(this.size * 0.5, this.size * 0.4);
      context.quadraticCurveTo(0, this.size * 0.8, -this.size * 0.5, this.size * 0.4);
      context.closePath();
      context.fill();
      context.beginPath();
      context.fillStyle = "rgba(255,255,255,0.4)";
      context.ellipse(0, 0, this.size * 0.3, this.size * 0.18, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 16;
    this.speed = 110;
    this.pulse = 0;
  }

  update(dt) {
    this.y += this.speed * dt;
    this.pulse += dt * 3;
  }

  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    const gradient = context.createRadialGradient(0, 0, 4, 0, 0, this.radius);
    if (this.type === "shield") {
      gradient.addColorStop(0, "rgba(108, 240, 255, 0.9)");
      gradient.addColorStop(1, "rgba(108, 240, 255, 0.1)");
    } else {
      gradient.addColorStop(0, "rgba(255, 220, 150, 0.9)");
      gradient.addColorStop(1, "rgba(255, 190, 90, 0.1)");
    }
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, this.radius * (1 + Math.sin(this.pulse) * 0.08), 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(12, 20, 30, 0.65)";
    context.font = "bold 14px 'Oxanium', 'Space Grotesk', sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(this.type === "shield" ? "+" : "★", 0, 1);
    context.restore();
  }
}

class Player {
  constructor() {
    this.reset();
  }

  reset() {
    const width = canvas.width / pixelRatio;
    const height = canvas.height / pixelRatio;
    this.x = width / 2;
    this.y = height - 90;
    this.radius = 24;
    this.speed = 320;
    this.boostSpeed = 540;
    this.energy = 100;
    this.maxEnergy = 100;
    this.energyRegen = 18;
    this.energyDrain = 60;
    this.fireCooldown = 0.18;
    this.fireTimer = 0;
    this.invulnerableTimer = 0;
    this.combo = 0;
    this.novaCharge = 0;
  }

  update(dt, input) {
    const width = canvas.width / pixelRatio;
    const height = canvas.height / pixelRatio;
    const dirX = input.horizontal;
    const dirY = input.vertical;
    const magnitude = Math.hypot(dirX, dirY);
    const boosting = input.boost && this.energy > 0;
    const maxSpeed = boosting ? this.boostSpeed : this.speed;
    const normalizedX = magnitude ? dirX / magnitude : 0;
    const normalizedY = magnitude ? dirY / magnitude : 0;
    this.x += normalizedX * maxSpeed * dt;
    this.y += normalizedY * maxSpeed * dt;
    this.x = Math.max(this.radius + 4, Math.min(width - this.radius - 4, this.x));
    this.y = Math.max(this.radius + 4, Math.min(height - this.radius - 4, this.y));

    this.fireTimer = Math.max(0, this.fireTimer - dt);

    if (boosting) {
      this.energy = Math.max(0, this.energy - this.energyDrain * dt);
    } else {
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen * dt);
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
  }

  canFire() {
    return this.fireTimer <= 0;
  }

  fire() {
    this.fireTimer = this.fireCooldown;
    return new Projectile(this.x, this.y - this.radius * 0.8, 0, -540, 5, true);
  }

  fireNova() {
    this.novaCharge = 0;
    this.combo = 0;
    return new NovaPulse(this.x, this.y - this.radius * 0.3);
  }

  draw(context) {
    context.save();
    if (this.invulnerableTimer > 0) {
      const blink = 0.6 + Math.abs(Math.sin(performance.now() / 80)) * 0.35;
      context.globalAlpha = blink;
    }
    context.translate(this.x, this.y);
    const flicker = Math.sin(performance.now() / 50) * 0.05;
    context.scale(1 + flicker, 1 - flicker);

    // Hull
    context.beginPath();
    context.moveTo(0, -this.radius * 1.4);
    context.lineTo(this.radius * 0.8, this.radius * 1.1);
    context.quadraticCurveTo(0, this.radius * 1.5, -this.radius * 0.8, this.radius * 1.1);
    context.closePath();
    const hullGradient = context.createLinearGradient(0, -this.radius * 1.4, 0, this.radius * 1.3);
    hullGradient.addColorStop(0, "rgba(108, 240, 255, 0.95)");
    hullGradient.addColorStop(1, "rgba(36, 120, 180, 0.95)");
    context.fillStyle = hullGradient;
    context.fill();
    context.strokeStyle = "rgba(8, 28, 42, 0.8)";
    context.lineWidth = 2;
    context.stroke();

    // Canopy
    context.fillStyle = "rgba(255, 255, 255, 0.7)";
    context.beginPath();
    context.ellipse(0, -this.radius * 0.25, this.radius * 0.5, this.radius * 0.65, 0, 0, Math.PI * 2);
    context.fill();

    // Thruster glow
    context.globalAlpha = 0.7 + Math.random() * 0.2;
    context.fillStyle = "rgba(108, 240, 255, 0.8)";
    context.beginPath();
    context.ellipse(0, this.radius * 1.2, this.radius * 0.3, this.radius * 0.8, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

const inputState = {
  horizontal: 0,
  vertical: 0,
  boost: false,
  boostKey: false,
  fire: false,
  firePressed: false,
};

const keyBindings = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
};

const keysDown = new Set();

function updateDirectionalInput() {
  const left = keysDown.has("left") ? 1 : 0;
  const right = keysDown.has("right") ? 1 : 0;
  const up = keysDown.has("up") ? 1 : 0;
  const down = keysDown.has("down") ? 1 : 0;
  inputState.horizontal = right - left + joystickState.x;
  inputState.vertical = down - up + joystickState.y;
  const magnitude = Math.hypot(inputState.horizontal, inputState.vertical);
  if (magnitude > 1) {
    inputState.horizontal /= magnitude;
    inputState.vertical /= magnitude;
  }
  const joystickMagnitude = Math.hypot(joystickState.x, joystickState.y);
  inputState.boost = inputState.boostKey || joystickMagnitude > 0.75;
}

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Spacebar"].includes(event.key)) {
    event.preventDefault();
  }
  const lower = event.key.toLowerCase();
  if (keyBindings[event.key]) {
    keysDown.add(keyBindings[event.key]);
  } else if (keyBindings[lower]) {
    keysDown.add(keyBindings[lower]);
  }
  if (event.key === " " || event.code === "Space") {
    inputState.fire = true;
    inputState.firePressed = true;
  }
  if (event.key === "Shift" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
    inputState.boostKey = true;
  }
  updateDirectionalInput();
});

document.addEventListener("keyup", (event) => {
  const lower = event.key.toLowerCase();
  if (keyBindings[event.key]) {
    keysDown.delete(keyBindings[event.key]);
  } else if (keyBindings[lower]) {
    keysDown.delete(keyBindings[lower]);
  }
  if (event.key === " " || event.code === "Space") {
    inputState.fire = false;
  }
  if (event.key === "Shift" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
    inputState.boostKey = false;
  }
  updateDirectionalInput();
});

const joystickState = { active: false, x: 0, y: 0 };

if (joystickEl) {
  joystickEl.addEventListener("pointerdown", (event) => {
    joystickState.active = true;
    joystickEl.setPointerCapture(event.pointerId);
    moveStick(event);
  });

  joystickEl.addEventListener("pointermove", (event) => {
    if (!joystickState.active) return;
    moveStick(event);
  });

  const resetStick = (event) => {
    if (joystickState.active) {
      joystickState.active = false;
      joystickState.x = 0;
      joystickState.y = 0;
      updateStickVisual(0, 0);
      joystickEl.releasePointerCapture?.(event.pointerId);
      updateDirectionalInput();
    }
  };

  joystickEl.addEventListener("pointerup", resetStick);
  joystickEl.addEventListener("pointercancel", resetStick);
}

function moveStick(event) {
  if (!joystickEl) return;
  const rect = joystickEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const maxDistance = rect.width / 2;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const distance = Math.min(Math.hypot(dx, dy), maxDistance);
  const angle = Math.atan2(dy, dx);
  const normalizedX = Math.cos(angle) * (distance / maxDistance);
  const normalizedY = Math.sin(angle) * (distance / maxDistance);
  joystickState.x = normalizedX;
  joystickState.y = normalizedY;
  updateStickVisual(normalizedX, normalizedY);
  updateDirectionalInput();
}

function updateStickVisual(x, y) {
  if (!joystickStick) return;
  const maxShift = (joystickEl.clientWidth - joystickStick.clientWidth) / 2;
  joystickStick.style.transform = `translate(calc(-50% + ${x * maxShift}px), calc(-50% + ${y * maxShift}px))`;
}

if (touchFireButton) {
  touchFireButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    inputState.fire = true;
    inputState.firePressed = true;
  });
  const release = () => {
    inputState.fire = false;
  };
  touchFireButton.addEventListener("pointerup", release);
  touchFireButton.addEventListener("pointercancel", release);
  touchFireButton.addEventListener("pointerleave", release);
}

const starfield = new Starfield(180);
const player = new Player();
const projectiles = [];
const enemyProjectiles = [];
const hazards = [];
const particles = [];
const powerUps = [];
const novas = [];

const gameState = {
  status: "start",
  score: 0,
  bestScore: 0,
  shields: 100,
  level: 1,
  spawnTimer: 0,
  hazardInterval: 1.6,
  elapsed: 0,
};

try {
  const stored = localStorage.getItem("starbound-best");
  if (stored) {
    gameState.bestScore = Number(stored) || 0;
  }
} catch (error) {
  console.warn("Unable to read best score", error);
}

function resetGame() {
  player.reset();
  projectiles.length = 0;
  enemyProjectiles.length = 0;
  hazards.length = 0;
  particles.length = 0;
  powerUps.length = 0;
  novas.length = 0;
  gameState.score = 0;
  gameState.level = 1;
  gameState.shields = 100;
  gameState.spawnTimer = 0.5;
  gameState.hazardInterval = 1.5;
  gameState.elapsed = 0;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = Math.floor(gameState.score).toLocaleString();
  levelEl.textContent = gameState.level;
  shieldsEl.textContent = `${Math.max(0, Math.round(gameState.shields))}%`;
  if (gameState.shields < 30) {
    shieldsEl.style.color = "var(--warning)";
  } else {
    shieldsEl.style.color = "var(--accent)";
  }
}

function spawnHazard() {
  const width = canvas.width / pixelRatio;
  const typeRoll = Math.random();
  const level = gameState.level;
  const spawnX = Math.random() * (width - 120) + 60;
  if (level >= 2 && typeRoll > 0.65) {
    const size = 48 + Math.random() * 30;
    const speed = 90 + Math.random() * 60 + level * 18;
    hazards.push(new Hazard("raider", spawnX, -size, size, speed, level));
  } else {
    const size = 26 + Math.random() * 36;
    const speed = 80 + Math.random() * 120 + level * 12;
    hazards.push(new Hazard("asteroid", spawnX, -size, size, speed, level));
  }
}

function destroyHazard(index, multiplier = 1) {
  const hazard = hazards[index];
  const baseScore = hazard.type === "asteroid" ? 45 : 120;
  const gained = baseScore * multiplier;
  gameState.score += gained;
  player.combo += 1;
  player.novaCharge = Math.min(100, player.novaCharge + (hazard.type === "asteroid" ? 12 : 20));
  spawnExplosion(hazard.x, hazard.y, hazard.type);
  if (Math.random() < (hazard.type === "asteroid" ? 0.1 : 0.22)) {
    const powerType = Math.random() < 0.6 ? "shield" : "nova";
    powerUps.push(new PowerUp(hazard.x, hazard.y, powerType));
  }
  hazards.splice(index, 1);
  sounds.playExplosion();
}

function spawnExplosion(x, y, type) {
  const count = type === "asteroid" ? 16 : 22;
  for (let i = 0; i < count; i += 1) {
    const color = type === "asteroid" ? "rgba(108, 240, 255, 0.8)" : "rgba(255, 120, 140, 0.9)";
    const size = type === "asteroid" ? 6 : 8;
    const speed = 120 + Math.random() * 180;
    const life = 0.6 + Math.random() * 0.4;
    particles.push(new Particle(x, y, color, size, speed, life));
  }
}

function damagePlayer(amount) {
  if (player.invulnerableTimer > 0) return;
  gameState.shields -= amount;
  player.invulnerableTimer = 1.2;
  player.combo = 0;
  player.novaCharge = Math.max(0, player.novaCharge - 25);
  if (gameState.shields <= 0) {
    triggerGameOver();
  }
  updateHud();
}

function triggerGameOver() {
  gameState.status = "gameover";
  finalScore.textContent = `Final score: ${Math.floor(gameState.score).toLocaleString()} pts`;
  if (gameState.score > gameState.bestScore) {
    gameState.bestScore = Math.floor(gameState.score);
    try {
      localStorage.setItem("starbound-best", gameState.bestScore.toString());
    } catch (error) {
      console.warn("Unable to persist best score", error);
    }
  }
  bestScoreEl.textContent = `Best score: ${gameState.bestScore.toLocaleString()} pts`;
  gameOverOverlay.hidden = false;
}

function startGame() {
  startOverlay.hidden = true;
  gameOverOverlay.hidden = true;
  resetGame();
  gameState.status = "running";
  gameState.lastTimestamp = performance.now();
}

startButton?.addEventListener("click", () => {
  startGame();
});

restartButton?.addEventListener("click", () => {
  startGame();
});

audioToggle?.addEventListener("click", async () => {
  const enabled = await sounds.toggle();
  audioToggle.textContent = enabled ? "🔊 Sound On" : "🔇 Sound Off";
  audioToggle.setAttribute("aria-pressed", enabled ? "true" : "false");
});

canvas.addEventListener("click", () => {
  if (gameState.status === "start") {
    startGame();
  }
});

canvas.addEventListener("contextmenu", (event) => event.preventDefault());

function updateGame(delta) {
  const width = canvas.width / pixelRatio;
  const height = canvas.height / pixelRatio;
  gameState.elapsed += delta;
  gameState.spawnTimer -= delta;
  starfield.update(delta);
  player.update(delta, inputState);

  if (gameState.spawnTimer <= 0) {
    spawnHazard();
    const interval = Math.max(0.55, gameState.hazardInterval - gameState.level * 0.08);
    gameState.spawnTimer = interval + Math.random() * 0.6;
  }

  if (gameState.score > gameState.level * 550) {
    gameState.level += 1;
    gameState.hazardInterval = Math.max(0.7, gameState.hazardInterval * 0.92);
  }

  if (inputState.fire && player.canFire()) {
    if (player.novaCharge >= 100 && inputState.firePressed) {
      const nova = player.fireNova();
      novas.push(nova);
      sounds.playExplosion();
    } else {
      const shot = player.fire();
      projectiles.push(shot);
      sounds.playLaser();
    }
  }
  inputState.firePressed = false;

  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = projectiles[i];
    projectile.update(delta);
    if (
      projectile.life <= 0 ||
      projectile.y < -40 ||
      projectile.x < -40 ||
      projectile.x > width + 40
    ) {
      projectiles.splice(i, 1);
    }
  }

  for (let i = enemyProjectiles.length - 1; i >= 0; i -= 1) {
    const projectile = enemyProjectiles[i];
    projectile.update(delta);
    if (projectile.life <= 0 || projectile.y > height + 40) {
      enemyProjectiles.splice(i, 1);
      continue;
    }
    const dist = Math.hypot(projectile.x - player.x, projectile.y - player.y);
    if (dist < projectile.radius + player.radius) {
      enemyProjectiles.splice(i, 1);
      damagePlayer(30);
    }
  }

  for (let i = hazards.length - 1; i >= 0; i -= 1) {
    const hazard = hazards[i];
    const newProjectile = hazard.update(delta);
    if (newProjectile) {
      enemyProjectiles.push(newProjectile);
    }

    if (hazard.y > height + hazard.size * 2) {
      hazards.splice(i, 1);
      continue;
    }

    const hitDist = hazard.radius + player.radius;
    if (Math.hypot(hazard.x - player.x, hazard.y - player.y) < hitDist) {
      hazards.splice(i, 1);
      damagePlayer(hazard.type === "asteroid" ? 35 : 45);
      spawnExplosion(hazard.x, hazard.y, hazard.type);
      continue;
    }
  }

  for (let i = powerUps.length - 1; i >= 0; i -= 1) {
    const orb = powerUps[i];
    orb.update(delta);
    if (orb.y > height + 40) {
      powerUps.splice(i, 1);
      continue;
    }
    if (Math.hypot(orb.x - player.x, orb.y - player.y) < orb.radius + player.radius) {
      powerUps.splice(i, 1);
      if (orb.type === "shield") {
        gameState.shields = Math.min(120, gameState.shields + 25);
      } else {
        player.novaCharge = 100;
      }
      sounds.playPowerup();
      updateHud();
    }
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.update(delta);
    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }

  for (let i = novas.length - 1; i >= 0; i -= 1) {
    const nova = novas[i];
    nova.update(delta);
    if (!nova.alive) {
      novas.splice(i, 1);
      continue;
    }
    for (let j = hazards.length - 1; j >= 0; j -= 1) {
      const hazard = hazards[j];
      const distance = Math.hypot(hazard.x - nova.x, hazard.y - nova.y);
      if (distance < nova.radius + hazard.radius) {
        destroyHazard(j, 1.5);
      }
    }
  }

  for (let i = hazards.length - 1; i >= 0; i -= 1) {
    const hazard = hazards[i];
    for (let j = projectiles.length - 1; j >= 0; j -= 1) {
      const projectile = projectiles[j];
      const distance = Math.hypot(hazard.x - projectile.x, hazard.y - projectile.y);
      if (distance < hazard.radius + projectile.radius) {
        projectiles.splice(j, 1);
        hazard.health -= 1;
        if (hazard.health <= 0) {
          destroyHazard(i, 1 + player.combo * 0.05);
        }
        break;
      }
    }
  }

  if (gameState.shields < 0) gameState.shields = 0;

  updateHud();
}

function renderGame() {
  const width = canvas.width / pixelRatio;
  const height = canvas.height / pixelRatio;
  ctx.clearRect(0, 0, width, height);

  starfield.draw(ctx);

  ctx.save();
  ctx.globalAlpha = 0.85 + Math.sin(gameState.elapsed * 0.4) * 0.05;
  ctx.strokeStyle = "rgba(108, 240, 255, 0.12)";
  ctx.lineWidth = 1;
  const gridSpacing = 64;
  for (let x = gridSpacing / 2; x < width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = gridSpacing / 2; y < height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  for (const power of powerUps) {
    power.draw(ctx);
  }

  for (const hazard of hazards) {
    hazard.draw(ctx);
  }

  for (const projectile of projectiles) {
    projectile.draw(ctx);
  }
  for (const projectile of enemyProjectiles) {
    projectile.draw(ctx);
  }

  for (const particle of particles) {
    particle.draw(ctx);
  }

  for (const nova of novas) {
    nova.draw(ctx);
  }

  player.draw(ctx);

  drawMeters(ctx);
}

function drawMeters(context) {
  const width = canvas.width / pixelRatio;
  context.save();
  const shieldWidth = Math.min(1, Math.max(0, gameState.shields / 120));
  const novaWidth = Math.min(1, Math.max(0, player.novaCharge / 100));
  const energyWidth = Math.min(1, Math.max(0, player.energy / player.maxEnergy));
  const baseX = Math.max(16, width - 200);
  const baseY = 40;

  const drawBar = (label, value, color, offsetY) => {
    context.save();
    context.translate(baseX, baseY + offsetY);
    context.fillStyle = "rgba(2, 12, 24, 0.55)";
    context.fillRect(0, 0, 160, 12);
    const gradient = context.createLinearGradient(0, 0, 160, 0);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(10, 40, 60, 0.4)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 160 * value, 12);
    if (value >= 0.999) {
      context.strokeStyle = color;
      context.lineWidth = 1.4;
      context.shadowColor = color;
      context.shadowBlur = 8;
      context.strokeRect(-1, -1, 162, 14);
    }
    context.fillStyle = "rgba(232, 247, 255, 0.7)";
    context.font = "10px 'Oxanium', 'Space Grotesk', sans-serif";
    context.textBaseline = "bottom";
    context.fillText(label, 0, -2);
    context.restore();
  };

  drawBar("SHIELDS", shieldWidth, "rgba(108, 240, 255, 0.9)", 0);
  drawBar("NOVA", novaWidth, "rgba(255, 220, 150, 0.9)", 24);
  drawBar("ENERGY", energyWidth, "rgba(120, 160, 255, 0.9)", 48);
  context.restore();
}

function gameLoop(timestamp) {
  if (typeof gameState.lastTimestamp !== "number") {
    gameState.lastTimestamp = timestamp;
  }
  const delta = Math.min((timestamp - gameState.lastTimestamp) / 1000, 0.1);
  gameState.lastTimestamp = timestamp;

  if (gameState.status === "running") {
    updateGame(delta);
    renderGame();
  } else if (gameState.status === "start") {
    starfield.update(delta * 0.5);
    renderGame();
  } else if (gameState.status === "gameover") {
    renderGame();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

updateHud();
renderGame();

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: { preload, create, update }
};

let player, goblins, bullets, xpOrbs;
let cursors, keys, shootKey, ultiKey;
let ui = {};
let killCount = 0, xp = 0, ultiReady = false;
let lastShot = 0;

const game = new Phaser.Game(config);

function preload() {
  // Спрайтшит мага и гоблина: 4 направления × 4 кадра, кадр 64×64
  this.load.spritesheet('mage', 'assets/sprites/mage_walk.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('goblin', 'assets/sprites/goblin_walk.png', { frameWidth: 64, frameHeight: 64 });
}

function create() {
  // Фон — простая сетка
  const g = this.add.graphics();
  g.fillStyle(0x0b0c10,1); g.fillRect(0,0,800,600);
  g.lineStyle(1,0x242a36,1);
  for (let x=0; x<800; x+=32) g.lineBetween(x,0,x,600);
  for (let y=0; y<600; y+=32) g.lineBetween(0,y,800,y);

  // ---------- АНИМАЦИИ ----------
  makeWalkAnims(this, 'mage',  'walk-');
  makeIdleAnims(this, 'mage',  'idle-');
  makeWalkAnims(this, 'goblin','g-walk-');
  makeIdleAnims(this, 'goblin','g-idle-');

  // ---------- ИГРОК ----------
  player = this.physics.add.sprite(400, 300, 'mage', 0);
  player.setCollideWorldBounds(true);
  player.dir = 'down';
  player.maxHp = 100;
  player.hp = player.maxHp;

  // ---------- ГРУППЫ ----------
  goblins = this.physics.add.group();
  bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, runChildUpdate: true });
  xpOrbs = this.physics.add.group();

  // Спавн стартовых гоблинов
  for (let i = 0; i < 5; i++) spawnGoblin.call(this);

  // Управление
  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys('W,A,S,D');
  shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  ultiKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

  // Оверлап/столкновения
  this.physics.add.overlap(player, goblins, onPlayerTouchGoblin, null, this);
  this.physics.add.overlap(bullets, goblins, onBulletHitGoblin, null, this);
  this.physics.add.overlap(player, xpOrbs, onPickupXP, null, this);

  // ---------- UI ----------
  buildUI.call(this);

  // Таймер периодического спавна гоблинов
  this.time.addEvent({ delay: 3000, loop: true, callback: () => spawnGoblin.call(this) });
}

function update(time, delta) {
  // ----- ДВИЖЕНИЕ И АНИМАЦИЯ ИГРОКА -----
  const speed = 160;
  let vx = 0, vy = 0;
  const left  = cursors.left.isDown  || keys.A.isDown;
  const right = cursors.right.isDown || keys.D.isDown;
  const up    = cursors.up.isDown    || keys.W.isDown;
  const down  = cursors.down.isDown  || keys.S.isDown;

  if (left)  vx -= speed;
  if (right) vx += speed;
  if (up)    vy -= speed;
  if (down)  vy += speed;

  if (vx && vy) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; }
  player.setVelocity(vx, vy);

  let moving = vx !== 0 || vy !== 0;
  if (moving) {
    if (Math.abs(vx) > Math.abs(vy)) player.dir = vx < 0 ? 'left' : 'right';
    else player.dir = vy < 0 ? 'up' : 'down';
    player.anims.play('walk-' + player.dir, true);
  } else {
    player.anims.play('idle-' + player.dir, true);
  }

  // ----- СТРЕЛЬБА -----
  if (Phaser.Input.Keyboard.JustDown(shootKey) || (shootKey.isDown && time > lastShot + 300)) {
    shoot.call(this, player.dir);
    lastShot = time;
  }

  // ----- ИИ ГОБЛИНОВ -----
  goblins.children.iterate(g => {
    if (!g || !g.active) return;
    const dx = player.x - g.x, dy = player.y - g.y;
    const dist = Math.hypot(dx, dy);
    const stopDist = 40, chaseSpeed = 90;
    if (dist > stopDist) {
      const ux = dx / dist, uy = dy / dist;
      g.setVelocity(ux * chaseSpeed, uy * chaseSpeed);
      if (Math.abs(dx) > Math.abs(dy)) g.dir = dx < 0 ? 'left' : 'right';
      else g.dir = dy < 0 ? 'up' : 'down';
      g.anims.play('g-walk-' + g.dir, true);
    } else {
      g.setVelocity(0, 0);
      g.anims.play('g-idle-' + g.dir, true);
    }
    // Обновить мини HP-бар
    updateGoblinHpBar(g);
  });

  // ----- УЛЬТА -----
  if (ultiReady && Phaser.Input.Keyboard.JustDown(ultiKey)) {
    castMeteorShower.call(this);
    ultiReady = false;
    killCount = 0; // Сбрасываем счётчик убийств для следующей ульты
  }

  // ----- UI обновление -----
  drawPlayerHpBar();
  drawUltiHint();
}

/* ============================== HELPERS ============================== */

function makeWalkAnims(scene, key, prefix) {
  // Строки по порядку: down(0..3), left(4..7), right(8..11), up(12..15)
  scene.anims.create({ key: prefix + 'down',  frames: scene.anims.generateFrameNumbers(key, { start: 0,  end: 3  }), frameRate: 10, repeat: -1 });
  scene.anims.create({ key: prefix + 'left',  frames: scene.anims.generateFrameNumbers(key, { start: 4,  end: 7  }), frameRate: 10, repeat: -1 });
  scene.anims.create({ key: prefix + 'right', frames: scene.anims.generateFrameNumbers(key, { start: 8,  end: 11 }), frameRate: 10, repeat: -1 });
  scene.anims.create({ key: prefix + 'up',    frames: scene.anims.generateFrameNumbers(key, { start: 12, end: 15 }), frameRate: 10, repeat: -1 });
}
function makeIdleAnims(scene, key, prefix) {
  scene.anims.create({ key: prefix + 'down',  frames: [{ key, frame: 0  }] });
  scene.anims.create({ key: prefix + 'left',  frames: [{ key, frame: 4  }] });
  scene.anims.create({ key: prefix + 'right', frames: [{ key, frame: 8  }] });
  scene.anims.create({ key: prefix + 'up',    frames: [{ key, frame: 12 }] });
}

function spawnGoblin() {
  const x = Phaser.Math.Between(40, 760);
  const y = Phaser.Math.Between(40, 560);
  const g = goblins.create(x, y, 'goblin', 0);
  g.setCollideWorldBounds(true);
  g.dir = 'down';
  g.maxHp = 30;
  g.hp = g.maxHp;
  // Мини-бар: графика + фон
  g.hpBg = this.add.graphics().setDepth(10);
  g.hpFg = this.add.graphics().setDepth(11);
  updateGoblinHpBar(g);
}

function updateGoblinHpBar(g) {
  const width = 28, height = 4;
  const x = g.x - width/2, y = g.y - 40;
  const p = Phaser.Math.Clamp(g.hp / g.maxHp, 0, 1);
  g.hpBg.clear().fillStyle(0x4a2323, 1).fillRect(x, y, width, height);
  g.hpFg.clear().fillStyle(0x7ee787, 1).fillRect(x+1, y+1, (width-2)*p, height-2);
}

function onBulletHitGoblin(bullet, g) {
  bullet.destroy();
  g.hp -= 12;
  if (g.hp <= 0) {
    killCount++;
    dropXP.call(this, g.x, g.y);
    // Убираем минибары
    g.hpBg.destroy(); g.hpFg.destroy();
    g.destroy();
    if (killCount >= 3) ultiReady = true;
  } else {
    updateGoblinHpBar(g);
  }
}

function onPlayerTouchGoblin(player, g) {
  // Лёгкий контактный урон и отбрасывание
  const dx = player.x - g.x, dy = player.y - g.y;
  const dist = Math.max(1, Math.hypot(dx, dy));
  player.setVelocity((dx/dist)*200, (dy/dist)*200);
  damagePlayer(8);
}

function damagePlayer(amount) {
  player.hp = Phaser.Math.Clamp(player.hp - amount, 0, player.maxHp);
  if (player.hp <= 0) {
    // Респавн/рестарт
    player.hp = player.maxHp;
    player.setPosition(400, 300);
  }
}

function dropXP(x, y) {
  const orb = xpOrbs.create(x, y, null);
  orb.setCircle(6);
  orb.body.setOffset(-6, -6);
  orb.setData('type', 'xp');

  // Визуал через Graphics как текстуру
  const g = this.add.graphics();
  g.fillStyle(0xf2cc60, 1).fillCircle(6, 6, 6);
  g.lineStyle(2, 0xb89634, 1).strokeCircle(6, 6, 6);
  const key = 'xp_' + Phaser.Math.RND.uuid();
  g.generateTexture(key, 12, 12);
  g.destroy();
  orb.setTexture(key);
  orb.setDepth(2);

  // Разлёт
  const a = Math.random() * Math.PI * 2;
  orb.setVelocity(Math.cos(a)*100, Math.sin(a)*100);
  orb.setDrag(120);
}

function onPickupXP(player, orb) {
  if (orb.getData('type') === 'xp') {
    xp++;
    orb.destroy();
  }
}

function shoot(dir) {
  const scene = this;
  const b = bullets.get(player.x, player.y, null);
  if (!b) return;
  // Синяя сфера
  const g = scene.add.graphics();
  g.fillStyle(0x64b5ff, 1).fillCircle(6, 6, 6);
  g.lineStyle(2, 0x9cd0ff, 1).strokeCircle(6, 6, 6);
  const key = 'bullet_' + Phaser.Math.RND.uuid();
  g.generateTexture(key, 12, 12);
  g.destroy();
  b.setTexture(key);
  b.setCircle(6); b.body.setOffset(-6, -6);

  const speed = 320;
  let vx=0, vy=0;
  if (dir === 'left')  vx = -speed;
  if (dir === 'right') vx =  speed;
  if (dir === 'up')    vy = -speed;
  if (dir === 'down')  vy =  speed;

  b.setVelocity(vx, vy);
  b.setDepth(2);
  b.life = 900; // мс
  b.update = function(_, dt) {
    this.life -= dt;
    if (this.life <= 0) this.destroy();
  }
}

function castMeteorShower() {
  const scene = this;
  const meteors = 12;
  for (let i=0; i<meteors; i++) {
    scene.time.delayedCall(80*i, () => spawnMeteor.call(scene));
  }
}

function spawnMeteor() {
  const scene = this;
  const x = Phaser.Math.Between(40, 760);
  const startY = -40;
  const endY = Phaser.Math.Between(200, 560);

  // Визуал метеора
  const g = scene.add.graphics();
  g.fillStyle(0xff6b6b, 1).fillCircle(10, 10, 10);
  g.lineStyle(2, 0xff9a9a, 1).strokeCircle(10, 10, 10);
  const key = 'meteor_' + Phaser.Math.RND.uuid();
  g.generateTexture(key, 20, 20);
  g.destroy();

  const m = scene.physics.add.image(x, startY, key).setDepth(3);
  m.setVelocity(0, 420);
  m.setData('dmg', 30);

  // След (простая полоска)
  const trail = scene.add.rectangle(x, startY-30, 3, 40, 0xff9a9a, 0.6).setDepth(2);
  scene.tweens.add({ targets: trail, y: endY, duration: 800, onComplete: () => trail.destroy() });

  // Проверка попаданий
  const hitHandler = () => {
    // Урон всем гоблинам рядом
    goblins.children.iterate(g => {
      if (!g || !g.active) return;
      const d = Phaser.Math.Distance.Between(m.x, m.y, g.x, g.y);
      if (d < 46) {
        g.hp -= m.getData('dmg');
        if (g.hp <= 0) {
          killCount++;
          dropXP.call(scene, g.x, g.y);
          g.hpBg.destroy(); g.hpFg.destroy();
          g.destroy();
        } else {
          updateGoblinHpBar(g);
        }
      }
    });
    // Взрыв
    const ex = scene.add.circle(m.x, m.y, 28, 0xffa74d, 0.35).setDepth(3);
    scene.tweens.add({ targets: ex, alpha: 0, scale: 1.4, duration: 250, onComplete: () => ex.destroy() });
    m.destroy();
  };

  // По достижении земли — взрыв
  scene.time.delayedCall(800, hitHandler);
}

function buildUI() {
  const scene = this;
  // Иконка мага (кадр 0)
  ui.icon = scene.add.image(70, 560, 'mage', 0).setScrollFactor(0).setScale(0.8).setDepth(1000);
  // Полоска HP
  ui.hpBg = scene.add.graphics().setScrollFactor(0).setDepth(1000);
  ui.hpFg = scene.add.graphics().setScrollFactor(0).setDepth(1001);
  // Текст: XP и убийства
  ui.text = scene.add.text(140, 545, '', { fontFamily: 'system-ui, Arial', fontSize: 14, color: '#e8e8e8' })
    .setScrollFactor(0).setDepth(1001);
  // Подсказка ульты
  ui.ulti = scene.add.text(600, 545, '', { fontFamily: 'system-ui, Arial', fontSize: 14, color: '#f2cc60' })
    .setScrollFactor(0).setDepth(1001);
  drawPlayerHpBar();
  drawUltiHint();
}

function drawPlayerHpBar() {
  const x = 110, y = 560, w = 220, h = 16;
  const p = Phaser.Math.Clamp(player.hp / player.maxHp, 0, 1);
  ui.hpBg.clear().fillStyle(0x312a2a,1).fillRoundedRect(x, y, w, h, 6).lineStyle(1, 0x000000, 0.5).strokeRoundedRect(x, y, w, h, 6);
  ui.hpFg.clear().fillStyle(0x7ee787,1).fillRoundedRect(x+2, y+2, (w-4)*p, h-4, 6);
  ui.text.setText(`HP: ${player.hp}/${player.maxHp}   XP: ${xp}   Kills: ${killCount}`);
}

function drawUltiHint() {
  ui.ulti.setText(ultiReady ? 'Ulti READY — press R' : '');
}

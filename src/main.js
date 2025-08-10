const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: { preload, create, update }
};

let player, goblin;
let cursors, keys;

const game = new Phaser.Game(config);

function preload() {
  // Герой: 4x4 кадра по 64x64
  this.load.spritesheet('mage', 'assets/sprites/mage_walk.png', {
    frameWidth: 64,
    frameHeight: 64
  });

  // Гоблин: 4x4 кадра по 64x64
  this.load.spritesheet('goblin', 'assets/sprites/goblin_walk.png', {
    frameWidth: 64,
    frameHeight: 64
  });
}

function create() {
  // Фон сеткой (просто, чтобы видеть движение)
  const g = this.add.graphics();
  g.fillStyle(0x0b0c10,1); g.fillRect(0,0,800,600);
  g.lineStyle(1,0x242a36,1);
  for (let x=0; x<800; x+=32) g.lineBetween(x,0,x,600);
  for (let y=0; y<600; y+=32) g.lineBetween(0,y,800,y);

  // Анимации мага
  this.anims.create({ key:'walk-down',  frames:this.anims.generateFrameNumbers('mage',   { start:0,  end:3  }), frameRate:10, repeat:-1 });
  this.anims.create({ key:'walk-left',  frames:this.anims.generateFrameNumbers('mage',   { start:4,  end:7  }), frameRate:10, repeat:-1 });
  this.anims.create({ key:'walk-right', frames:this.anims.generateFrameNumbers('mage',   { start:8,  end:11 }), frameRate:10, repeat:-1 });
  this.anims.create({ key:'walk-up',    frames:this.anims.generateFrameNumbers('mage',   { start:12, end:15 }), frameRate:10, repeat:-1 });

  this.anims.create({ key:'idle-down',  frames:[{ key:'mage', frame:0  }] });
  this.anims.create({ key:'idle-left',  frames:[{ key:'mage', frame:4  }] });
  this.anims.create({ key:'idle-right', frames:[{ key:'mage', frame:8  }] });
  this.anims.create({ key:'idle-up',    frames:[{ key:'mage', frame:12 }] });

  // Анимации гоблина (те же диапазоны кадров)
  this.anims.create({ key:'g-walk-down',  frames:this.anims.generateFrameNumbers('goblin',{ start:0,  end:3  }), frameRate:10, repeat:-1 });
  this.anims.create({ key:'g-walk-left',  frames:this.anims.generateFrameNumbers('goblin',{ start:4,  end:7  }), frameRate:10, repeat:-1 });
  this.anims.create({ key:'g-walk-right', frames:this.anims.generateFrameNumbers('goblin',{ start:8,  end:11 }), frameRate:10, repeat:-1 });
  this.anims.create({ key:'g-walk-up',    frames:this.anims.generateFrameNumbers('goblin',{ start:12, end:15 }), frameRate:10, repeat:-1 });

  this.anims.create({ key:'g-idle-down',  frames:[{ key:'goblin', frame:0  }] });
  this.anims.create({ key:'g-idle-left',  frames:[{ key:'goblin', frame:4  }] });
  this.anims.create({ key:'g-idle-right', frames:[{ key:'goblin', frame:8  }] });
  this.anims.create({ key:'g-idle-up',    frames:[{ key:'goblin', frame:12 }] });

  // Игрок
  player = this.physics.add.sprite(400, 300, 'mage', 0);
  player.setCollideWorldBounds(true);
  player.dir = 'down';

  // Гоблин
  goblin = this.physics.add.sprite(200, 200, 'goblin', 0);
  goblin.setCollideWorldBounds(true);
  goblin.dir = 'down';

  // Управление
  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys('W,A,S,D');

  // Небольшой круг столкновений (условная дистанция ближнего боя)
  this.physics.add.overlap(player, goblin, () => {
    // Здесь можно уменьшать HP, отталкивать и т.п.
  }, null, this);
}

function update() {
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

  // нормализация
  if (vx && vy) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; }

  player.setVelocity(vx, vy);

  let moving = vx !== 0 || vy !== 0;
  if (moving) {
    if (Math.abs(vx) > Math.abs(vy)) {
      player.dir = vx < 0 ? 'left' : 'right';
    } else {
      player.dir = vy < 0 ? 'up' : 'down';
    }
    player.anims.play('walk-' + player.dir, true);
  } else {
    player.anims.play('idle-' + player.dir, true);
  }

  // --- Простой ИИ гоблина: преследование игрока ---
  const gx = goblin.x, gy = goblin.y;
  const px = player.x, py = player.y;

  const dx = px - gx;
  const dy = py - gy;
  const dist = Math.hypot(dx, dy);
  const chaseSpeed = 90;     // скорость гоблина
  const stopDist = 38;       // дистанция остановки (радиус взаимодействия)

  if (dist > stopDist) {
    const ux = dx / dist;
    const uy = dy / dist;
    goblin.setVelocity(ux * chaseSpeed, uy * chaseSpeed);

    // Направление анимации гоблина
    if (Math.abs(dx) > Math.abs(dy)) {
      goblin.dir = dx < 0 ? 'left' : 'right';
    } else {
      goblin.dir = dy < 0 ? 'up' : 'down';
    }
    goblin.anims.play('g-walk-' + goblin.dir, true);
  } else {
    goblin.setVelocity(0, 0);
    goblin.anims.play('g-idle-' + goblin.dir, true);
  }
}

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

let player;
let cursors;
let keys;

const game = new Phaser.Game(config);

function preload() {
    // Загружаем спрайтшит (64x64 кадры, 4 направления × 4 кадра)
    this.load.spritesheet('mage', 'assets/sprites/mage_walk.png', {
        frameWidth: 64,
        frameHeight: 64
    });
}

function create() {
    // Анимации ходьбы
    this.anims.create({ key: 'walk-down',  frames: this.anims.generateFrameNumbers('mage', { start: 0,  end: 3  }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'walk-left',  frames: this.anims.generateFrameNumbers('mage', { start: 4,  end: 7  }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'walk-right', frames: this.anims.generateFrameNumbers('mage', { start: 8,  end: 11 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'walk-up',    frames: this.anims.generateFrameNumbers('mage', { start: 12, end: 15 }), frameRate: 10, repeat: -1 });

    // Idle (по одному кадру на направление)
    this.anims.create({ key: 'idle-down',  frames: [ { key: 'mage', frame: 0  } ] });
    this.anims.create({ key: 'idle-left',  frames: [ { key: 'mage', frame: 4  } ] });
    this.anims.create({ key: 'idle-right', frames: [ { key: 'mage', frame: 8  } ] });
    this.anims.create({ key: 'idle-up',    frames: [ { key: 'mage', frame: 12 } ] });

    // Игрок
    player = this.physics.add.sprite(400, 300, 'mage', 0);
    player.setCollideWorldBounds(true);
    player.dir = 'down';

    // Управление
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys('W,A,S,D');
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

    // Нормализация по диагонали
    if (vx && vy) {
        vx *= Math.SQRT1_2;
        vy *= Math.SQRT1_2;
    }

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
}

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

const game = new Phaser.Game(config);

function preload() {
    this.load.spritesheet('mage', 'assets/sprites/mage_directions_base.png', {
        frameWidth: 64,
        frameHeight: 64
    });
}

function create() {
    // Создаём анимации для 4 направлений (пока по 1 кадру, позже можно расширить)
    this.anims.create({
        key: 'down',
        frames: [{ key: 'mage', frame: 0 }],
        frameRate: 10
    });
    this.anims.create({
        key: 'up',
        frames: [{ key: 'mage', frame: 1 }],
        frameRate: 10
    });
    this.anims.create({
        key: 'left',
        frames: [{ key: 'mage', frame: 2 }],
        frameRate: 10
    });
    this.anims.create({
        key: 'right',
        frames: [{ key: 'mage', frame: 3 }],
        frameRate: 10
    });

    player = this.physics.add.sprite(400, 300, 'mage', 0);
    player.setCollideWorldBounds(true);

    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addKeys('W,A,S,D');
}

function update() {
    const speed = 150;
    let moving = false;

    if (cursors.left.isDown || this.input.keyboard.keys[65].isDown) {
        player.setVelocity(-speed, 0);
        player.anims.play('left', true);
        moving = true;
    }
    else if (cursors.right.isDown || this.input.keyboard.keys[68].isDown) {
        player.setVelocity(speed, 0);
        player.anims.play('right', true);
        moving = true;
    }
    else if (cursors.up.isDown || this.input.keyboard.keys[87].isDown) {
        player.setVelocity(0, -speed);
        player.anims.play('up', true);
        moving = true;
    }
    else if (cursors.down.isDown || this.input.keyboard.keys[83].isDown) {
        player.setVelocity(0, speed);
        player.anims.play('down', true);
        moving = true;
    }
    else {
        player.setVelocity(0, 0);
    }

    if (!moving) {
        player.anims.stop();
    }
}

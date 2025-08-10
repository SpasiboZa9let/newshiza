import { GAME_W, GAME_H, RENDER, FPS, PHYSICS, TEX, 
         GOB_SPAWN_EVERY_MS, GOB_AI_TICK_MS, PLAYER_MAX_HP, REGEN_PER_SEC } from './config.js';
import { makeWalkAnims, makeIdleAnims } from './anims.js';
import { buildUI, drawPlayerHpBar, drawUltiHint } from './ui.js';
import { spawnGoblin } from './spawn.js';
import { aiTick } from './ai.js';
import { tryShoot, onBulletHitGoblin, onPlayerTouchGoblin, castMeteorShower } from './combat.js';
import { onPickupXP } from './loot.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  preload() {
    this.load.spritesheet('mage',   'assets/sprites/mage_walk.png',   { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('goblin', 'assets/sprites/goblin_walk.png', { frameWidth: 64, frameHeight: 64 });

    const g = this.add.graphics();
    g.fillStyle(0x64b5ff, 1).fillCircle(6,6,6);
    g.lineStyle(2,0x9cd0ff,1).strokeCircle(6,6,6);
    g.generateTexture(TEX.bullet, 12,12); g.clear();

    g.fillStyle(0xf2cc60, 1).fillCircle(6,6,6);
    g.lineStyle(2,0xb89634,1).strokeCircle(6,6,6);
    g.generateTexture(TEX.xp, 12,12); g.clear();

    g.fillStyle(0xff6b6b, 1).fillCircle(10,10,10);
    g.lineStyle(2,0xff9a9a,1).strokeCircle(10,10,10);
    g.generateTexture(TEX.meteor, 20,20);
    g.destroy();
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x0b0c10,1).fillRect(0,0,GAME_W,GAME_H);
    bg.lineStyle(1,0x242a36,1);
    for (let x=0; x<GAME_W; x+=32) bg.lineBetween(x,0,x,GAME_H);
    for (let y=0; y<GAME_H; y+=32) bg.lineBetween(0,y,GAME_W,y);

    makeWalkAnims(this, 'mage', 'walk-', 8);
    makeIdleAnims(this, 'mage', 'idle-');
    makeWalkAnims(this, 'goblin', 'g-walk-', 8);
    makeIdleAnims(this, 'goblin', 'g-idle-');

    this.player = this.physics.add.sprite(GAME_W/2, GAME_H/2, 'mage', 0);
    this.player.setCollideWorldBounds(true);
    this.player.dir = 'down';
    this.player.maxHp = PLAYER_MAX_HP;
    this.player.hp = this.player.maxHp;
    this.player.invulnUntil = 0;

    this.goblins = this.physics.add.group({ maxSize: 10 });
    this.bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 120, runChildUpdate: true });
    this.xpOrbs  = this.physics.add.group({ maxSize: 120 });
    this.meteors = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 32 });

    for (let i=0;i<5;i++) spawnGoblin.call(this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.ultiKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.physics.add.overlap(this.player, this.goblins, onPlayerTouchGoblin, null, this);
    this.physics.add.overlap(this.bullets, this.goblins, onBulletHitGoblin, null, this);
    this.physics.add.overlap(this.player, this.xpOrbs,  onPickupXP, null, this);

    this.killCount = 0; this.xp = 0; this.ultiReady = false; this.lastShot = 0;

    buildUI(this);

    this.time.addEvent({ delay: GOB_SPAWN_EVERY_MS, loop: true, callback: () => spawnGoblin.call(this) });
    this.time.addEvent({ delay: GOB_AI_TICK_MS, loop: true, callback: () => aiTick.call(this) });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.scene.pause(); else this.scene.resume();
    });
  }

  update(time) {
    const speed = 160; let vx=0, vy=0;
    const L=this.cursors.left.isDown||this.keys.A.isDown, R=this.cursors.right.isDown||this.keys.D.isDown;
    const U=this.cursors.up.isDown  ||this.keys.W.isDown, D=this.cursors.down.isDown ||this.keys.S.isDown;
    if (L) vx-=speed; if (R) vx+=speed; if (U) vy-=speed; if (D) vy+=speed;
    if (vx && vy) { vx*=Math.SQRT1_2; vy*=Math.SQRT1_2; }
    this.player.setVelocity(vx,vy);

    const moving = vx || vy;
    if (moving) {
      if (Math.abs(vx) > Math.abs(vy)) this.player.dir = vx < 0 ? 'left' : 'right';
      else this.player.dir = vy < 0 ? 'up' : 'down';
      this.player.anims.play('walk-' + this.player.dir, true);
    } else {
      this.player.anims.play('idle-' + this.player.dir, true);
    }

    tryShoot.call(this, time);

    if (this.ultiReady && Phaser.Input.Keyboard.JustDown(this.ultiKey)) {
      castMeteorShower.call(this);
      this.ultiReady = false; this.killCount = 0; drawUltiHint(this);
    }

    drawPlayerHpBar(this);

    // пассивный реген
    const dt = this.game.loop.delta;
    if (this.player.hp > 0 && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + REGEN_PER_SEC * (dt/1000));
    }
  }
}

export function buildGameConfig() {
  return {
    type: Phaser.AUTO,
    width: GAME_W,
    height: GAME_H,
    render: RENDER,
    fps: FPS,
    physics: PHYSICS,
    scene: GameScene
  };
}

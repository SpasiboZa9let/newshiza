const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  render: {
    pixelArt: true,
    antialias: false,
    powerPreference: 'low-power',
    roundPixels: true,
  },
  fps: { target: 60, min: 30, forceSetTimeOut: true },
  physics: { default: 'arcade', arcade: { debug: false, fps: 60 } },
  scene: { preload, create, update }
};

let player, goblins, bullets, xpOrbs, meteors;
let cursors, keys, shootKey, ultiKey;
let ui = {};
let killCount = 0, xp = 0, ultiReady = false;
let lastShot = 0;

const MAX_GOBLINS = 12;
const GOB_SPAWN_EVERY_MS = 3500;

const TEX = { bullet:'bulletBlue', xp:'xpOrb', meteor:'meteor' };

new Phaser.Game(config);

function preload() {
  // === Spritesheets ===
  this.load.spritesheet('mage',   'assets/sprites/mage_walk.png',   { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('goblin', 'assets/sprites/goblin_walk.png', { frameWidth: 64, frameHeight: 64 });

  // === Pre-baked textures (one-time) ===
  // bullet
  let g = this.add.graphics();
  g.fillStyle(0x64b5ff, 1).fillCircle(6, 6, 6);
  g.lineStyle(2, 0x9cd0ff, 1).strokeCircle(6, 6, 6);
  g.generateTexture(TEX.bullet, 12, 12);
  g.clear();
  // xp
  g.fillStyle(0xf2cc60, 1).fillCircle(6, 6, 6);
  g.lineStyle(2, 0xb89634, 1).strokeCircle(6, 6, 6);
  g.generateTexture(TEX.xp, 12, 12);
  g.clear();
  // meteor
  g.fillStyle(0xff6b6b, 1).fillCircle(10, 10, 10);
  g.lineStyle(2, 0xff9a9a, 1).strokeCircle(10, 10, 10);
  g.generateTexture(TEX.meteor, 20, 20);
  g.destroy();
}

function create() {
  // Background grid (once)
  const bg = this.add.graphics();
  bg.fillStyle(0x0b0c10,1).fillRect(0,0,800,600);
  bg.lineStyle(1,0x242a36,1);
  for (let x=0; x<800; x+=32) bg.lineBetween(x,0,x,600);
  for (let y=0; y<600; y+=32) bg.lineBetween(0,y,800,y);

  // Anims
  makeWalkAnims(this, 'mage',  'walk-');  makeIdleAnims(this, 'mage',  'idle-');
  makeWalkAnims(this, 'goblin','g-walk-');makeIdleAnims(this, 'goblin','g-idle-');

  // Player
  player = this.physics.add.sprite(400,300,'mage',0);
  player.setCollideWorldBounds(true);
  player.dir='down'; player.maxHp=100; player.hp=player.maxHp;

  // Groups (with pooling)
  goblins = this.physics.add.group({ maxSize: MAX_GOBLINS });
  bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 120, runChildUpdate: true });
  xpOrbs  = this.physics.add.group({ maxSize: 100 });
  meteors = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 32 });

  // spawn a few
  for (let i=0;i<5;i++) spawnGoblin.call(this);

  // Input
  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys('W,A,S,D');
  shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  ultiKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

  // Collisions
  this.physics.add.overlap(player, goblins, onPlayerTouchGoblin, null, this);
  this.physics.add.overlap(bullets, goblins, onBulletHitGoblin, null, this);
  this.physics.add.overlap(player, xpOrbs, onPickupXP, null, this);

  // UI
  buildUI.call(this);

  // Controlled spawn
  this.time.addEvent({ delay: GOB_SPAWN_EVERY_MS, loop: true, callback: () => {
    if (goblins.countActive(true) < MAX_GOBLINS) spawnGoblin.call(this);
  }});
}

function update(time) {
  // movement
  const speed=160;
  let vx=0, vy=0;
  const left=cursors.left.isDown||keys.A.isDown, right=cursors.right.isDown||keys.D.isDown;
  const up=cursors.up.isDown||keys.W.isDown, down=cursors.down.isDown||keys.S.isDown;
  if (left) vx-=speed; if (right) vx+=speed; if (up) vy-=speed; if (down) vy+=speed;
  if (vx && vy){ vx*=Math.SQRT1_2; vy*=Math.SQRT1_2; }
  player.setVelocity(vx,vy);

  const moving = vx||vy;
  if (moving){
    if (Math.abs(vx)>Math.abs(vy)) player.dir = vx<0?'left':'right';
    else player.dir = vy<0?'up':'down';
    player.anims.play('walk-'+player.dir,true);
  } else {
    player.anims.play('idle-'+player.dir,true);
  }

  // shooting (300ms cooldown, hold-to-fire ok)
  if (Phaser.Input.Keyboard.JustDown(shootKey) || (shootKey.isDown && time>lastShot+300)){
    shoot.call(this, player.dir);
    lastShot = time;
  }

  // Goblin AI (staggered updates)
  let idx=0;
  goblins.children.iterate(g=>{
    if (!g || !g.active) return;
    idx++;
    // update every 3rd frame per goblin (spread by index)
    if ((this.game.loop.frame + idx) % 3 !== 0) return;

    const dx=player.x-g.x, dy=player.y-g.y, dist=Math.hypot(dx,dy);
    const stop=40, speed=90;
    if (dist>stop){
      const ux=dx/dist, uy=dy/dist;
      g.setVelocity(ux*speed, uy*speed);
      if (Math.abs(dx)>Math.abs(dy)) g.dir = dx<0?'left':'right';
      else g.dir = dy<0?'up':'down';
      g.anims.play('g-walk-'+g.dir,true);
    } else {
      g.setVelocity(0,0);
      g.anims.play('g-idle-'+g.dir,true);
    }
    // HP bar: move & scale, no redraw
    positionGoblinHpBar(g);
  });

  // Ulti
  if (ultiReady && Phaser.Input.Keyboard.JustDown(ultiKey)){
    castMeteorShower.call(this);
    ultiReady=false; killCount=0;
  }

  // UI
  drawPlayerHpBar();
  drawUltiHint();
}

/* ===== Helpers ===== */

function makeWalkAnims(scene, key, prefix){
  scene.anims.create({ key:prefix+'down',  frames:scene.anims.generateFrameNumbers(key,{start:0,end:3}),   frameRate:10, repeat:-1 });
  scene.anims.create({ key:prefix+'left',  frames:scene.anims.generateFrameNumbers(key,{start:4,end:7}),   frameRate:10, repeat:-1 });
  scene.anims.create({ key:prefix+'right', frames:scene.anims.generateFrameNumbers(key,{start:8,end:11}),  frameRate:10, repeat:-1 });
  scene.anims.create({ key:prefix+'up',    frames:scene.anims.generateFrameNumbers(key,{start:12,end:15}), frameRate:10, repeat:-1 });
}
function makeIdleAnims(scene, key, prefix){
  scene.anims.create({ key:prefix+'down',  frames:[{key,frame:0}] });
  scene.anims.create({ key:prefix+'left',  frames:[{key,frame:4}] });
  scene.anims.create({ key:prefix+'right', frames:[{key,frame:8}] });
  scene.anims.create({ key:prefix+'up',    frames:[{key,frame:12}] });
}

function spawnGoblin(){
  const x = Phaser.Math.Between(40,760), y = Phaser.Math.Between(40,560);
  const g = goblins.get(x,y,'goblin',0);
  if (!g) return;
  g.setActive(true).setVisible(true);
  g.setCollideWorldBounds(true);
  g.dir='down'; g.maxHp=30; g.hp=g.maxHp;

  // tiny hp bars (rectangles, no per-frame redraw)
  if (!g.hpBg){
    g.hpBg = this.add.rectangle(0,0,28,4,0x4a2323).setDepth(10);
    g.hpFg = this.add.rectangle(0,0,26,2,0x7ee787).setDepth(11).setOrigin(0,0.5);
  }
  positionGoblinHpBar(g);
}

function positionGoblinHpBar(g){
  const width=26;
  if (g.hpBg){ g.hpBg.setPosition(g.x, g.y-40); }
  if (g.hpFg){
    g.hpFg.setPosition(g.x - width/2, g.y-40);
    g.hpFg.scaleX = Phaser.Math.Clamp(g.hp/g.maxHp, 0, 1);
  }
}

function onBulletHitGoblin(b, g){
  b.setActive(false).setVisible(false).destroy(); // pool small; destroy ok
  g.hp -= 12;
  if (g.hp <= 0){
    killCount++;
    dropXP.call(this, g.x, g.y);
    if (g.hpBg){ g.hpBg.destroy(); g.hpBg=null; }
    if (g.hpFg){ g.hpFg.destroy(); g.hpFg=null; }
    g.destroy();
    if (killCount >= 3) ultiReady = true;
  } else {
    positionGoblinHpBar(g);
  }
}

function onPlayerTouchGoblin(p, g){
  const dx=p.x-g.x, dy=p.y-g.y, dist=Math.max(1,Math.hypot(dx,dy));
  p.setVelocity((dx/dist)*200, (dy/dist)*200);
  damagePlayer(8);
}

function damagePlayer(amount){
  player.hp = Phaser.Math.Clamp(player.hp-amount, 0, player.maxHp);
  if (player.hp<=0){
    player.hp = player.maxHp;
    player.setPosition(400,300);
  }
}

function dropXP(x,y){
  const orb = xpOrbs.get(x,y,TEX.xp);
  if (!orb) return;
  orb.setActive(true).setVisible(true);
  orb.setCircle(6); orb.body.setOffset(orb.width/2-6, orb.height/2-6);
  const a = Math.random()*Math.PI*2;
  orb.setVelocity(Math.cos(a)*100, Math.sin(a)*100).setDrag(120);
}

function onPickupXP(p, orb){
  xp++; orb.disableBody(true,true);
}

function shoot(dir){
  const b = bullets.get(player.x, player.y, TEX.bullet);
  if (!b) return;
  b.setActive(true).setVisible(true);
  b.setCircle(6); b.body.setOffset(b.width/2-6, b.height/2-6);
  const speed=320; let vx=0,vy=0;
  if (dir==='left') vx=-speed; else if (dir==='right') vx=speed;
  else if (dir==='up') vy=-speed; else vy=speed;
  b.setVelocity(vx,vy);
  b.life=900;
  b.update=function(_,dt){ this.life-=dt; if (this.life<=0) this.disableBody(true,true); }
}

function castMeteorShower(){
  for (let i=0;i<12;i++){
    this.time.delayedCall(80*i, () => spawnMeteor.call(this));
  }
}

function spawnMeteor(){
  const x = Phaser.Math.Between(40,760);
  const m = meteors.get(x, -40, TEX.meteor);
  if (!m) return;
  m.setActive(true).setVisible(true).setDepth(3);
  m.setVelocity(0,420); m.setData('dmg',30);

  // simple timed explosion
  this.time.delayedCall(800, () => {
    goblins.children.iterate(g=>{
      if (!g || !g.active) return;
      const d = Phaser.Math.Distance.Between(m.x, m.y, g.x, g.y);
      if (d<46){
        g.hp -= m.getData('dmg');
        if (g.hp<=0){
          killCount++; dropXP.call(this,g.x,g.y);
          if (g.hpBg){ g.hpBg.destroy(); g.hpBg=null; }
          if (g.hpFg){ g.hpFg.destroy(); g.hpFg=null; }
          g.destroy();
        } else { positionGoblinHpBar(g); }
      }
    });
    // tiny explosion flash (no heavy tweens)
    const ex = this.add.circle(m.x, m.y, 20, 0xffa74d, 0.35).setDepth(3);
    this.time.delayedCall(180, ()=> ex.destroy());
    m.disableBody(true,true);
  });
}

/* ===== UI ===== */
function buildUI(){
  ui.icon = this.add.image(70,560,'mage',0).setScrollFactor(0).setScale(0.8).setDepth(1000);
  ui.hpBg = this.add.rectangle(110,560,220,16,0x312a2a).setOrigin(0,0.5).setScrollFactor(0).setDepth(1000);
  ui.hpOutline = this.add.rectangle(110,560,220,16).setOrigin(0,0.5).setStrokeStyle(1,0x000000,0.5).setScrollFactor(0).setDepth(1000);
  ui.hpFg = this.add.rectangle(112,560,216,12,0x7ee787).setOrigin(0,0.5).setScrollFactor(0).setDepth(1001);
  ui.text = this.add.text(140, 545, '', { fontFamily:'system-ui, Arial', fontSize:14, color:'#e8e8e8' }).setScrollFactor(0).setDepth(1001);
  ui.ulti = this.add.text(600, 545, '', { fontFamily:'system-ui, Arial', fontSize:14, color:'#f2cc60' }).setScrollFactor(0).setDepth(1001);
  drawPlayerHpBar(); drawUltiHint();
}
function drawPlayerHpBar(){
  const p = Phaser.Math.Clamp(player.hp/player.maxHp,0,1);
  ui.hpFg.scaleX = p;
  ui.text.setText(`HP: ${player.hp}/${player.maxHp}   XP: ${xp}   Kills: ${killCount}`);
}
function drawUltiHint(){
  ui.ulti.setText(ultiReady ? 'Ulti READY — press R' : '');
}

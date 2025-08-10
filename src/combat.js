import { BULLET_CD_MS, METEORS_COUNT, TEX, INVULN_MS, CONTACT_DAMAGE } from './config.js';
import { drawUltiHint } from './ui.js';
import { positionGoblinHpBar } from './spawn.js';
import { dropXP } from './loot.js';

export function tryShoot(time) {
  const scene = this;
  if (Phaser.Input.Keyboard.JustDown(scene.shootKey) || (scene.shootKey.isDown && time > scene.lastShot + BULLET_CD_MS)) {
    shoot.call(scene, scene.player.dir);
    scene.lastShot = time;
  }
}

export function shoot(dir) {
  const scene = this;
  const b = scene.bullets.get(scene.player.x, scene.player.y, TEX.bullet);
  if (!b) return;

  b.setActive(true).setVisible(true);
  b.setCircle(6); b.body.setOffset(b.width/2 - 6, b.height/2 - 6);

  const speed = 320; let vx=0, vy=0;
  if (dir==='left') vx=-speed; else if (dir==='right') vx=speed;
  else if (dir==='up') vy=-speed; else vy=speed;

  b.setVelocity(vx, vy);
  b.life = 700;
  b.update = function(_, dt) { this.life -= dt; if (this.life <= 0) this.disableBody(true, true); };
}

export function onBulletHitGoblin(b, g) {
  const scene = this;
  b.disableBody(true, true);
  g.hp -= 12;

  if (g.hp <= 0) {
    scene.killCount++;
    dropXP.call(scene, g.x, g.y);
    if (g.hpBg) { g.hpBg.destroy(); g.hpBg = null; }
    if (g.hpFg) { g.hpFg.destroy(); g.hpFg = null; }
    g.destroy();
    if (scene.killCount >= 3) { scene.ultiReady = true; drawUltiHint(scene); }
  } else {
    positionGoblinHpBar.call(scene, g);
  }
}

export function onPlayerTouchGoblin(player, g) {
  const scene = this;
  const now = scene.time.now;

  if (now < scene.player.invulnUntil) return;

  const nextHit = g.getData('nextHit') ?? 0;
  if (now < nextHit) return;
  g.setData('nextHit', now + 350);

  const dx = scene.player.x - g.x, dy = scene.player.y - g.y;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const kx = (dx / dist), ky = (dy / dist);
  damagePlayer.call(scene, CONTACT_DAMAGE, kx, ky);
}

export function damagePlayer(amount, kx = 0, ky = 0) {
  const scene = this;
  const now = scene.time.now;

  scene.player.invulnUntil = now + INVULN_MS;
  scene.player.hp = Phaser.Math.Clamp(scene.player.hp - amount, 0, scene.player.maxHp);
  scene.player.setVelocity(kx * 240, ky * 240);

  scene.tweens.killTweensOf(scene.player);
  scene.player.setAlpha(0.4);
  scene.tweens.add({ targets: scene.player, alpha: 1, duration: 120, yoyo: true, repeat: 4 });

  if (scene.player.hp <= 0) {
    scene.time.delayedCall(120, () => {
      scene.player.hp = scene.player.maxHp;
      scene.player.setPosition(scene.scale.width/2, scene.scale.height/2);
      scene.player.invulnUntil = scene.time.now + INVULN_MS * 1.5;
    });
  }
}

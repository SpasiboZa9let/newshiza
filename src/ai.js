import { positionGoblinHpBar } from './spawn.js';

export function aiTick() {
  const scene = this;
  const cam = scene.cameras.main;

  scene.goblins.children.iterate(g => {
    if (!g || !g.active) return;

    // стопаем анимацию, если вне экрана
    const onScreen = Phaser.Geom.Rectangle.Overlaps(
      cam.worldView, new Phaser.Geom.Rectangle(g.x-32, g.y-32, 64, 64)
    );
    if (!onScreen) { g.anims.pause(); return; }

    const dx = scene.player.x - g.x;
    const dy = scene.player.y - g.y;
    const dist = Math.hypot(dx, dy);
    const stop = 40, speed = 90;

    if (dist > stop) {
      const ux = dx / dist, uy = dy / dist;
      g.setVelocity(ux * speed, uy * speed);
      if (Math.abs(dx) > Math.abs(dy)) g.dir = dx < 0 ? 'left' : 'right';
      else g.dir = dy < 0 ? 'up' : 'down';
      g.anims.play('g-walk-' + g.dir, true);
    } else {
      g.setVelocity(0,0);
      g.anims.play('g-idle-' + g.dir, true);
    }

    positionGoblinHpBar.call(scene, g);
  });
}

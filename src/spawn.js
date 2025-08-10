import { MAX_GOBLINS } from './config.js';

export function spawnGoblin(x, y) {
  const scene = this;
  if (scene.goblins.countActive(true) >= MAX_GOBLINS) return;

  x = x ?? Phaser.Math.Between(40, scene.scale.width - 40);
  y = y ?? Phaser.Math.Between(40, scene.scale.height - 40);

  const g = scene.goblins.get(x, y, 'goblin', 0);
  if (!g) return;

  g.setActive(true).setVisible(true).setCollideWorldBounds(true);
  g.dir = 'down'; g.maxHp = 30; g.hp = g.maxHp;

  if (!g.hpBg) {
    g.hpBg = scene.add.rectangle(0,0,28,4,0x4a2323).setDepth(10);
    g.hpFg = scene.add.rectangle(0,0,26,2,0x7ee787).setDepth(11).setOrigin(0,0.5);
  }
  positionGoblinHpBar.call(scene, g);
}

export function positionGoblinHpBar(g) {
  const width = 26;
  if (g.hpBg) g.hpBg.setPosition(g.x, g.y - 40);
  if (g.hpFg) {
    g.hpFg.setPosition(g.x - width/2, g.y - 40);
    g.hpFg.scaleX = Phaser.Math.Clamp(g.hp / g.maxHp, 0, 1);
  }
}

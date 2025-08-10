export function buildUI(scene) {
  const ui = {};
  ui.icon = scene.add.image(70, 560, 'mage', 0).setScrollFactor(0).setScale(0.8).setDepth(1000);
  ui.hpBg = scene.add.rectangle(110, 560, 220, 16, 0x312a2a).setOrigin(0,0.5).setScrollFactor(0).setDepth(1000);
  ui.hpOutline = scene.add.rectangle(110,560,220,16).setOrigin(0,0.5)
    .setStrokeStyle(1,0x000000,0.5).setScrollFactor(0).setDepth(1000);
  ui.hpFg = scene.add.rectangle(112, 560, 216, 12, 0x7ee787).setOrigin(0,0.5).setScrollFactor(0).setDepth(1001);
  ui.text = scene.add.text(140, 545, '', { fontFamily:'system-ui, Arial', fontSize:14, color:'#e8e8e8' })
    .setScrollFactor(0).setDepth(1001);
  ui.ulti = scene.add.text(600, 545, '', { fontFamily:'system-ui, Arial', fontSize:14, color:'#f2cc60' })
    .setScrollFactor(0).setDepth(1001);
  scene.ui = ui;
  drawPlayerHpBar(scene);
  drawUltiHint(scene);
}

export function drawPlayerHpBar(scene) {
  const p = Phaser.Math.Clamp(scene.player.hp / scene.player.maxHp, 0, 1);
  scene.ui.hpFg.scaleX = p;
  scene.ui.text.setText(`HP: ${scene.player.hp}/${scene.player.maxHp}   XP: ${scene.xp}   Kills: ${scene.killCount}`);
}

export function drawUltiHint(scene) {
  scene.ui.ulti.setText(scene.ultiReady ? 'Ulti READY — press R' : '');
}

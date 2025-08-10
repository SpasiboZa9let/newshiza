import { TEX } from './config.js';

export function dropXP(x, y) {
  const scene = this;
  const orb = scene.xpOrbs.get(x, y, TEX.xp);
  if (!orb) return;

  orb.setActive(true).setVisible(true);
  orb.setCircle(6); orb.body.setOffset(orb.width/2 - 6, orb.height/2 - 6);
  const a = Math.random() * Math.PI * 2;
  orb.setVelocity(Math.cos(a)*100, Math.sin(a)*100).setDrag(120);
}

export function onPickupXP(player, orb) {
  const scene = this;
  scene.xp++;
  orb.disableBody(true, true);
}

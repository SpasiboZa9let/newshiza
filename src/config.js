export const GAME_W = 800;
export const GAME_H = 600;

export const RENDER = {
  pixelArt: true,
  antialias: false,
  powerPreference: 'low-power',
  roundPixels: true,
};

export const FPS = { target: 45, min: 30, forceSetTimeOut: true };

export const PHYSICS = {
  default: 'arcade',
  arcade: { debug: false, fps: 60, useTree: true, overlapBias: 8 }
};

export const MAX_GOBLINS = 10;
export const GOB_SPAWN_EVERY_MS = 3500;
export const GOB_AI_TICK_MS = 120;
export const BULLET_CD_MS = 300;
export const METEORS_COUNT = 8;

export const TEX = { bullet: 'bulletBlue', xp: 'xpOrb', meteor: 'meteor' };

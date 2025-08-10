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

// --- Новые параметры баланса ---
export const PLAYER_MAX_HP = 140;
export const CONTACT_DAMAGE = 6;     // урон с касания
export const INVULN_MS = 700;        // неуязвимость после удара
export const REGEN_PER_SEC = 3;      // реген в секунду
export const GOB_STOP_DIST = 52;     // дистанция остановки гоблина

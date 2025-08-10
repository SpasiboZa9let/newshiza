export function makeWalkAnims(scene, key, prefix, rate = 10) {
  scene.anims.create({ key: prefix+'down',  frames: scene.anims.generateFrameNumbers(key,{start:0,end:3}),   frameRate: rate, repeat: -1 });
  scene.anims.create({ key: prefix+'left',  frames: scene.anims.generateFrameNumbers(key,{start:4,end:7}),   frameRate: rate, repeat: -1 });
  scene.anims.create({ key: prefix+'right', frames: scene.anims.generateFrameNumbers(key,{start:8,end:11}),  frameRate: rate, repeat: -1 });
  scene.anims.create({ key: prefix+'up',    frames: scene.anims.generateFrameNumbers(key,{start:12,end:15}), frameRate: rate, repeat: -1 });
}

export function makeIdleAnims(scene, key, prefix) {
  scene.anims.create({ key: prefix+'down',  frames: [{ key, frame: 0  }] });
  scene.anims.create({ key: prefix+'left',  frames: [{ key, frame: 4  }] });
  scene.anims.create({ key: prefix+'right', frames: [{ key, frame: 8  }] });
  scene.anims.create({ key: prefix+'up',    frames: [{ key, frame: 12 }] });
}

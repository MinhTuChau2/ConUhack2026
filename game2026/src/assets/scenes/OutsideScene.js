import makeCar from "../entities/Car";
import { store, outfitAtom, carDecayAtom , moneyAtom  } from "../../store";
import { PALETTE } from "../../constants";
import { socket } from "../network/network.js";
import makePlayer from "../entities/Player";
import {Zone} from "../systems/Zone.js"; 

const COIN_SCALE = 0.1;
const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1080;
// Track active coin respawn timers
const coinRespawnTimers = new Set();
let leavingScene = false;
//const otherPlayers = {};


// Initialize zone system with server sync
let gameZone = null;
let zoneInitialized = false;

function initializeZone(k) {
  if (!zoneInitialized) {
    gameZone = new Zone();
    zoneInitialized = true;
  }
  return gameZone;
}

// Update and render zone system from server data
function updateZone(k, serverZoneData) {
  if (!gameZone || !serverZoneData) return;
  
  // Update zone with server data
  gameZone.centerX = serverZoneData.centerX;
  gameZone.centerY = serverZoneData.centerY;
  gameZone.currentWidth = serverZoneData.currentWidth;
  gameZone.currentHeight = serverZoneData.currentHeight;
  gameZone.targetWidth = serverZoneData.targetWidth;
  gameZone.targetHeight = serverZoneData.targetHeight;
  gameZone.targetCenterX = serverZoneData.targetCenterX;
  gameZone.targetCenterY = serverZoneData.targetCenterY;
  gameZone.isActive = serverZoneData.isActive;
  
  gameZone.render(k);
}

export default function OutsideScene(k, player, otherPlayers) {
    for (const id in otherPlayers) {
    otherPlayers[id].destroy();
    delete otherPlayers[id];
  }
  if (!player) return;
  leavingScene = false;
  
  // Initialize zone system
  let serverZoneData = null;
  initializeZone(k);
  
  // Listen for zone updates from server
  socket.on("zone:update", (zoneData) => {
    serverZoneData = zoneData;
  });
  
 
/*
  function spawnRemotePlayer(k, id, pos) {
  const remote = k.add([
    k.sprite("player", { anim: "walk-down-idle" }),
    k.scale(2),
    k.anchor("center"),
    k.area(),
    k.body(),
    k.pos(pos.x, pos.y),
    k.opacity(0.7),
    "remotePlayer",
  ]);
  
  remote.isRemote = true;       // 🔒 FLAG IT
  otherPlayers[id] = remote;
 
}
*/

const onPlayerJoined = ({ id, pos, scene }) => {
  if (scene !== "outside") return;
  if (id === socket.id) return;
  if (otherPlayers[id]) return; // ✅ ADD THIS

  spawnRemotePlayer(k, id, pos);
   const remote = otherPlayers[id];
    if (remote) {
    remote.scale = k.vec2(2);
}
};


const onPlayerMoved = ({ id, x, y, scene }) => {
  if (scene !== "outside") return;   // 🔴 CRITICAL
  const remote = otherPlayers[id];
  if (!remote) return;
  remote.pos = k.vec2(x, y);
};


const onPlayerLeft = ({ id }) => {
  const remote = otherPlayers[id];
  if (!remote) return;
  remote.destroy();
  delete otherPlayers[id];
};

// Request all outside players whenever entering
socket.emit("players:requestOutside");

// Use `on` instead of `once` to avoid missing future events
socket.on("players:outsideList", (players) => {
  for (const [id, data] of Object.entries(players)) {
    if (id === socket.id) continue;
    if (!otherPlayers[id]) spawnRemotePlayer(k, id, data.pos, 2);
  }
});

socket.on("player:joined", onPlayerJoined);
socket.on("player:moved", onPlayerMoved);
socket.on("player:leftOutside", onPlayerLeft);

  // ---------------------
  // Load sprites (ONLY ONCE)
  // ---------------------
  k.loadSprite("prologue", "./sprites/car1.png", {
    sliceX: 4,
    sliceY: 8,
    anims: {
      "drive-down-idle": 0,
      "drive-down": { from: 0, to: 3, loop: true },
      "drive-left-down": { from: 4, to: 7, loop: true },
      "drive-left-down-idle": 4,
      "drive-left": { from: 8, to: 11, loop: true },
      "drive-left-idle": 8,
      "drive-left-up": { from: 12, to: 15, loop: true },
      "drive-left-up-idle": 12,
      "drive-up": { from: 16, to: 19, loop: true },
      "drive-up-idle": 16,
      "drive-right-up": { from: 20, to: 23, loop: true },
      "drive-right-up-idle": 20,
      "drive-right": { from: 24, to: 27, loop: true },
      "drive-right-idle": 24,
      "drive-right-down": { from: 28, to: 31, loop: true },
      "drive-right-down-idle": 28,
    },
  });

  k.loadSprite("civic", "./sprites/car2.png", {
    sliceX: 4,
    sliceY: 8,
    anims: {
      "drive-down-idle": 0,
      "drive-down": { from: 0, to: 3, loop: true },
      "drive-left-down": { from: 4, to: 7, loop: true },
      "drive-left-down-idle": 4,
      "drive-left": { from: 8, to: 11, loop: true },
      "drive-left-idle": 8,
      "drive-left-up": { from: 12, to: 15, loop: true },
      "drive-left-up-idle": 12,
      "drive-up": { from: 16, to: 19, loop: true },
      "drive-up-idle": 16,
      "drive-right-up": { from: 20, to: 23, loop: true },
      "drive-right-up-idle": 20,
      "drive-right": { from: 24, to: 27, loop: true },
      "drive-right-idle": 24,
      "drive-right-down": { from: 28, to: 31, loop: true },
      "drive-right-down-idle": 28,
    },
  });

  k.loadSprite("coin", "./sprites/Coin.png");

    // ---------------------
  // Background
  // ---------------------
const BG_WIDTH = 1920;
const BG_HEIGHT = 1080;

const OUTSIDE_WIDTH = 1920;
const OUTSIDE_HEIGHT = 1080;


  const BAR_WIDTH = 160;
const BAR_HEIGHT = 16;

const healthBg = k.add([
  k.rect(BAR_WIDTH, BAR_HEIGHT),
  k.pos(20, 20),
  k.color(40, 40, 40),
  k.fixed(),
  k.z(9999),
]);

// ARMOR BAR (behind health)
const armorFill = k.add([
  k.rect(BAR_WIDTH, BAR_HEIGHT),
  k.pos(20, 40),
  k.color(80, 120, 220),
  k.fixed(),
  k.z(10000),
]);

// HEALTH BAR (front)
const healthFill = k.add([
  k.rect(BAR_WIDTH, BAR_HEIGHT),
  k.pos(20, 20),
  k.color(220, 60, 60),
  k.fixed(),
  k.z(10001),
]);

healthFill.onUpdate(() => {
  if (player.health == null) return;

  const healthRatio = player.health / player.maxHealth;
  const armorRatio =
    player.maxArmor > 0 ? player.armor / player.maxArmor : 0;

  armorFill.width = BAR_WIDTH * k.clamp(armorRatio, 0, 1);
  healthFill.width = BAR_WIDTH * k.clamp(healthRatio, 0, 1);
});



k.loadSprite("outsideBg", "./sprites/OUTSIDE.png", {
  sliceX: 2,
  sliceY: 1,
  anims: {
    idle: {
      from: 0,
      to: 1,
      loop: true,
      speed: 1, // slow idle
    },
  },
});

const outside = k.add([
  k.sprite("outsideBg", { anim: "idle" }),
  k.pos(WORLD_WIDTH / 2, WORLD_HEIGHT / 2),
  k.anchor("center"),
  k.z(-5), // ABOVE forest, BELOW player
]);

// Tell server we are now outside
socket.emit("player:sceneChange", {
  scene: "outside",
  x: player.pos.x,
  y: player.pos.y,
});

// Ask server who is currently outside
socket.emit("players:requestOutside");

socket.once("players:outsideList", (players) => {
  for (const [id, data] of Object.entries(players)) {
    if (id === socket.id) continue;
    if (!otherPlayers[id]) {
      spawnRemotePlayer(k, id, data.pos);
    }
  }
});


k.loadSprite("FOREST", "./sprites/FOREST.png", {
  sliceX: 2,
  sliceY: 1,
  anims: {
    idle: {
      from: 0,
      to: 1,
      loop: true,
      speed: 1, // slow idle
    },
  },
});

const bgTiles = [];

// Create a 3x3 forest grid
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    bgTiles.push(
      k.add([
        k.sprite("FOREST", { anim: "idle" }),
        k.pos(x * BG_WIDTH, y * BG_HEIGHT),
        k.anchor("topleft"),
        k.z(-20), // FAR BACK
      ])
    );
  }
}

// Reposition forest tiles around camera
k.onUpdate(() => {
  const cam = k.camPos();

  const baseX = Math.floor(cam.x / BG_WIDTH) * BG_WIDTH;
  const baseY = Math.floor(cam.y / BG_HEIGHT) * BG_HEIGHT;

  let i = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      bgTiles[i].pos = k.vec2(
        baseX + x * BG_WIDTH,
        baseY + y * BG_HEIGHT
      );
      i++;
    }
  }
});


  // ---------------------
// Coin UI
// ---------------------
const coinText = k.add([
  k.text(`Coins: ${store.get(moneyAtom)}`, { size: 18 }),
  k.pos(50, 50),
  k.fixed(),
  k.z(200),
  k.stay(),
]);

// React to money changes
coinText.onUpdate(() => {
  coinText.text = `Coins: ${store.get(moneyAtom)}`;
});

  // ---------------------
  // Player
  // ---------------------
  player.pos = k.vec2(WORLD_WIDTH / 2 - 800, WORLD_HEIGHT / 2 - 120);
  player.scale = k.vec2(2);
  k.add(player);

  if (player.setBounds) player.setBounds(null);

  // ---------------------
  // Cars (FROM car.js)
  // ---------------------
  const civic = makeCar(
    k,
    k.vec2(WORLD_WIDTH / 2 , WORLD_HEIGHT / 2),
    "civic"
  );

  const prologue = makeCar(
    k,
    k.vec2(WORLD_WIDTH / 2 + 350, WORLD_HEIGHT / 2),
    "prologue"
  );

  // ---------------------
  // Enter car
  // ---------------------
  player.inCar = false;
  player.car = null;

  player.enterCar = (car) => {
  if (player.inCar) return;

  player.inCar = true;
  player.car = car;
  car.driver = player;
  player.hidden = true;

  // 🌍 APPLY CAR POLLUTION
  store.set(carDecayAtom, car.envMultiplier);

  k.camPos(car.pos);
};


  k.onCollide("player", "car", (_, car) => {
    player.enterCar(car);
  });

  
  // ---------------------
  // Coins
  // ---------------------
  function spawnCoin(pos) {
  return k.add([
    k.sprite("coin"),
    k.pos(pos),
    k.scale(COIN_SCALE),
    k.anchor("center"),
    k.area({ shape: new k.Rect(k.vec2(0), 10, 10) }),
    k.opacity(1),
    "coin",
  ]);
}



  for (let i = 0; i < 40; i++) {
    spawnCoin(
      k.vec2(
        k.rand(200, WORLD_WIDTH - 200),
        k.rand(200, WORLD_HEIGHT - 200)
      )
    );
  }

  
const COIN_RESPAWN_TIME = 5000;
const RESPAWN_RADIUS = 40;

k.onCollide("car", "coin", (car, coin) => {
  if (!car.driver) return;
  if (leavingScene) return;

  const basePos = coin.pos.clone();
  coin.destroy();

  store.set(moneyAtom, store.get(moneyAtom) + 1);

  const timerId = setTimeout(() => {
    //  Do nothing if we already left
    if (leavingScene) return;

    const offset = k.vec2(
      k.rand(-RESPAWN_RADIUS, RESPAWN_RADIUS),
      k.rand(-RESPAWN_RADIUS, RESPAWN_RADIUS)
    );

    const newCoin = spawnCoin(basePos.add(offset));
    newCoin.opacity = 0;

    k.tween(
      0,
      1,
      0.6,
      (v) => (newCoin.opacity = v),
      k.easings.easeOutQuad
    );

    coinRespawnTimers.delete(timerId);
  }, COIN_RESPAWN_TIME);

  coinRespawnTimers.add(timerId);
});

// ---------------------
// Door to go home
// ---------------------
function addHomeDoor(pos) {
  return k.add([
    k.rect(50, 50), // size of the door
    k.pos(pos),
    k.color(150, 75, 0), // brown
    k.anchor("center"),
    k.area({ shape: new k.Rect(k.vec2(0), 40, 60) }),
    k.opacity(0.1),
    "door",
  ]);
}

// Add the door somewhere in the world
const homeDoor = addHomeDoor(k.vec2(107, WORLD_HEIGHT / 2 - 100));

// ---------------------
// Door collision / interaction
// ---------------------
k.onCollide("player", "door", (playerEntity) => {

  // Stop coin respawns
  leavingScene = true;
  coinRespawnTimers.forEach((id) => clearTimeout(id));
  coinRespawnTimers.clear();


  // Force exit car
  if (playerEntity.inCar && playerEntity.car) {
    const car = playerEntity.car;
    car.driver = null;
    playerEntity.inCar = false;
    playerEntity.car = null;
    playerEntity.hidden = false;
    store.set(carDecayAtom, 1);
  }

  // Reset scale
  playerEntity.scale = k.vec2(5);

  // ✅ Reset collision and interaction flags
  playerEntity.locked = false;
  playerEntity.inCloset = false;
  playerEntity.unlocking = false;
  playerEntity.area.collisionIgnore = []; // important
  playerEntity.hidden = false;

  console.log("🚪 Leaving outside → home");
  socket.emit("player:sceneChange", {
    scene: "home",
    x: 200,      // spawn position outside
    y: 200,
  });

for (const id in otherPlayers) {
  otherPlayers[id].destroy();
  delete otherPlayers[id];
}

  // Go home
  k.go("home");
  
});

  k.onSceneLeave(() => {
    socket.off("player:joined", onPlayerJoined);
    socket.off("player:moved", onPlayerMoved);
    socket.off("player:leftOutside", onPlayerLeft);

    for (const id in otherPlayers) {
      otherPlayers[id].destroy();
      delete otherPlayers[id];
    }
  });

  // ---------------------
  // Camera
  // ---------------------
  k.onUpdate(() => {
    const target = player.inCar ? player.car.pos : player.pos;
    k.camPos(k.camPos().lerp(target, 0.12));
    
    // Update zone system with server data
    updateZone(k, serverZoneData);
  });

  // ---------------------
  // Outfit restore
  // ---------------------
  const savedOutfit = store.get(outfitAtom);
  if (savedOutfit && savedOutfit !== "none") {
    player.changeOutfit(savedOutfit);
  }



}
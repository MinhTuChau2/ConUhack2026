import makePlayer from "../entities/Player.js";
import { PALETTE } from "../../constants";
import makeSection from "../components/Section";
import { store, moneyAtom, dayAtom } from "../../store";
import { socket } from "../network/network.js";

const OUTFIT_DURABILITY = {
  outfit1: 100, 
  outfit2: 80, 
  outfit3: 40, 
  outfit4: 20, 
  outfit5: 10, 
};

function wearOutfit(player, outfitId) {
  player.currentOutfit = outfitId;
  player.changeOutfit(outfitId);

  // Reset armor
  player.armor = 0;
  player.maxArmor = 0;

  if (outfitId === "none") return;

  const durability = OUTFIT_DURABILITY[outfitId] ?? 0;

  player.armor = durability;
  player.maxArmor = durability;

  console.log(
    `🛡️ ${outfitId} equipped → armor ${player.armor}/${player.maxArmor}`
  );
}



function openClosetPopup(k, player) {
  player.locked = true;
  player.inCloset = true;

  // --- DARK BACKGROUND ---
  k.add([
    k.rect(k.width(), k.height()),
    k.pos(0, 0),
    k.color(0, 0, 0),
    k.opacity(0.6),
    k.fixed(),
    //k.area(),
    "closetPopup",
  ]);

  // --- PANEL ---
  k.add([
    k.rect(700, 460),
    k.pos(k.center()),
    k.anchor("center"),
    k.color(20, 20, 20),
    k.opacity(0.95),
    k.fixed(),
    "closetPopup",
  ]);

  // --- TITLE ---
  k.add([
    k.text("Choose Your Outfit", { size: 28 }),
    k.pos(k.center().x, k.center().y - 200),
    k.anchor("center"),
    k.fixed(),
    "closetPopup",
  ]);

  const outfitOptions = [
  { id: "outfit1", label: "Handmade clothes", desc: "Ethical, slow fashion", price: 50 },
  { id: "outfit2", label: "Second-hand clothes", desc: "Sustainable & affordable", price: 25 },
  { id: "outfit3", label: "Local brands", desc: "Supports local creators", price: 40 },
  { id: "outfit4", label: "Fast fashion", desc: "Cheap, low sustainability", price: 10 },
  { id: "outfit5", label: "Vintage", desc: "Unique & reused", price: 30 },
  { id: "none", label: "No outfit", desc: "Default look", price: 0 },
];

// Simple ownership store (can later move to atom / save file)
const ownedOutfits = new Set(["none"]);


  outfitOptions.forEach((o, i) => {
  const y = k.center().y - 120 + i * 60;
  const isOwned = ownedOutfits.has(o.id);
  const money = store.get(moneyAtom);
  const canAfford = money >= o.price;

  const button = k.add([
    k.rect(520, 46, { radius: 6 }),
    k.pos(k.center().x, y),
    k.anchor("center"),
    k.color(
      isOwned ? k.rgb(60, 100, 60)
      : canAfford ? k.rgb(60, 60, 60)
      : k.rgb(80, 40, 40)
    ),
    k.area(),
    k.fixed(),
    {
      outfitId: o.id,
      price: o.price,
      owned: isOwned,
    },
    "closetPopup",
  ]);

  const label = isOwned
    ? "Wear"
    : o.price === 0
      ? "Free"
      : canAfford
        ? `Buy (${o.price} coins)`
        : `Locked (${o.price} coins)`;

  k.add([
    k.text(`${o.label} — ${o.desc} | ${label}`, { size: 16 }),
    k.pos(k.center().x, y),
    k.anchor("center"),
    k.fixed(),
    "closetPopup",
  ]);


// Hover
button.onHover(() => {
  button.scale = k.vec2(1.03);
});

button.onHoverEnd(() => {
  button.scale = k.vec2(1);
});

// Click logic (ONLY ONE)
button.onClick(() => {
 if (o.id === "none") {
  wearOutfit(player, "none");
  closeCloset();
  return;
}

if (ownedOutfits.has(o.id)) {
  wearOutfit(player, o.id);
  closeCloset();
  return;
}
  if (!canAfford) {
    k.shake(6);
    return;
  }

  // BUY
  store.set(moneyAtom, money - o.price);
  ownedOutfits.add(o.id);
  wearOutfit(player, o.id);
  player.unlocking = false;
  closeCloset();

});
});

  function closeCloset() {
  k.destroyAll("closetPopup");
  player.locked = false;
  player.inCloset = false;
  
  // Only ignore sections
  player.area.collisionIgnore = player.area.collisionIgnore?.filter(tag => tag !== "section") || [];
  
  player.unlocking = false; // make sure unlocking flag is cleared
}

}

export default function HomeScene(k, player, otherPlayers) {
  //HELPERS
function clearRemotePlayers() {
  for (const id in otherPlayers) {
    otherPlayers[id].destroy();
    delete otherPlayers[id];
  }
}

  // EVERYTHING you currently have inside initGame
  // except makeKaplayCtx()
  // Spawn existing remote players in this scene
  for (const [id, remoteData] of Object.entries(otherPlayers)) {
    if (!remoteData.spawnedInScene) {
      //spawnRemotePlayer(k, id, remoteData.pos);
      remoteData.spawnedInScene = true; // prevent duplicates
    }
  }

  const WORLD_WIDTH = 1920;
  const WORLD_HEIGHT = 1180;
  

function resetPlayerState(player) {
  player.locked = false;
  player.inCloset = false;
  player.hidden = false;
  player.inCar = false;
  player.car = null;
  player.unlocking = false;
  player.area.collisionIgnore = [];
  player.isStatic = false;
  player.velocity = k.vec2(0,0);
  player.scale = k.vec2(2); // normal scale
}

  // --- LOAD PLAYER SPRITE ---
  /*
  k.loadSprite("player", "./sprites/player.png", {
    sliceX: 4,
    sliceY: 8,
    anims: {
      "walk-down-idle": 0,
      "walk-down": { from: 0, to: 3, loop: true },
      "walk-left-down": { from: 4, to: 7, loop: true },
      "walk-left-down-idle": 4,
      "walk-left": { from: 8, to: 11, loop: true },
      "walk-left-idle": 8,
      "walk-left-up": { from: 12, to: 15, loop: true },
      "walk-left-up-idle": 12,
      "walk-up": { from: 16, to: 19, loop: true },
      "walk-up-idle": 16,
      "walk-right-up": { from: 20, to: 23, loop: true },
      "walk-right-up-idle": 20,
      "walk-right": { from: 24, to: 27, loop: true },
      "walk-right-idle": 24,
      "walk-right-down": { from: 28, to: 31, loop: true },
      "walk-right-down-idle": 28,
    }
  });
*/
  k.loadSprite("outfit1", "./sprites/outfit1.png", {
  sliceX: 4,
  sliceY: 8,
  anims: {
    "walk-down-idle": 0,
    "walk-down": { from: 0, to: 3, loop: true },
    "walk-left-down": { from: 4, to: 7, loop: true },
    "walk-left-down-idle": 4,
    "walk-left": { from: 8, to: 11, loop: true },
    "walk-left-idle": 8,
    "walk-left-up": { from: 12, to: 15, loop: true },
    "walk-left-up-idle": 12,
    "walk-up": { from: 16, to: 19, loop: true },
    "walk-up-idle": 16,
    "walk-right-up": { from: 20, to: 23, loop: true },
    "walk-right-up-idle": 20,
    "walk-right": { from: 24, to: 27, loop: true },
    "walk-right-idle": 24,
    "walk-right-down": { from: 28, to: 31, loop: true },
    "walk-right-down-idle": 28,
  }
});

 k.loadSprite("outfit2", "./sprites/outfit2.png", {
  sliceX: 4,
  sliceY: 8,
  anims: {
    "walk-down-idle": 0,
    "walk-down": { from: 0, to: 3, loop: true },
    "walk-left-down": { from: 4, to: 7, loop: true },
    "walk-left-down-idle": 4,
    "walk-left": { from: 8, to: 11, loop: true },
    "walk-left-idle": 8,
    "walk-left-up": { from: 12, to: 15, loop: true },
    "walk-left-up-idle": 12,
    "walk-up": { from: 16, to: 19, loop: true },
    "walk-up-idle": 16,
    "walk-right-up": { from: 20, to: 23, loop: true },
    "walk-right-up-idle": 20,
    "walk-right": { from: 24, to: 27, loop: true },
    "walk-right-idle": 24,
    "walk-right-down": { from: 28, to: 31, loop: true },
    "walk-right-down-idle": 28,
  }
});

 k.loadSprite("outfit3", "./sprites/outfit3.png", {
  sliceX: 4,
  sliceY: 8,
  anims: {
    "walk-down-idle": 0,
    "walk-down": { from: 0, to: 3, loop: true },
    "walk-left-down": { from: 4, to: 7, loop: true },
    "walk-left-down-idle": 4,
    "walk-left": { from: 8, to: 11, loop: true },
    "walk-left-idle": 8,
    "walk-left-up": { from: 12, to: 15, loop: true },
    "walk-left-up-idle": 12,
    "walk-up": { from: 16, to: 19, loop: true },
    "walk-up-idle": 16,
    "walk-right-up": { from: 20, to: 23, loop: true },
    "walk-right-up-idle": 20,
    "walk-right": { from: 24, to: 27, loop: true },
    "walk-right-idle": 24,
    "walk-right-down": { from: 28, to: 31, loop: true },
    "walk-right-down-idle": 28,
  }
});

 k.loadSprite("outfit4", "./sprites/outfit4.png", {
  sliceX: 4,
  sliceY: 8,
  anims: {
    "walk-down-idle": 0,
    "walk-down": { from: 0, to: 3, loop: true },
    "walk-left-down": { from: 4, to: 7, loop: true },
    "walk-left-down-idle": 4,
    "walk-left": { from: 8, to: 11, loop: true },
    "walk-left-idle": 8,
    "walk-left-up": { from: 12, to: 15, loop: true },
    "walk-left-up-idle": 12,
    "walk-up": { from: 16, to: 19, loop: true },
    "walk-up-idle": 16,
    "walk-right-up": { from: 20, to: 23, loop: true },
    "walk-right-up-idle": 20,
    "walk-right": { from: 24, to: 27, loop: true },
    "walk-right-idle": 24,
    "walk-right-down": { from: 28, to: 31, loop: true },
    "walk-right-down-idle": 28,
  }
});

 k.loadSprite("outfit5", "./sprites/outfit5.png", {
  sliceX: 4,
  sliceY: 8,
  anims: {
    "walk-down-idle": 0,
    "walk-down": { from: 0, to: 3, loop: true },
    "walk-left-down": { from: 4, to: 7, loop: true },
    "walk-left-down-idle": 4,
    "walk-left": { from: 8, to: 11, loop: true },
    "walk-left-idle": 8,
    "walk-left-up": { from: 12, to: 15, loop: true },
    "walk-left-up-idle": 12,
    "walk-up": { from: 16, to: 19, loop: true },
    "walk-up-idle": 16,
    "walk-right-up": { from: 20, to: 23, loop: true },
    "walk-right-up-idle": 20,
    "walk-right": { from: 24, to: 27, loop: true },
    "walk-right-idle": 24,
    "walk-right-down": { from: 28, to: 31, loop: true },
    "walk-right-down-idle": 28,
  }
});

  // --- LOAD BACKGROUND IMAGE ---
  k.loadSprite("home-bg", "./sprites/Home.png");

  // --- LOAD SECTION IMAGES ---
  k.loadSprite("bed", "./sprites/bed.png");
  k.loadSprite("meditate", "./sprites/meditate.png");
  k.loadSprite("closet", "./sprites/Closet.png");
  k.loadSprite("books", "./sprites/Books.png");
  k.loadSprite("plant1", "./sprites/plant1.png");
  k.loadSprite("plant2", "./sprites/plant2.png");
  k.loadSprite("plant3", "./sprites/plant3.png");
  k.loadSprite("door", "./sprites/door.png");

  // --- SHADER BACKGROUND (BEHIND EVERYTHING) ---
  k.loadShaderURL("tiledPattern", null, "/shaders/tiledPattern.frag");
  const shaderBackground = k.add([
    k.uvquad(k.width(), k.height()),
    k.shader("tiledPattern", () => ({
      u_time: k.time() / 20,
      u_color1: k.Color.fromHex(PALETTE.color3),
      u_color2: k.Color.fromHex(PALETTE.color2),
      u_speed: k.vec2(1, -1),
      u_aspect: k.width() / k.height(),
      u_size: 5,
    })),
    k.pos(0, 0),
    k.fixed(true),
  ]);

  shaderBackground.onUpdate(() => {
    shaderBackground.width = k.width();
    shaderBackground.height = k.height();
    shaderBackground.uniform.u_aspect = k.width() / k.height();
  });
/*
 function spawnRemotePlayer(k, id, pos) {
  const remote = k.add([
    k.sprite("player", { anim: "walk-down-idle" }),
    k.scale(5),
    k.anchor("center"),
    k.area(),
    k.body(),
    k.pos(pos.x, pos.y),
    k.opacity(0.7),
    "remotePlayer",
  ]);

  otherPlayers[id] = remote;
}
  */
 
/*
socket.emit("player:sceneChange", {
  scene: "home",
  x: currentPlayer.pos.x,
  y: currentPlayer.pos.y,
});
*/

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




const onPlayerJoined = ({ id, pos, scene }) => {
  if (scene !== "home") return;
  if (id === socket.id) return;
  if (otherPlayers[id]) return; // ✅ ADD THIS
  //spawnRemotePlayer(k, id, pos);
};


const onPlayerMoved = ({ id, x, y, scene }) => {
  if (scene !== "home") return;   // 🔴 CRITICAL
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

socket.emit("players:requestScene", { scene: "home" });

socket.on("players:sceneList", (playersList) => {
  for (const [id, data] of Object.entries(playersList)) {
    if (id === socket.id) continue;
    //if (!otherPlayers[id]) spawnRemotePlayer(k, id, data.pos);
  }
});


socket.on("player:joined", onPlayerJoined);
socket.on("player:moved", onPlayerMoved);
socket.on("player:leftOutside", onPlayerLeft);

  // --- IMAGE BACKGROUND (WORLD SIZE) ---
  const background = k.add([
    k.sprite("home-bg"),
    k.pos(0, 0),
    k.anchor("topleft"),
  ]);

  k.onUpdate(() => {
    if (background.width && background.height) {
      const scaleX = WORLD_WIDTH / background.width;
      const scaleY = WORLD_HEIGHT / background.height;
      background.scale = k.vec2(scaleX, scaleY);
    }
  });

 // --- SECTIONS AS PNG OBSTACLES WITH INTERACTION ---
const sections = [
  { pos: k.vec2(WORLD_WIDTH / 2 - 800, WORLD_HEIGHT / 2 - 430), name: "Bed", sprite: "bed" },
  { pos: k.vec2(WORLD_WIDTH / 2 - 770, WORLD_HEIGHT / 2 + 270), name: "Meditate", sprite: "meditate" },
  { pos: k.vec2(WORLD_WIDTH / 2 - 100, WORLD_HEIGHT / 2 - 450), name: "Closet", sprite: "closet" },
  { pos: k.vec2(WORLD_WIDTH / 2 + 700, WORLD_HEIGHT / 2 - 450), name: "Books", sprite: "books" },
    { pos: k.vec2(WORLD_WIDTH / 2 + 490, WORLD_HEIGHT / 2 - 480), name: "Plant1", sprite: "plant1" },
    { pos: k.vec2(WORLD_WIDTH / 2 - 600 , WORLD_HEIGHT / 2 - 520), name: "Plant2", sprite: "plant2" },
    { pos: k.vec2(WORLD_WIDTH / 2 - 850, WORLD_HEIGHT / 2 - 60), name: "Plant3", sprite: "plant3" },
     { pos: k.vec2(WORLD_WIDTH / 2 + 960, WORLD_HEIGHT / 2 + 460), name: "ExitDoor", sprite: "door" },
];

sections.forEach((s) => {
  const section = k.add([
    k.sprite(s.sprite),
    k.pos(s.pos),
    k.anchor("center"),
    k.area(),
    k.body({ isStatic: true }), // blocks movement
    "section",
    { sectionName: s.name },
  ]);

 
  section.onCollide("player", (player) => {
  if (!player.isLocal) return;
  if (player.unlocking) return; //  KEY LINE

  if (player.locked && player.lockedBy === s.name) return;
  if (player.locked && !player.inCloset) return;


    if (
  (s.name === "Bed" || s.name === "Meditate") &&
  !player.locked &&
  !player.unlocking
) {
  // --- LOCK PLAYER ---
  player.locked = true;
  player.lockedBy = s.name;
  player.justLocked = true;
  // Save exit position
  player.exitPos = player.pos.clone();

  // Stop movement & physics
  player.velocity = k.vec2(0, 0);
  player.isStatic = true;
  player.area.collisionIgnore = ["section"];

  // Snap to center of the object
  player.pos = section.pos.clone();

  // --- START COUNTER ---
  player.lockStartTime = Date.now();

  if (player.lockTimer) {
    clearInterval(player.lockTimer);
  }

  player.lockTimer = setInterval(() => {
  const elapsedSec = (Date.now() - player.lockStartTime) / 1000;
  const isPenaltyPhase = elapsedSec >= 300;

  let delta = 0;
  if (s.name === "Bed") delta = isPenaltyPhase ? -0.1 : 0.1;
  if (s.name === "Meditate") delta = isPenaltyPhase ? -0.05 : 0.05;

  const current = store.get(mentalAtom);

  // 🚫 If already maxed, ignore bonus
  if (current >= 1 && delta > 0) {
    delta = 0;
  }

  // ✅ Clamp result between 0 and 1
  const next = Math.min(1, Math.max(0, current + delta));

  store.set(mentalAtom, next);

  console.log(
    `${s.name} ${isPenaltyPhase ? "penalty" : "bonus"} → mental =`,
    next.toFixed(2)
  );
}, 10_000);
}


    else if (s.name === "Closet") {
    if (!player.isLocal) return;
  openClosetPopup(k, player);
  console.log("Closet opened — choose an outfit");
}
else if (s.name === "ExitDoor") {
   if (!player.isLocal) return;
   
  console.log("🚪 Leaving home → outside");
  clearRemotePlayers();
  socket.emit("player:sceneChange", {
    scene: "outside",
    x: 200,      // spawn position outside
    y: 200,
  });
  
  resetPlayerState(player); // <-- RESET EVERYTHING
  k.go("outside");
}



    else {
      console.log(`Interacted with section: ${s.name}`);
    }

  });
});





player.onUpdate(() => {
  player.pos.x = k.clamp(player.pos.x, 0, 1920);
  player.pos.y = k.clamp(player.pos.y, 0, 1080);
});
const BORDER_THICKNESS = 5;
const BORDER_COLOR = k.rgb(0, 0, 0);
 

// Top
k.add([
  k.rect(WORLD_WIDTH, BORDER_THICKNESS),
  k.pos(0, 0),
  k.color(BORDER_COLOR),
]);

// Bottom
k.add([
  k.rect(WORLD_WIDTH, BORDER_THICKNESS),
  k.pos(0, WORLD_HEIGHT - BORDER_THICKNESS),
  k.color(BORDER_COLOR),
]);

// Left
k.add([
  k.rect(BORDER_THICKNESS, WORLD_HEIGHT),
  k.pos(0, 0),
  k.color(BORDER_COLOR),
]);

// Right
k.add([
  k.rect(BORDER_THICKNESS, WORLD_HEIGHT),
  k.pos(WORLD_WIDTH - BORDER_THICKNESS, 0),
  k.color(BORDER_COLOR),
]);

  // --- PLAYER ---
 // const player = makePlayer(k, k.vec2(WORLD_WIDTH / 2, WORLD_HEIGHT / 2), 700);
    //return player;
    // --- PLAYER (reuse existing one) ---
 player.pos = k.vec2(WORLD_WIDTH - 200, WORLD_HEIGHT - 200); // near exit door
k.add(player);



}
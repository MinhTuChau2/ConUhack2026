import { DIAGONAL_FACTOR, OUTFIT_DECAY_MODIFIER } from "../../constants";
import { store, outfitAtom, healthAtom  } from "../../store";
import { socket } from "../network/network.js";
import makeHealth from "../systems/Health";
import makeHealthBar from "../ui/HealthBar";


export default function makePlayer(k, posVec2, speed,  isLocal = true, otherPlayers = {}) {
  // ---------------------
  // PLAYER ENTITY
  // ---------------------


  const player = k.add([
    k.sprite("player", { anim: "walk-down-idle" }),
    k.scale(5),
    k.anchor("center"),
    k.area({ shape: new k.Rect(k.vec2(0), 5, 10), solid: true }), // solid for collision
    k.body({ isStatic: false }),
    
    isLocal ? "localPlayer" : "remotePlayer",
    k.pos(posVec2),
    "player",
    {
      locked: false,
      isLocal,
      lockedBy: null,
      unlocking: false,
      inCloset: false,
      exitPos: null,
      justLocked: false,
      direction: k.vec2(0, 0),
      directionName: "walk-down",
      currentOutfitId: "none",
      hasMoved: false,
      currentScene: "outside",
      health: 100,
      maxHealth: 100,
      armor: 0,        // durability left
      maxArmor: 100,
     
    },
  ]);
  // ---------------------
// PLAYER vs PLAYER DAMAGE
// ---------------------
player.shootingBound = false;
// Only the LOCAL player handles collision damage

  player.onCollide("remotePlayer", (other) => {
    // Prevent rapid-fire damage every frame
    if (player._lastHit && k.time() - player._lastHit < 1) return;
    player._lastHit = k.time();

    // Damage BOTH players
    damagePlayer(player, 10);


  });



  // -------------------------
  // LOCAL PLAYER UI HEALTH BAR
  // -------------------------
  let healthBar = null;

  if (isLocal) {
    const BAR_WIDTH = 160;
    const BAR_HEIGHT = 16;

    // Health bar background
    const bg = k.add([
      k.rect(BAR_WIDTH, BAR_HEIGHT),
      k.pos(20, 20),
      k.color(40, 40, 40),
      k.fixed(),
      k.z(9999),
    ]);

    // Health bar foreground
    const fill = k.add([
      k.rect(BAR_WIDTH, BAR_HEIGHT),
      k.pos(20, 20),
      k.color(220, 60, 60),
      k.fixed(),
      k.z(10000),
    ]);

    healthBar = { bg, fill };

    // Update health bar every frame
    player.onUpdate(() => {
      const ratio = player.health / 100; // assuming max 100
      fill.width = Math.max(0, BAR_WIDTH * ratio);
    });

    // Sync health with the atom
    store.set(healthAtom, player.health);
    console.log("Local player health:", player.health);
  }

  // -------------------------
  // REMOTE PLAYER HEALTH BAR (above sprite)
  // -------------------------
  if (!isLocal) {
    const BAR_WIDTH = 40;
    const BAR_HEIGHT = 5;

    const bg = k.add([
      k.rect(BAR_WIDTH, BAR_HEIGHT),
      k.color(40, 40, 40),
      k.anchor("center"),
      k.pos(player.pos.x, player.pos.y - 20), // above sprite
    ]);

    const fill = k.add([
      k.rect(BAR_WIDTH, BAR_HEIGHT),
      k.color(220, 60, 60),
      k.anchor("center"),
      k.pos(player.pos.x, player.pos.y - 20),
    ]);

    healthBar = { bg, fill };

    player.onUpdate(() => {
      fill.width = Math.max(0, BAR_WIDTH * (player.health / 100));
      bg.pos = fill.pos = k.vec2(player.pos.x, player.pos.y - 20);
    });
  }

  player.healthBar = healthBar;
 function damagePlayer(player, amount) {
  let remaining = amount;

  // Armor absorbs first
  if (player.armor > 0) {
    const absorbed = Math.min(player.armor, remaining);
    player.armor -= absorbed;
    remaining -= absorbed;
  }

  if (remaining > 0) {
    player.health = Math.max(0, player.health - remaining);
  }

  if (player.isLocal) {
    socket.emit("player:health", {
      value: player.health,
      armor: player.armor,
    });
  }

  // Optional: auto-remove broken outfit
  if (player.armor === 0 && player.currentOutfit !== "none") {
    player.currentOutfit = "none";
    player.changeOutfit("none");
  }
}



  // ---------------------
  // WORLD BOUNDS
  // ---------------------
  let worldWidth = 0;
  let worldHeight = 0;

  player.setBounds = (w, h) => {
    worldWidth = w;
    worldHeight = h;
  };

  // ---------------------
  // OUTFITS
  // ---------------------
  const outfits = ["outfit1", "outfit2", "outfit3", "outfit4", "outfit5"];
  player.currentOutfitIndex = -1;

  player.changeOutfit = (outfitId) => {
    const id = outfitId ?? "none";
    store.set(outfitAtom, id);
    player.currentOutfitId = id;

    if (player.outfit) {
      player.outfit.destroy();
      player.outfit = null;
    }

    if (id === "none") return;
   if (player.inCar) player.hidden = false;
    player.outfit = player.add([
      k.sprite(id, { anim: `${player.directionName}-idle` }),
      k.anchor("center"),
    ]);
  };

  // Restore saved outfit
  const savedOutfit = store.get(outfitAtom);
  if (savedOutfit && savedOutfit !== "none") {
    player.changeOutfit(savedOutfit);
  }

  // ---------------------
  // INPUT TRACKING
  // ---------------------
  let isMouseDown = false;
  const game = document.getElementById("game");
  const DIR_MAP = {
    "walk-right": k.vec2(1, 0),
    "walk-left": k.vec2(-1, 0),
    "walk-up": k.vec2(0, -1),
    "walk-down": k.vec2(0, 1),
    "walk-right-up": k.vec2(0.7, -0.7),
    "walk-right-down": k.vec2(0.7, 0.7),
    "walk-left-up": k.vec2(-0.7, -0.7),
    "walk-left-down": k.vec2(-0.7, 0.7),
  };
  player.lastFacingDir = DIR_MAP["walk-down"];

  const setMouseDown = (val) => (isMouseDown = val);
  ["mousedown", "touchstart"].forEach((evt) =>
    game.addEventListener(evt, () => setMouseDown(true))
  );
  ["mouseup", "touchend", "focusout"].forEach((evt) =>
    game.addEventListener(evt, () => setMouseDown(false))
  );

  // ---------------------
  // SHOOTING (SCENE-BOUND)
  // ---------------------
  player.bindShooting = () => {
    if (!player.isLocal) return;
    if (player.shootingBound) return; // 🔒 prevent re-binding
  player.shootingBound = true;

    const SHOT_COOLDOWN = 1 / 3;
    let lastShotTime = -Infinity;

    k.onKeyPress("space", () => {
      if (player.inCloset || player.locked || player.hidden) {
        console.log("[SHOOT] blocked", {
          inCloset: player.inCloset,
          locked: player.locked,
          hidden: player.hidden,
        });
        return;
      }

      const now = k.time();
      if (now - lastShotTime < SHOT_COOLDOWN) return;
      lastShotTime = now;

      // inside bindShooting (LOCAL ONLY)
        const aim = player.lastFacingDir.unit();
        if (!player.bow) return;

        const bowWorldPos = player.bow.worldPos();
        const spawnPos = bowWorldPos.add(aim.scale(10));

        socket.emit("player:shoot", {
        x: spawnPos.x,
        y: spawnPos.y,
        dx: aim.x,
        dy: aim.y,
        angle: aim.angle(),
});


    });
  };
socket.on("player:shoot", ({ x, y, dx, dy, angle }) => {
  k.add([
    k.rect(12, 4),
    k.color(255, 60, 60),
    k.pos(x, y),
    k.anchor("center"),
    k.area(),
    k.body(),
    k.rotate(angle),
    k.move(k.vec2(dx, dy), 800),
    k.offscreen({ destroy: true }),
    "bullet",
  ]);
  // BULLET → PLAYER DAMAGE
 bullet.onCollide("player", (player) => {
  // Only damage REMOTE players
  if (player.isLocal) return;
  if (player.health <= 0) return;

  damagePlayer(player, 10); // 💥 -10 HP
  bullet.destroy();
});

});

  // ---------------------
// BOW (LOCAL PLAYER ONLY)
// ---------------------

  player.bow = player.add([
    k.sprite("bow"),          // make sure this sprite is loaded
    k.anchor("center"),
    k.pos(8, 0), 
    k.scale(0.05),             // offset from player center
    k.z(5),
  ]);


  // ---------------------
  // UNLOCK / CLOSET CLICK
  // ---------------------
  const unlockPlayer = () => {
    if (player.inCloset || !player.locked) return;

    if (player.justLocked) {
      player.justLocked = false;
      return;
    }

    if (player.lockTimer) {
      clearInterval(player.lockTimer);
      player.lockTimer = null;
    }

    player.locked = false;
    player.lockedBy = null;
    player.unlocking = true;
    player.isStatic = false;
    player.area.collisionIgnore = ["section"];

    if (player.exitPos) {
      const exitDir = player.exitPos.sub(player.pos).unit();
      player.pos = player.exitPos.add(exitDir.scale(20));
    }

    player.exitPos = null;

    setTimeout(() => {
      player.area.collisionIgnore = [];
      player.unlocking = false;
    }, 150);
  };

  game.addEventListener("mouseup", unlockPlayer);
  game.addEventListener("touchend", unlockPlayer);

  // ---------------------
  // CAMERA
  // ---------------------
  const CAMERA_ZOOM = 1;
  const CAMERA_LERP = 0.12;
  k.camScale(CAMERA_ZOOM);

  // ---------------------
  // MAIN UPDATE LOOP
  // ---------------------
  player.onUpdate(() => {
    // ---------------------
    // LOCKED / CLOSET STATES
    // ---------------------
    if (player.inCloset || player.locked) {
      player.direction = k.vec2(0, 0);
      const idle = `${player.directionName}-idle`;

      if (!player.getCurAnim()?.name.includes("idle")) {
        player.play(idle);
        if (player.outfit) player.outfit.play(idle);
      }
      return;
    }

    // ---------------------
    // MOVEMENT
    // ---------------------
    player.direction = k.vec2(0, 0);
    const worldMousePos = k.toWorld(k.mousePos());
    if (isMouseDown) player.direction = worldMousePos.sub(player.pos).unit();

    const dx = player.direction.x;
    const dy = player.direction.y;
// Mark as moved if the player is actually moving
if (dx !== 0 || dy !== 0) {
    player.hasMoved = true; // <-- THIS IS REQUIRED
}
    if (dx > 0 && Math.abs(dy) < 0.5) player.directionName = "walk-right";
    else if (dx < 0 && Math.abs(dy) < 0.5) player.directionName = "walk-left";
    else if (dy < -0.8) player.directionName = "walk-up";
    else if (dy > 0.8) player.directionName = "walk-down";
    else if (dx < 0 && dy < -0.5) player.directionName = "walk-left-up";
    else if (dx < 0 && dy > 0.5) player.directionName = "walk-left-down";
    else if (dx > 0 && dy < -0.5) player.directionName = "walk-right-up";
    else if (dx > 0 && dy > 0.5) player.directionName = "walk-right-down";

    const facingDir = DIR_MAP[player.directionName];
    if (facingDir) player.lastFacingDir = facingDir;
    
    if (player.direction.eq(k.vec2(0, 0))) {
      const idle = `${player.directionName}-idle`;
      if (!player.getCurAnim()?.name.includes("idle")) {
        player.play(idle);
        if (player.outfit) player.outfit.play(idle);
      }
    } else if (player.getCurAnim()?.name !== player.directionName) {
      player.play(player.directionName);
      if (player.outfit) player.outfit.play(player.directionName);
    }

    const moveSpeed = dx && dy ? DIAGONAL_FACTOR * speed : speed;
    player.move(player.direction.scale(moveSpeed));


    // ---------------------
    // CAMERA FOLLOW
    // ---------------------
    k.camPos(k.camPos().lerp(player.pos, CAMERA_LERP));
    // Bow Follow
    // -- Bow Follow --
    if (player.bow) {
      const dir = player.lastFacingDir;
      player.bow.angle = dir.angle();
    }
  });

  // Movement input (only for local player)
  // Only the local player sends and receives socket updates
  if (isLocal) {
    
    player.onUpdate(() => {
      if (player.hasMoved) {
        socket.emit("player:move", {
          x: player.pos.x,
          y: player.pos.y,
          scene: player.currentScene
        });
        player.hasMoved = false;
      }
      
});
socket.on("player:health", ({ id, value }) => {
  if (id === socket.id) return;

  const other = otherPlayers[id];
  if (other) {
    other.health = value;
    if (other.healthBar) {
      const ratio = other.health / 100;
      other.healthBar.fill.width = Math.max(0, 40 * ratio); // 40 = bar width
    }
  }
});

    socket.on("player:update", ({ id, x, y, scene }) => {
      if (id === socket.id) return; // ignore self

      const other = otherPlayers[id];
      if (other) {
        other.pos = { x, y };
      } else {
        // Create remote player
        const remote = makePlayer(k, { x, y }, speed, false, otherPlayers);
        remote.playerId = id;
        otherPlayers[id] = remote;

      }
    });
  }


  return player;
}

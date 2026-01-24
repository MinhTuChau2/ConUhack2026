import MenuScene from "./assets/scenes/Menu";
import makePlayer from "./assets/entities/Player";
import makeKaplayCtx from "./kaplayCTX.js";
import { store } from "./store";
import HomeScene from "./assets/scenes/HomeScene";
import OutsideScene from "./assets/scenes/OutsideScene";
//import makeEarthHealthBar from "./assets/ui/EarthHealthBar";
//import startEarthDecay from "./assets/systems/earthDecay";
//import makeMentalHealthBar from "./ui/MentalHealthBar";
//import startMentalDecay from "./systems/mentalDecay";
import { socket } from "./assets/network/network.js";
import makeHealth from "./assets/systems/Health";
//import makeHealthBar from "./assets/ui/HealthBar";

function showChatBubble(k, target, text) {
  if (target.chatBubble) {
    const { bg, label, tail } = target.chatBubble;
    if (bg.exists()) bg.destroy();
    if (label.exists()) label.destroy();
    if (tail.exists()) tail.destroy();
  }

  const paddingX = 10;
  const paddingY = 6;
  const maxWidth = 160;
  const lifetime = 3;

  // Text label
  const label = k.add([
    k.text(text, { size: 14, width: maxWidth }),
    k.color(255, 255, 255),
    k.anchor("center"),
    k.z(1010), // on top
  ]);

  // Background rectangle
  const bg = k.add([
    k.rect(label.width + paddingX * 2, label.height + paddingY * 2, { radius: 6 }),
    k.color(30, 30, 30),
    k.anchor("center"),
    k.z(1000), // under text
  ]);

  // Tail triangle
  const tail = k.add([
    k.polygon([k.vec2(-5, 0), k.vec2(5, 0), k.vec2(0, 8)]),
    k.color(30, 30, 30),
    k.anchor("center"),
    k.z(1000),
  ]);

  const offsetY = 97;

  const update = () => {
    if (!target.exists()) {
      if (bg.exists()) bg.destroy();
      if (label.exists()) label.destroy();
      if (tail.exists()) tail.destroy();
      return;
    }
    const baseX = target.pos.x;
    const baseY = target.pos.y - offsetY;
    bg.pos = k.vec2(baseX, baseY);
    label.pos = k.vec2(baseX, baseY);
    tail.pos = k.vec2(baseX, baseY + bg.height / 2 + 4);
  };

  k.onUpdate(update);

  // Fade out
  k.wait(lifetime - 0.5, () => {
    k.tween(1, 0, 0.5, (v) => {
      if (bg.exists()) bg.color = [30, 30, 30, v];
      if (tail.exists()) tail.color = [30, 30, 30, v];
      if (label.exists()) label.color = [255, 255, 255, v];
    });
  });

  k.wait(lifetime, () => {
    if (bg.exists()) bg.destroy();
    if (label.exists()) label.destroy();
    if (tail.exists()) tail.destroy();
  });

  target.chatBubble = { bg, label, tail };
}




let currentPlayer = null;
const otherPlayers = {}; // store remote players here
let currentRemoteScale = 5;

//HELPERS
function clearRemotePlayers() {
  for (const id in otherPlayers) {
    otherPlayers[id].destroy();
    delete otherPlayers[id];
  }
}

 // --- Function to spawn remote players ---
  
 function spawnRemotePlayer(k, id, pos) {
  const remote = k.add([
    k.sprite("player", { anim: "walk-down-idle" }),
    k.scale(currentRemoteScale), // 👈 key line
    k.anchor("center"),
    k.area({ shape: new k.Rect(k.vec2(0), 5, 10) }),
    k.body({ isStatic: true }),
    k.pos(k.vec2(pos.x, pos.y)),
    "remotePlayer",
    {
      directionName: "walk-down",
      isMoving: false,
      lastMoveTime: 0,
    },
  ]);

  otherPlayers[id] = remote;
}


export default async function initGame() {
  const k = makeKaplayCtx();

  // --- Load player sprite ---
  await k.loadSprite("player", "./sprites/player.png", {
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
    },
  });

  // --- Indicator for other players ---
  const indicator = document.createElement("div");
  indicator.style.position = "fixed";
  indicator.style.top = "10px";
  indicator.style.left = "50%";
  indicator.style.transform = "translateX(-50%)";
  indicator.style.width = "40px";
  indicator.style.height = "40px";
  indicator.style.borderRadius = "50%";
  indicator.style.backgroundColor = "red";
  indicator.style.zIndex = 9999;
  indicator.style.display = "flex";
  indicator.style.justifyContent = "center";
  indicator.style.alignItems = "center";
  indicator.style.fontSize = "18px";
  indicator.style.color = "white";
  indicator.style.fontWeight = "bold";
  indicator.title = "Other players online";
  indicator.textContent = "0";
  document.body.appendChild(indicator);

  // --- Chat UI ---
const chatBox = document.createElement("div");
chatBox.style.position = "fixed";
chatBox.style.bottom = "60px";
chatBox.style.left = "20px";
chatBox.style.width = "260px";
chatBox.style.maxHeight = "220px";
chatBox.style.overflowY = "auto";
chatBox.style.background = "rgba(0,0,0,0.7)";
chatBox.style.color = "white";
chatBox.style.padding = "8px";
chatBox.style.fontSize = "13px";
chatBox.style.borderRadius = "6px";
chatBox.style.zIndex = 9999;
document.body.appendChild(chatBox);

const chatInput = document.createElement("input");
chatInput.type = "text";
chatInput.placeholder = "Press Enter to chat...";
chatInput.style.position = "fixed";
chatInput.style.bottom = "20px";
chatInput.style.left = "20px";
chatInput.style.width = "260px";
chatInput.style.padding = "6px";
chatInput.style.borderRadius = "6px";
chatInput.style.border = "none";
chatInput.style.outline = "none";
chatInput.style.zIndex = 9999;
document.body.appendChild(chatInput);


  let otherPlayersCount = 0;

  let onlineCount = 0;
socket.on("players:sceneSnapshot", (players) => {
  clearRemotePlayers();

  for (const [id, data] of Object.entries(players)) {
    if (id === socket.id) continue;
    spawnRemotePlayer(k, id, data.pos);
  }
});

socket.on("player:joinedScene", ({ id, pos }) => {
  if (id === socket.id) return;
  if (!otherPlayers[id]) spawnRemotePlayer(k, id, pos);
});

socket.on("player:leftScene", ({ id }) => {
  const remote = otherPlayers[id];
  if (remote) {
    remote.destroy();
    delete otherPlayers[id];
  }
});


  // --- Remote players store ---
//const otherPlayers = {};

// --- Socket event handlers ---
socket.on("players:init", (players) => {
  onlineCount = Object.keys(players).length;
  indicator.textContent = onlineCount;
  indicator.style.backgroundColor = onlineCount > 1 ? "green" : "red";
});

socket.on("player:joined", () => {
  onlineCount++;
  indicator.textContent = onlineCount;
  indicator.style.backgroundColor = "green";
});

socket.on("player:left", () => {
  onlineCount = Math.max(0, onlineCount - 1);
  indicator.textContent = onlineCount;
  indicator.style.backgroundColor =
    onlineCount > 1 ? "green" : "red";
});

socket.on("chat:message", ({ id, name, message }) => {
  // Add message to chat box
  const msg = document.createElement("div");
  msg.innerHTML = `<strong>${name}:</strong> ${message}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Show bubble only for **remote players**
  const remote = otherPlayers[id];
  if (remote) {
    showChatBubble(k, remote, message);
  }
});



  // --- Show menu and create local player ---
  MenuScene((playerName) => {
    console.log("Player name received:", playerName);
    
    const player = makePlayer(k, k.vec2(960, 540), 700, true, otherPlayers);
    currentPlayer = player;
   
 chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && chatInput.value.trim() !== "") {
    const message = chatInput.value.trim();

    // Show bubble immediately for local player
    if (currentPlayer) {
      showChatBubble(k, currentPlayer, message);
    }

    // Send to server so remote players see it
    socket.emit("chat:message", {
      name: playerName,
      message: message,
    });

    chatInput.value = "";
  }
});

 
 socket.on("player:moved", ({ id, x, y }) => {
  const remote = otherPlayers[id];
  if (!remote) return;

  const newPos = k.vec2(x, y);
  const prevPos = remote.pos;

  const delta = newPos.sub(prevPos);

  // Move instantly (ghost slide)
  remote.pos = newPos;

  // Decide facing direction ONLY
  let facing;

  if (Math.abs(delta.x) > Math.abs(delta.y)) {
    facing = delta.x > 0 ? "walk-right" : "walk-left";
  } else if (Math.abs(delta.y) > 0.1) {
    facing = delta.y > 0 ? "walk-down" : "walk-up";
  } else {
    return; // no meaningful movement
  }

  // Only play IDLE of that direction
  const idleAnim = `${facing}-idle`;

  if (remote.curAnim() !== idleAnim) {
    remote.play(idleAnim);
    remote.directionName = facing;
  }

}); 

k.scene("home", () => {
  currentRemoteScale = 5;

  socket.emit("player:sceneChange", {
    scene: "home",
    x: player.pos.x,
    y: player.pos.y,
  });

  currentPlayer = HomeScene(k, player, otherPlayers);

  Object.values(otherPlayers).forEach((remote) => {
    remote.scale = k.vec2(5);
  });
});

k.scene("outside", () => {
  currentRemoteScale = 2;

  socket.emit("player:sceneChange", {
    scene: "outside",
    x: player.pos.x,
    y: player.pos.y,
  });

  currentPlayer = OutsideScene(k, player, otherPlayers);

  Object.values(otherPlayers).forEach((remote) => {
    remote.scale = k.vec2(2);
  });
});


    k.go("home");
  });
  

}
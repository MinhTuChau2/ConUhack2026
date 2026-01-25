import { Server } from "socket.io";
import { Zone } from "./Zone.js";

const io = new Server(3000, {
  cors: { origin: "*" },
});

// Initialize server-side zone
const serverZone = new Zone();
serverZone.initialize(1920, 1080);

// Store players: { socketId: { name, pos } }
const players = {};

io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  // --- Send initial player count to new client ---
  const otherPlayerCount = Object.keys(players).length;
  socket.emit("players:init-count", otherPlayerCount);
     console.log("How many players on:", otherPlayerCount);

  // --- Handle chat messages ---
  
  socket.on("chat:message", (data) => {
  // data = { name, message }
  io.emit("chat:message", {
    id: socket.id,
    name: data.name,
    message: data.message,
  });
});


socket.on("player:health", ({ value }) => {
  // broadcast to everyone except sender
  socket.broadcast.emit("player:health", {
    id: socket.id,
    value,
  });
});

     // --- Send all existing players to new client ---
  const existingPlayers = {};
  for (const [id, data] of Object.entries(players)) {
    if (id !== socket.id) existingPlayers[id] = data;
  }
  socket.emit("players:init", existingPlayers);
 
  // --- Listen for player joining with name ---
  socket.on("player:join", ({ name }) => {
  // 1️ Register player FIRST
  players[socket.id] = {
    name,
    pos: { x: 0, y: 0 },
    scene: "home",
  };
/*
  // 2️ Build snapshot AFTER join
  const existingPlayers = {};
  for (const [id, data] of Object.entries(players)) {
    if (id !== socket.id) {
      existingPlayers[id] = data;
    }
  }

  // 3️ Send snapshot to new player
  socket.emit("players:init", existingPlayers);
*/
  // 4️ Notify others
  socket.broadcast.emit("player:joined", {
    id: socket.id,
    name,
    pos: players[socket.id].pos,
    scene: players[socket.id].scene,
  });

  console.log(
  `Player connected: "${name}" in scene: ${players[socket.id].scene}`
);

});

socket.on("players:requestScene", ({ scene }) => {
  const list = {};
  for (const [id, player] of Object.entries(players)) {
    if (player.scene === scene && id !== socket.id) {
      list[id] = { pos: player.pos, scene: player.scene };
    }
  }
  socket.emit("players:sceneList", list);
});


  // --- Listen for movement ---
  socket.on("player:move", ({ x, y }) => {
    if (!players[socket.id]) return;

    players[socket.id].pos = { x, y };
    console.log(`Player ${players[socket.id].name} moved to x:${x}, y:${y}`);

    // Broadcast movement to all others
    socket.broadcast.emit("player:moved", {
      id: socket.id,
      x,
      y,
      scene: players[socket.id].scene,
    });
  });

 socket.on("player:sceneChange", ({ scene, x, y }) => {
  const player = players[socket.id];
  if (!player) return;

  const prevScene = player.scene;

  // 1️⃣ Leave old room
  socket.leave(prevScene);

  // 2️⃣ Tell OLD scene player left
  socket.to(prevScene).emit("player:leftScene", {
    id: socket.id,
  });

  // 3️⃣ Update server state
  player.scene = scene;
  player.pos = { x, y };

  // 4️⃣ Join new room
  socket.join(scene);

  // 5️⃣ Send snapshot of players already in this scene
  const snapshot = {};
  for (const [id, p] of Object.entries(players)) {
    if (id !== socket.id && p.scene === scene) {
      snapshot[id] = { pos: p.pos };
    }
  }

  socket.emit("players:sceneSnapshot", snapshot);

  // 6️⃣ Tell NEW scene player joined
  socket.to(scene).emit("player:joinedScene", {
    id: socket.id,
    pos: player.pos,
  });
});

/*
  socket.broadcast.emit(
    scene === "outside" ? "player:joined" : "player:leftOutside",
    { id: socket.id, pos: { x, y }, scene }
  );

  if (scene === "outside") {
    socket.broadcast.emit("player:joined", {
      id: socket.id,
      pos: { x, y },
      scene: "outside",
    });
  } else {
    socket.broadcast.emit("player:leftOutside", { id: socket.id });
  }

  socket.broadcast.emit("player:sceneChanged", {
    id: socket.id,
    scene,
    x,
    y,
  });
});
*/
socket.on("players:requestOutside", () => {
  const outsidePlayers = {};
  for (const [id, data] of Object.entries(players)) {
    if (id !== socket.id && data.scene === "outside") {
      outsidePlayers[id] = { pos: data.pos };
    }
  }
  socket.emit("players:outsideList", outsidePlayers);
});


  // --- Handle disconnect ---
  socket.on("disconnect", () => {
    if (players[socket.id]) {
      console.log(`Player disconnected: ${players[socket.id].name}`);
      delete players[socket.id];
      io.emit("player:left", socket.id);
    } else {
      console.log("Player disconnected: Unknown");
    }
  });
});

// Zone update broadcasting (60 FPS)
setInterval(() => {
  serverZone.update(1/60); // 60 FPS delta time
  io.emit("zone:update", {
    centerX: serverZone.centerX,
    centerY: serverZone.centerY,
    currentWidth: serverZone.currentWidth,
    currentHeight: serverZone.currentHeight,
    targetWidth: serverZone.targetWidth,
    targetHeight: serverZone.targetHeight,
    targetCenterX: serverZone.targetCenterX,
    targetCenterY: serverZone.targetCenterY,
    isActive: serverZone.isActive
  });
}, 1000/60); // 60 FPS

console.log("Socket.io server running on port 3000");
console.log("Zone system initialized and broadcasting at 60 FPS");
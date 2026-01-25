import { Server } from "socket.io";
import { ElevenLabsClient } from "elevenlabs";

const io = new Server(3000, {
  cors: { origin: "*" },
});

const elevenlabs = new ElevenLabsClient({
  apiKey: "sk_0df9b0d131474de2c86618ea7951e780b572daa8bb74f1fb",
});

// Store players: { socketId: { name, pos } }
const players = {};
const readyPlayers = new Set();
io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  // --- Send initial player count to new client ---
  const otherPlayerCount = Object.keys(players).length;
  socket.emit("players:init-count", otherPlayerCount);
     console.log("How many players on:", otherPlayerCount);

     socket.on("player:health", ({ value, armor, isGhost }) => {
  // broadcast to everyone except sender
  socket.broadcast.emit("player:health", {
    id: socket.id,
    value,
    armor,
    isGhost,
  });
});


socket.on("player:ready", () => {
  console.log("✅ Player ready:", socket.id);

  readyPlayers.add(socket.id);

  // Count players who are in HOME
  const homePlayers = Object.values(players).filter(
    (p) => p.scene === "home"
  );

  const totalPlayers = homePlayers.length;
  const readyCount = readyPlayers.size;

  // 🔁 Update everyone in home
  io.emit("home:readyUpdate", {
    readyCount,
    totalPlayers,
  });

  // 🎮 ALL READY → START GAME
  if (readyCount === totalPlayers && totalPlayers > 0) {
    console.log("🚀 All players ready → starting game");

    readyPlayers.clear();

    for (const [id, player] of Object.entries(players)) {
      if (player.scene !== "home") continue;

      const spawn = {
        x: Math.random() * 1600 + 100,
        y: Math.random() * 900 + 100,
      };

      io.to(id).emit("home:gameStart", { pos: spawn });

      // update server-side scene
      player.scene = "outside";
      player.pos = spawn;
    }
  }
});

  // --- Handle chat messages ---
  socket.on("chat:message", async (data) => {
    // 1. Broadcast text IMMEDIATELY for the visual bubble
    io.emit("chat:message", { 
      id: socket.id, 
      name: data.name, 
      message: data.message 
    });

     // --- Send all existing players to new client ---
    try {
      // 2. Start generating Rachel's voice
      const audioStream = await elevenlabs.generate({
        voice: "NOpBlnGInO9m6vDvFkFC",
        text: data.message,
        model_id: "eleven_turbo_v2_5"
      });

      // 3. Convert the audio stream into a Base64 string
      const chunks = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);
      const base64Audio = audioBuffer.toString('base64');

      // 4. Send the audio data to everyone
      io.emit("chat:audio", { id: socket.id, audio: base64Audio });
    } catch (err) {
      console.error("ElevenLabs API Error:", err);
    }
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

socket.on("player:shoot", (data) => {
  io.emit("player:shoot", {
    id: socket.id,
    ...data,
  });
  console.log("Player : shot");
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

console.log("Socket.io server running on port 3000");
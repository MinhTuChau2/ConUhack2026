import { io } from "socket.io-client";
export const socket = io("http://localhost:3000");
//export const socket = io("http://192.168.1.176:3000");
//export const socket = io("http://192.168.1.197:3000");
//export const socket = io("http://172.30.105.139:3000");
socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
});

export function registerPlayer(name, pos) {
  socket.emit("registerPlayer", { name, pos });

  socket.on("playerRegistered", (player) => {
    console.log("You are registered:", player);
  });

  socket.on("players:init", (allPlayers) => {
    console.log("Existing players:", allPlayers);
  });

  socket.on("player:joined", (player) => {
    console.log("A new player joined:", player);
  });

  socket.on("player:moved", ({ id, pos }) => {
    console.log(`${id} moved to`, pos);
  });

  socket.on("player:left", (id) => {
    console.log(`${id} left the game`);
  });
}

export function sendPlayerMove({ x, y, scene, dir }) {
  socket.emit("player:move", { x, y, scene, dir });
}
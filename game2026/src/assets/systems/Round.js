// Round.js
export default function makeRound(k, currentPlayer, otherPlayers, socket) {
  let roundActive = false;

  // Random spawn points for outside
  const spawnPoints = [
    { x: 200, y: 200 },
    { x: 1720, y: 200 },
    { x: 200, y: 880 },
    { x: 1720, y: 880 },
    { x: 960, y: 540 },
  ];

  function tryStartRound() {
    const players = [currentPlayer, ...Object.values(otherPlayers)];
    const allReady = players.every(p => p.currentScene === "outside" && !p.isGhost);
    if (allReady && !roundActive) startRound(players);
  }

  function startRound(players) {
  roundActive = true;
  console.log("[ROUND] Starting!");

  const availableSpawns = [...spawnPoints];

  players.forEach(p => {
    const idx = Math.floor(Math.random() * availableSpawns.length);
    const spawn = availableSpawns.splice(idx, 1)[0]; // remove used
    p.pos = k.vec2(spawn.x, spawn.y);
    p.health = 100;
    p.armor = 100;
    p.isGhost = false;
    if (p.area) p.area.solid = true;
    if (p.outfit) p.outfit.opacity = 1;
    p.opacity = 1;

    if (p === currentPlayer) p.bindShooting();

    // reset movement flag
    p.hasMoved = false;
  });
}


  function checkRoundEnd() {
    if (!roundActive) return;

    const players = [currentPlayer, ...Object.values(otherPlayers)];
    const alive = players.filter(p => !p.isGhost);

    if (alive.length <= 1) {
      roundActive = false;
      console.log("[ROUND] Ended!", alive[0]?.isGhost ? "No winners" : `Winner: ${alive[0]}`);

      players.forEach(p => {
        p.currentScene = "home";
        p.pos = k.vec2(960, 540);
        p.health = 100;
        p.armor = 100;
        p.isGhost = false;
        if (p.area) p.area.solid = true;
        if (p.outfit) p.outfit.opacity = 1;
        p.opacity = 1;
      });

      k.go("home");
    }
  }

  // Call this when player enters outside
  function playerEnterOutside(player) {
    player.currentScene = "outside";
    tryStartRound();
  }

  // Call this when a player dies
  function playerGhosted(player) {
    checkRoundEnd();
  }

  return { playerEnterOutside, playerGhosted };
}

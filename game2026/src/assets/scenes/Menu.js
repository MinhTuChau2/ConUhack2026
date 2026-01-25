import { socket } from "../network/network.js";

export default function MenuScene(onSubmit) {
  // --- Create menu container ---
  const menuDiv = document.createElement("div");
  menuDiv.classList.add("menu-screen");
  document.body.appendChild(menuDiv);

  // --- Input ---
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter your name";
  input.classList.add("menu-input");
  menuDiv.appendChild(input);

  // --- Button ---
  const button = document.createElement("button");
  button.textContent = "Start Game";
  button.classList.add("menu-button");
  menuDiv.appendChild(button);

  const startGame = () => {
    const name = input.value.trim();
    if (!name) return alert("You must enter a name!");

    socket.emit("player:join", { name });
    menuDiv.remove();
    if (onSubmit) onSubmit(name);
  };

  button.addEventListener("click", startGame);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startGame();
  });

  input.focus();

  // --- Styles ---
  const style = document.createElement("style");
  style.textContent = `
    .menu-screen {
  position: fixed;
  inset: 0;

  background-image: url("./sprites/BG.png");
  background-repeat: no-repeat;

  /* 2 horizontal frames */
  background-size: 200% 100%;
  background-position: 0% 0%;

  /* Hard switch between frames */
  animation: bgAnim 1s steps(2) infinite;

  /* Dark overlay for contrast */
  box-shadow: inset 0 0 0 1000px rgba(0,0,0,0.35);

  /* Center everything like a game menu */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  /* Pixelated effect */
  image-rendering: pixelated;
}

/* LEFT → RIGHT frame */
@keyframes bgAnim {
  from { background-position: 0% 0%; }   /* frame 1 (left) */
  to   { background-position: 200% 0%; } /* frame 2 (right) */
}

/* Input box */
.menu-input {
  font-family: "Press Start 2P", monospace; /* retro pixel font */
  font-size: 16px;
  padding: 10px;
  margin-bottom: 20px;
  width: 260px;
  border: 3px solid #fff; /* chunky border */
  background-color: #222; /* dark background */
  color: #fff;
  text-align: center;
  outline: none;
  box-shadow: 4px 4px 0 #000; /* retro 3D pixel shadow */
}

/* Button */
.menu-button {
  font-family: "Press Start 2P", monospace;
  font-size: 16px;
  padding: 10px 20px;
  cursor: pointer;
  border: 3px solid #fff;
  background-color: #954caf;
  color: white;
  text-shadow: 2px 2px #000;
  box-shadow: 4px 4px 0 #000;
  transition: transform 0.1s steps(1), background-color 0.1s steps(1);
}

/* Button hover effect */
.menu-button:hover {
  background-color: #4557a0;
  transform: translate(-2px, -2px); /* chunky retro move */
}

  `;
  document.head.appendChild(style);
}

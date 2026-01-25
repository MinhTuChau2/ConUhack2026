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

  /* Two frames side-by-side */
  background-size: 200% 100%;
  background-position: 0% 0%; /* start on LEFT frame */

  /* Hard frame switching */
  animation: bgAnim 1s steps(2) infinite;

  /* Dark overlay */
  box-shadow: inset 0 0 0 1000px rgba(0,0,0,0.35);

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* LEFT → RIGHT frame */
@keyframes bgAnim {
  from { background-position: 0% 0%; }     /* frame 1 (left) */
  to   { background-position: 200% 0%; }   /* frame 2 (right) */
}

.menu-input {
  font-size: 24px;
  padding: 12px;
  margin-bottom: 20px;
  width: 300px;
  border-radius: 8px;
  border: none;
  outline: none;
  text-align: center;
}

.menu-button {
  font-size: 24px;
  padding: 12px 26px;
  cursor: pointer;
  border-radius: 8px;
  border: none;
  background-color: #4CAF50;
  color: white;
  transition: transform 0.15s ease, background-color 0.2s ease;
}

.menu-button:hover {
  background-color: #45a049;
  transform: scale(1.05);
}

  `;
  document.head.appendChild(style);
}

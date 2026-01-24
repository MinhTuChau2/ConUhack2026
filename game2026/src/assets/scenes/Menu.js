import { socket } from "../network/network.js";

export default function MenuScene(onSubmit) {
  // --- Create menu container ---
  const menuDiv = document.createElement("div");
  menuDiv.classList.add("menu-screen");
  document.body.appendChild(menuDiv);

  // --- Create input ---
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter your name";
  input.classList.add("menu-input");
  menuDiv.appendChild(input);

  // --- Create start button ---
  const button = document.createElement("button");
  button.textContent = "Start Game";
  button.classList.add("menu-button");
  menuDiv.appendChild(button);

  // --- Function to handle submission ---
  const startGame = () => {
    const name = input.value.trim();
    if (!name) return alert("You must enter a name!");

    socket.emit("player:join", { name });
    console.log("Sent name to server:", name);

    // Remove menu
    menuDiv.remove();

    // Start the game
    if (onSubmit) onSubmit(name);
  };

  // --- Events ---
  button.addEventListener("click", startGame);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startGame();
  });

  // --- Auto-focus input ---
  input.focus();

  // --- Add CSS styles dynamically ---
  const style = document.createElement("style");
  style.textContent = `
    .menu-screen {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.85);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      transition: opacity 0.3s ease;
    }
    .menu-input {
      font-size: 24px;
      padding: 10px;
      margin-bottom: 20px;
      width: 300px;
      max-width: 80%;
      border-radius: 6px;
      border: none;
      outline: none;
    }
    .menu-button {
      font-size: 24px;
      padding: 10px 20px;
      cursor: pointer;
      border-radius: 6px;
      border: none;
      background-color: #4CAF50;
      color: white;
      transition: background-color 0.2s ease;
    }
    .menu-button:hover {
      background-color: #45a049;
    }
  `;
  document.head.appendChild(style);
}
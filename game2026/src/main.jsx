import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import initGame from "./initgame";
import ReactUi from "./reactUi";
import { store } from "./store";
import { Provider } from "jotai";

const ui = document.getElementById("ui");
const root = createRoot(ui);
root.render(
    <StrictMode>
        <Provider store={store}>
        <ReactUi /> 
        </Provider>
    </StrictMode>
)

initGame()

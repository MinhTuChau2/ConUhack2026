import kaplay from 'kaplay';


export default function makeKaplayCtx() {
    return kaplay({
        global: false,
        pixelDensity: 2,
        touchToMouse: true,
        debug: true, // Change when deployed
        debugKey: "f1",
        canvas: document.getElementById("game")
    })
}
import { store, carDecayAtom } from "../../store";

export default function makeCar(k, pos, spriteName) {
  const envMultiplier =
    spriteName === "civic" ? 1.5 :
    spriteName === "prologue" ? 0.9 :
    1;

  const car = k.add([
    k.sprite(spriteName),
    k.pos(pos),
    k.scale(3.5),
    k.anchor("center"),

    k.area({
      shape: new k.Rect(k.vec2(0), 28, 14),
      solid: true,
    }),

    "car",
    {
      speed: 520,
      driver: null,
      directionName: "drive-down",
      envMultiplier,
    },
  ]);

  // -----------------------------
  // ENTER / EXIT WITH E
  // -----------------------------
  k.onKeyPress("e", () => {
    const player = k.get("player")[0];
    if (!player) return;

    // 🚗 ENTER
    if (!car.driver && !player.isInCar) {
      if (player.pos.dist(car.pos) < 36) {
        car.driver = player;
        player.isInCar = true;
        player.hidden = true;

        // 🌍 APPLY CAR DECAY
        store.set(carDecayAtom, car.envMultiplier);

        return;
      }
    }

    // 🚶 EXIT
    if (car.driver === player) {
      car.driver = null;
      player.isInCar = false;
      player.hidden = false;

      // 🌍 RESET DECAY
      store.set(carDecayAtom, 1);

      // place player next to car
      player.pos = car.pos.add(k.vec2(28, 0));
    }
  });

  // -----------------------------
  // CAR UPDATE
  // -----------------------------
  car.onUpdate(() => {
    if (!car.driver) return;

    let dx = 0;
    let dy = 0;

    if (k.isKeyDown("w")) dy -= 1;
    if (k.isKeyDown("s")) dy += 1;
    if (k.isKeyDown("a")) dx -= 1;
    if (k.isKeyDown("d")) dx += 1;

    const moving = dx !== 0 || dy !== 0;

    // 🧭 Direction logic
    if (dx < 0 && dy < 0) car.directionName = "drive-left-up";
    else if (dx < 0 && dy > 0) car.directionName = "drive-left-down";
    else if (dx > 0 && dy < 0) car.directionName = "drive-right-up";
    else if (dx > 0 && dy > 0) car.directionName = "drive-right-down";
    else if (dx < 0) car.directionName = "drive-left";
    else if (dx > 0) car.directionName = "drive-right";
    else if (dy < 0) car.directionName = "drive-up";
    else if (dy > 0) car.directionName = "drive-down";

    const anim = moving
      ? car.directionName
      : `${car.directionName}-idle`;

    if (car.getCurAnim()?.name !== anim) {
      car.play(anim);
    }

    //  MOVE
    if (moving) {
      const dir = k.vec2(dx, dy).unit();
      car.move(dir.scale(car.speed));
    }

    // 👤 Player rides car
    car.driver.pos = car.pos;
  });

  return car;
}
import { PALETTE } from "../../constants";

export default function makeSection(k, posVec2, sectionName, onCollide = null, sprite = null) {
  // Main section entity
  const components = [
    k.pos(posVec2),
    k.anchor("center"),
    k.area({ solid: false }), // allows collision/interactions
    sectionName,
  ];

  // If a sprite is provided, use it
  if (sprite) {
    components.push(k.sprite(sprite));
  } else {
    // fallback: simple rectangle
    components.push(
      k.rect(200, 200, { radius: 10 }),
      k.color(PALETTE.color1)
    );
  }

  const section = k.add(components);

  // Optional text label (as a separate entity to avoid width conflict)
  if (!sprite) {
    k.add([
      k.text(sectionName, { font: "ibm-bold", size: 64 }),
      k.pos(posVec2.x, posVec2.y - 150),
      k.anchor("center"),
      k.color(PALETTE.color1),
    ]);
  }

  // Collision/interaction
  if (onCollide) {
    const onCollideHandler = section.onCollide("player", () => {
      onCollide(section);
      onCollideHandler.cancel();
    });
  }

  return section;
}
export default function makeHealthBar(k, { x, y, width, height, health }) {
  // Background
  const bg = k.add([
    k.rect(width, height),
    k.pos(x, y),
    k.color(40, 40, 40),
    k.fixed(),        // 🚨 REQUIRED
    k.z(9999),        // 🚨 FORCE TOP
  ]);

  // Foreground
  const bar = k.add([
    k.rect(width, height),
    k.pos(x, y),
    k.color(220, 60, 60),
    k.fixed(),        // 🚨 REQUIRED
    k.z(10000),
  ]);

  bar.onUpdate(() => {
    const ratio = health.current / health.max;
    bar.width = Math.max(0, width * ratio);
  });

  return { bg, bar };
}

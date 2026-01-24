// systems/Health.js
export default function makeHealth(max = 100) {
  return {
    max,
    current: max,

    // Deal damage
    damage(amount) {
      this.current = Math.max(0, this.current - amount);
    },

    // Heal health
    heal(amount) {
      this.current = Math.min(this.max, this.current + amount);
    },

    // Directly set health
    set(value) {
      this.current = Math.max(0, Math.min(this.max, value));
    },

    // Ratio for health bar (0–1)
    ratio() {
      return this.current / this.max;
    },
  };
}

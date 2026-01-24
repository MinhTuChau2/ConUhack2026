export const PALETTE = {
   color1: "#8ED6FF", // sky
 color2: "#4F4F4F", // vegetation (dark grey)
color3: "#1E1E1E", // earth (near-black)

  color4: "#1ABC9C", // water
  color5: "#F1C40F", // sunlight
    color6: "#5D6D7E", // polluted sky
  color7: "#6E7B58", // sick vegetation
  color8: "#5C4033", // dry earth
  color9: "#566573", // dirty water
  color10: "#922B21", // danger accent
};

export const DIAGONAL_FACTOR = 1 / Math.sqrt(2);
export const ZOOM_MAX_BOUND = 2;
export const ZOOM_MIN_BOUND = 0.2;
//export const WORLD_WIDTH = 2000;  // width of your world
//export const WORLD_HEIGHT = 2000; // height of your world
export const BASE_MENTAL_DECAY = 0.0008;

export const OUTFIT_DECAY_MODIFIER = {
  outfit1: 0.4, // Handmade clothes (best)
  outfit2: 0.6, // Second-hand
  outfit3: 0.8, // Local brands
  outfit4: 1.6, // Fast fashion (worst)
  outfit5: 0.5, // Vintage
  none: 1.0,    // No outfit
};
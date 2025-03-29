/**
 * Utility functions for color manipulation in the game
 */

/**
 * Creates a rgba color string
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @param {number} a - Alpha component (0-1)
 * @returns {string} - RGBA color string
 */
export const rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`;

/**
 * Creates a hex color string
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {string} - Hex color string
 */
export const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Creates a gradient color between two colors based on a progress value
 * @param {number} r1 - Start red component (0-255)
 * @param {number} g1 - Start green component (0-255)
 * @param {number} b1 - Start blue component (0-255)
 * @param {number} r2 - End red component (0-255)
 * @param {number} g2 - End green component (0-255)
 * @param {number} b2 - End blue component (0-255)
 * @param {number} progress - Progress from 0 to 1
 * @param {number} alpha - Alpha value from 0 to 1
 * @returns {string} - RGBA color string
 */
export const gradientColor = (r1, g1, b1, r2, g2, b2, progress, alpha = 1) => {
  const r = Math.round(r1 + (r2 - r1) * progress);
  const g = Math.round(g1 + (g2 - g1) * progress);
  const b = Math.round(b1 + (b2 - b1) * progress);
  return rgba(r, g, b, alpha);
};

/**
 * Creates a color palette for themed elements
 * @param {string} baseColor - Base hex color
 * @returns {Object} - Color palette with variants
 */
export const createPalette = (baseColor) => {
  // Convert hex to RGB
  const r = parseInt(baseColor.substring(1, 3), 16);
  const g = parseInt(baseColor.substring(3, 5), 16);
  const b = parseInt(baseColor.substring(5, 7), 16);
  
  return {
    base: baseColor,
    light: rgbToHex(Math.min(r + 40, 255), Math.min(g + 40, 255), Math.min(b + 40, 255)),
    dark: rgbToHex(Math.max(r - 40, 0), Math.max(g - 40, 0), Math.max(b - 40, 0)),
    transparent: rgba(r, g, b, 0.5),
    veryTransparent: rgba(r, g, b, 0.2)
  };
};

// Predefined palettes
export const COLOR_PALETTES = {
  player: createPalette('#5183f5'),  // Blue
  tagged: createPalette('#ff6b6b'),  // Red
  hazard: createPalette('#8a2be2'),  // Purple
  energy: createPalette('#4ade80'),  // Green
  explosion: createPalette('#fbbf24') // Amber
};
/**
 * Math utility functions for the game graphics
 */

/**
 * Get a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random number in range
 */
export const randomRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

/**
 * Get a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random integer in range
 */
export const randomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Calculate the distance between two points
 * @param {number} x1 - First point x coordinate
 * @param {number} y1 - First point y coordinate
 * @param {number} x2 - Second point x coordinate
 * @param {number} y2 - Second point y coordinate
 * @returns {number} - Distance between points
 */
export const distance = (x1, y1, x2, y2) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} - Interpolated value
 */
export const lerp = (a, b, t) => {
  return a + (b - a) * t;
};

/**
 * Converts degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} - Angle in radians
 */
export const degToRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Clamps a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Generates points for a regular polygon
 * @param {number} sides - Number of sides
 * @param {number} radius - Radius of polygon
 * @param {number} offsetAngle - Offset angle in radians
 * @returns {Array} - Array of [x, y] point pairs
 */
export const regularPolygon = (sides, radius, offsetAngle = 0) => {
  const points = [];
  for (let i = 0; i < sides; i++) {
    const angle = offsetAngle + (Math.PI * 2 * i) / sides;
    points.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
  }
  return points;
};

/**
 * Easing function: ease out quad
 * @param {number} t - Value between 0 and 1
 * @returns {number} - Eased value
 */
export const easeOutQuad = (t) => {
  return t * (2 - t);
};

/**
 * Easing function: ease in quad
 * @param {number} t - Value between 0 and 1
 * @returns {number} - Eased value
 */
export const easeInQuad = (t) => {
  return t * t;
};

/**
 * Easing function: ease in out quad
 * @param {number} t - Value between 0 and 1
 * @returns {number} - Eased value
 */
export const easeInOutQuad = (t) => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};
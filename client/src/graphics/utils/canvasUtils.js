/**
 * Canvas utility functions for drawing operations
 */

/**
 * Draw a rounded rectangle on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {number} radius - Corner radius
 * @param {boolean} fill - Whether to fill the rectangle
 * @param {boolean} stroke - Whether to stroke the rectangle
 */
export const roundRect = (ctx, x, y, width, height, radius, fill = true, stroke = false) => {
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  
  if (fill) {
    ctx.fill();
  }
  
  if (stroke) {
    ctx.stroke();
  }
};

/**
 * Draw a line with glow effect
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} x1 - Start x coordinate
 * @param {number} y1 - Start y coordinate
 * @param {number} x2 - End x coordinate
 * @param {number} y2 - End y coordinate
 * @param {string} color - Line color
 * @param {string} glowColor - Glow color
 * @param {number} width - Line width
 * @param {number} glowWidth - Glow width
 */
export const drawGlowingLine = (ctx, x1, y1, x2, y2, color, glowColor, width = 2, glowWidth = 10) => {
  ctx.save();
  
  // Draw glow
  ctx.beginPath();
  ctx.lineWidth = glowWidth;
  ctx.strokeStyle = glowColor;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Draw core line
  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  ctx.restore();
};

/**
 * Draw text with a backdrop
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {string} text - Text to draw
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} fillStyle - Text color
 * @param {string} backdropFill - Backdrop fill color
 * @param {number} padding - Padding around text
 * @param {string} font - Font specification
 */
export const drawTextWithBackdrop = (ctx, text, x, y, fillStyle, backdropFill, padding = 5, font = null) => {
  ctx.save();
  
  if (font) {
    ctx.font = font;
  }
  
  const textMetrics = ctx.measureText(text);
  const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
  
  // Draw backdrop
  ctx.fillStyle = backdropFill;
  roundRect(
    ctx,
    x - textMetrics.width / 2 - padding,
    y - textHeight - padding,
    textMetrics.width + padding * 2,
    textHeight + padding * 2,
    5
  );
  
  // Draw text
  ctx.fillStyle = fillStyle;
  ctx.fillText(text, x, y);
  
  ctx.restore();
};

/**
 * Draw a dashed circle
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} x - Center x coordinate
 * @param {number} y - Center y coordinate
 * @param {number} radius - Circle radius
 * @param {Array<number>} dashPattern - Dash pattern array
 * @param {string} strokeStyle - Stroke color
 * @param {number} lineWidth - Line width
 */
export const drawDashedCircle = (ctx, x, y, radius, dashPattern, strokeStyle, lineWidth = 1) => {
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dashPattern);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
};

/**
 * Draw a gradient circle
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {number} x - Center x coordinate
 * @param {number} y - Center y coordinate
 * @param {number} radius - Circle radius
 * @param {string} innerColor - Inner color
 * @param {string} outerColor - Outer color
 */
export const drawGradientCircle = (ctx, x, y, radius, innerColor, outerColor) => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(1, outerColor);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
};
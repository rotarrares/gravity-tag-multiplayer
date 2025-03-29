/**
 * Grid-based spatial partitioning system for optimizing physics calculations
 */
const { GAME_CONSTANTS } = require('../constants');

class SpatialGrid {
  constructor(cellSize = 300) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(GAME_CONSTANTS.ARENA_WIDTH / this.cellSize);
    this.rows = Math.ceil(GAME_CONSTANTS.ARENA_HEIGHT / this.cellSize);
    this.grid = new Array(this.cols * this.rows).fill().map(() => []);
  }

  // Clear the grid
  clear() {
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i] = [];
    }
  }

  // Get cell index from world coordinates
  getCellIndex(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    
    // Clamp indices to grid bounds
    const clampedCol = Math.max(0, Math.min(col, this.cols - 1));
    const clampedRow = Math.max(0, Math.min(row, this.rows - 1));
    
    return clampedRow * this.cols + clampedCol;
  }

  // Insert an object into the grid
  insert(object) {
    const cellIndex = this.getCellIndex(object.x, object.y);
    this.grid[cellIndex].push(object);
    return cellIndex;
  }

  // Get all objects in a cell and its neighboring cells
  getNeighborhood(x, y, range = 1) {
    const centerCellIndex = this.getCellIndex(x, y);
    const centerCol = centerCellIndex % this.cols;
    const centerRow = Math.floor(centerCellIndex / this.cols);
    
    const result = [];
    
    // Get objects from this cell and neighboring cells
    for (let rowOffset = -range; rowOffset <= range; rowOffset++) {
      for (let colOffset = -range; colOffset <= range; colOffset++) {
        const row = centerRow + rowOffset;
        const col = centerCol + colOffset;
        
        // Skip cells outside the grid
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
          continue;
        }
        
        const cellIndex = row * this.cols + col;
        result.push(...this.grid[cellIndex]);
      }
    }
    
    return result;
  }

  // Update the grid with new positions of all objects
  update(objects) {
    this.clear();
    for (const object of objects) {
      this.insert(object);
    }
  }

  // Get all objects within a given radius
  getObjectsInRadius(x, y, radius) {
    // Determine the range of cells to check based on radius
    const cellRange = Math.ceil(radius / this.cellSize);
    const candidates = this.getNeighborhood(x, y, cellRange);
    
    // Filter objects within the actual radius
    return candidates.filter(obj => {
      const dx = obj.x - x;
      const dy = obj.y - y;
      const distSquared = dx * dx + dy * dy;
      return distSquared <= radius * radius;
    });
  }
}

module.exports = SpatialGrid;

/**
 * Object pooling system for reducing garbage collection overhead
 */

class ObjectPool {
  constructor(objectType, initialSize = 10, resetMethod = null) {
    this.objectType = objectType;
    this.pool = [];
    this.resetMethod = resetMethod || ((obj) => {
      // Default reset just clears all properties to undefined
      for (const prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
          obj[prop] = undefined;
        }
      }
      return obj;
    });
    
    // Initialize the pool with the specified number of objects
    this.expand(initialSize);
  }
  
  // Create a new object of the proper type
  createObject() {
    return new this.objectType();
  }
  
  // Add more objects to the pool
  expand(count) {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.createObject());
    }
  }
  
  // Get an object from the pool, or create a new one if none available
  get() {
    if (this.pool.length === 0) {
      // Expand the pool if it's empty
      this.expand(Math.max(5, Math.floor(this.pool.length * 0.5)));
    }
    
    return this.pool.pop();
  }
  
  // Return an object to the pool after resetting it
  release(obj) {
    if (obj) {
      this.resetMethod(obj);
      this.pool.push(obj);
    }
  }
  
  // Current size of the pool (not including objects in use)
  get size() {
    return this.pool.length;
  }
}

// Vector object for reuse in physics calculations
class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  // Set vector values
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
  
  // Copy values from another vector
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }
  
  // Calculate magnitude
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  
  // Calculate squared magnitude (faster)
  magnitudeSquared() {
    return this.x * this.x + this.y * this.y;
  }
  
  // Normalize the vector
  normalize() {
    const mag = this.magnitude();
    if (mag > 0) {
      this.x /= mag;
      this.y /= mag;
    }
    return this;
  }
  
  // Add another vector
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  
  // Subtract another vector
  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  
  // Scale vector by a factor
  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
}

// Create pools for commonly used types
const vectorPool = new ObjectPool(Vector2D, 50, (v) => v.set(0, 0));

// Export pools for use in other modules
module.exports = {
  ObjectPool,
  Vector2D,
  vectorPool,
};

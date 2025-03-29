/**
 * Performance optimization utilities for client-side rendering
 */

// Performance settings
let settings = {
  maxFPS: 60,
  particleEffects: true,
  backgroundAnimation: true,
  smoothMovement: true,
  highQualityGravityWells: false,
  resolution: 1.0
};

// FPS limiting
let lastFrameTime = 0;
const fpsInterval = {}; // Store by ID to support multiple render loops

// Initialize FPS limiter for a specific render loop
export const initFrameRateLimiter = (id, fps = settings.maxFPS) => {
  fpsInterval[id] = 1000 / fps;
  lastFrameTime = 0;
  return fpsInterval[id];
};

// Check if we should render a new frame based on FPS limit
export const shouldRenderFrame = (id, timestamp) => {
  // No FPS limiting
  if (!fpsInterval[id]) {
    return true;
  }
  
  // First frame
  if (!lastFrameTime) {
    lastFrameTime = timestamp;
    return true;
  }
  
  // Check if enough time has passed since last frame
  const elapsed = timestamp - lastFrameTime;
  
  if (elapsed > fpsInterval[id]) {
    // Enough time has passed, render new frame
    lastFrameTime = timestamp - (elapsed % fpsInterval[id]);
    return true;
  }
  
  // Not enough time has passed
  return false;
};

// Get current graphics settings
export const getGraphicsSettings = () => {
  return { ...settings };
};

// Set graphics settings
export const setGraphicsSettings = (newSettings) => {
  settings = { ...settings, ...newSettings };
  
  // Apply FPS limit to all render loops
  Object.keys(fpsInterval).forEach(id => {
    fpsInterval[id] = 1000 / settings.maxFPS;
  });
  
  return settings;
};

// Load settings from localStorage
export const loadSavedSettings = () => {
  try {
    const savedSettings = localStorage.getItem('performanceSettings');
    if (savedSettings) {
      settings = { ...settings, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error('Error loading performance settings:', error);
  }
  return settings;
};

// Calculate particle count based on performance settings
export const getParticleCount = (baseCount) => {
  if (!settings.particleEffects) {
    return 0;
  }
  
  if (settings.highQualityGravityWells) {
    return baseCount;
  }
  
  return Math.floor(baseCount * 0.4); // 40% of particles in medium quality
};

// Decide whether to use motion interpolation based on settings
export const useInterpolation = () => {
  return settings.smoothMovement;
};

// Interpolate between two positions for smooth movement
export const interpolatePosition = (oldPos, newPos, factor) => {
  if (!settings.smoothMovement) {
    return newPos;
  }
  
  return {
    x: oldPos.x + (newPos.x - oldPos.x) * factor,
    y: oldPos.y + (newPos.y - oldPos.y) * factor
  };
};

// Object pool for particles
const particlePool = [];

// Get a particle from the pool or create a new one
export const getParticle = (properties = {}) => {
  if (particlePool.length > 0) {
    const particle = particlePool.pop();
    // Reset particle
    particle.life = 1.0;
    particle.x = 0;
    particle.y = 0;
    particle.vx = 0;
    particle.vy = 0;
    particle.size = 1;
    particle.color = '#ffffff';
    
    // Apply properties
    Object.assign(particle, properties);
    
    return particle;
  }
  
  // Create a new particle
  return {
    life: 1.0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 1,
    color: '#ffffff',
    ...properties
  };
};

// Return a particle to the pool
export const releaseParticle = (particle) => {
  if (particle && particlePool.length < 1000) { // Limit pool size
    particlePool.push(particle);
  }
};

// Initialize listeners for performance settings changes
export const initPerformanceListeners = () => {
  window.addEventListener('performanceSettingsChanged', (event) => {
    const { settings: newSettings } = event.detail;
    setGraphicsSettings(newSettings);
  });
  
  // Initial load
  loadSavedSettings();
};

import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../contexts/SocketContext';

const PerformanceSettings = () => {
  const socket = useContext(SocketContext);
  const [performanceMode, setPerformanceMode] = useState('balanced');
  const [maxFPS, setMaxFPS] = useState(60);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Performance presets
  const performancePresets = {
    'low': {
      maxFPS: 30,
      particleEffects: false,
      backgroundAnimation: false,
      smoothMovement: false,
      highQualityGravityWells: false,
      resolution: 0.5
    },
    'balanced': {
      maxFPS: 60,
      particleEffects: true,
      backgroundAnimation: true,
      smoothMovement: true,
      highQualityGravityWells: false,
      resolution: 1.0
    },
    'high': {
      maxFPS: 120,
      particleEffects: true,
      backgroundAnimation: true,
      smoothMovement: true,
      highQualityGravityWells: true,
      resolution: 1.0
    }
  };
  
  // Apply the selected performance mode
  const applyPerformanceMode = (mode) => {
    const settings = performancePresets[mode];
    
    // Send settings to server
    socket.emit('setPerformanceMode', { mode });
    
    // Apply client-side settings
    setMaxFPS(settings.maxFPS);
    
    // Set CSS variable for resolution scale
    document.documentElement.style.setProperty(
      '--resolution-scale', 
      settings.resolution
    );
    
    // Store settings in local storage
    localStorage.setItem('performanceMode', mode);
    localStorage.setItem('performanceSettings', JSON.stringify(settings));
    
    // Emit event for other components to update
    window.dispatchEvent(new CustomEvent('performanceSettingsChanged', {
      detail: { mode, settings }
    }));
  };
  
  // Load saved settings on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('performanceMode') || 'balanced';
    setPerformanceMode(savedMode);
    applyPerformanceMode(savedMode);
    
    // Listen for confirmation from server
    socket.on('performanceModeSet', ({ mode }) => {
      console.log(`Performance mode set to ${mode} on the server`);
    });
    
    return () => {
      socket.off('performanceModeSet');
    };
  }, [socket]);
  
  // Handle performance mode change
  const handleModeChange = (e) => {
    const newMode = e.target.value;
    setPerformanceMode(newMode);
    applyPerformanceMode(newMode);
  };
  
  return (
    <div className="performance-settings">
      <h3>Performance Settings</h3>
      
      <div className="preset-selector">
        <label htmlFor="performance-mode">Graphics Quality:</label>
        <select 
          id="performance-mode" 
          value={performanceMode} 
          onChange={handleModeChange}
        >
          <option value="low">Low (Better Performance)</option>
          <option value="balanced">Balanced</option>
          <option value="high">High (Better Graphics)</option>
        </select>
      </div>
      
      <button 
        className="toggle-advanced"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
      </button>
      
      {showAdvanced && (
        <div className="advanced-settings">
          <div className="setting-group">
            <label htmlFor="max-fps">Max FPS: {maxFPS}</label>
            <input 
              type="range" 
              id="max-fps" 
              min="15" 
              max="144" 
              step="15"
              value={maxFPS}
              onChange={(e) => setMaxFPS(parseInt(e.target.value))}
            />
          </div>
          
          <div className="setting-info">
            <p>Current Settings:</p>
            <ul>
              <li>Frame Rate: {performancePresets[performanceMode].maxFPS} FPS</li>
              <li>Particle Effects: {performancePresets[performanceMode].particleEffects ? 'On' : 'Off'}</li>
              <li>Background Animation: {performancePresets[performanceMode].backgroundAnimation ? 'On' : 'Off'}</li>
              <li>Smooth Movement: {performancePresets[performanceMode].smoothMovement ? 'On' : 'Off'}</li>
              <li>High Quality Gravity Wells: {performancePresets[performanceMode].highQualityGravityWells ? 'On' : 'Off'}</li>
              <li>Resolution Scale: {performancePresets[performanceMode].resolution * 100}%</li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="performance-tips">
        <p><strong>Performance Tips:</strong></p>
        <ul>
          <li>Lower settings if you experience lag or stuttering</li>
          <li>Mobile devices should use Low or Balanced</li>
          <li>Close other browser tabs for better performance</li>
        </ul>
      </div>
    </div>
  );
};

export default PerformanceSettings;

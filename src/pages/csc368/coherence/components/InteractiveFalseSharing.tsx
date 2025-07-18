import { useState, useRef, useEffect } from 'react';

interface InteractiveFalseSharingProps {
  width?: number;
  height?: number;
  className?: string;
}

type CacheLineOwner = 'P1' | 'P2' | null;
type AnimationState = 'idle' | 'p1-write' | 'p2-write' | 'auto-ping-pong';
type MSIState = 'Modified' | 'Shared' | 'Invalid';

interface CoreState {
  msiState: MSIState;
  hasData: boolean;
  isAnimating: boolean;
}

interface FalseSharingScenario {
  name: string;
  description: string;
  p1Variable: string;
  p2Variable: string;
  cacheLineLayout: {
    variables: string[];
    colors: string[];
  };
  educationalNote: string;
}

export function InteractiveFalseSharing({ 
  width = 1200, 
  height = 700, 
  className = "" 
}: InteractiveFalseSharingProps) {
  // Scenario definitions
  const scenarios: FalseSharingScenario[] = [
    {
      name: "Classic False Sharing",
      description: "Two global variables in the same cache line causing false sharing",
      p1Variable: "gVar1",
      p2Variable: "gVar2",
      cacheLineLayout: {
        variables: ["gVar1", "gVar2", "buffer", "temp"],
        colors: ["#fb923c", "#34d399", "#94a3b8", "#a78bfa"]
      },
      educationalNote: "This is the most common false sharing scenario where two independent variables happen to be allocated in the same cache line."
    },
    {
      name: "Array Elements",
      description: "Adjacent array elements accessed by different cores",
      p1Variable: "arr[0]",
      p2Variable: "arr[1]",
      cacheLineLayout: {
        variables: ["arr[0]", "arr[1]", "arr[2]", "arr[3]"],
        colors: ["#fb923c", "#34d399", "#fbbf24", "#f87171"]
      },
      educationalNote: "Array elements stored consecutively in memory can cause false sharing when different cores access adjacent elements."
    },
    {
      name: "Struct Members",
      description: "Different members of the same struct accessed by different cores",
      p1Variable: "obj.x",
      p2Variable: "obj.y",
      cacheLineLayout: {
        variables: ["obj.x", "obj.y", "obj.z", "obj.w"],
        colors: ["#fb923c", "#34d399", "#a78bfa", "#f472b6"]
      },
      educationalNote: "Struct members are typically stored together in memory, making them susceptible to false sharing."
    },
    {
      name: "Counter Variables",
      description: "Per-core counters that end up in the same cache line",
      p1Variable: "count1",
      p2Variable: "count2",
      cacheLineLayout: {
        variables: ["count1", "count2", "total", "flag"],
        colors: ["#fb923c", "#34d399", "#fbbf24", "#ef4444"]
      },
      educationalNote: "Performance counters or statistics variables can accidentally share cache lines, degrading performance."
    }
  ];

  // State management
  const [currentScenario, setCurrentScenario] = useState(0);
  const [cacheLineOwner, setCacheLineOwner] = useState<CacheLineOwner>(null);
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [isAnimating, setIsAnimating] = useState(false);
  const [accessCount, setAccessCount] = useState({ P1: 0, P2: 0 });
  const [message, setMessage] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // MSI Protocol States
  const [core1State, setCore1State] = useState<CoreState>({
    msiState: 'Invalid',
    hasData: false,
    isAnimating: false
  });
  
  const [core2State, setCore2State] = useState<CoreState>({
    msiState: 'Invalid',
    hasData: false,
    isAnimating: false
  });
  
  // Constants for grid layout
  const ROWS = 8;
  const COLS = 16;
  const CACHE_LINE_ROW = 3;
  const CACHE_LINE_START = 6;
  const CACHE_LINE_SIZE = 4;
  const ANIMATION_DURATION = 1500;

  // Reset state when scenario changes
  useEffect(() => {
    handleReset();
  }, [currentScenario]);

  const currentScenarioData = scenarios[currentScenario];
  
  // Calculate responsive dimensions for grid
  const gridWidth = 400;
  const gridHeight = 300;
  const cellSize = Math.min(gridWidth / COLS, gridHeight / ROWS);
  const gridStartX = 50;
  const gridStartY = 100;
  
  // Calculate responsive dimensions for MSI
  const msiStartX = 500;
  
  // Handle processor access - now updates both grid and MSI visualizations
  const handleP1Access = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCacheLineOwner('P1');
    setAnimationState('p1-write');
    setAccessCount(prev => ({ ...prev, P1: prev.P1 + 1 }));
    setMessage('Core 1 writing to gVar1...');
    
    // Update MSI states
    setCore1State(prev => ({ ...prev, isAnimating: true }));
    
    setTimeout(() => {
      // Core 1 gets Modified state
      setCore1State({
        msiState: 'Modified',
        hasData: true,
        isAnimating: false
      });
      
      // Core 2 becomes Invalid if it had data
      if (core2State.hasData) {
        setCore2State(prev => ({
          ...prev,
          msiState: 'Invalid',
          hasData: false
        }));
        setMessage('Core 1 invalidated Core 2\'s cache line');
      } else {
        setMessage('Core 1 now owns the cache line');
      }
      
      setIsAnimating(false);
      setAnimationState('idle');
    }, ANIMATION_DURATION);
  };
  
  const handleP2Access = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCacheLineOwner('P2');
    setAnimationState('p2-write');
    setAccessCount(prev => ({ ...prev, P2: prev.P2 + 1 }));
    setMessage('Core 2 writing to gVar2...');
    
    // Update MSI states
    setCore2State(prev => ({ ...prev, isAnimating: true }));
    
    setTimeout(() => {
      // Core 2 gets Modified state
      setCore2State({
        msiState: 'Modified',
        hasData: true,
        isAnimating: false
      });
      
      // Core 1 becomes Invalid if it had data
      if (core1State.hasData) {
        setCore1State(prev => ({
          ...prev,
          msiState: 'Invalid',
          hasData: false
        }));
        setMessage('Core 2 invalidated Core 1\'s cache line');
      } else {
        setMessage('Core 2 now owns the cache line');
      }
      
      setIsAnimating(false);
      setAnimationState('idle');
    }, ANIMATION_DURATION);
  };
  
  const handleAutoPingPong = () => {
    if (animationState === 'auto-ping-pong') {
      // Stop auto ping-pong
      setAnimationState('idle');
      setIsAnimating(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Start auto ping-pong
      setAnimationState('auto-ping-pong');
      let currentProcessor: 'P1' | 'P2' = 'P1';
      
      intervalRef.current = setInterval(() => {
        if (currentProcessor === 'P1') {
          handleP1Access();
        } else {
          handleP2Access();
        }
        currentProcessor = currentProcessor === 'P1' ? 'P2' : 'P1';
      }, 2000);
    }
  };
  
  // Reset function
    const handleReset = () => {
    setAccessCount({ P1: 0, P2: 0 });
    setCacheLineOwner(null);
    setAnimationState('idle');
    setIsAnimating(false);
    setMessage('');
    setCore1State({ msiState: 'Invalid', hasData: false, isAnimating: false });
    setCore2State({ msiState: 'Invalid', hasData: false, isAnimating: false });
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  
  // Helper functions for visualization
  const getCacheLineColor = () => {
    if (animationState === 'p1-write' || (cacheLineOwner === 'P1' && animationState === 'auto-ping-pong')) {
      return isAnimating ? '#ef4444' : '#3b82f6';
    } else if (animationState === 'p2-write' || (cacheLineOwner === 'P2' && animationState === 'auto-ping-pong')) {
      return isAnimating ? '#10b981' : '#3b82f6';
    }
    return '#6b7280';
  };
  
  const getProcessorHighlight = (processor: 'P1' | 'P2') => {
    if (animationState === 'auto-ping-pong') {
      return cacheLineOwner === processor && isAnimating;
    }
    return animationState === `${processor.toLowerCase()}-write` as const;
  };

  const getMSIColor = (state: MSIState) => {
    switch (state) {
      case 'Modified': return '#ef4444'; // Red
      case 'Shared': return '#10b981';   // Green
      case 'Invalid': return '#6b7280';  // Gray
      default: return '#6b7280';
    }
  };

  const getCoreHighlight = (coreId: 'P1' | 'P2') => {
    if (cacheLineOwner === coreId) {
      return '#3b82f6'; // Blue for owner
    }
    return 'transparent';
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="mb-4 text-center">
        <h4 className="text-lg font-semibold mb-2">Combined False Sharing Visualization</h4>
        <p className="text-sm text-gray-600">
          Memory grid and MSI cache coherence protocol working together
        </p>
      </div>
      
      {/* Scenario Selection */}
      <div className="mb-4 flex flex-wrap gap-4 justify-center items-center">
        <select
          value={currentScenario}
          onChange={(e) => setCurrentScenario(parseInt(e.target.value))}
          className="px-3 py-2 border rounded-lg bg-white font-medium"
        >
          {scenarios.map((scenario, index) => (
            <option key={index} value={index}>
              {scenario.name}
            </option>
          ))}
        </select>
        
        <div className="text-sm text-gray-600 max-w-md">
          <strong>{currentScenarioData.name}:</strong> {currentScenarioData.description}
        </div>
      </div>
      
      {/* Control Panel */}
      <div className="mb-6 flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleP1Access}
          disabled={isAnimating || animationState === 'auto-ping-pong'}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            getProcessorHighlight('P1') 
              ? 'bg-red-500 text-white shadow-lg animate-pulse' 
              : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400'
          }`}
        >
          P1 Access {currentScenarioData.p1Variable} ({accessCount.P1})
        </button>
        
        <button
          onClick={handleP2Access}
          disabled={isAnimating || animationState === 'auto-ping-pong'}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            getProcessorHighlight('P2') 
              ? 'bg-green-500 text-white shadow-lg animate-pulse' 
              : 'bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400'
          }`}
        >
          P2 Access {currentScenarioData.p2Variable} ({accessCount.P2})
        </button>
        
        <button
          onClick={handleAutoPingPong}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            animationState === 'auto-ping-pong' 
              ? 'bg-red-600 text-white' 
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          {animationState === 'auto-ping-pong' ? 'Stop Auto' : 'Auto Ping-Pong'}
        </button>
        
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
      
      {/* Status Display */}
      <div className="mb-4 text-center">
        <div className="text-sm font-medium">
          Cache Line Owner: {' '}
          <span className={`font-bold ${
            cacheLineOwner === 'P1' ? 'text-blue-600' : 
            cacheLineOwner === 'P2' ? 'text-green-600' : 
            'text-gray-500'
          }`}>
            {cacheLineOwner || 'None'}
          </span>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Total coherence events: {accessCount.P1 + accessCount.P2}
        </div>
        {message && (
          <div className="mt-2 text-sm font-medium text-blue-700">{message}</div>
        )}
      </div>
      
      <svg width={width} height={height} className="border rounded-lg bg-gray-50">
        {/* Left Side: Memory Grid Visualization */}
        <g>
          <text
            x={gridStartX + gridWidth/2}
            y={30}
            textAnchor="middle"
            fontSize="16"
            fill="#374151"
            className="font-bold"
          >
            Memory Grid View
          </text>
          
          {/* Grid of memory cells */}
          {Array.from({ length: ROWS }, (_, row) => 
            Array.from({ length: COLS }, (_, col) => {
              const x = gridStartX + col * cellSize;
              const y = gridStartY + row * cellSize;
              const isInCacheLine = row === CACHE_LINE_ROW && 
                                   col >= CACHE_LINE_START && 
                                   col < CACHE_LINE_START + CACHE_LINE_SIZE;
              const isP1Cell = row === CACHE_LINE_ROW && col === CACHE_LINE_START;
              const isP2Cell = row === CACHE_LINE_ROW && col === CACHE_LINE_START + 1;
              
              // Get color based on scenario and position in cache line
              let cellColor = '#e5e7eb'; // Default gray
              if (isInCacheLine) {
                const cacheLineIndex = col - CACHE_LINE_START;
                if (cacheLineIndex < currentScenarioData.cacheLineLayout.colors.length) {
                  cellColor = currentScenarioData.cacheLineLayout.colors[cacheLineIndex];
                }
              }
              
              return (
                <circle
                  key={`${row}-${col}`}
                  cx={x + cellSize/2}
                  cy={y + cellSize/2}
                  r={cellSize/3}
                  fill={
                    isP1Cell && getProcessorHighlight('P1') ? '#fca5a5' : 
                    isP2Cell && getProcessorHighlight('P2') ? '#86efac' : 
                    cellColor
                  }
                  stroke={
                    isP1Cell ? '#3b82f6' :
                    isP2Cell ? '#10b981' :
                    '#9ca3af'
                  }
                  strokeWidth={isP1Cell || isP2Cell ? 2 : 1}
                  className="transition-all duration-300"
                />
              );
            })
          )}
          
          {/* Variable labels in cache line */}
          {currentScenarioData.cacheLineLayout.variables.map((variable, index) => {
            if (index >= CACHE_LINE_SIZE) return null;
            const x = gridStartX + (CACHE_LINE_START + index) * cellSize;
            const y = gridStartY + CACHE_LINE_ROW * cellSize;
            
            return (
              <text
                key={`var-${index}`}
                x={x + cellSize/2}
                y={y + cellSize/2 + 3}
                textAnchor="middle"
                fontSize="8"
                fill="white"
                className="font-bold"
              >
                {variable}
              </text>
            );
          })}
          
          {/* Cache line outline */}
          <rect
            x={gridStartX + CACHE_LINE_START * cellSize - 3}
            y={gridStartY + CACHE_LINE_ROW * cellSize - 3}
            width={CACHE_LINE_SIZE * cellSize + 6}
            height={cellSize + 6}
            fill="none"
            stroke={getCacheLineColor()}
            strokeWidth={4}
            strokeDasharray={isAnimating ? "0" : "8,4"}
            className="transition-all duration-300"
          />
          
          {/* Cache line label */}
          <text
            x={gridStartX + (CACHE_LINE_START + CACHE_LINE_SIZE/2) * cellSize}
            y={gridStartY + CACHE_LINE_ROW * cellSize - 10}
            textAnchor="middle"
            fontSize="12"
            fill="#374151"
            className="font-semibold"
          >
            Cache Line
          </text>
        </g>
        
        {/* Right Side: MSI Cache Coherence Protocol */}
        <g>
          <text
            x={msiStartX + 200}
            y={30}
            textAnchor="middle"
            fontSize="16"
            fill="#374151"
            className="font-bold"
          >
            MSI Cache Coherence Protocol
          </text>
          
          {/* Core 1 Cache */}
          <g>
            <text
              x={msiStartX + 100}
              y={70}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              className="font-bold"
            >
              Core 1 Cache
            </text>
            
            {/* Core 1 MSI State */}
            <rect
              x={msiStartX + 30}
              y={80}
              width={140}
              height={25}
              fill={getMSIColor(core1State.msiState)}
              stroke="#374151"
              strokeWidth={1}
              rx={4}
              className="transition-all duration-300"
            />
            <text
              x={msiStartX + 100}
              y={98}
              textAnchor="middle"
              fontSize="12"
              fill="white"
              className="font-medium"
            >
              {core1State.msiState}
            </text>
            
            {/* Core 1 Cache Line with variable */}
            <rect
              x={msiStartX + 30}
              y={120}
              width={140}
              height={30}
              fill="#f3f4f6"
              stroke={getCoreHighlight('P1') || '#e5e7eb'}
              strokeWidth={getCoreHighlight('P1') ? 3 : 1}
              rx={2}
              className="transition-all duration-300"
            />
            
            {core1State.hasData && (
              <g className={core1State.msiState === 'Invalid' ? 'opacity-50' : ''}>
                <rect
                  x={msiStartX + 40}
                  y={125}
                  width={60}
                  height={20}
                  fill={currentScenarioData.cacheLineLayout.colors[0]}
                  stroke="#374151"
                  strokeWidth={1}
                  rx={2}
                />
                <text
                  x={msiStartX + 70}
                  y={138}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  className="font-medium"
                >
                  {currentScenarioData.p1Variable}
                </text>
                {core1State.msiState === 'Invalid' && (
                  <line
                    x1={msiStartX + 40}
                    y1={125}
                    x2={msiStartX + 100}
                    y2={145}
                    stroke="#dc2626"
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                )}
              </g>
            )}
          </g>
          
          {/* Core 2 Cache */}
          <g>
            <text
              x={msiStartX + 300}
              y={70}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              className="font-bold"
            >
              Core 2 Cache
            </text>
            
            {/* Core 2 MSI State */}
            <rect
              x={msiStartX + 230}
              y={80}
              width={140}
              height={25}
              fill={getMSIColor(core2State.msiState)}
              stroke="#374151"
              strokeWidth={1}
              rx={4}
              className="transition-all duration-300"
            />
            <text
              x={msiStartX + 300}
              y={98}
              textAnchor="middle"
              fontSize="12"
              fill="white"
              className="font-medium"
            >
              {core2State.msiState}
            </text>
            
            {/* Core 2 Cache Line with gVar2 */}
            <rect
              x={msiStartX + 230}
              y={120}
              width={140}
              height={30}
              fill="#f3f4f6"
              stroke={getCoreHighlight('P2') || '#e5e7eb'}
              strokeWidth={getCoreHighlight('P2') ? 3 : 1}
              rx={2}
              className="transition-all duration-300"
            />
            
            {core2State.hasData && (
              <g className={core2State.msiState === 'Invalid' ? 'opacity-50' : ''}>
                <rect
                  x={msiStartX + 300}
                  y={125}
                  width={60}
                  height={20}
                  fill={currentScenarioData.cacheLineLayout.colors[1]}
                  stroke="#374151"
                  strokeWidth={1}
                  rx={2}
                />
                <text
                  x={msiStartX + 330}
                  y={138}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  className="font-medium"
                >
                  {currentScenarioData.p2Variable}
                </text>
                {core2State.msiState === 'Invalid' && (
                  <line
                    x1={msiStartX + 300}
                    y1={125}
                    x2={msiStartX + 360}
                    y2={145}
                    stroke="#dc2626"
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                )}
              </g>
            )}
          </g>
          
          {/* Main Memory */}
          <g>
            <text
              x={msiStartX + 200}
              y={200}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              className="font-bold"
            >
              Main Memory
            </text>
            
            <rect
              x={msiStartX + 100}
              y={220}
              width={200}
              height={30}
              fill="#f9fafb"
              stroke="#374151"
              strokeWidth={2}
              rx={4}
            />
            
            {/* Variables in Memory */}
            <rect
              x={msiStartX + 110}
              y={225}
              width={50}
              height={20}
              fill={currentScenarioData.cacheLineLayout.colors[0]}
              stroke="#374151"
              strokeWidth={1}
              rx={2}
            />
            <text
              x={msiStartX + 135}
              y={238}
              textAnchor="middle"
              fontSize="10"
              fill="white"
              className="font-medium"
            >
              {currentScenarioData.p1Variable}
            </text>
            
            <rect
              x={msiStartX + 240}
              y={225}
              width={50}
              height={20}
              fill={currentScenarioData.cacheLineLayout.colors[1]}
              stroke="#374151"
              strokeWidth={1}
              rx={2}
            />
            <text
              x={msiStartX + 265}
              y={238}
              textAnchor="middle"
              fontSize="10"
              fill="white"
              className="font-medium"
            >
              {currentScenarioData.p2Variable}
            </text>
          </g>
        </g>
        
        {/* Coherence Traffic Animation */}
        {isAnimating && (
          <g>
            <circle
              cx={width/2}
              cy={height/2}
              r={30}
              fill="none"
              stroke="#ef4444"
              strokeWidth={3}
              strokeDasharray="8,4"
              className="animate-spin"
            />
            <text
              x={width/2}
              y={height/2 + 5}
              textAnchor="middle"
              fontSize="16"
              fill="#ef4444"
              className="font-bold"
            >
              ⚡
            </text>
          </g>
        )}
      </svg>
      
      {/* Scenario Educational Note */}
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg max-w-4xl">
        <h5 className="font-semibold text-green-900 mb-2">Scenario Insight: {currentScenarioData.name}</h5>
        <p className="text-sm text-green-800">{currentScenarioData.educationalNote}</p>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-white border rounded-lg shadow-sm max-w-4xl">
        <h5 className="font-semibold mb-2">Combined Visualization Legend:</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h6 className="font-medium mb-1">Memory Grid (Left):</h6>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: currentScenarioData.cacheLineLayout.colors[0] }}
                ></div>
                <span>P1 accesses {currentScenarioData.p1Variable}</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: currentScenarioData.cacheLineLayout.colors[1] }}
                ></div>
                <span>P2 accesses {currentScenarioData.p2Variable}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-800 rounded"></div>
                <span>Cache line boundary</span>
              </div>
            </div>
          </div>
          <div>
            <h6 className="font-medium mb-1">MSI Protocol (Right):</h6>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Modified - Core owns cache line</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Shared - Multiple cores may have copy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span>Invalid - Cache line invalidated</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm"><strong>False Sharing:</strong> Both visualizations show the same cache line being shared between different variables 
          ({currentScenarioData.p1Variable} and {currentScenarioData.p2Variable}), 
          causing unnecessary coherence traffic when either processor writes to its variable.</p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';

interface InteractiveFalseSharingProps {
  width?: number;
  height?: number;
  className?: string;
}

type CacheLineOwner = 'P1' | 'P2' | null;
type AnimationState = 'idle' | 'p1-write' | 'p2-write' | 'auto-ping-pong';

export function InteractiveFalseSharing({ 
  width = 900, 
  height = 500, 
  className = "" 
}: InteractiveFalseSharingProps) {
  const [cacheLineOwner, setCacheLineOwner] = useState<CacheLineOwner>(null);
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [isAnimating, setIsAnimating] = useState(false);
  const [accessCount, setAccessCount] = useState({ P1: 0, P2: 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Constants for grid layout
  const ROWS = 8;
  const COLS = 16;
  const CACHE_LINE_ROW = 3; // Row containing the cache line (0-indexed)
  const CACHE_LINE_START = 6; // Starting column of cache line
  const CACHE_LINE_SIZE = 4; // Cache line spans 4 cells
  
  // Calculate responsive dimensions
  const cellSize = Math.min((width - 200) / COLS, (height - 200) / ROWS);
  const gridWidth = COLS * cellSize;
  const gridHeight = ROWS * cellSize;
  const startX = 100;
  const startY = 80;
  
  // Calculate positions for P1 and P2 access points
  const p1CellX = startX + (CACHE_LINE_START + 0.5) * cellSize;
  const p1CellY = startY + (CACHE_LINE_ROW + 0.5) * cellSize;
  const p2CellX = startX + (CACHE_LINE_START + CACHE_LINE_SIZE - 0.5) * cellSize;
  const p2CellY = startY + (CACHE_LINE_ROW + 0.5) * cellSize;
  
  // Handle processor access
  const handleP1Access = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCacheLineOwner('P1');
    setAnimationState('p1-write');
    setAccessCount(prev => ({ ...prev, P1: prev.P1 + 1 }));
    
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationState('idle');
    }, 1000);
  };
  
  const handleP2Access = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCacheLineOwner('P2');
    setAnimationState('p2-write');
    setAccessCount(prev => ({ ...prev, P2: prev.P2 + 1 }));
    
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationState('idle');
    }, 1000);
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
        setIsAnimating(true);
        setCacheLineOwner(currentProcessor);
        setAccessCount(prev => ({ 
          ...prev, 
          [currentProcessor]: prev[currentProcessor] + 1 
        }));
        
        setTimeout(() => {
          setIsAnimating(false);
        }, 800);
        
        currentProcessor = currentProcessor === 'P1' ? 'P2' : 'P1';
      }, 1000);
    }
  };
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Get cache line color based on owner and animation state
  const getCacheLineColor = () => {
    if (animationState === 'p1-write' || (cacheLineOwner === 'P1' && animationState === 'auto-ping-pong')) {
      return isAnimating ? '#ef4444' : '#3b82f6'; // Red when writing, blue when owned
    } else if (animationState === 'p2-write' || (cacheLineOwner === 'P2' && animationState === 'auto-ping-pong')) {
      return isAnimating ? '#10b981' : '#3b82f6'; // Green when writing, blue when owned
    }
    return '#6b7280'; // Gray when no owner
  };
  
  // Get processor highlight
  const getProcessorHighlight = (processor: 'P1' | 'P2') => {
    if (animationState === 'auto-ping-pong') {
      return cacheLineOwner === processor && isAnimating;
    }
    return animationState === `${processor.toLowerCase()}-write` as const;
  };
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="mb-4 text-center">
        <h4 className="text-lg font-semibold mb-2">Interactive False Sharing Simulator</h4>
        <p className="text-sm text-gray-600">
          Simulate processor accesses to see false sharing in action
        </p>
      </div>
      
      {/* Control Panel */}
      <div className="mb-6 flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleP1Access}
          disabled={isAnimating || animationState === 'auto-ping-pong'}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            getProcessorHighlight('P1') 
              ? 'bg-red-500 text-white shadow-lg' 
              : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400'
          }`}
        >
          Access P1 ({accessCount.P1})
        </button>
        
        <button
          onClick={handleP2Access}
          disabled={isAnimating || animationState === 'auto-ping-pong'}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            getProcessorHighlight('P2') 
              ? 'bg-green-500 text-white shadow-lg' 
              : 'bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400'
          }`}
        >
          Access P2 ({accessCount.P2})
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
          onClick={() => {
            setAccessCount({ P1: 0, P2: 0 });
            setCacheLineOwner(null);
            setAnimationState('idle');
            setIsAnimating(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }}
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
      </div>
      
      <svg width={width} height={height} className="border rounded-lg bg-gray-50">
        {/* Grid of memory cells */}
        {Array.from({ length: ROWS }, (_, row) => 
          Array.from({ length: COLS }, (_, col) => {
            const x = startX + col * cellSize;
            const y = startY + row * cellSize;
            const isInCacheLine = row === CACHE_LINE_ROW && 
                                 col >= CACHE_LINE_START && 
                                 col < CACHE_LINE_START + CACHE_LINE_SIZE;
            const isP1Cell = row === CACHE_LINE_ROW && col === CACHE_LINE_START;
            const isP2Cell = row === CACHE_LINE_ROW && col === CACHE_LINE_START + CACHE_LINE_SIZE - 1;
            
            return (
              <circle
                key={`${row}-${col}`}
                cx={x + cellSize/2}
                cy={y + cellSize/2}
                r={cellSize/3}
                fill={
                  isP1Cell && getProcessorHighlight('P1') ? '#fca5a5' : // Light red for P1 active
                  isP2Cell && getProcessorHighlight('P2') ? '#86efac' : // Light green for P2 active
                  isP1Cell ? '#93c5fd' : // Light blue for P1 cell
                  isP2Cell ? '#86efac' : // Light green for P2 cell
                  isInCacheLine ? '#f3f4f6' : // Light gray for cache line
                  '#e5e7eb' // Default gray
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
        
        {/* Cache line outline */}
        <rect
          x={startX + CACHE_LINE_START * cellSize - 3}
          y={startY + CACHE_LINE_ROW * cellSize - 3}
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
          x={startX + (CACHE_LINE_START + CACHE_LINE_SIZE/2) * cellSize}
          y={startY + CACHE_LINE_ROW * cellSize - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#374151"
          className="font-semibold"
        >
          Cache Line
        </text>
        
        {/* P1 Label and access indicator */}
        <g>
          <rect
            x={startX + CACHE_LINE_START * cellSize - 60}
            y={startY + CACHE_LINE_ROW * cellSize - 10}
            width={40}
            height={cellSize + 20}
            fill={getProcessorHighlight('P1') ? '#3b82f6' : '#e5e7eb'}
            stroke="#374151"
            strokeWidth={1}
            rx={4}
            className="transition-all duration-300"
          />
          <text
            x={startX + CACHE_LINE_START * cellSize - 40}
            y={startY + CACHE_LINE_ROW * cellSize + cellSize/2 + 5}
            textAnchor="middle"
            fontSize="14"
            fill={getProcessorHighlight('P1') ? 'white' : '#374151'}
            className="font-bold"
          >
            P1
          </text>
          
          {/* Access arrow for P1 */}
          {(animationState === 'p1-write' || (cacheLineOwner === 'P1' && animationState === 'auto-ping-pong')) && (
            <line
              x1={startX + CACHE_LINE_START * cellSize - 20}
              y1={startY + CACHE_LINE_ROW * cellSize + cellSize/2}
              x2={p1CellX - cellSize/3}
              y2={p1CellY}
              stroke="#ef4444"
              strokeWidth={3}
              markerEnd="url(#arrowRed)"
              className="animate-pulse"
            />
          )}
          
          {/* Variable label */}
          <text
            x={startX + CACHE_LINE_START * cellSize - 40}
            y={startY + CACHE_LINE_ROW * cellSize + cellSize + 15}
            textAnchor="middle"
            fontSize="10"
            fill="#374151"
            className="font-medium"
          >
            var x
          </text>
        </g>
        
        {/* P2 Label and access indicator */}
        <g>
          <rect
            x={startX + (CACHE_LINE_START + CACHE_LINE_SIZE) * cellSize + 20}
            y={startY + CACHE_LINE_ROW * cellSize - 10}
            width={40}
            height={cellSize + 20}
            fill={getProcessorHighlight('P2') ? '#10b981' : '#e5e7eb'}
            stroke="#374151"
            strokeWidth={1}
            rx={4}
            className="transition-all duration-300"
          />
          <text
            x={startX + (CACHE_LINE_START + CACHE_LINE_SIZE) * cellSize + 40}
            y={startY + CACHE_LINE_ROW * cellSize + cellSize/2 + 5}
            textAnchor="middle"
            fontSize="14"
            fill={getProcessorHighlight('P2') ? 'white' : '#374151'}
            className="font-bold"
          >
            P2
          </text>
          
          {/* Access arrow for P2 */}
          {(animationState === 'p2-write' || (cacheLineOwner === 'P2' && animationState === 'auto-ping-pong')) && (
            <line
              x1={startX + (CACHE_LINE_START + CACHE_LINE_SIZE) * cellSize + 20}
              y1={startY + CACHE_LINE_ROW * cellSize + cellSize/2}
              x2={p2CellX + cellSize/3}
              y2={p2CellY}
              stroke="#10b981"
              strokeWidth={3}
              markerEnd="url(#arrowGreen)"
              className="animate-pulse"
            />
          )}
          
          {/* Variable label */}
          <text
            x={startX + (CACHE_LINE_START + CACHE_LINE_SIZE) * cellSize + 40}
            y={startY + CACHE_LINE_ROW * cellSize + cellSize + 15}
            textAnchor="middle"
            fontSize="10"
            fill="#374151"
            className="font-medium"
          >
            var y
          </text>
        </g>
        
        {/* Arrow markers */}
        <defs>
          <marker
            id="arrowRed"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0,0 0,6 9,3"
              fill="#ef4444"
            />
          </marker>
          <marker
            id="arrowGreen"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0,0 0,6 9,3"
              fill="#10b981"
            />
          </marker>
        </defs>
        
        {/* Coherence traffic indicator */}
        {isAnimating && (
          <g>
            <rect
              x={startX}
              y={startY + gridHeight + 20}
              width={gridWidth}
              height={25}
              fill="#fef3c7"
              stroke="#f59e0b"
              strokeWidth={1}
              rx={4}
              className="animate-pulse"
            />
            <text
              x={startX + gridWidth/2}
              y={startY + gridHeight + 37}
              textAnchor="middle"
              fontSize="12"
              fill="#92400e"
              className="font-medium"
            >
              🚨 Coherence Traffic: Cache line transferring to {cacheLineOwner}
            </text>
          </g>
        )}
      </svg>
      
      {/* Explanation Panel */}
      <div className="mt-6 p-4 bg-white border rounded-lg shadow-sm max-w-2xl">
        <h5 className="font-semibold mb-2">False Sharing Explanation:</h5>
        <div className="space-y-2 text-sm">
          <p>
            <strong>What's happening:</strong> P1 writes to variable 'x' and P2 writes to variable 'y'. 
            Even though they're accessing different variables, both variables are in the same cache line.
          </p>
          <p>
            <strong>The problem:</strong> Every time one processor writes, the entire cache line must be 
            transferred to that processor, invalidating the cache line in the other processor. This creates 
            unnecessary coherence traffic.
          </p>
          <p>
            <strong>Performance impact:</strong> Each access triggers expensive cache coherence operations, 
            even though the processors aren't actually sharing data - they just happen to be in the same cache line.
          </p>
          {accessCount.P1 + accessCount.P2 > 0 && (
            <p className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <strong>Coherence events so far:</strong> {accessCount.P1 + accessCount.P2} cache line transfers 
              (P1: {accessCount.P1}, P2: {accessCount.P2})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

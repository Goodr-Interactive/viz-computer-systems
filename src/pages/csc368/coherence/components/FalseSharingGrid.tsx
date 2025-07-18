import { useState, useEffect } from 'react';

interface FalseSharingGridProps {
  width?: number;
  height?: number;
  className?: string;
}

export function FalseSharingGrid({ 
  width = 800, 
  height = 400, 
  className = "" 
}: FalseSharingGridProps) {
  const [isPingPong, setIsPingPong] = useState(false);
  
  // Constants for grid layout
  const ROWS = 8;
  const COLS = 16;
  const CACHE_LINE_START = 4; // Starting column of cache line
  const CACHE_LINE_SIZE = 4; // Cache line spans 4 cells
  const CACHE_LINE_ROW = 3; // Row containing the cache line
  
  // Calculate responsive dimensions
  const cellSize = Math.min(width / (COLS + 2), height / (ROWS + 4)) * 0.8;
  const gridWidth = COLS * cellSize;
  const gridHeight = ROWS * cellSize;
  const startX = (width - gridWidth) / 2;
  const startY = (height - gridHeight) / 2 + 40; // Extra space for labels
  
  // Animate ping-pong effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPingPong(prev => !prev);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate positions for P1 and P2 access points
  const p1X = startX + (CACHE_LINE_START + 0.5) * cellSize;
  const p1Y = startY + (CACHE_LINE_ROW + 0.5) * cellSize;
  const p2X = startX + (CACHE_LINE_START + CACHE_LINE_SIZE - 0.5) * cellSize;
  const p2Y = startY + (CACHE_LINE_ROW + 0.5) * cellSize;
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="mb-4 text-center">
        <h4 className="text-lg font-semibold mb-2">False Sharing Visualization</h4>
        <p className="text-sm text-gray-600">
          P1 and P2 access different variables in the same cache line
        </p>
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
                  isP1Cell ? '#3b82f6' : // Blue for P1
                  isP2Cell ? '#ef4444' : // Red for P2
                  isInCacheLine ? '#f3f4f6' : // Light gray for cache line
                  '#e5e7eb' // Default gray
                }
                stroke={
                  isP1Cell ? '#1d4ed8' :
                  isP2Cell ? '#dc2626' :
                  '#9ca3af'
                }
                strokeWidth={1}
                className="transition-all duration-300"
              />
            );
          })
        )}
        
        {/* Cache line outline with ping-pong animation */}
        <rect
          x={startX + CACHE_LINE_START * cellSize - 2}
          y={startY + CACHE_LINE_ROW * cellSize - 2}
          width={CACHE_LINE_SIZE * cellSize + 4}
          height={cellSize + 4}
          fill="none"
          stroke={isPingPong ? '#ef4444' : '#3b82f6'}
          strokeWidth={3}
          strokeDasharray="5,5"
          className="transition-all duration-500"
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
        
        {/* P1 Label and Arrow */}
        <g>
          <text
            x={p1X}
            y={startY - 20}
            textAnchor="middle"
            fontSize="14"
            fill="#1d4ed8"
            className="font-bold"
          >
            P1
          </text>
          <line
            x1={p1X}
            y1={startY - 5}
            x2={p1X}
            y2={p1Y - cellSize/3 - 5}
            stroke="#1d4ed8"
            strokeWidth={2}
            markerEnd="url(#arrowP1)"
          />
          {/* Variable label */}
          <text
            x={p1X}
            y={p1Y + cellSize/2 + 15}
            textAnchor="middle"
            fontSize="10"
            fill="#1d4ed8"
            className="font-medium"
          >
            var x
          </text>
        </g>
        
        {/* P2 Label and Arrow */}
        <g>
          <text
            x={p2X}
            y={startY - 20}
            textAnchor="middle"
            fontSize="14"
            fill="#dc2626"
            className="font-bold"
          >
            P2
          </text>
          <line
            x1={p2X}
            y1={startY - 5}
            x2={p2X}
            y2={p2Y - cellSize/3 - 5}
            stroke="#dc2626"
            strokeWidth={2}
            markerEnd="url(#arrowP2)"
          />
          {/* Variable label */}
          <text
            x={p2X}
            y={p2Y + cellSize/2 + 15}
            textAnchor="middle"
            fontSize="10"
            fill="#dc2626"
            className="font-medium"
          >
            var y
          </text>
        </g>
        
        {/* Arrow markers */}
        <defs>
          <marker
            id="arrowP1"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0,0 0,6 9,3"
              fill="#1d4ed8"
            />
          </marker>
          <marker
            id="arrowP2"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0,0 0,6 9,3"
              fill="#dc2626"
            />
          </marker>
        </defs>
        
        {/* Ping-pong status indicator */}
        <g>
          <rect
            x={startX}
            y={startY + gridHeight + 20}
            width={gridWidth}
            height={30}
            fill={isPingPong ? '#fef3c7' : '#dbeafe'}
            stroke={isPingPong ? '#f59e0b' : '#3b82f6'}
            strokeWidth={1}
            rx={4}
            className="transition-all duration-500"
          />
          <text
            x={startX + gridWidth/2}
            y={startY + gridHeight + 40}
            textAnchor="middle"
            fontSize="12"
            fill={isPingPong ? '#92400e' : '#1e40af'}
            className="font-medium"
          >
            {isPingPong ? '🔄 Cache line bouncing to P2' : '🔄 Cache line bouncing to P1'}
          </text>
        </g>
        
        {/* Grid coordinates (optional) */}
        <text
          x={startX - 20}
          y={startY + gridHeight/2}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
          transform={`rotate(-90 ${startX - 20} ${startY + gridHeight/2})`}
        >
          Memory Rows
        </text>
        <text
          x={startX + gridWidth/2}
          y={startY + gridHeight + 15}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
        >
          Memory Columns
        </text>
      </svg>
      
      {/* Legend */}
      <div className="mt-4 p-3 bg-white border rounded-lg shadow-sm max-w-md">
        <h5 className="font-medium mb-2">Legend:</h5>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>P1 accesses variable x</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>P2 accesses variable y</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-dashed"></div>
            <span>Cache line (animated ping-pong effect)</span>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <strong>False Sharing:</strong> P1 and P2 write to different variables in the same cache line, 
            causing unnecessary coherence traffic as the cache line bounces between processors.
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface MemoryCell {
  id: number;
  row: number;
  col: number;
  isInCacheLine: boolean;
  isP1Access: boolean;
  isP2Access: boolean;
}

type SharingScenario = 'false-sharing' | 'true-sharing' | 'no-sharing';

export const SimpleFalseSharingViz: React.FC = () => {
  const [animationState, setAnimationState] = useState<'p1' | 'p2'>('p1');
  const [containerWidth, setContainerWidth] = useState(800);
  const [scenario, setScenario] = useState<SharingScenario>('false-sharing');
  const [randomConfig, setRandomConfig] = useState({
    cacheLineRow: 3,
    cacheLineStartCol: 6,
    p1Row: 3,
    p1Col: 6,
    p2Row: 3,
    p2Col: 9,
    secondCacheLineRow: 5,
    secondCacheLineStartCol: 12
  });
  
  // Grid dimensions
  const ROWS = 8;
  const COLS = 16;
  const CACHE_LINE_LENGTH = 4; // Cache line spans 4 cells
  
  // Randomization function
  const randomizeConfiguration = () => {
    const getRandomRow = () => Math.floor(Math.random() * ROWS);
    const getRandomCol = (maxCol = COLS - CACHE_LINE_LENGTH) => Math.floor(Math.random() * maxCol);
    
    const cacheLineRow = getRandomRow();
    const cacheLineStartCol = getRandomCol();
    
    let secondCacheLineRow, secondCacheLineStartCol;
    // Ensure second cache line doesn't overlap with first
    do {
      secondCacheLineRow = getRandomRow();
      secondCacheLineStartCol = getRandomCol();
    } while (
      secondCacheLineRow === cacheLineRow &&
      secondCacheLineStartCol < cacheLineStartCol + CACHE_LINE_LENGTH &&
      secondCacheLineStartCol + CACHE_LINE_LENGTH > cacheLineStartCol
    );
    
    setRandomConfig({
      cacheLineRow,
      cacheLineStartCol,
      p1Row: cacheLineRow,
      p1Col: cacheLineStartCol,
      p2Row: cacheLineRow,
      p2Col: cacheLineStartCol + CACHE_LINE_LENGTH - 1,
      secondCacheLineRow,
      secondCacheLineStartCol
    });
  };
  
  // Get scenario configuration
  const getScenarioConfig = () => {
    switch (scenario) {
      case 'false-sharing':
        return {
          p1Row: randomConfig.p1Row,
          p1Col: randomConfig.p1Col,
          p2Row: randomConfig.p2Row,
          p2Col: randomConfig.p2Col,
          cacheLineRow: randomConfig.cacheLineRow,
          cacheLineStartCol: randomConfig.cacheLineStartCol,
          title: "False Sharing",
          description: "Two processors accessing different variables in the same cache line",
          explanation: "P1 writes to variable A and P2 writes to variable B. Even though they access different variables, both variables are in the same cache line. This causes unnecessary coherence traffic as the cache line bounces between processors."
        };
      case 'true-sharing':
        const sharedCol = randomConfig.cacheLineStartCol + Math.floor(CACHE_LINE_LENGTH / 2);
        return {
          p1Row: randomConfig.cacheLineRow,
          p1Col: sharedCol,
          p2Row: randomConfig.cacheLineRow,
          p2Col: sharedCol, // Same cell
          cacheLineRow: randomConfig.cacheLineRow,
          cacheLineStartCol: randomConfig.cacheLineStartCol,
          title: "True Sharing",
          description: "Two processors accessing the same variable in the same cache line",
          explanation: "P1 and P2 both access the same variable X. This is legitimate sharing where coherence traffic is necessary to maintain data consistency between processors."
        };
      case 'no-sharing':
        return {
          p1Row: randomConfig.cacheLineRow,
          p1Col: randomConfig.cacheLineStartCol,
          p2Row: randomConfig.secondCacheLineRow,
          p2Col: randomConfig.secondCacheLineStartCol, // Different cache line
          cacheLineRow: randomConfig.cacheLineRow,
          cacheLineStartCol: randomConfig.cacheLineStartCol,
          title: "No Sharing",
          description: "Two processors accessing different variables in different cache lines",
          explanation: "P1 writes to variable A and P2 writes to variable B. Since they are in different cache lines, there is no coherence traffic between processors - this is the ideal scenario."
        };
      default:
        return getScenarioConfig();
    }
  };

  const config = getScenarioConfig();
  
  // Create memory grid
  const memoryGrid: MemoryCell[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const id = row * COLS + col;
      const isInCacheLine = row === config.cacheLineRow && 
                           col >= config.cacheLineStartCol && 
                           col < config.cacheLineStartCol + CACHE_LINE_LENGTH;
      
      // For no-sharing scenario, also highlight the second cache line
      const isInSecondCacheLine = scenario === 'no-sharing' && 
                                 row === randomConfig.secondCacheLineRow && 
                                 col >= randomConfig.secondCacheLineStartCol && 
                                 col < randomConfig.secondCacheLineStartCol + CACHE_LINE_LENGTH;
      
      const isP1Access = row === config.p1Row && col === config.p1Col;
      const isP2Access = row === config.p2Row && col === config.p2Col;
      
      memoryGrid.push({
        id,
        row,
        col,
        isInCacheLine: isInCacheLine || isInSecondCacheLine,
        isP1Access,
        isP2Access
      });
    }
  }

  // Animation effect - ping-pong every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationState(prev => prev === 'p1' ? 'p2' : 'p1');
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Responsive width handling
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('false-sharing-container');
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate cell size based on container width
  const cellSize = Math.min(containerWidth / (COLS + 2), 40); // +2 for padding
  const gridWidth = cellSize * COLS;
  const gridHeight = cellSize * ROWS;

  return (
    <div id="false-sharing-container" className="w-full max-w-4xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{config.title}</h2>
        <p className="text-gray-600">
          {config.description}
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="flex justify-center mb-6 gap-2">
        <Button
          variant={scenario === 'false-sharing' ? 'default' : 'outline'}
          onClick={() => setScenario('false-sharing')}
          className="text-sm"
        >
          False Sharing
        </Button>
        <Button
          variant={scenario === 'true-sharing' ? 'default' : 'outline'}
          onClick={() => setScenario('true-sharing')}
          className="text-sm"
        >
          True Sharing
        </Button>
        <Button
          variant={scenario === 'no-sharing' ? 'default' : 'outline'}
          onClick={() => setScenario('no-sharing')}
          className="text-sm"
        >
          No Sharing
        </Button>
      </div>

      {/* Randomize Button */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={randomizeConfiguration}
          variant="secondary"
          className="text-sm font-semibold"
        >
          Randomize Layout
        </Button>
      </div>

      <div className="flex justify-center mb-4">
        <svg 
          width={gridWidth + 100} 
          height={gridHeight + 100}
          className="border border-gray-200 rounded-lg"
        >
          {/* Memory grid */}
          {memoryGrid.map((cell) => (
            <g key={cell.id}>
              {/* Memory cell circle */}
              <circle
                cx={50 + cell.col * cellSize + cellSize / 2}
                cy={50 + cell.row * cellSize + cellSize / 2}
                r={cellSize * 0.3}
                fill={cell.isP1Access || cell.isP2Access ? "#f59e0b" : "#e5e7eb"}
                stroke={cell.isInCacheLine ? "#3b82f6" : "#9ca3af"}
                strokeWidth="1"
              />
              
              {/* Cell labels for accessed cells */}
              {cell.isP1Access && (
                <text
                  x={50 + cell.col * cellSize + cellSize / 2}
                  y={50 + cell.row * cellSize + cellSize / 2 + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  fontWeight="bold"
                >
                  {scenario === 'true-sharing' ? 'X' : 'A'}
                </text>
              )}
              {cell.isP2Access && !cell.isP1Access && (
                <text
                  x={50 + cell.col * cellSize + cellSize / 2}
                  y={50 + cell.row * cellSize + cellSize / 2 + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  fontWeight="bold"
                >
                  {scenario === 'true-sharing' ? 'X' : 'B'}
                </text>
              )}
            </g>
          ))}

          {/* Cache line outline with animation - only animate for false sharing and true sharing */}
          <rect
            x={50 + config.cacheLineStartCol * cellSize}
            y={50 + config.cacheLineRow * cellSize}
            width={CACHE_LINE_LENGTH * cellSize}
            height={cellSize}
            fill="none"
            stroke={scenario === 'no-sharing' ? "#3b82f6" : (animationState === 'p1' ? "#ef4444" : "#3b82f6")}
            strokeWidth="3"
            strokeDasharray="5,5"
            rx="4"
            className={scenario === 'no-sharing' ? "" : "transition-all duration-500"}
          />

          {/* Additional cache line for no-sharing scenario */}
          {scenario === 'no-sharing' && (
            <rect
              x={50 + randomConfig.secondCacheLineStartCol * cellSize}
              y={50 + randomConfig.secondCacheLineRow * cellSize}
              width={CACHE_LINE_LENGTH * cellSize}
              height={cellSize}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray="5,5"
              rx="4"
            />
          )}

          {/* Processor labels and arrows */}
          {/* P1 label and arrow */}
          <g>
            <text
              x={50 + config.p1Col * cellSize - 15}
              y={50 + config.p1Row * cellSize - 10}
              textAnchor="middle"
              fontSize="14"
              fill={scenario === 'no-sharing' ? "#6b7280" : (animationState === 'p1' ? "#ef4444" : "#6b7280")}
              fontWeight="bold"
              className={scenario === 'no-sharing' ? "" : "transition-all duration-500"}
            >
              P1
            </text>
            <line
              x1={50 + config.p1Col * cellSize - 10}
              y1={50 + config.p1Row * cellSize - 5}
              x2={50 + config.p1Col * cellSize + cellSize / 2 - 5}
              y2={50 + config.p1Row * cellSize + cellSize / 2 - 5}
              stroke={scenario === 'no-sharing' ? "#6b7280" : (animationState === 'p1' ? "#ef4444" : "#6b7280")}
              strokeWidth="2"
              markerEnd="url(#arrowhead-p1)"
              className={scenario === 'no-sharing' ? "" : "transition-all duration-500"}
            />
          </g>

          {/* P2 label and arrow */}
          <g>
            <text
              x={50 + config.p2Col * cellSize + 15}
              y={50 + config.p2Row * cellSize - 10}
              textAnchor="middle"
              fontSize="14"
              fill={scenario === 'no-sharing' ? "#6b7280" : (animationState === 'p2' ? "#ef4444" : "#6b7280")}
              fontWeight="bold"
              className={scenario === 'no-sharing' ? "" : "transition-all duration-500"}
            >
              P2
            </text>
            <line
              x1={50 + config.p2Col * cellSize + 10}
              y1={50 + config.p2Row * cellSize - 5}
              x2={50 + config.p2Col * cellSize + cellSize / 2 + 5}
              y2={50 + config.p2Row * cellSize + cellSize / 2 - 5}
              stroke={scenario === 'no-sharing' ? "#6b7280" : (animationState === 'p2' ? "#ef4444" : "#6b7280")}
              strokeWidth="2"
              markerEnd="url(#arrowhead-p2)"
              className={scenario === 'no-sharing' ? "" : "transition-all duration-500"}
            />
          </g>

          {/* Arrow markers */}
          <defs>
            <marker
              id="arrowhead-p1"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={scenario === 'no-sharing' ? "#6b7280" : (animationState === 'p1' ? "#ef4444" : "#6b7280")}
                className={scenario === 'no-sharing' ? "" : "transition-all duration-500"}
              />
            </marker>
            <marker
              id="arrowhead-p2"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={scenario === 'no-sharing' ? "#6b7280" : (animationState === 'p2' ? "#ef4444" : "#6b7280")}
                className={scenario === 'no-sharing' ? "" : "transition-all duration-500"}
              />
            </marker>
          </defs>

          {/* Cache line labels */}
          <text
            x={50 + config.cacheLineStartCol * cellSize + (CACHE_LINE_LENGTH * cellSize) / 2}
            y={50 + config.cacheLineRow * cellSize + cellSize + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
            fontWeight="bold"
          >
            Cache Line 1
          </text>
          
          {/* Additional cache line label for no-sharing scenario */}
          {scenario === 'no-sharing' && (
            <text
              x={50 + randomConfig.secondCacheLineStartCol * cellSize + (CACHE_LINE_LENGTH * cellSize) / 2}
              y={50 + randomConfig.secondCacheLineRow * cellSize + cellSize + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
              fontWeight="bold"
            >
              Cache Line 2
            </text>
          )}
        </svg>
      </div>

      {/* Explanation */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">{config.title} Explained</h3>
        <p className="text-yellow-700">
          {config.explanation}
        </p>
        {scenario !== 'no-sharing' && (
          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-yellow-700">P1 active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-yellow-700">P2 active</span>
            </div>
          </div>
        )}
        {scenario === 'no-sharing' && (
          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm text-yellow-700">No coherence traffic</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

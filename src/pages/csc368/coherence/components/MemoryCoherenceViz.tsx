import { useState, useEffect, useRef } from 'react';

// Types for the memory coherence visualization
type CacheState = 'Modified' | 'Shared' | 'Invalid';
type CoreId = 'Core1' | 'Core2';

interface MemoryBlock {
  address: string;
  label: string;
  color: string;
  owner: CoreId | 'shared' | null;
}

interface AccessStep {
  core: CoreId;
  variable: string;
  action: 'read' | 'write';
  message: string;
}

interface Scenario {
  name: string;
  description: string;
  memory: MemoryBlock[];
  accessPattern: AccessStep[];
}

interface CoreState {
  cacheLines: Array<{
    variable: string;
    state: CacheState;
    color: string;
  }>;
}

interface MemoryCoherenceVizProps {
  className?: string;
}

export const MemoryCoherenceViz: React.FC<MemoryCoherenceVizProps> = ({ className = '' }) => {
  // Scenarios data
  const scenarios: Scenario[] = [
    {
      name: "False Sharing",
      description: "Two cores accessing different variables in the same cache line",
      memory: [
        { address: "0xF000", label: "gVar1", color: "#fb923c", owner: null },
        { address: "0xF004", label: "gVar2", color: "#34d399", owner: null },
        { address: "0xF008", label: "buffer", color: "#94a3b8", owner: null },
        { address: "0xF00C", label: "temp", color: "#a78bfa", owner: null },
        { address: "0xF010", label: "count", color: "#fbbf24", owner: null },
        { address: "0xF014", label: "flag", color: "#f87171", owner: null },
      ],
      accessPattern: [
        { core: "Core1", variable: "gVar1", action: "write", message: "Core 1 writes to gVar1 → gets exclusive ownership" },
        { core: "Core2", variable: "gVar2", action: "write", message: "Core 2 writes to gVar2 → false sharing invalidates Core 1" },
        { core: "Core1", variable: "gVar1", action: "read", message: "Core 1 reads gVar1 → cache miss, reload from memory" },
        { core: "Core2", variable: "gVar2", action: "write", message: "Core 2 writes to gVar2 again → invalidates Core 1 again" },
        { core: "Core1", variable: "gVar1", action: "write", message: "Core 1 writes to gVar1 → ping-pong effect continues" },
      ]
    },
    {
      name: "True Sharing",
      description: "Two cores accessing the same variable",
      memory: [
        { address: "0xF000", label: "shared", color: "#60a5fa", owner: null },
        { address: "0xF004", label: "localA", color: "#fb923c", owner: null },
        { address: "0xF008", label: "localB", color: "#34d399", owner: null },
        { address: "0xF00C", label: "temp", color: "#a78bfa", owner: null },
      ],
      accessPattern: [
        { core: "Core1", variable: "shared", action: "read", message: "Core 1 reads shared variable → gets shared copy" },
        { core: "Core2", variable: "shared", action: "read", message: "Core 2 reads shared variable → both cores have shared copy" },
        { core: "Core1", variable: "shared", action: "write", message: "Core 1 writes to shared → invalidates Core 2" },
        { core: "Core2", variable: "shared", action: "read", message: "Core 2 reads shared → cache miss, reload from memory" },
      ]
    },
    {
      name: "No Sharing",
      description: "Two cores accessing completely separate memory regions",
      memory: [
        { address: "0xF000", label: "core1Var", color: "#fb923c", owner: null },
        { address: "0xF004", label: "core1Buf", color: "#fb923c", owner: null },
        { address: "0xF040", label: "core2Var", color: "#34d399", owner: null },
        { address: "0xF044", label: "core2Buf", color: "#34d399", owner: null },
      ],
      accessPattern: [
        { core: "Core1", variable: "core1Var", action: "write", message: "Core 1 writes to its private variable → no coherence needed" },
        { core: "Core2", variable: "core2Var", action: "write", message: "Core 2 writes to its private variable → no coherence needed" },
        { core: "Core1", variable: "core1Buf", action: "read", message: "Core 1 reads its private buffer → no cache misses" },
        { core: "Core2", variable: "core2Buf", action: "read", message: "Core 2 reads its private buffer → optimal performance" },
      ]
    }
  ];

  // State management
  const [currentScenario, setCurrentScenario] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [core1State, setCore1State] = useState<CoreState>({ cacheLines: [] });
  const [core2State, setCore2State] = useState<CoreState>({ cacheLines: [] });
  const [memoryState, setMemoryState] = useState<MemoryBlock[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [actionLog, setActionLog] = useState<string[]>([]);

  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Constants for layout
  const SVG_WIDTH = 1200;
  const SVG_HEIGHT = 600;
  const MEMORY_BLOCK_WIDTH = 80;
  const MEMORY_BLOCK_HEIGHT = 40;
  const CORE_WIDTH = 120;
  const CORE_HEIGHT = 120;
  const CACHE_LINE_HEIGHT = 20;
  const MSI_SECTION_WIDTH = 400;

  // Initialize scenario
  useEffect(() => {
    const scenario = scenarios[currentScenario];
    setMemoryState([...scenario.memory]);
    setCore1State({ cacheLines: [] });
    setCore2State({ cacheLines: [] });
    setCurrentStep(0);
    setCurrentMessage('');
    setActionLog([]);
    setAutoPlay(false);
    
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, [currentScenario]);

  // Auto play functionality
  useEffect(() => {
    if (autoPlay) {
      autoPlayRef.current = setInterval(() => {
        nextStep();
      }, 1500);
    } else if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, currentStep, currentScenario]);

  // Execute next step in the access pattern
  const nextStep = () => {
    const scenario = scenarios[currentScenario];
    if (currentStep >= scenario.accessPattern.length) {
      setAutoPlay(false);
      return;
    }

    const step = scenario.accessPattern[currentStep];
    setIsAnimating(true);
    setCurrentMessage(step.message);
    
    // Add to action log
    setActionLog(prev => [...prev, `Step ${currentStep + 1}: ${step.message}`]);

    // Animate arrow and update cache states
    animationTimeoutRef.current = setTimeout(() => {
      updateCacheStates(step);
      setIsAnimating(false);
      setCurrentStep(prev => prev + 1);
    }, 1000);
  };

  const updateCacheStates = (step: AccessStep) => {
    const memoryBlock = memoryState.find(block => block.label === step.variable);
    if (!memoryBlock) return;

    // Update memory ownership
    setMemoryState(prev => prev.map(block => 
      block.label === step.variable 
        ? { ...block, owner: step.core }
        : block
    ));

    // Update cache states based on the action
    if (step.action === 'write') {
      // Writing core gets Modified state
      const updateCore = step.core === 'Core1' ? setCore1State : setCore2State;
      const invalidateCore = step.core === 'Core1' ? setCore2State : setCore1State;
      
      updateCore(prev => ({
        cacheLines: [
          ...prev.cacheLines.filter(line => line.variable !== step.variable),
          { variable: step.variable, state: 'Modified', color: memoryBlock.color }
        ]
      }));

      // Invalidate the other core's cache line
      invalidateCore(prev => ({
        cacheLines: prev.cacheLines.map(line => 
          line.variable === step.variable 
            ? { ...line, state: 'Invalid' }
            : line
        )
      }));
    } else if (step.action === 'read') {
      // Reading core gets Shared state (or stays Modified if already owned)
      const updateCore = step.core === 'Core1' ? setCore1State : setCore2State;
      
      updateCore(prev => {
        const existingLine = prev.cacheLines.find(line => line.variable === step.variable);
        if (existingLine && existingLine.state === 'Invalid') {
          // Cache miss - reload from memory
          return {
            cacheLines: prev.cacheLines.map(line => 
              line.variable === step.variable 
                ? { ...line, state: 'Shared' }
                : line
            )
          };
        } else if (!existingLine) {
          // First time access
          return {
            cacheLines: [
              ...prev.cacheLines,
              { variable: step.variable, state: 'Shared', color: memoryBlock.color }
            ]
          };
        }
        return prev;
      });
    }
  };

  const resetScenario = () => {
    setCurrentStep(0);
    setAutoPlay(false);
    setIsAnimating(false);
    setCurrentMessage('');
    setActionLog([]);
    const scenario = scenarios[currentScenario];
    setMemoryState([...scenario.memory]);
    setCore1State({ cacheLines: [] });
    setCore2State({ cacheLines: [] });
    
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  };

  const getCacheStateColor = (state: CacheState) => {
    switch (state) {
      case 'Modified': return '#ef4444';
      case 'Shared': return '#10b981';
      case 'Invalid': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const scenario = scenarios[currentScenario];
  const canNextStep = currentStep < scenario.accessPattern.length;
  const currentAccessStep = currentStep < scenario.accessPattern.length ? scenario.accessPattern[currentStep] : null;

  // Calculate positions
  const memoryTimelineWidth = SVG_WIDTH - MSI_SECTION_WIDTH - 100;
  const memoryStartX = 50;
  const memoryY = SVG_HEIGHT - 120;
  const core1X = 50;
  const core2X = 250;
  const coreY = 50;
  
  // MSI Protocol section positions
  const msiStartX = SVG_WIDTH - MSI_SECTION_WIDTH;
  const msiCore1X = msiStartX + 50;
  const msiCore2X = msiStartX + 250;
  const msiMemoryY = SVG_HEIGHT - 120;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="mb-4 text-center">
        <h4 className="text-lg font-semibold mb-2">Memory Coherence Scenarios</h4>
        <p className="text-sm text-gray-600">
          Visualize different memory access patterns and their coherence implications
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 justify-center items-center">
        <select
          value={currentScenario}
          onChange={(e) => setCurrentScenario(parseInt(e.target.value))}
          className="px-3 py-2 border rounded-lg bg-white"
        >
          {scenarios.map((scenario, index) => (
            <option key={index} value={index}>
              {scenario.name}
            </option>
          ))}
        </select>

        <button
          onClick={nextStep}
          disabled={!canNextStep || isAnimating}
          className="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
        >
          Next Step ({currentStep + 1}/{scenario.accessPattern.length})
        </button>

        <button
          onClick={() => setAutoPlay(!autoPlay)}
          disabled={!canNextStep || isAnimating}
          className={`px-4 py-2 rounded-lg font-medium ${
            autoPlay 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-green-500 text-white hover:bg-green-600'
          } disabled:bg-gray-400`}
        >
          {autoPlay ? 'Stop Auto' : 'Auto Play'}
        </button>

        <button
          onClick={resetScenario}
          className="px-4 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600"
        >
          Reset
        </button>
      </div>

      {/* Scenario Description */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl">
        <h5 className="font-semibold text-blue-900">{scenario.name}</h5>
        <p className="text-sm text-blue-700 mt-1">{scenario.description}</p>
      </div>

      {/* Current Message */}
      {currentMessage && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl">
          <p className="text-sm text-yellow-800 font-medium">{currentMessage}</p>
        </div>
      )}

      {/* SVG Visualization */}
      <svg width={SVG_WIDTH} height={SVG_HEIGHT} className="border rounded-lg bg-gray-50">
        {/* Left Side: Memory Timeline Visualization */}
        <g>
          {/* Timeline Title */}
          <text
            x={memoryTimelineWidth / 2}
            y={25}
            textAnchor="middle"
            fontSize="16"
            fill="#374151"
            className="font-bold"
          >
            Memory Access Timeline
          </text>
          
          {/* Core 1 - Timeline */}
          <g>
            <rect
              x={core1X}
              y={coreY}
              width={CORE_WIDTH}
              height={CORE_HEIGHT}
              fill="#fef3c7"
              stroke="#f59e0b"
              strokeWidth={2}
              rx={8}
            />
            <text
              x={core1X + CORE_WIDTH/2}
              y={coreY + 20}
              textAnchor="middle"
              fontSize="14"
              fill="#92400e"
              className="font-bold"
            >
              Core 1
            </text>
            
            {/* Core 1 Cache Lines */}
            {core1State.cacheLines.map((line, index) => (
              <g key={`core1-${line.variable}`}>
                <rect
                  x={core1X + 5}
                  y={coreY + 30 + index * CACHE_LINE_HEIGHT}
                  width={CORE_WIDTH - 10}
                  height={CACHE_LINE_HEIGHT - 2}
                  fill={getCacheStateColor(line.state)}
                  stroke="#374151"
                  strokeWidth={1}
                  rx={2}
                  opacity={line.state === 'Invalid' ? 0.5 : 1}
                />
                <text
                  x={core1X + CORE_WIDTH/2}
                  y={coreY + 42 + index * CACHE_LINE_HEIGHT}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  className="font-medium"
                >
                  {line.variable} ({line.state})
                </text>
              </g>
            ))}
          </g>

          {/* Core 2 - Timeline */}
          <g>
            <rect
              x={core2X}
              y={coreY}
              width={CORE_WIDTH}
              height={CORE_HEIGHT}
              fill="#dcfce7"
              stroke="#16a34a"
              strokeWidth={2}
              rx={8}
            />
            <text
              x={core2X + CORE_WIDTH/2}
              y={coreY + 20}
              textAnchor="middle"
              fontSize="14"
              fill="#166534"
              className="font-bold"
            >
              Core 2
            </text>
            
            {/* Core 2 Cache Lines */}
            {core2State.cacheLines.map((line, index) => (
              <g key={`core2-${line.variable}`}>
                <rect
                  x={core2X + 5}
                  y={coreY + 30 + index * CACHE_LINE_HEIGHT}
                  width={CORE_WIDTH - 10}
                  height={CACHE_LINE_HEIGHT - 2}
                  fill={getCacheStateColor(line.state)}
                  stroke="#374151"
                  strokeWidth={1}
                  rx={2}
                  opacity={line.state === 'Invalid' ? 0.5 : 1}
                />
                <text
                  x={core2X + CORE_WIDTH/2}
                  y={coreY + 42 + index * CACHE_LINE_HEIGHT}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  className="font-medium"
                >
                  {line.variable} ({line.state})
                </text>
              </g>
            ))}
          </g>

          {/* Memory Blocks - Timeline */}
          {memoryState.map((block, index) => {
            const x = memoryStartX + (index * MEMORY_BLOCK_WIDTH);
            const y = memoryY;
            
            return (
              <g key={`timeline-${block.address}`}>
                <rect
                  x={x}
                  y={y}
                  width={MEMORY_BLOCK_WIDTH - 2}
                  height={MEMORY_BLOCK_HEIGHT}
                  fill={block.color}
                  stroke={block.owner ? '#374151' : '#9ca3af'}
                  strokeWidth={block.owner ? 2 : 1}
                  rx={4}
                />
                <text
                  x={x + MEMORY_BLOCK_WIDTH/2}
                  y={y + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  className="font-bold"
                >
                  {block.label}
                </text>
                <text
                  x={x + MEMORY_BLOCK_WIDTH/2}
                  y={y + 30}
                  textAnchor="middle"
                  fontSize="8"
                  fill="white"
                  className="font-medium"
                >
                  {block.address}
                </text>
                {block.owner && (
                  <text
                    x={x + MEMORY_BLOCK_WIDTH/2}
                    y={y + MEMORY_BLOCK_HEIGHT + 15}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#374151"
                    className="font-medium"
                  >
                    {block.owner}
                  </text>
                )}
              </g>
            );
          })}

          {/* Memory Label - Timeline */}
          <text
            x={memoryTimelineWidth / 2}
            y={memoryY + MEMORY_BLOCK_HEIGHT + 40}
            textAnchor="middle"
            fontSize="14"
            fill="#374151"
            className="font-bold"
          >
            Main Memory (Timeline View)
          </text>
        </g>

        {/* Vertical Separator */}
        <line
          x1={msiStartX - 20}
          y1={20}
          x2={msiStartX - 20}
          y2={SVG_HEIGHT - 20}
          stroke="#d1d5db"
          strokeWidth={2}
          strokeDasharray="5,5"
        />

        {/* Right Side: MSI Protocol Visualization */}
        <g>
          {/* MSI Protocol Title */}
          <text
            x={msiStartX + MSI_SECTION_WIDTH / 2}
            y={25}
            textAnchor="middle"
            fontSize="16"
            fill="#374151"
            className="font-bold"
          >
            MSI Cache Coherence Protocol
          </text>

          {/* MSI Core 1 Cache */}
          <g>
            <text
              x={msiCore1X + 60}
              y={70}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              className="font-bold"
            >
              Core 1 Cache
            </text>
            
            {/* Core 1 MSI Cache Lines */}
            {core1State.cacheLines.map((line, index) => (
              <g key={`msi-core1-${line.variable}`}>
                <rect
                  x={msiCore1X}
                  y={80 + index * 35}
                  width={120}
                  height={30}
                  fill="#f3f4f6"
                  stroke={line.state === 'Modified' ? '#ef4444' : line.state === 'Shared' ? '#10b981' : '#6b7280'}
                  strokeWidth={2}
                  rx={4}
                  opacity={line.state === 'Invalid' ? 0.5 : 1}
                />
                
                {/* Variable block inside cache */}
                <rect
                  x={msiCore1X + 5}
                  y={85 + index * 35}
                  width={50}
                  height={20}
                  fill={line.color}
                  stroke="#374151"
                  strokeWidth={1}
                  rx={2}
                  opacity={line.state === 'Invalid' ? 0.5 : 1}
                />
                <text
                  x={msiCore1X + 30}
                  y={98 + index * 35}
                  textAnchor="middle"
                  fontSize="9"
                  fill="white"
                  className="font-medium"
                >
                  {line.variable}
                </text>
                
                {/* State indicator */}
                <text
                  x={msiCore1X + 85}
                  y={98 + index * 35}
                  textAnchor="middle"
                  fontSize="10"
                  fill={getCacheStateColor(line.state)}
                  className="font-bold"
                >
                  {line.state}
                </text>
                
                {/* Invalid overlay */}
                {line.state === 'Invalid' && (
                  <line
                    x1={msiCore1X + 5}
                    y1={85 + index * 35}
                    x2={msiCore1X + 55}
                    y2={105 + index * 35}
                    stroke="#dc2626"
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                )}
              </g>
            ))}
          </g>

          {/* MSI Core 2 Cache */}
          <g>
            <text
              x={msiCore2X + 60}
              y={70}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              className="font-bold"
            >
              Core 2 Cache
            </text>
            
            {/* Core 2 MSI Cache Lines */}
            {core2State.cacheLines.map((line, index) => (
              <g key={`msi-core2-${line.variable}`}>
                <rect
                  x={msiCore2X}
                  y={80 + index * 35}
                  width={120}
                  height={30}
                  fill="#f3f4f6"
                  stroke={line.state === 'Modified' ? '#ef4444' : line.state === 'Shared' ? '#10b981' : '#6b7280'}
                  strokeWidth={2}
                  rx={4}
                  opacity={line.state === 'Invalid' ? 0.5 : 1}
                />
                
                {/* Variable block inside cache */}
                <rect
                  x={msiCore2X + 5}
                  y={85 + index * 35}
                  width={50}
                  height={20}
                  fill={line.color}
                  stroke="#374151"
                  strokeWidth={1}
                  rx={2}
                  opacity={line.state === 'Invalid' ? 0.5 : 1}
                />
                <text
                  x={msiCore2X + 30}
                  y={98 + index * 35}
                  textAnchor="middle"
                  fontSize="9"
                  fill="white"
                  className="font-medium"
                >
                  {line.variable}
                </text>
                
                {/* State indicator */}
                <text
                  x={msiCore2X + 85}
                  y={98 + index * 35}
                  textAnchor="middle"
                  fontSize="10"
                  fill={getCacheStateColor(line.state)}
                  className="font-bold"
                >
                  {line.state}
                </text>
                
                {/* Invalid overlay */}
                {line.state === 'Invalid' && (
                  <line
                    x1={msiCore2X + 5}
                    y1={85 + index * 35}
                    x2={msiCore2X + 55}
                    y2={105 + index * 35}
                    stroke="#dc2626"
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                )}
              </g>
            ))}
          </g>

          {/* MSI Main Memory */}
          <g>
            <text
              x={msiStartX + MSI_SECTION_WIDTH / 2}
              y={msiMemoryY - 20}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              className="font-bold"
            >
              Main Memory (MSI View)
            </text>
            
            <rect
              x={msiStartX + 50}
              y={msiMemoryY}
              width={MSI_SECTION_WIDTH - 100}
              height={40}
              fill="#f9fafb"
              stroke="#374151"
              strokeWidth={2}
              rx={4}
            />
            
            {/* Memory blocks in MSI view */}
            {memoryState.slice(0, 4).map((block, index) => (
              <g key={`msi-memory-${block.address}`}>
                <rect
                  x={msiStartX + 60 + index * 50}
                  y={msiMemoryY + 5}
                  width={45}
                  height={30}
                  fill={block.color}
                  stroke="#374151"
                  strokeWidth={1}
                  rx={2}
                />
                <text
                  x={msiStartX + 82.5 + index * 50}
                  y={msiMemoryY + 22}
                  textAnchor="middle"
                  fontSize="8"
                  fill="white"
                  className="font-medium"
                >
                  {block.label}
                </text>
              </g>
            ))}
          </g>
        </g>

        {/* Animated Access Arrow - Timeline */}
        {isAnimating && currentAccessStep && (
          <g>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#ef4444"
                />
              </marker>
            </defs>
            
            {(() => {
              const targetBlock = memoryState.find(block => block.label === currentAccessStep.variable);
              if (!targetBlock) return null;
              
              const targetIndex = memoryState.findIndex(block => block.label === currentAccessStep.variable);
              const targetX = memoryStartX + targetIndex * MEMORY_BLOCK_WIDTH + MEMORY_BLOCK_WIDTH/2;
              const targetY = memoryY;
              
              const sourceX = currentAccessStep.core === 'Core1' ? core1X + CORE_WIDTH/2 : core2X + CORE_WIDTH/2;
              const sourceY = coreY + CORE_HEIGHT;
              
              return (
                <line
                  x1={sourceX}
                  y1={sourceY}
                  x2={targetX}
                  y2={targetY}
                  stroke="#ef4444"
                  strokeWidth={3}
                  markerEnd="url(#arrowhead)"
                  className="animate-pulse"
                />
              );
            })()}
          </g>
        )}

        {/* Coherence Activity Indicator */}
        {isAnimating && (
          <g>
            <circle
              cx={msiStartX + MSI_SECTION_WIDTH / 2}
              cy={250}
              r={25}
              fill="none"
              stroke="#ef4444"
              strokeWidth={3}
              strokeDasharray="8,4"
              className="animate-spin"
            />
            <text
              x={msiStartX + MSI_SECTION_WIDTH / 2}
              y={255}
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

      {/* Action Log */}
      {actionLog.length > 0 && (
        <div className="mt-6 p-4 bg-white border rounded-lg shadow-sm max-w-2xl">
          <h5 className="font-semibold mb-2">Action Log:</h5>
          <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
            {actionLog.map((action, index) => (
              <div key={index} className="text-gray-700">
                {action}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-white border rounded-lg shadow-sm max-w-6xl">
        <h5 className="font-semibold mb-2">Consolidated Memory Coherence Visualization Legend:</h5>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <h6 className="font-medium mb-1">MSI Cache States:</h6>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Modified - Core owns and has modified the data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Shared - Core has clean copy, others may too</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span>Invalid - Cache line is stale/invalid</span>
              </div>
            </div>
          </div>
          <div>
            <h6 className="font-medium mb-1">Memory Timeline (Left):</h6>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-400 rounded"></div>
                <span>Variables with different colors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-800 rounded"></div>
                <span>Bold border indicates current owner</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Animated arrow shows access</span>
              </div>
            </div>
          </div>
          <div>
            <h6 className="font-medium mb-1">MSI Protocol (Right):</h6>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 border-2 border-red-500 rounded"></div>
                <span>Modified state cache line</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 border-2 border-green-500 rounded"></div>
                <span>Shared state cache line</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 border-2 border-gray-500 rounded opacity-50"></div>
                <span>Invalid state cache line</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm"><strong>Consolidated View:</strong> The left side shows the memory access timeline with cores and memory blocks, 
          while the right side shows the detailed MSI cache coherence protocol states. Both views update synchronously to show 
          the same coherence events from different perspectives.</p>
        </div>
      </div>
    </div>
  );
};

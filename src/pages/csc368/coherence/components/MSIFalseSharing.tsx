import { useState } from 'react';

interface MSIFalseSharingProps {
  width?: number;
  height?: number;
  className?: string;
}

type MSIState = 'Modified' | 'Shared' | 'Invalid';
type CoreId = 'Core1' | 'Core2';

interface CoreState {
  msiState: MSIState;
  hasData: boolean;
  isAnimating: boolean;
}

interface CacheLineState {
  owner: CoreId | null;
  lastAccess: CoreId | null;
  accessCount: number;
}

export function MSIFalseSharing({ 
  width = 1000, 
  height = 600, 
  className = "" 
}: MSIFalseSharingProps) {
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
  
  const [cacheLineState, setCacheLineState] = useState<CacheLineState>({
    owner: null,
    lastAccess: null,
    accessCount: 0
  });
  
  const [message, setMessage] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation duration
  const ANIMATION_DURATION = 1500;
  
  // Handle Core 1 write
  const handleCore1Write = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setMessage('Core 1 writing to gVar1...');
    
    // Animate Core 1 access
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
      
      setCacheLineState({
        owner: 'Core1',
        lastAccess: 'Core1',
        accessCount: cacheLineState.accessCount + 1
      });
      
      setIsAnimating(false);
    }, ANIMATION_DURATION);
  };
  
  // Handle Core 2 write
  const handleCore2Write = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setMessage('Core 2 writing to gVar2...');
    
    // Animate Core 2 access
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
      
      setCacheLineState({
        owner: 'Core2',
        lastAccess: 'Core2',
        accessCount: cacheLineState.accessCount + 1
      });
      
      setIsAnimating(false);
    }, ANIMATION_DURATION);
  };
  
  // Reset simulation
  const handleReset = () => {
    setCore1State({ msiState: 'Invalid', hasData: false, isAnimating: false });
    setCore2State({ msiState: 'Invalid', hasData: false, isAnimating: false });
    setCacheLineState({ owner: null, lastAccess: null, accessCount: 0 });
    setMessage('');
    setIsAnimating(false);
  };
  
  // Get MSI state color
  const getMSIColor = (state: MSIState) => {
    switch (state) {
      case 'Modified': return '#ef4444'; // Red
      case 'Shared': return '#10b981';   // Green
      case 'Invalid': return '#6b7280';  // Gray
    }
  };
  
  // Get core highlight color
  const getCoreHighlight = (coreId: CoreId) => {
    if (cacheLineState.owner === coreId) {
      return '#3b82f6'; // Blue for owner
    }
    return 'transparent';
  };
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="mb-4 text-center">
        <h4 className="text-lg font-semibold mb-2">MSI Cache Coherence Protocol</h4>
        <p className="text-sm text-gray-600">
          False Sharing Visualization with Modified/Shared/Invalid states
        </p>
      </div>
      
      {/* Control Panel */}
      <div className="mb-6 flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleCore1Write}
          disabled={isAnimating}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            core1State.isAnimating 
              ? 'bg-orange-500 text-white shadow-lg animate-pulse' 
              : 'bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-400'
          }`}
        >
          Step: Core 1 writes gVar1
        </button>
        
        <button
          onClick={handleCore2Write}
          disabled={isAnimating}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            core2State.isAnimating 
              ? 'bg-green-500 text-white shadow-lg animate-pulse' 
              : 'bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400'
          }`}
        >
          Step: Core 2 writes gVar2
        </button>
        
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
      
      {/* Status Message */}
      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-800">{message}</p>
        </div>
      )}
      
      {/* Stats */}
      <div className="mb-4 text-center text-sm text-gray-600">
        <p>Cache line owner: <span className="font-medium">{cacheLineState.owner || 'None'}</span></p>
        <p>Total coherence events: <span className="font-medium">{cacheLineState.accessCount}</span></p>
      </div>
      
      <svg width={width} height={height} className="border rounded-lg bg-gray-50">
        {/* Core 1 Cache */}
        <g>
          {/* Core 1 Title */}
          <text
            x={150}
            y={40}
            textAnchor="middle"
            fontSize="16"
            fill="#374151"
            className="font-bold"
          >
            Core 1 Cache
          </text>
          
          {/* Core 1 MSI State */}
          <rect
            x={80}
            y={50}
            width={140}
            height={20}
            fill={getMSIColor(core1State.msiState)}
            stroke="#374151"
            strokeWidth={1}
            rx={4}
            className="transition-all duration-300"
          />
          <text
            x={150}
            y={64}
            textAnchor="middle"
            fontSize="12"
            fill="white"
            className="font-medium"
          >
            {core1State.msiState}
          </text>
          
          {/* Core 1 Cache Lines */}
          {['0x00', '0x40', '0x80', '0xC0'].map((addr, index) => {
            const y = 80 + index * 30;
            const isTargetLine = addr === '0x00';
            
            return (
              <g key={addr}>
                {/* Address label */}
                <text
                  x={50}
                  y={y + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                  className="font-mono"
                >
                  {addr}
                </text>
                
                {/* Cache line */}
                <rect
                  x={70}
                  y={y + 5}
                  width={160}
                  height={25}
                  fill={isTargetLine ? '#f3f4f6' : '#ffffff'}
                  stroke={isTargetLine ? getCoreHighlight('Core1') : '#e5e7eb'}
                  strokeWidth={isTargetLine ? 3 : 1}
                  rx={2}
                  className="transition-all duration-300"
                />
                
                {/* gVar1 data */}
                {isTargetLine && core1State.hasData && (
                  <g className={core1State.msiState === 'Invalid' ? 'opacity-50' : ''}>
                    <rect
                      x={80}
                      y={y + 8}
                      width={60}
                      height={19}
                      fill="#fb923c"
                      stroke="#ea580c"
                      strokeWidth={1}
                      rx={2}
                      className={`transition-all duration-300 ${
                        core1State.msiState === 'Invalid' ? 'opacity-50' : ''
                      }`}
                    />
                    <text
                      x={110}
                      y={y + 20}
                      textAnchor="middle"
                      fontSize="10"
                      fill="white"
                      className="font-medium"
                    >
                      gVar1 = 5
                    </text>
                    {core1State.msiState === 'Invalid' && (
                      <line
                        x1={80}
                        y1={y + 8}
                        x2={140}
                        y2={y + 27}
                        stroke="#dc2626"
                        strokeWidth={2}
                        className="animate-pulse"
                      />
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </g>
        
        {/* Core 2 Cache */}
        <g>
          {/* Core 2 Title */}
          <text
            x={450}
            y={40}
            textAnchor="middle"
            fontSize="16"
            fill="#374151"
            className="font-bold"
          >
            Core 2 Cache
          </text>
          
          {/* Core 2 MSI State */}
          <rect
            x={380}
            y={50}
            width={140}
            height={20}
            fill={getMSIColor(core2State.msiState)}
            stroke="#374151"
            strokeWidth={1}
            rx={4}
            className="transition-all duration-300"
          />
          <text
            x={450}
            y={64}
            textAnchor="middle"
            fontSize="12"
            fill="white"
            className="font-medium"
          >
            {core2State.msiState}
          </text>
          
          {/* Core 2 Cache Lines */}
          {['0x00', '0x40', '0x80', '0xC0'].map((addr, index) => {
            const y = 80 + index * 30;
            const isTargetLine = addr === '0x00';
            
            return (
              <g key={addr}>
                {/* Address label */}
                <text
                  x={350}
                  y={y + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                  className="font-mono"
                >
                  {addr}
                </text>
                
                {/* Cache line */}
                <rect
                  x={370}
                  y={y + 5}
                  width={160}
                  height={25}
                  fill={isTargetLine ? '#f3f4f6' : '#ffffff'}
                  stroke={isTargetLine ? getCoreHighlight('Core2') : '#e5e7eb'}
                  strokeWidth={isTargetLine ? 3 : 1}
                  rx={2}
                  className="transition-all duration-300"
                />
                
                {/* gVar2 data */}
                {isTargetLine && core2State.hasData && (
                  <g className={core2State.msiState === 'Invalid' ? 'opacity-50' : ''}>
                    <rect
                      x={450}
                      y={y + 8}
                      width={60}
                      height={19}
                      fill="#34d399"
                      stroke="#059669"
                      strokeWidth={1}
                      rx={2}
                      className={`transition-all duration-300 ${
                        core2State.msiState === 'Invalid' ? 'opacity-50' : ''
                      }`}
                    />
                    <text
                      x={480}
                      y={y + 20}
                      textAnchor="middle"
                      fontSize="10"
                      fill="white"
                      className="font-medium"
                    >
                      gVar2 = 7
                    </text>
                    {core2State.msiState === 'Invalid' && (
                      <line
                        x1={450}
                        y1={y + 8}
                        x2={510}
                        y2={y + 27}
                        stroke="#dc2626"
                        strokeWidth={2}
                        className="animate-pulse"
                      />
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </g>
        
        {/* Main Memory */}
        <g>
          {/* Memory Title */}
          <text
            x={300}
            y={280}
            textAnchor="middle"
            fontSize="16"
            fill="#374151"
            className="font-bold"
          >
            Main Memory
          </text>
          
          {/* Memory Address Range */}
          <text
            x={300}
            y={300}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
            className="font-mono"
          >
            Address Range: 0xF000 - 0xF040
          </text>
          
          {/* Memory Cache Line */}
          <rect
            x={150}
            y={320}
            width={300}
            height={40}
            fill="#f9fafb"
            stroke="#374151"
            strokeWidth={2}
            rx={4}
            className="transition-all duration-300"
          />
          
          {/* Memory Cache Line Label */}
          <text
            x={300}
            y={315}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
            className="font-medium"
          >
            Cache Line (64 bytes)
          </text>
          
          {/* gVar1 in Memory */}
          <rect
            x={170}
            y={330}
            width={60}
            height={20}
            fill="#fb923c"
            stroke="#ea580c"
            strokeWidth={1}
            rx={2}
          />
          <text
            x={200}
            y={343}
            textAnchor="middle"
            fontSize="10"
            fill="white"
            className="font-medium"
          >
            gVar1
          </text>
          
          {/* gVar2 in Memory */}
          <rect
            x={370}
            y={330}
            width={60}
            height={20}
            fill="#34d399"
            stroke="#059669"
            strokeWidth={1}
            rx={2}
          />
          <text
            x={400}
            y={343}
            textAnchor="middle"
            fontSize="10"
            fill="white"
            className="font-medium"
          >
            gVar2
          </text>
          
          {/* Memory addresses */}
          <text
            x={160}
            y={375}
            textAnchor="middle"
            fontSize="9"
            fill="#6b7280"
            className="font-mono"
          >
            0xF000
          </text>
          <text
            x={440}
            y={375}
            textAnchor="middle"
            fontSize="9"
            fill="#6b7280"
            className="font-mono"
          >
            0xF040
          </text>
        </g>
        
        {/* Connection Lines */}
        <g stroke="#9ca3af" strokeWidth={1} strokeDasharray="4,4">
          {/* Core 1 to Memory */}
          <line
            x1={150}
            y1={200}
            x2={200}
            y2={320}
            className="transition-all duration-300"
          />
          
          {/* Core 2 to Memory */}
          <line
            x1={450}
            y1={200}
            x2={400}
            y2={320}
            className="transition-all duration-300"
          />
        </g>
        
        {/* Coherence Traffic Animation */}
        {isAnimating && (
          <g>
            <circle
              cx={300}
              cy={250}
              r={20}
              fill="none"
              stroke="#ef4444"
              strokeWidth={3}
              strokeDasharray="8,4"
              className="animate-spin"
            />
            <text
              x={300}
              y={255}
              textAnchor="middle"
              fontSize="12"
              fill="#ef4444"
              className="font-bold"
            >
              ⚡
            </text>
          </g>
        )}
      </svg>
      
      {/* Explanation Panel */}
      <div className="mt-6 p-4 bg-white border rounded-lg shadow-sm max-w-3xl">
        <h5 className="font-semibold mb-2">MSI Protocol Behavior:</h5>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span><strong>Modified:</strong> Core has exclusive write access and owns the cache line</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span><strong>Shared:</strong> Core has read-only access (not used in this write-only example)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span><strong>Invalid:</strong> Core's cache line is invalid and must be fetched from memory</span>
          </div>
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p><strong>False Sharing Issue:</strong> Even though gVar1 and gVar2 are different variables, 
            they reside in the same cache line. When one core writes to its variable, it invalidates 
            the entire cache line in the other core, causing unnecessary coherence traffic.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

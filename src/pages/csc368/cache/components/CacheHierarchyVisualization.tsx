import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AddressBitVisualization } from "./AddressBitVisualization";
import { WorkloadTester } from "./WorkloadTester";

// Cache configuration types
interface CacheConfig {
  enabled: boolean;
  size: number; // in KB
  blockSize: number; // in bytes
  associativity: number; // 1 = direct mapped, > 1 = set associative
  accessTime: number; // in cycles
}

interface CacheHierarchyConfig {
  l1: CacheConfig;
  l2: CacheConfig;
  l3: CacheConfig;
  ramAccessTime: number;
}

// Default cache configurations
const DEFAULT_CACHE_CONFIG: CacheHierarchyConfig = {
  l1: {
    enabled: true,
    size: 32, // 32KB
    blockSize: 64, // 64 bytes
    associativity: 2, // 2-way set associative
    accessTime: 1, // 1 cycle
  },
  l2: {
    enabled: true,
    size: 256, // 256KB
    blockSize: 64, // 64 bytes
    associativity: 8, // 8-way set associative
    accessTime: 10, // 10 cycles
  },
  l3: {
    enabled: true,
    size: 8192, // 8MB
    blockSize: 64, // 64 bytes
    associativity: 16, // 16-way set associative
    accessTime: 30, // 30 cycles
  },
  ramAccessTime: 300, // 300 cycles
};

export const CacheHierarchyVisualization: React.FC = () => {
  const [config, setConfig] = useState<CacheHierarchyConfig>(DEFAULT_CACHE_CONFIG);
  const [activeTab, setActiveTab] = useState("hierarchy");

  const updateCacheConfig = (level: 'l1' | 'l2' | 'l3', field: keyof CacheConfig, value: number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        [field]: value
      }
    }));
  };

  const calculateSets = (cacheConfig: CacheConfig) => {
    const totalBlocks = (cacheConfig.size * 1024) / cacheConfig.blockSize;
    return totalBlocks / cacheConfig.associativity;
  };

  const calculateIndexBits = (cacheConfig: CacheConfig) => {
    const sets = calculateSets(cacheConfig);
    return Math.log2(sets);
  };

  const calculateOffsetBits = (cacheConfig: CacheConfig) => {
    return Math.log2(cacheConfig.blockSize);
  };

  const calculateTagBits = (cacheConfig: CacheConfig, addressBits = 32) => {
    const indexBits = calculateIndexBits(cacheConfig);
    const offsetBits = calculateOffsetBits(cacheConfig);
    return addressBits - indexBits - offsetBits;
  };

  const renderCacheLevel = (level: 'l1' | 'l2' | 'l3', levelName: string, color: string) => {
    const cache = config[level];
    
    return (
      <Card className={`w-full ${!cache.enabled ? 'opacity-50' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${color}`} />
              {levelName} Cache
            </CardTitle>
            <Switch
              checked={cache.enabled}
              onCheckedChange={(checked) => updateCacheConfig(level, 'enabled', checked)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Size (KB)</Label>
              <Select 
                value={cache.size.toString()} 
                onValueChange={(value) => updateCacheConfig(level, 'size', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {level === 'l1' && (
                    <>
                      <SelectItem value="16">16 KB</SelectItem>
                      <SelectItem value="32">32 KB</SelectItem>
                      <SelectItem value="64">64 KB</SelectItem>
                    </>
                  )}
                  {level === 'l2' && (
                    <>
                      <SelectItem value="128">128 KB</SelectItem>
                      <SelectItem value="256">256 KB</SelectItem>
                      <SelectItem value="512">512 KB</SelectItem>
                      <SelectItem value="1024">1 MB</SelectItem>
                    </>
                  )}
                  {level === 'l3' && (
                    <>
                      <SelectItem value="2048">2 MB</SelectItem>
                      <SelectItem value="4096">4 MB</SelectItem>
                      <SelectItem value="8192">8 MB</SelectItem>
                      <SelectItem value="16384">16 MB</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Block Size (bytes)</Label>
              <Select 
                value={cache.blockSize.toString()} 
                onValueChange={(value) => updateCacheConfig(level, 'blockSize', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="32">32 bytes</SelectItem>
                  <SelectItem value="64">64 bytes</SelectItem>
                  <SelectItem value="128">128 bytes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Associativity</Label>
              <Select 
                value={cache.associativity.toString()} 
                onValueChange={(value) => updateCacheConfig(level, 'associativity', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Direct Mapped</SelectItem>
                  <SelectItem value="2">2-way</SelectItem>
                  <SelectItem value="4">4-way</SelectItem>
                  <SelectItem value="8">8-way</SelectItem>
                  <SelectItem value="16">16-way</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Access Time (cycles)</Label>
              <div className="px-3 py-2 border rounded-md bg-muted">
                {cache.accessTime}
              </div>
            </div>
          </div>
          
          {cache.enabled && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Calculated Properties:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Sets: {calculateSets(cache).toLocaleString()}</div>
                <div>Blocks: {((cache.size * 1024) / cache.blockSize).toLocaleString()}</div>
                <div>Index bits: {calculateIndexBits(cache)}</div>
                <div>Offset bits: {calculateOffsetBits(cache)}</div>
                <div>Tag bits: {calculateTagBits(cache)}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderHierarchyDiagram = () => {
    return (
      <div className="w-full">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-2">Memory Hierarchy</h3>
          <p className="text-muted-foreground">Data flows between CPU and RAM through cache levels</p>
        </div>
        
        {/* Mobile: Vertical layout */}
        <div className="md:hidden flex flex-col items-center space-y-6 p-6">
          {/* CPU */}
          <div className="flex items-center justify-center w-24 h-16 bg-blue-600 text-white rounded-lg font-semibold">
            CPU
          </div>
          
          <div className="w-1 h-6 bg-gray-400"></div>
          
          {/* L1 Cache */}
          {config.l1.enabled && (
            <>
              <Card className="w-48 border-blue-400 border-2">
                <CardContent className="p-4 text-center">
                  <div className="w-4 h-4 rounded bg-blue-400 mx-auto mb-2"></div>
                  <div className="font-semibold">L1 Cache</div>
                  <div className="text-sm text-muted-foreground">
                    {config.l1.size} KB • {config.l1.accessTime} cycle
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {calculateSets(config.l1)} sets × {config.l1.associativity} ways
                  </div>
                </CardContent>
              </Card>
              <div className="w-1 h-6 bg-gray-400"></div>
            </>
          )}
          
          {/* L2 Cache */}
          {config.l2.enabled && (
            <>
              <Card className="w-56 border-green-500 border-2">
                <CardContent className="p-4 text-center">
                  <div className="w-4 h-4 rounded bg-green-500 mx-auto mb-2"></div>
                  <div className="font-semibold">L2 Cache</div>
                  <div className="text-sm text-muted-foreground">
                    {config.l2.size} KB • {config.l2.accessTime} cycles
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {calculateSets(config.l2)} sets × {config.l2.associativity} ways
                  </div>
                </CardContent>
              </Card>
              <div className="w-1 h-6 bg-gray-400"></div>
            </>
          )}
          
          {/* L3 Cache */}
          {config.l3.enabled && (
            <>
              <Card className="w-64 border-yellow-500 border-2">
                <CardContent className="p-4 text-center">
                  <div className="w-4 h-4 rounded bg-yellow-500 mx-auto mb-2"></div>
                  <div className="font-semibold">L3 Cache</div>
                  <div className="text-sm text-muted-foreground">
                    {config.l3.size >= 1024 ? `${config.l3.size / 1024} MB` : `${config.l3.size} KB`} • {config.l3.accessTime} cycles
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {calculateSets(config.l3)} sets × {config.l3.associativity} ways
                  </div>
                </CardContent>
              </Card>
              <div className="w-1 h-6 bg-gray-400"></div>
            </>
          )}
          
          {/* RAM */}
          <Card className="w-72 border-red-500 border-2">
            <CardContent className="p-4 text-center">
              <div className="w-4 h-4 rounded bg-red-500 mx-auto mb-2"></div>
              <div className="font-semibold">Main Memory (RAM)</div>
              <div className="text-sm text-muted-foreground">
                {config.ramAccessTime} cycles
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Desktop/Tablet: Horizontal layout */}
        <div className="hidden md:flex items-center justify-between p-2 max-w-full">
          {/* CPU */}
          <div className="flex items-center justify-center w-12 h-8 bg-blue-600 text-white rounded font-semibold text-xs flex-shrink-0">
            CPU
          </div>
          
          {/* Arrow from CPU */}
          <div className="flex items-center mx-0.5">
            <div className="h-0.5 w-2 bg-gray-400"></div>
            <div className="w-0 h-0 border-l-2 border-l-gray-400 border-t-1 border-b-1 border-t-transparent border-b-transparent"></div>
          </div>
          
          {/* L1 Cache */}
          {config.l1.enabled && (
            <>
              <Card className="w-24 border-blue-400 border-2 flex-shrink-0">
                <CardContent className="p-1 text-center">
                  <div className="w-2 h-2 rounded bg-blue-400 mx-auto mb-0.5"></div>
                  <div className="font-semibold text-xs">L1</div>
                  <div className="text-[10px] text-muted-foreground">
                    {config.l1.size}KB
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {config.l1.accessTime}cy
                  </div>
                </CardContent>
              </Card>
              
              {/* Arrow to next level */}
              {(config.l2.enabled || config.l3.enabled || (!config.l2.enabled && !config.l3.enabled)) && (
                <div className="flex items-center mx-0.5">
                  <div className="h-0.5 w-2 bg-gray-400"></div>
                  <div className="w-0 h-0 border-l-2 border-l-gray-400 border-t-1 border-b-1 border-t-transparent border-b-transparent"></div>
                </div>
              )}
            </>
          )}
          
          {/* L2 Cache */}
          {config.l2.enabled && (
            <>
              <Card className="w-24 border-green-500 border-2 flex-shrink-0">
                <CardContent className="p-1 text-center">
                  <div className="w-2 h-2 rounded bg-green-500 mx-auto mb-0.5"></div>
                  <div className="font-semibold text-xs">L2</div>
                  <div className="text-[10px] text-muted-foreground">
                    {config.l2.size}KB
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {config.l2.accessTime}cy
                  </div>
                </CardContent>
              </Card>
              
              {/* Arrow to next level */}
              {(config.l3.enabled || !config.l3.enabled) && (
                <div className="flex items-center mx-0.5">
                  <div className="h-0.5 w-2 bg-gray-400"></div>
                  <div className="w-0 h-0 border-l-2 border-l-gray-400 border-t-1 border-b-1 border-t-transparent border-b-transparent"></div>
                </div>
              )}
            </>
          )}
          
          {/* L3 Cache */}
          {config.l3.enabled && (
            <>
              <Card className="w-24 border-yellow-500 border-2 flex-shrink-0">
                <CardContent className="p-1 text-center">
                  <div className="w-2 h-2 rounded bg-yellow-500 mx-auto mb-0.5"></div>
                  <div className="font-semibold text-xs">L3</div>
                  <div className="text-[10px] text-muted-foreground">
                    {config.l3.size >= 1024 ? `${config.l3.size / 1024}MB` : `${config.l3.size}KB`}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {config.l3.accessTime}cy
                  </div>
                </CardContent>
              </Card>
              
              {/* Arrow to RAM */}
              <div className="flex items-center mx-0.5">
                <div className="h-0.5 w-2 bg-gray-400"></div>
                <div className="w-0 h-0 border-l-2 border-l-gray-400 border-t-1 border-b-1 border-t-transparent border-b-transparent"></div>
              </div>
            </>
          )}
          
          {/* Arrow to RAM (if no enabled caches after current) */}
          {!config.l1.enabled && !config.l2.enabled && !config.l3.enabled && (
            <div className="flex items-center mx-0.5">
              <div className="h-0.5 w-2 bg-gray-400"></div>
              <div className="w-0 h-0 border-l-2 border-l-gray-400 border-t-1 border-b-1 border-t-transparent border-b-transparent"></div>
            </div>
          )}
          
          {/* RAM */}
          <Card className="w-24 border-red-500 border-2 flex-shrink-0">
            <CardContent className="p-1 text-center">
              <div className="w-2 h-2 rounded bg-red-500 mx-auto mb-0.5"></div>
              <div className="font-semibold text-xs">RAM</div>
              <div className="text-[10px] text-muted-foreground">
                Memory
              </div>
              <div className="text-[10px] text-muted-foreground">
                {config.ramAccessTime}cy
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Performance Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Access Latency Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {config.l1.enabled && (
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-600">L1 Hit</div>
                  <div className="text-2xl font-bold">{config.l1.accessTime}</div>
                  <div className="text-sm text-muted-foreground">cycles</div>
                </div>
              )}
              {config.l2.enabled && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-600">L2 Hit</div>
                  <div className="text-2xl font-bold">{config.l2.accessTime}</div>
                  <div className="text-sm text-muted-foreground">cycles</div>
                </div>
              )}
              {config.l3.enabled && (
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="font-semibold text-yellow-600">L3 Hit</div>
                  <div className="text-2xl font-bold">{config.l3.accessTime}</div>
                  <div className="text-sm text-muted-foreground">cycles</div>
                </div>
              )}
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="font-semibold text-red-600">RAM Access</div>
                <div className="text-2xl font-bold">{config.ramAccessTime}</div>
                <div className="text-sm text-muted-foreground">cycles</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="address">Address Bits</TabsTrigger>
          <TabsTrigger value="workloads">Workloads</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hierarchy" className="space-y-4">
          {renderHierarchyDiagram()}
        </TabsContent>
        
        <TabsContent value="configuration" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderCacheLevel('l1', 'L1', 'bg-blue-400')}
            {renderCacheLevel('l2', 'L2', 'bg-green-500')}
            {renderCacheLevel('l3', 'L3', 'bg-yellow-500')}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>RAM Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Access Time (cycles)</Label>
                  <Slider
                    value={[config.ramAccessTime]}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, ramAccessTime: value[0] }))}
                    max={500}
                    min={100}
                    step={10}
                    className="mt-2"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    Current: {config.ramAccessTime} cycles
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="address" className="space-y-4">
          <AddressBitVisualization config={config} />
        </TabsContent>
        
        <TabsContent value="workloads" className="space-y-4">
          <WorkloadTester config={config} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

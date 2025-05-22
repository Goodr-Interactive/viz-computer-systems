import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// Define the instruction stages
const PIPELINE_STAGES = ["Fetch", "Decode", "Execute", "Memory", "Write Back"];

// Define some sample instructions for visualization
const DEFAULT_INSTRUCTIONS = [
  { id: 1, name: "ADD R1, R2, R3", color: "#4285F4" },
  { id: 2, name: "SUB R4, R5, R6", color: "#EA4335" },
  { id: 3, name: "LW R7, 0(R8)", color: "#FBBC05" },
  { id: 4, name: "SW R9, 4(R10)", color: "#34A853" },
  { id: 5, name: "BEQ R11, R12, label", color: "#8F44AD" }
];

interface Instruction {
  id: number;
  name: string;
  color: string;
  currentStage?: number;
  startCycle?: number;
  stalled?: boolean;
}

interface PipelineVisualizationProps {
  width?: number;
  height?: number;
  instructions?: Instruction[];
}

export const PipelineVisualization: React.FC<PipelineVisualizationProps> = ({
  width = 800,
  height = 400,
  instructions = DEFAULT_INSTRUCTIONS
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const nonPipelinedSvgRef = useRef<SVGSVGElement>(null);
  const [cycles, setCycles] = useState<number>(0);
  const [pipelineInstructions, setPipelineInstructions] = useState<Instruction[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000); // milliseconds between cycles
  const [isPipelined, setIsPipelined] = useState<boolean>(true); // Toggle between pipelined and non-pipelined
  
  // Add instruction state
  const [newInstructionName, setNewInstructionName] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [availableColors] = useState<string[]>([
    "#4285F4", "#EA4335", "#FBBC05", "#34A853", "#8F44AD", 
    "#FF5722", "#009688", "#673AB7", "#3F51B5", "#00BCD4", 
    "#607D8B", "#795548", "#9C27B0", "#2196F3", "#FF9800"
  ]);
  
  // Initialize pipeline
  useEffect(() => {
    setPipelineInstructions(
      instructions.map((instr, index) => ({
        ...instr,
        currentStage: -1, // Not yet in pipeline
        startCycle: index, // Start one cycle after the previous instruction
        stalled: false
      }))
    );
  }, [instructions]);

  // Core visualization logic
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 50, right: 30, bottom: 50, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create the main group element
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X and Y scales
    const xScale = d3.scaleBand()
      .domain(d3.range(0, cycles + 5).map(String))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleBand()
      .domain(PIPELINE_STAGES)
      .range([0, innerHeight])
      .padding(0.1);

    // Add X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 40)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text("Clock Cycle");

    // Add Y axis
    g.append("g")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -innerHeight / 2)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text("Pipeline Stage");

    // Draw grid lines
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(d3.range(0, cycles + 5))
      .enter()
      .append("line")
      .attr("x1", d => xScale(String(d))! + xScale.bandwidth() / 2)
      .attr("x2", d => xScale(String(d))! + xScale.bandwidth() / 2)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(PIPELINE_STAGES)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", d => yScale(d)! + yScale.bandwidth())
      .attr("y2", d => yScale(d)! + yScale.bandwidth())
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    // Draw pipeline stages for each instruction
    pipelineInstructions.forEach(instr => {
      if (instr.startCycle === undefined || instr.currentStage === undefined || instr.currentStage < 0) {
        return;
      }

      // For each cycle this instruction has been in the pipeline
      for (let stage = 0; stage <= Math.min(instr.currentStage, PIPELINE_STAGES.length - 1); stage++) {
        const cycle = instr.startCycle + stage;
        if (cycle > cycles) continue;

        const stageName = PIPELINE_STAGES[stage];
        
        // Draw the rectangle for this stage
        g.append("rect")
          .attr("x", xScale(String(cycle))!)
          .attr("y", yScale(stageName)!)
          .attr("width", xScale.bandwidth())
          .attr("height", yScale.bandwidth())
          .attr("fill", instr.stalled && stage === instr.currentStage ? "#f8d7da" : instr.color)
          .attr("stroke", "black")
          .attr("opacity", 0.7)
          .attr("rx", 4)
          .on("mouseover", function(event) {
            d3.select(this).attr("opacity", 1);
            
            const tooltip = svg.append("g")
              .attr("class", "tooltip")
              .attr("transform", `translate(${event.offsetX + 10},${event.offsetY - 10})`);
              
            tooltip.append("rect")
              .attr("fill", "white")
              .attr("stroke", "black")
              .attr("rx", 5)
              .attr("ry", 5)
              .attr("width", 180)
              .attr("height", 60)
              .attr("opacity", 0.9);
              
            tooltip.append("text")
              .attr("x", 10)
              .attr("y", 20)
              .text(`Instruction: ${instr.name}`);
              
            tooltip.append("text")
              .attr("x", 10)
              .attr("y", 40)
              .text(`Stage: ${stageName} (Cycle ${cycle})`);
          })
          .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.7);
            svg.selectAll(".tooltip").remove();
          });
          
        // Add text label (instruction ID)
        g.append("text")
          .attr("x", xScale(String(cycle))! + xScale.bandwidth() / 2)
          .attr("y", yScale(stageName)! + yScale.bandwidth() / 2)
          .attr("fill", "white")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-weight", "bold")
          .text(instr.id);
      }
    });

    // Draw instruction legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 150}, 10)`);

    pipelineInstructions.forEach((instr, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);
        
      legendItem.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", instr.color);
        
      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(instr.name);
    });
    
  }, [width, height, cycles, pipelineInstructions]);

  // Simulation logic
  useEffect(() => {
    if (!isRunning) return;
    
    const timer = setTimeout(() => {
      // Increment cycle
      setCycles(prev => prev + 1);
      
      // Update each instruction's position in the pipeline
      setPipelineInstructions(prevInstructions => {
        if (isPipelined) {
          // Pipelined execution - all instructions can advance simultaneously
          return prevInstructions.map(instr => {
            // If the instruction hasn't started yet
            if (instr.startCycle !== undefined && cycles < instr.startCycle) {
              return instr;
            }
            
            // If the instruction has already completed all stages
            if (instr.currentStage !== undefined && instr.currentStage >= PIPELINE_STAGES.length) {
              return instr;
            }
            
            // Otherwise, advance the instruction to the next stage
            return {
              ...instr,
              currentStage: (instr.currentStage !== undefined ? instr.currentStage + 1 : 0)
            };
          });
        } else {
          // Non-pipelined execution - only one instruction can be active at a time
          const activeInstructionIndex = prevInstructions.findIndex(
            instr => instr.currentStage !== undefined && 
                   instr.currentStage >= 0 && 
                   instr.currentStage < PIPELINE_STAGES.length
          );
          
          if (activeInstructionIndex === -1) {
            // No active instruction, try to start the next one
            const nextInstructionIndex = prevInstructions.findIndex(
              instr => instr.currentStage === -1
            );
            
            if (nextInstructionIndex !== -1) {
              return prevInstructions.map((instr, index) => {
                if (index === nextInstructionIndex) {
                  return { ...instr, currentStage: 0, startCycle: cycles };
                }
                return instr;
              });
            }
            return prevInstructions; // All done
          }
          
          // Advance the active instruction
          return prevInstructions.map((instr, index) => {
            if (index === activeInstructionIndex) {
              if (instr.currentStage !== undefined && instr.currentStage < PIPELINE_STAGES.length - 1) {
                return { ...instr, currentStage: instr.currentStage + 1 };
              } else {
                // This instruction is done, reset to find next one on next cycle
                return { ...instr, currentStage: PIPELINE_STAGES.length };
              }
            }
            return instr;
          });
        }
      });
    }, speed);
    
    return () => clearTimeout(timer);
  }, [isRunning, cycles, speed, isPipelined]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCycles(0);
    setPipelineInstructions(
      instructions.map((instr, index) => ({
        ...instr,
        currentStage: -1,
        startCycle: isPipelined ? index : undefined,
        stalled: false
      }))
    );
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(2000 - parseInt(e.target.value, 10));
  };
  
  const togglePipelineMode = () => {
    setIsRunning(false);
    setIsPipelined(!isPipelined);
    handleReset();
  };
  
  // Add instruction handlers
  const handleAddInstruction = () => {
    if (!newInstructionName.trim()) return;
    
    setIsRunning(false);
    
    const newInstruction: Instruction = {
      id: pipelineInstructions.length + 1,
      name: newInstructionName.trim(),
      color: availableColors[pipelineInstructions.length % availableColors.length],
      currentStage: -1,
      startCycle: isPipelined ? pipelineInstructions.length : undefined,
      stalled: false
    };
    
    setPipelineInstructions([...pipelineInstructions, newInstruction]);
    setNewInstructionName("");
    setShowAddForm(false);
  };
  
  const handleRemoveInstruction = (id: number) => {
    setIsRunning(false);
    const updatedInstructions = pipelineInstructions.filter(instr => instr.id !== id);
    
    // Reassign IDs to keep them sequential
    const reindexedInstructions = updatedInstructions.map((instr, index) => ({
      ...instr,
      id: index + 1,
      startCycle: isPipelined ? index : undefined
    }));
    
    setPipelineInstructions(reindexedInstructions);
    setCycles(0);
  };
  
  // Calculate total cycles to complete all instructions
  const totalCyclesRequired = isPipelined 
    ? pipelineInstructions.length + PIPELINE_STAGES.length - 1
    : pipelineInstructions.length * PIPELINE_STAGES.length;
  
  // Calculate CPI (Cycles Per Instruction) and IPC (Instructions Per Cycle)
  const cpi = pipelineInstructions.length > 0 
    ? (cycles / Math.min(cycles, pipelineInstructions.length)).toFixed(2)
    : "0.00";
    
  const ipc = cycles > 0 
    ? (Math.min(cycles, pipelineInstructions.length) / cycles).toFixed(2)
    : "0.00";
    
  // Calculate theoretical maximum metrics
  const theoreticalMaxCPI = isPipelined 
    ? "1.00" 
    : PIPELINE_STAGES.length.toFixed(2);
    
  const theoreticalMaxIPC = isPipelined 
    ? "1.00" 
    : (1 / PIPELINE_STAGES.length).toFixed(2);

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2 w-full">
        <div className="flex space-x-4">
          <button 
            onClick={handleStart}
            disabled={isRunning}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Start
          </button>
          <button 
            onClick={handleStop}
            disabled={!isRunning}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Stop
          </button>
          <button 
            onClick={handleReset}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Reset
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isPipelined}
              onChange={togglePipelineMode}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium">
              {isPipelined ? "Pipelined Mode" : "Non-pipelined Mode"}
            </span>
          </label>
        </div>
      </div>
      
      {/* Instruction Management UI */}
      <div className="w-full border-t border-b border-gray-200 py-4 my-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
          <h3 className="text-lg font-medium mb-2 md:mb-0">Instructions</h3>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm flex items-center"
          >
            {showAddForm ? "Cancel" : "Add Instruction"}
            {!showAddForm && (
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>
        </div>
        
        {showAddForm && (
          <div className="flex flex-col md:flex-row gap-2 mb-4 p-3 bg-gray-50 rounded">
            <input
              type="text"
              value={newInstructionName}
              onChange={(e) => setNewInstructionName(e.target.value)}
              placeholder="Enter instruction (e.g., ADD R1, R2, R3)"
              className="flex-grow px-3 py-2 border border-gray-300 rounded"
            />
            <button
              onClick={handleAddInstruction}
              disabled={!newInstructionName.trim()}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}
        
        <div className="max-h-40 overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {pipelineInstructions.map((instr) => (
              <li key={instr.id} className="py-2 flex justify-between items-center">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 mr-2 rounded-full" 
                    style={{ backgroundColor: instr.color }}
                  ></div>
                  <span>
                    <strong>{instr.id}:</strong> {instr.name}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveInstruction(instr.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Remove instruction"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full mb-2">
        <div className="flex items-center space-x-2">
          <span>Slow</span>
          <input 
            type="range" 
            min="100" 
            max="1900" 
            value={2000 - speed} 
            onChange={handleSpeedChange} 
            className="w-40"
          />
          <span>Fast</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <h3 className="text-lg font-medium">Clock Cycle: {cycles}</h3>
          </div>
          
          <div className="text-center flex items-center gap-2">
            <div>
              <h3 className="text-lg font-medium">
                CPI: {cpi} <span className="text-xs text-gray-500">(min: {theoreticalMaxCPI})</span>
              </h3>
            </div>
            <div className="text-xl">|</div>
            <div>
              <h3 className="text-lg font-medium">
                IPC: {ipc} <span className="text-xs text-gray-500">(max: {theoreticalMaxIPC})</span>
              </h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border border-gray-300 rounded-lg shadow-lg overflow-hidden mb-4">
        <svg ref={svgRef} width={width} height={height}></svg>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 w-full">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Performance Metrics:</strong> In {isPipelined ? "pipelined" : "non-pipelined"} mode, all {pipelineInstructions.length} instructions require approximately <strong>{totalCyclesRequired}</strong> cycles to complete.
              {isPipelined ? (
                <> A perfect pipeline achieves a CPI of 1.0 (one cycle per instruction), while non-pipelined execution requires {PIPELINE_STAGES.length} cycles per instruction.</>
              ) : (
                <> Without pipelining, each instruction must complete all {PIPELINE_STAGES.length} stages before the next can begin, resulting in a CPI of {PIPELINE_STAGES.length}.</>
              )}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-left w-full max-w-3xl">
        <h3 className="text-lg font-semibold mb-2">About Instruction Pipelining</h3>
        <p className="mb-2">
          Instruction pipelining is a technique used in modern CPU design to increase instruction throughput by
          executing multiple instructions simultaneously, each at a different stage of completion. The pipeline 
          is divided into stages, with each stage performing a specific part of the instruction processing.
        </p>
        <p className="mb-2">
          In this visualization, we have implemented a classic 5-stage pipeline:
        </p>
        <ul className="list-disc ml-8 mb-4">
          <li><strong>Fetch:</strong> Retrieve the instruction from memory</li>
          <li><strong>Decode:</strong> Decode the instruction and read registers</li>
          <li><strong>Execute:</strong> Perform the operation or calculate an address</li>
          <li><strong>Memory:</strong> Access memory if needed</li>
          <li><strong>Write Back:</strong> Write the result back to a register</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-2">Pipelined vs. Non-Pipelined Execution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-medium mb-1">Pipelined Execution</h4>
            <p className="text-sm">
              In pipelined execution, multiple instructions are in different stages of execution simultaneously.
              Once the pipeline is full, the processor can complete one instruction per clock cycle, which 
              significantly improves throughput.
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded">
            <h4 className="font-medium mb-1">Non-Pipelined Execution</h4>
            <p className="text-sm">
              In non-pipelined execution, each instruction must complete all stages before the next instruction 
              can begin. This means each instruction takes 5 cycles to complete, and the processor can only 
              complete one instruction every 5 cycles.
            </p>
          </div>
        </div>
        <p>
          Toggle between modes to see the dramatic difference in performance! In the real world, 
          modern processors use much deeper pipelines (often 10-20 stages) to achieve even higher performance.
        </p>
      </div>
    </div>
  );
};

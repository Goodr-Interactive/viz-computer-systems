import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// Define the instruction stages with register visualization
const PIPELINE_STAGES = ["Fetch", "Decode", "Execute", "Memory", "Writeback"];
const PIPELINE_REGISTERS = ["IF/ID", "ID/EX", "EX/MEM", "MEM/WB"];

// Define some sample instructions for visualization
const DEFAULT_INSTRUCTIONS = [
  { id: 1, name: "lw x1, 0(x20)", color: "#4285F4", registers: { src: ["x20"], dest: ["x1"] } },
  { id: 2, name: "lw x2, 4(x20)", color: "#EA4335", registers: { src: ["x20"], dest: ["x2"] } },
  { id: 3, name: "add x3, x1, x2", color: "#FBBC05", registers: { src: ["x1", "x2"], dest: ["x3"] } },
  { id: 4, name: "sw x3, 8(x20)", color: "#34A853", registers: { src: ["x3", "x20"], dest: [] } },
  { id: 5, name: "blt x0, x3, loop", color: "#8F44AD", registers: { src: ["x0", "x3"], dest: [] } }
];

interface Instruction {
  id: number;
  name: string;
  color: string;
  registers: {
    src: string[];
    dest: string[];
  };
  currentStage?: number;
  startCycle?: number;
  stalled?: boolean;
}

interface RegisterPipelineVisualizationProps {
  width?: number;
  height?: number;
  instructions?: Instruction[];
}

export const RegisterPipelineVisualization: React.FC<RegisterPipelineVisualizationProps> = ({
  width,
  height,
  instructions = DEFAULT_INSTRUCTIONS
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState<number>(width || 800);
  const [svgHeight, setSvgHeight] = useState<number>(height || 400);
  const [cycles, setCycles] = useState<number>(0);
  const [pipelineInstructions, setPipelineInstructions] = useState<Instruction[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000); // milliseconds between cycles
  const [isPipelined, setIsPipelined] = useState<boolean>(true); // Toggle between pipelined and non-pipelined
  
  // Register state
  const [registers, setRegisters] = useState<Record<string, number>>({
    x0: 0,  // x0 is hardwired to 0 in RISC-V
    x1: 0,
    x2: 0,
    x3: 0,
    x20: 0x1000  // Base address for memory operations
  });
  
  // Add instruction state
  const [newInstructionName, setNewInstructionName] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [availableColors] = useState<string[]>([
    "#4285F4", "#EA4335", "#FBBC05", "#34A853", "#8F44AD", 
    "#FF5722", "#009688", "#673AB7", "#3F51B5", "#00BCD4", 
    "#607D8B", "#795548", "#9C27B0", "#2196F3", "#FF9800"
  ]);
  
  // Set initial dimensions based on container size
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setSvgWidth(width);
      setSvgHeight(Math.max(height, 400));
    }
  }, []);

  // Add dimension monitoring
  useEffect(() => {
    // Create a ResizeObserver to watch the container size
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return;
      
      const { width, height } = entries[0].contentRect;
      setSvgWidth(width);
      setSvgHeight(Math.max(height, 400)); // Minimum height of 400px
    });
    
    resizeObserver.observe(containerRef.current);
    
    // Clean up
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setSvgWidth(width);
        setSvgHeight(Math.max(height, 400));
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
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
    
    const innerWidth = svgWidth - margin.left - margin.right;
    const innerHeight = svgHeight - margin.top - margin.bottom;
    
    // Create the main group element
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X and Y scales
    // Convert clock cycles to actual times (starting at 0)
    const timeLabels = d3.range(0, cycles + 5).map(cycle => `Cycle ${cycle}`);

    const xScale = d3.scaleBand()
      .domain(d3.range(0, cycles + 5).map(String))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleBand()
      .domain(pipelineInstructions.map(instr => instr.id.toString()))
      .range([0, innerHeight])
      .padding(0.1);

    // Add X axis
    const xAxis = g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((_, i) => timeLabels[i]));
      
    xAxis.append("text")
      .attr("transform", "rotate(60)")
      .attr("text-anchor", "start")
      .attr("x", innerWidth / 2)
      .attr("y", 40)
      .attr("fill", "black")
      .text("Clock Cycle");

    // Add Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d => {
        const instr = pipelineInstructions.find(i => i.id.toString() === d);
        return instr ? instr.name : d;
      }))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -80)
      .attr("x", -innerHeight / 2)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text("Instruction");

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
      .data(pipelineInstructions.map(instr => instr.id.toString()))
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
          .attr("y", yScale(instr.id.toString())!)
          .attr("width", xScale.bandwidth())
          .attr("height", yScale.bandwidth())
          .attr("fill", instr.stalled && stage === instr.currentStage ? "#f8d7da" : instr.color)
          .attr("stroke", "black")
          .attr("opacity", 0.7)
          .attr("rx", 4)
          .on("mouseover", function(event) {
            d3.select(this).attr("opacity", 1);
            
            // Show pipeline register lines on hover
            d3.select(".register-lines").style("opacity", 1);
            
            const tooltip = svg.append("g")
              .attr("class", "tooltip")
              .attr("transform", `translate(${event.offsetX + 10},${event.offsetY - 10})`);
              
            tooltip.append("rect")
              .attr("fill", "white")
              .attr("stroke", "black")
              .attr("rx", 5)
              .attr("ry", 5)
              .attr("width", 220)
              .attr("height", 80)
              .attr("opacity", 0.9);
              
            tooltip.append("text")
              .attr("x", 10)
              .attr("y", 20)
              .text(`Instruction: ${instr.name}`);
              
            tooltip.append("text")
              .attr("x", 10)
              .attr("y", 40)
              .text(`Stage: ${stageName} (Cycle ${cycle})`);
              
            tooltip.append("text")
              .attr("x", 10)
              .attr("y", 60)
              .text(`Registers: ${instr.registers.src.join(', ')} → ${instr.registers.dest.join(', ')}`);
          })
          .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.7);
            
            // Hide pipeline register lines on mouseout
            d3.select(".register-lines").style("opacity", 0);
            
            svg.selectAll(".tooltip").remove();
          });
          
        // Add stage label
        g.append("text")
          .attr("x", xScale(String(cycle))! + xScale.bandwidth() / 2)
          .attr("y", yScale(instr.id.toString())! + yScale.bandwidth() / 2)
          .attr("fill", "white")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-weight", "bold")
          .text(stageName.charAt(0));
      }
    });

    // Draw pipeline registers if in pipelined mode
    if (isPipelined && cycles > 0) {
      // Create a group for register lines and labels that will be hidden by default
      const registerLinesGroup = g.append("g")
        .attr("class", "register-lines")
        .style("opacity", 0);
      
      // Draw vertical lines between pipeline stages to represent registers
      PIPELINE_REGISTERS.forEach((registerName, index) => {
        // Position the register between stages
        const registerCyclePosition = 0.5 + index;
        
        if (registerCyclePosition <= cycles) {
          // Draw register line
          registerLinesGroup.append("line")
            .attr("class", `register-line-${index}`)
            .attr("x1", xScale(String(Math.floor(registerCyclePosition)))! + xScale.bandwidth())
            .attr("x2", xScale(String(Math.floor(registerCyclePosition)))! + xScale.bandwidth())
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#ff9800")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4");
            
          // Add register label
          registerLinesGroup.append("text")
            .attr("class", `register-label-${index}`)
            .attr("x", xScale(String(Math.floor(registerCyclePosition)))! + xScale.bandwidth())
            .attr("y", -10)
            .attr("fill", "#ff9800")
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .text(registerName);
        }
      });
    }
    
  }, [svgWidth, svgHeight, cycles, pipelineInstructions, isPipelined]);

  // Simulation logic
  useEffect(() => {
    if (!isRunning) return;
    
    // Check if all instructions are completed
    const allInstructionsCompleted = pipelineInstructions.every(
      instr => instr.currentStage !== undefined && instr.currentStage >= PIPELINE_STAGES.length
    );
    
    if (allInstructionsCompleted) {
      setIsRunning(false);
      return;
    }
    
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
          let updatedInstructions = [...prevInstructions];
          
          if (updatedInstructions[activeInstructionIndex].currentStage !== undefined && 
              updatedInstructions[activeInstructionIndex].currentStage < PIPELINE_STAGES.length - 1) {
            // Simply advance this instruction to the next stage
            updatedInstructions[activeInstructionIndex] = {
              ...updatedInstructions[activeInstructionIndex],
              currentStage: updatedInstructions[activeInstructionIndex].currentStage! + 1
            };
          } else {
            // This instruction is done, mark it as completed
            updatedInstructions[activeInstructionIndex] = {
              ...updatedInstructions[activeInstructionIndex],
              currentStage: PIPELINE_STAGES.length
            };
            
            // Immediately start the next instruction if available
            const nextInstructionIndex = updatedInstructions.findIndex(
              instr => instr.currentStage === -1
            );
            
            if (nextInstructionIndex !== -1) {
              updatedInstructions[nextInstructionIndex] = {
                ...updatedInstructions[nextInstructionIndex],
                currentStage: 0,
                startCycle: cycles
              };
            }
          }
          
          return updatedInstructions;
        }
      });
      
      // Update register values based on the current pipeline state
      setRegisters(prevRegisters => {
        const newRegisters = { ...prevRegisters };
        
        // For each instruction that has reached the writeback stage, update register values
        pipelineInstructions.forEach(instr => {
          if (instr.currentStage === 4) { // Writeback stage
            instr.registers.dest.forEach(reg => {
              // Special case for x0 in RISC-V: it's hardwired to 0
              if (reg === 'x0') return;
              
              // Simulate register updates with random values for demonstration
              newRegisters[reg] = Math.floor(Math.random() * 100);
            });
          }
        });
        
        // Ensure x0 is always 0 (RISC-V specification)
        newRegisters['x0'] = 0;
        
        return newRegisters;
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
    
    // Reset register values
    setRegisters({
      x0: 0,  // x0 is hardwired to 0 in RISC-V
      x1: 0,
      x2: 0,
      x3: 0,
      x20: 0x1000  // Base address for memory operations
    });
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
    
    // Parse RISC-V instruction to determine source and destination registers
    const instructionName = newInstructionName.trim();
    const srcRegisters: string[] = [];
    const destRegisters: string[] = [];
    
    // Extract registers based on instruction type
    if (instructionName.startsWith("add") || instructionName.startsWith("sub") || 
        instructionName.startsWith("and") || instructionName.startsWith("or") || 
        instructionName.startsWith("xor") || instructionName.startsWith("slt")) {
      // R-type: add x3, x1, x2 (dest = x3, src = x1, x2)
      const parts = instructionName.split(/[, ]+/);
      if (parts.length >= 4) {
        destRegisters.push(parts[1]);
        srcRegisters.push(parts[2], parts[3]);
      }
    } else if (instructionName.startsWith("lw") || instructionName.startsWith("lb") || 
               instructionName.startsWith("lh") || instructionName.startsWith("ld")) {
      // I-type load: lw x1, 0(x20) (dest = x1, src = x20)
      const destReg = instructionName.split(/[, ]+/)[1];
      const addrMatch = instructionName.match(/\(([^)]+)\)/);
      if (destReg && addrMatch) {
        destRegisters.push(destReg);
        srcRegisters.push(addrMatch[1]);
      }
    } else if (instructionName.startsWith("sw") || instructionName.startsWith("sb") || 
               instructionName.startsWith("sh") || instructionName.startsWith("sd")) {
      // S-type store: sw x3, 8(x20) (src = x3, x20)
      const srcReg = instructionName.split(/[, ]+/)[1];
      const addrMatch = instructionName.match(/\(([^)]+)\)/);
      if (srcReg && addrMatch) {
        srcRegisters.push(srcReg, addrMatch[1]);
      }
    } else if (instructionName.startsWith("beq") || instructionName.startsWith("bne") ||
               instructionName.startsWith("blt") || instructionName.startsWith("bge")) {
      // B-type branch: blt x0, x3, loop (src = x0, x3)
      const parts = instructionName.split(/[, ]+/);
      if (parts.length >= 3) {
        srcRegisters.push(parts[1], parts[2]);
      }
    }
    
    const newInstruction: Instruction = {
      id: pipelineInstructions.length + 1,
      name: instructionName,
      color: availableColors[pipelineInstructions.length % availableColors.length],
      registers: { 
        src: srcRegisters, 
        dest: destRegisters 
      },
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
            {pipelineInstructions.every(instr => instr.currentStage !== undefined && instr.currentStage >= PIPELINE_STAGES.length) ? 'Start Over' : 'Reset'}
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
              placeholder="Enter RISC-V instruction (e.g., add x1, x2, x3)"
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
      
      {/* Register Values Display */}
      <div className="w-full border-t border-b border-gray-200 py-4 my-2">
        <h3 className="text-lg font-medium mb-2">Register Values</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(registers).map(([reg, value]) => (
            <div key={reg} className="bg-gray-100 p-2 rounded flex justify-between">
              <span className="font-medium">{reg}:</span>
              <span className="font-mono">{value}</span>
            </div>
          ))}
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
            <h3 className="text-lg font-medium">
              Current Cycle: {cycles}
            </h3>
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
      
      <div ref={containerRef} className="border border-gray-300 rounded-lg shadow-lg overflow-hidden mb-4 w-full" style={{ height: '500px' }}>
        <svg ref={svgRef} width={svgWidth} height={svgHeight}></svg>
      </div>
      
      {pipelineInstructions.every(instr => instr.currentStage !== undefined && instr.currentStage >= PIPELINE_STAGES.length) && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 w-full">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>All done!</strong> All instructions have been completed. It took {cycles} cycles to complete all {pipelineInstructions.length} instructions.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 w-full">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>RISC-V Pipeline with Registers:</strong> This visualization shows the classic 5-stage RISC-V pipeline with pipeline registers between each stage.
              {isPipelined ? (
                <> In pipelined mode, each instruction moves through the pipeline stages independently, with registers transferring data between stages. 
                RISC-V uses a load-store architecture where only load/store instructions (lw/sw) access memory. The pipeline registers (IF/ID, ID/EX, EX/MEM, MEM/WB) 
                hold instruction data between stages, requiring approximately {pipelineInstructions.length + PIPELINE_STAGES.length - 1} cycles to complete all {pipelineInstructions.length} instructions.</>
              ) : (
                <> In non-pipelined mode, each instruction completes all stages before the next instruction begins, showing how RISC-V would perform without pipelining.
                This requires approximately {pipelineInstructions.length * PIPELINE_STAGES.length} cycles to complete all {pipelineInstructions.length} instructions.</>
              )}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-left w-full max-w-3xl">
        <h3 className="text-lg font-semibold mb-2">Understanding Pipeline Registers</h3>
        <p className="mb-2">
          In a real CPU, data must be transferred between pipeline stages through special registers. These pipeline 
          registers hold the intermediate results and control signals needed by each stage.
        </p>
        <p className="mb-2">
          The main pipeline registers in a five-stage RISC pipeline are:
        </p>
        <ul className="list-disc ml-8 mb-4">
          <li><strong>IF/ID Register:</strong> Holds the instruction fetched from memory before it's decoded</li>
          <li><strong>ID/EX Register:</strong> Holds decoded instruction information, register values, and control signals</li>
          <li><strong>EX/MEM Register:</strong> Holds the ALU result, data to be stored, and control signals</li>
          <li><strong>MEM/WB Register:</strong> Holds data read from memory and ALU results before writeback</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-2">Pipeline Hazards</h3>
        <p className="mb-2">
          This model demonstrates a simplified pipeline without hazards. In a real CPU, three types of hazards can occur:
        </p>
        <ul className="list-disc ml-8 mb-4">
          <li><strong>Structural Hazards:</strong> When two instructions need the same hardware resource simultaneously</li>
          <li><strong>Data Hazards:</strong> When an instruction depends on the result of a previous instruction still in the pipeline</li>
          <li><strong>Control Hazards:</strong> When the pipeline changes the flow of instruction execution (e.g., branches)</li>
        </ul>
        
        <p className="mb-4">
          For example, in our instructions, the "add x3, x1, x2" instruction depends on the values of x1 and x2, which are
          loaded by the previous two instructions. In a real CPU, this would require either:
        </p>
        <ul className="list-disc ml-8 mb-4">
          <li><strong>Data Forwarding:</strong> Directly passing the result from one stage to another without waiting for writeback</li>
          <li><strong>Pipeline Stalls:</strong> Pausing the dependent instruction until the required values are available</li>
          <li><strong>Out-of-Order Execution:</strong> Executing independent instructions while waiting for dependencies to resolve</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-2">RISC-V Architecture</h3>
        <p className="mb-2">
          This visualization uses the RISC-V instruction set architecture (ISA), an open standard instruction set that embodies RISC principles.
        </p>
        <p className="mb-2">
          Key aspects of RISC-V shown in this visualization:
        </p>
        <ul className="list-disc ml-8 mb-4">
          <li><strong>Register File:</strong> RISC-V uses 32 integer registers (x0-x31), with x0 hardwired to zero</li>
          <li><strong>Instruction Types:</strong> R-type (register-register), I-type (immediate/load), S-type (store), B-type (branch), etc.</li>
          <li><strong>Memory Access:</strong> Only load (lw) and store (sw) instructions can access memory</li>
          <li><strong>Branch Instructions:</strong> Conditional branches like blt (branch if less than) perform comparisons and change control flow</li>
        </ul>
        
        <p>
          These hazards require additional techniques like forwarding, stalling, and branch prediction to resolve.
        </p>
      </div>
    </div>
  );
};

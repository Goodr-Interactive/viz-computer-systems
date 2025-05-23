import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// Import SVG assets for pipeline stages
import shirtSvg from "@/assets/shirt.svg";
import washingMachineSvg from "@/assets/washing-machine.svg";
import tumbleDrySvg from "@/assets/tumble-dry.svg";
import handDrySvg from "@/assets/hand-dry.svg";
import closetSvg from "@/assets/closet.svg";

// Define the instruction stages
const PIPELINE_STAGES = ["Sort", "Wash", "Dry", "Fold", "Put Away"];

// Define SVG images for each pipeline stage
const STAGE_IMAGES = [
  shirtSvg,         // Sort stage
  washingMachineSvg, // Wash stage
  tumbleDrySvg,     // Dry stage
  handDrySvg,       // Fold stage
  closetSvg         // Put Away stage
];

// Define some sample instructions for visualization
const DEFAULT_INSTRUCTIONS = [
  { id: 1, name: "Load 1 (shirts)", color: "#4285F4" },
  { id: 2, name: "Load 2 (pants)", color: "#EA4335" },
  { id: 3, name: "Load 3 (socks)", color: "#FBBC05" },
  { id: 4, name: "Load 4 (sheets)", color: "#34A853" },
  { id: 5, name: "Load 5 (jackets)", color: "#8F44AD" }
];

interface Instruction {
  id: number;
  name: string;
  color: string;
  currentStage?: number;
  startCycle?: number;
  stalled?: boolean;
}

interface BasicLaundryProps {
  width?: number;
  height?: number;
  instructions?: Instruction[];
}

export const BasicLaundry: React.FC<BasicLaundryProps> = ({
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
  // const [availableColors] = useState<string[]>([
  //   "#4285F4", "#EA4335", "#FBBC05", "#34A853", "#8F44AD", 
  //   "#FF5722", "#009688", "#673AB7", "#3F51B5", "#00BCD4", 
  //   "#607D8B", "#795548", "#9C27B0", "#2196F3", "#FF9800"
  // ]);
  
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
  }, [instructions]);    // Core visualization logic
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
      
    // Define defs for SVG patterns
    const defs = svg.append("defs");
    
    // Create patterns for each pipeline stage with the SVG icons
    STAGE_IMAGES.forEach((image, index) => {
      defs.append("pattern")
        .attr("id", `stage-pattern-${index}`)
        .attr("patternUnits", "objectBoundingBox")
        .attr("width", 1)
        .attr("height", 1)
        .attr("patternContentUnits", "objectBoundingBox")
        .append("image")
        .attr("href", image)
        .attr("width", 1)
        .attr("height", 1)
        .attr("preserveAspectRatio", "xMidYMid meet");
    });

    // X and Y scales
    // Convert clock cycles to actual times (starting at 9:00 AM)
    const timeLabels = d3.range(0, cycles + 5).map(cycle => {
      const minutes = cycle * 30; // Each cycle is 30 minutes
      const hours = Math.floor(9 + minutes / 60); // Start at 9 AM
      const mins = minutes % 60;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours > 12 ? hours - 12 : hours;
      return `${hour12}:${mins === 0 ? '00' : mins} ${ampm}`;
    });

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
      
    // Rotate the tick labels
    xAxis.selectAll("text")
      .attr("transform", "rotate(60)")
      .attr("text-anchor", "start")
      .attr("y", 0)
      .attr("x", 9)
      .attr("dy", ".35em");
      
    xAxis.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 40)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      // .text("Time of Day");

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
      .text("Laundry Load");

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
        
        // Create a group for the stage
        const stageGroup = g.append("g")
          .attr("transform", `translate(${xScale(String(cycle))!}, ${yScale(instr.id.toString())!})`)
          .attr("opacity", 0.7)
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
              .attr("width", 220)
              .attr("height", 60)
              .attr("opacity", 0.9);
              
            tooltip.append("text")
              .attr("x", 10)
              .attr("y", 20)
              .text(`Laundry: ${instr.name}`);
              
            tooltip.append("text")
              .attr("x", 10)
              .attr("y", 40)
              .text(`Stage: ${stageName} (${timeLabels[cycle]})`);
          })
          .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.7);
            svg.selectAll(".tooltip").remove();
          });
        
        // Add colored background rectangle
        stageGroup.append("rect")
          .attr("width", xScale.bandwidth())
          .attr("height", yScale.bandwidth())
          .attr("fill", instr.stalled && stage === instr.currentStage ? "#f8d7da" : instr.color)
          .attr("stroke", "black")
          .attr("rx", 4);
        
        // Calculate inner rectangle size for the icon (slightly smaller)
        const innerWidth = xScale.bandwidth() * 0.8;
        const innerHeight = yScale.bandwidth() * 0.8;
        const innerX = (xScale.bandwidth() - innerWidth) / 2;
        const innerY = (yScale.bandwidth() - innerHeight) / 2;
        
        // Add SVG icon on top
        stageGroup.append("rect")
          .attr("width", innerWidth)
          .attr("height", innerHeight)
          .attr("x", innerX)
          .attr("y", innerY)
          .attr("fill", `url(#stage-pattern-${stage})`)
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .attr("rx", 4);
        
        // Add a light overlay to tint the icon with instruction color
        stageGroup.append("rect")
          .attr("width", innerWidth)
          .attr("height", innerHeight)
          .attr("x", innerX)
          .attr("y", innerY)
          .attr("fill", instr.color)
          .attr("opacity", 0.2)
          .attr("rx", 4);
      }
    });

    // Draw instruction legend
    // const legend = svg.append("g")
    //   .attr("transform", `translate(${svgWidth - 150}, 10)`);

    // Legend for laundry loads
    // legend.append("text")
    //   .attr("x", 0)
    //   .attr("y", -5)
    //   .attr("font-weight", "bold")
    //   .text("Laundry Loads");

    // pipelineInstructions.forEach((instr, i) => {
    //   const legendItem = legend.append("g")
    //     .attr("transform", `translate(0, ${i * 20 + 15})`);
        
      // legendItem.append("rect")
      //   .attr("width", 15)
      //   .attr("height", 15)
      //   .attr("fill", instr.color);
        
      // legendItem.append("text")
      //   .attr("x", 20)
      //   .attr("y", 12)
      //   .text(instr.name);
    // });
    
    // // Legend for pipeline stages
    // const stageLegend = svg.append("g")
    //   .attr("transform", `translate(10, 10)`);
      
    // stageLegend.append("text")
    //   .attr("x", 0)
    //   .attr("y", -5)
    //   .attr("font-weight", "bold")
    //   .text("Pipeline Stages");
      
    // PIPELINE_STAGES.forEach((stage, i) => {
    //   const legendItem = stageLegend.append("g")
    //     .attr("transform", `translate(0, ${i * 20 + 15})`);
        
    //   legendItem.append("text")
    //     .attr("font-weight", "bold")
    //     .text(`${stage.charAt(0)} = ${stage}`);
    // });
    
  }, [svgWidth, svgHeight, cycles, pipelineInstructions]);

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
  // const handleAddInstruction = () => {
  //   if (!newInstructionName.trim()) return;
    
  //   setIsRunning(false);
    
  //   const newInstruction: Instruction = {
  //     id: pipelineInstructions.length + 1,
  //     name: newInstructionName.trim(),
  //     color: availableColors[pipelineInstructions.length % availableColors.length],
  //     currentStage: -1,
  //     startCycle: isPipelined ? pipelineInstructions.length : undefined,
  //     stalled: false
  //   };
    
  //   setPipelineInstructions([...pipelineInstructions, newInstruction]);
  //   setNewInstructionName("");
  //   setShowAddForm(false);
  // };
  
  // const handleRemoveInstruction = (id: number) => {
  //   setIsRunning(false);
  //   const updatedInstructions = pipelineInstructions.filter(instr => instr.id !== id);
    
  //   // Reassign IDs to keep them sequential
  //   const reindexedInstructions = updatedInstructions.map((instr, index) => ({
  //     ...instr,
  //     id: index + 1,
  //     startCycle: isPipelined ? index : undefined
  //   }));
    
  //   setPipelineInstructions(reindexedInstructions);
  //   setCycles(0);
  // };
  
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
              Current Time: {cycles > 0 ? (
                (() => {
                  const minutes = Math.floor(cycles / 2) * 30;
                  const hours = Math.floor(9 + minutes / 60);
                  const mins = minutes % 60;
                  const ampm = hours >= 12 ? 'PM' : 'AM';
                  const hour12 = hours > 12 ? hours - 12 : hours;
                  return `${hour12}:${mins === 0 ? '00' : mins} ${ampm}`;
                })()
              ) : '9:00 AM'} 
              <span className="text-xs text-gray-500"> (Cycle: {cycles})</span>
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
                <strong>All done!</strong> All laundry loads have been completed. Final time: {
                  (() => {
                    const minutes = Math.floor(cycles / 2) * 30;
                    const hours = Math.floor(9 + minutes / 60);
                    const mins = minutes % 60;
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const hour12 = hours > 12 ? hours - 12 : hours;
                    return `${hour12}:${mins === 0 ? '00' : mins} ${ampm}`;
                  })()
                }. It took {cycles} "cycles" to complete all {pipelineInstructions.length} loads of laundry.
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
              <strong>Laundry Efficiency:</strong> In {isPipelined ? "pipelined" : "non-pipelined"} mode, all {pipelineInstructions.length} loads of laundry require approximately <strong>{totalCyclesRequired}</strong> "cycles" to complete (from 9:00 AM to {
                (() => {
                  const minutes = totalCyclesRequired * 30;
                  const hours = Math.floor(9 + minutes / 60);
                  const mins = minutes % 60;
                  const ampm = hours >= 12 ? 'PM' : 'AM';
                  const hour12 = hours > 12 ? hours - 12 : hours;
                  return `${hour12}:${mins === 0 ? '00' : mins} ${ampm}`;
                })()
              }).
              {isPipelined ? (
                <> With pipelined laundry, you can complete a load every 30 minutes once the pipeline is full, achieving a CPI of 1.0. Without pipelining, each load would take all {PIPELINE_STAGES.length} stages to complete before starting the next.</>
              ) : (
                <> With non-pipelined laundry, you must complete all {PIPELINE_STAGES.length} stages for each load before starting the next one, resulting in a cycles-per-load of {PIPELINE_STAGES.length}.</>
              )}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-left w-full max-w-3xl">
        <h3 className="text-lg font-semibold mb-2">Understanding Pipelining with Laundry</h3>
        <p className="mb-2">
          Instruction pipelining in computer architecture is similar to how a modern laundry process works. 
          Instead of waiting for one load of laundry to go through all stages before starting the next load, 
          we can have multiple loads at different stages simultaneously.
        </p>
        <p className="mb-2">
          In this visualization, we represent a typical laundry day starting at 9:00 AM, with each pipeline stage
          taking approximately 30 minutes to complete. This makes the 5-stage pipeline take stage * time per stage (e.g. 5-stages * 30 mins = 2.5 hrs) hours per load
          in non-pipelined mode.
        </p>
        <p className="mb-2">
          Our 5-stage laundry pipeline consists of:
        </p>
        <ul className="list-disc ml-8 mb-4">
          <li><strong>Sort (S):</strong> Separate the clothes by color/type (like retrieving instructions from memory)</li>
          <li><strong>Wash (W):</strong> Run the washing machine (like decoding instructions)</li>
          <li><strong>Dry (D):</strong> Use the dryer (like executing the instruction)</li>
          <li><strong>Fold (F):</strong> Fold the clean laundry (like memory access)</li>
          <li><strong>Put Away (P):</strong> Return clothes to drawers and closets (like writing results back to registers)</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-2">Pipelined vs. Non-Pipelined Laundry</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-medium mb-1">Pipelined Laundry</h4>
            <p className="text-sm">
              In a pipelined laundry system, while the T-shirts are in the dryer, the pants can be in the washer, 
              and you can be sorting the socks. This way, a new load of laundry can be completed every cycle 
              once the pipeline is full, dramatically improving efficiency.
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded">
            <h4 className="font-medium mb-1">Non-Pipelined Laundry</h4>
            <p className="text-sm">
              In a non-pipelined system, you would have to complete the entire process for T-shirts 
              (sort, wash, dry, fold, put away) before even starting to sort the pants. This means each 
              load takes 5 cycles to complete, and you can only finish one load every 5 cycles.
            </p>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">The Computer Architecture Connection</h3>
        <p className="mb-2">
          In CPU design, pipelining works the same way:
        </p>
        <ul className="list-disc ml-8 mb-4">
          <li>Each instruction goes through distinct stages (fetch, decode, execute, memory access, write back)</li>
          <li>With pipelining, multiple instructions are processed simultaneously at different stages</li>
          <li>This improves throughput - the number of instructions completed per cycle</li>
          <li>The CPI (Cycles Per Instruction) approaches 1.0 in an ideal pipeline</li>
        </ul>
        <p>
          Toggle between the pipelined and non-pipelined modes to see how dramatically this technique 
          improves efficiency - just like it would make your laundry day much more productive!
        </p>
      </div>
      
      {/* Next Visualization Button */}
      <div className="w-full flex justify-center mt-8 mb-4">
        <a 
          href="/csc368/pipelining/laundry" 
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center"
        >
          Next Visualization: Advanced Laundry
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>
    </div>
  );
};

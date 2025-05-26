import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { AnimatedBinaryBlock } from "./components/paging/ui/AnimatedBinaryBlock";
import { PagingSystem } from "./components/paging/PagingSystem";
import { PhysicalMemorySize, PageSize, VirtualAddressBits } from "./components/paging/types";
import {
  PageTableLevelColors,
  physicalMemoryOptions,
  pageSizeOptions,
  virtualBitsOptions,
} from "./components/paging/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CollapsibleHeading } from "./components/paging/ui/CollapsibleHeading";
import { InfoHeader } from "./components/paging/ui/InfoHeader";
import { SectionHeading } from "./components/paging/ui/SectionHeading";
import { SubsectionHeading } from "./components/paging/ui/SubsectionHeading";

export const SimplePaging: React.FunctionComponent = () => {
  // Set default values
  const [physicalMemory, setPhysicalMemory] = useState<PhysicalMemorySize>(PhysicalMemorySize.GB_1);
  const [pageSize, setPageSize] = useState<PageSize>(PageSize.B_512);
  const [virtualBits, setVirtualBits] = useState<VirtualAddressBits>(VirtualAddressBits.BITS_30);
  const [pagingSystem, setPagingSystem] = useState<PagingSystem>(
    new PagingSystem(physicalMemory, pageSize, virtualBits)
  );

  // Collapse state for sections
  const [derivedValuesCollapsed, setDerivedValuesCollapsed] = useState(true);

  // Update paging system when inputs change
  useEffect(() => {
    setPagingSystem(new PagingSystem(physicalMemory, pageSize, virtualBits));
  }, [physicalMemory, pageSize, virtualBits]);

  // Calculate binary representation of values
  const summary = pagingSystem.getSummary();
  const pageOffsetBlocks = summary.pageOffsetBits;
  const pfnBlocks = summary.pfnBits;

  // Calculate unused bits in the physical address (assuming 32-bit physical address)
  const unusedBits = 32 - pfnBlocks - pageOffsetBlocks;

  // Function to get the appropriate label for each level of the page table
  const getLevelLabel = (index: number, totalLevels: number): string => {
    if (index === totalLevels - 1) {
      return "Page Table Index";
    } else {
      return `PD Index ${index}`;
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-10 p-8 pb-24">
      {/* Configuration Section */}
      <section className="w-full max-w-6xl">
        <SectionHeading>Paging System Configuration</SectionHeading>

        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="physical-memory" className="font-medium">
              Physical Memory Size
            </Label>
            <Select
              value={physicalMemory.toString()}
              onValueChange={(value) => setPhysicalMemory(Number(value) as PhysicalMemorySize)}
            >
              <SelectTrigger id="physical-memory">
                <SelectValue placeholder="Select physical memory size" />
              </SelectTrigger>
              <SelectContent>
                {physicalMemoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="page-size" className="font-medium">
              Page Size
            </Label>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(Number(value) as PageSize)}
            >
              <SelectTrigger id="page-size">
                <SelectValue placeholder="Select page size" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="virtual-bits" className="font-medium">
              Virtual Address Bits
            </Label>
            <Select
              value={virtualBits.toString()}
              onValueChange={(value) => setVirtualBits(Number(value) as VirtualAddressBits)}
            >
              <SelectTrigger id="virtual-bits">
                <SelectValue placeholder="Select virtual address bits" />
              </SelectTrigger>
              <SelectContent>
                {virtualBitsOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Address Structure Section */}
      <section className="w-full max-w-6xl">
        <LayoutGroup>
          <div className="flex flex-col gap-8">
            <div className="bg-muted/50 rounded-lg p-6">
              <SubsectionHeading>Virtual Address ({virtualBits} bits)</SubsectionHeading>
              <div className="flex flex-col gap-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`virtual-${virtualBits}-${pageSize}-${physicalMemory}`}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {summary.bitsPerLevel.map((bits, index) => {
                        // Calculate the starting bit number for this level
                        let startBit = pageOffsetBlocks;
                        for (let i = summary.bitsPerLevel.length - 1; i > index; i--) {
                          startBit += summary.bitsPerLevel[i];
                        }
                        return (
                          <AnimatedBinaryBlock
                            key={index}
                            layoutId={`vpn-level-${index}`}
                            blocks={bits}
                            color={
                              PageTableLevelColors[index % PageTableLevelColors.length].background
                            }
                            borderColor={
                              PageTableLevelColors[index % PageTableLevelColors.length].border
                            }
                            hoverColor={
                              PageTableLevelColors[index % PageTableLevelColors.length].hover
                            }
                            tooltip={
                              <div className="max-w-sm space-y-1">
                                <p className="text-sm font-medium">
                                  {getLevelLabel(index, summary.pageTableLevels)} ({bits} bits)
                                </p>
                                <p className="text-xs">
                                  {index === summary.pageTableLevels - 1
                                    ? "Indexes into the final page table to find the physical frame number."
                                    : `Indexes into page directory level ${index} to find the next page table.`}
                                </p>
                              </div>
                            }
                            showLeftBorder={true}
                            label={getLevelLabel(index, summary.pageTableLevels)}
                            startBitNumber={startBit}
                          />
                        );
                      })}
                    </div>
                    <AnimatedBinaryBlock
                      layoutId="virtual-page-offset"
                      blocks={pageOffsetBlocks}
                      color="bg-emerald-100"
                      borderColor="border-emerald-300"
                      hoverColor="group-hover:bg-emerald-200"
                      tooltip={
                        <div className="max-w-sm space-y-1">
                          <p className="text-sm font-medium">
                            Page Offset ({pageOffsetBlocks} bits)
                          </p>
                          <p className="text-xs">
                            Byte position within the page. Copied directly to physical address
                            without translation.
                          </p>
                        </div>
                      }
                      showLeftBorder={true}
                      label="Page Offset"
                      startBitNumber={0}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-6">
              <SubsectionHeading>Physical Address (32 bits)</SubsectionHeading>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`physical-${virtualBits}-${pageSize}-${physicalMemory}`}
                  className="flex flex-wrap items-center gap-2"
                >
                  {unusedBits > 0 && (
                    <AnimatedBinaryBlock
                      layoutId="physical-unused"
                      blocks={unusedBits}
                      color="bg-gray-100"
                      borderColor="border-gray-300"
                      hoverColor="group-hover:bg-gray-200"
                      tooltip={
                        <div className="max-w-sm space-y-1">
                          <p className="text-sm font-medium">Unused Bits ({unusedBits} bits)</p>
                          <p className="text-xs">
                            High-order bits not needed for current memory size.
                          </p>
                        </div>
                      }
                      showLeftBorder={true}
                      label="Unused"
                      startBitNumber={pageOffsetBlocks + pfnBlocks}
                    />
                  )}
                  <AnimatedBinaryBlock
                    layoutId="physical-pfn"
                    blocks={pfnBlocks}
                    color="bg-sky-100"
                    borderColor="border-sky-300"
                    hoverColor="group-hover:bg-sky-200"
                    tooltip={
                      <div className="max-w-sm space-y-1">
                        <p className="text-sm font-medium">
                          Physical Frame Number ({pfnBlocks} bits)
                        </p>
                        <p className="text-xs">
                          Identifies which physical memory frame contains the page data. Comes from
                          the PTE.
                        </p>
                      </div>
                    }
                    showLeftBorder={true}
                    label="Physical Frame Number (PFN)"
                    startBitNumber={pageOffsetBlocks}
                  />
                  <AnimatedBinaryBlock
                    layoutId="physical-page-offset"
                    blocks={pageOffsetBlocks}
                    color="bg-emerald-100"
                    borderColor="border-emerald-300"
                    hoverColor="group-hover:bg-emerald-200"
                    tooltip={
                      <div className="max-w-sm space-y-1">
                        <p className="text-sm font-medium">Page Offset ({pageOffsetBlocks} bits)</p>
                        <p className="text-xs">
                          Same offset from virtual address. Passes through unchanged during
                          translation.
                        </p>
                      </div>
                    }
                    showLeftBorder={true}
                    label="Page Offset"
                    startBitNumber={0}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </LayoutGroup>
      </section>

      {/* Page Table Structure Section */}
      <section className="w-full max-w-6xl">
        <LayoutGroup>
          <div className="flex flex-col gap-4">
            {/* PTE Structure - Non-Collapsible */}
            <div className="bg-muted/50 rounded-lg p-6">
              <SubsectionHeading>Page Table Entry (PTE) Structure</SubsectionHeading>
              <p className="text-muted-foreground mb-3 text-sm">Each PTE is 32 bits (4 bytes)</p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`pte-${virtualBits}-${pageSize}-${physicalMemory}`}
                  className="flex flex-wrap items-center gap-2"
                >
                  {/* Modified bit */}
                  <AnimatedBinaryBlock
                    layoutId="pte-modified"
                    blocks={1}
                    color="bg-red-100"
                    borderColor="border-red-300"
                    hoverColor="group-hover:bg-red-200"
                    tooltip={
                      <div className="max-w-sm space-y-1">
                        <p className="text-sm font-medium">Modified Bit (M)</p>
                        <p className="text-xs">
                          Set when page is written to. Tells OS which pages need saving to storage.
                        </p>
                      </div>
                    }
                    showLeftBorder={true}
                    label="M"
                    startBitNumber={31}
                  />
                  {/* Referenced bit */}
                  <AnimatedBinaryBlock
                    layoutId="pte-referenced"
                    blocks={1}
                    color="bg-orange-100"
                    borderColor="border-orange-300"
                    hoverColor="group-hover:bg-orange-200"
                    tooltip={
                      <div className="max-w-sm space-y-1">
                        <p className="text-sm font-medium">Referenced Bit (R)</p>
                        <p className="text-xs">
                          Set when page is accessed. Used for page replacement algorithms like LRU.
                        </p>
                      </div>
                    }
                    showLeftBorder={true}
                    label="R"
                    startBitNumber={30}
                  />
                  {/* Valid bit */}
                  <AnimatedBinaryBlock
                    layoutId="pte-valid"
                    blocks={1}
                    color="bg-amber-100"
                    borderColor="border-amber-300"
                    hoverColor="group-hover:bg-amber-200"
                    tooltip={
                      <div className="max-w-sm space-y-1">
                        <p className="text-sm font-medium">Valid Bit (V)</p>
                        <p className="text-xs">
                          Shows if page is in memory. If 0, accessing it triggers a page fault.
                        </p>
                      </div>
                    }
                    showLeftBorder={true}
                    label="V"
                    startBitNumber={29}
                  />
                  {/* Protection bits */}
                  <AnimatedBinaryBlock
                    layoutId="pte-protection"
                    blocks={3}
                    color="bg-lime-100"
                    borderColor="border-lime-300"
                    hoverColor="group-hover:bg-lime-200"
                    tooltip={
                      <div className="max-w-sm space-y-1">
                        <p className="text-sm font-medium">Protection Bits (3 bits)</p>
                        <p className="text-xs">
                          Read, Write, Execute permissions. Hardware checks these on every access.
                        </p>
                      </div>
                    }
                    showLeftBorder={true}
                    label="Prot"
                    startBitNumber={26}
                  />
                  {/* Calculate unused bits in PTE */}
                  {26 - pfnBlocks > 0 && (
                    <AnimatedBinaryBlock
                      layoutId="pte-unused"
                      blocks={26 - pfnBlocks}
                      color="bg-gray-100"
                      borderColor="border-gray-300"
                      hoverColor="group-hover:bg-gray-200"
                      tooltip={
                        <div className="max-w-sm space-y-1">
                          <p className="text-sm font-medium">
                            Unused PTE Bits ({26 - pfnBlocks} bits)
                          </p>
                          <p className="text-xs">
                            Reserved space in PTE. Could be used for additional flags or larger
                            addresses.
                          </p>
                        </div>
                      }
                      showLeftBorder={true}
                      label="Unused"
                      startBitNumber={pfnBlocks}
                    />
                  )}
                  {/* PFN bits */}
                  <AnimatedBinaryBlock
                    layoutId="pte-pfn"
                    blocks={pfnBlocks}
                    color="bg-sky-100"
                    borderColor="border-sky-300"
                    hoverColor="group-hover:bg-sky-200"
                    tooltip={
                      <div className="max-w-sm space-y-1">
                        <p className="text-sm font-medium">
                          Physical Frame Number ({pfnBlocks} bits)
                        </p>
                        <p className="text-xs">
                          Physical frame where virtual page is stored. Replaces VPN during
                          translation.
                        </p>
                      </div>
                    }
                    showLeftBorder={true}
                    label="Physical Frame Number (PFN)"
                    startBitNumber={0}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </LayoutGroup>
      </section>

      {/* System Information Section - Moved to Bottom */}
      <section className="bg-muted/50 w-full max-w-6xl rounded-lg p-6">
        <CollapsibleHeading
          collapsed={derivedValuesCollapsed}
          onClick={() => setDerivedValuesCollapsed(!derivedValuesCollapsed)}
        >
          System Information
        </CollapsibleHeading>

        <AnimatePresence>
          {!derivedValuesCollapsed && (
            <motion.div
              key="system-info"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              style={{ overflow: "hidden" }}
            >
              <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-3">
                <div>
                  <InfoHeader
                    children="Virtual Address Space"
                    value={PagingSystem.formatBytes(summary.virtualAddressSpace)}
                    definition="The total addressable memory space available to programs using virtual addresses."
                    calculation={`2^${virtualBits} = ${PagingSystem.formatBytes(summary.virtualAddressSpace)}`}
                  />
                </div>

                <div>
                  <InfoHeader
                    children="Page Offset Bits"
                    value={summary.pageOffsetBits.toString()}
                    definition="The number of bits needed to address every byte within a single page."
                    calculation={`log₂(${PagingSystem.formatBytes(pageSize)}) = ${summary.pageOffsetBits} bits`}
                  />
                </div>

                <div>
                  <InfoHeader
                    children="VPN Bits"
                    value={summary.vpnBits.toString()}
                    definition="Virtual Page Number bits - used to identify which virtual page an address belongs to."
                    calculation={`${virtualBits} (virtual bits) - ${summary.pageOffsetBits} (offset bits) = ${summary.vpnBits} bits`}
                  />
                </div>

                <div>
                  <InfoHeader
                    children="PFN Bits"
                    value={summary.pfnBits.toString()}
                    definition="Physical Frame Number bits - used to identify physical memory frames."
                    calculation={`log₂(${PagingSystem.formatBytes(physicalMemory)} ÷ ${PagingSystem.formatBytes(pageSize)}) = ${summary.pfnBits} bits`}
                  />
                </div>

                <div>
                  <InfoHeader
                    children="Total Virtual Pages"
                    value={summary.totalVirtualPages.toLocaleString()}
                    definition="The total number of virtual pages that can be addressed by the virtual page number."
                    calculation={`2^${summary.vpnBits} = ${summary.totalVirtualPages.toLocaleString()} pages`}
                  />
                </div>

                <div>
                  <InfoHeader
                    children="Total Physical Frames"
                    value={summary.totalPhysicalFrames.toLocaleString()}
                    definition="The total number of physical memory frames available in the system."
                    calculation={`${PagingSystem.formatBytes(physicalMemory)} ÷ ${PagingSystem.formatBytes(pageSize)} = ${summary.totalPhysicalFrames.toLocaleString()} frames`}
                  />
                </div>

                <div>
                  <InfoHeader
                    children="PTEs Per Page"
                    value={summary.ptesPerPage.toLocaleString()}
                    definition="The number of Page Table Entries that can fit in a single page (assuming 4 bytes per PTE)."
                    calculation={`${PagingSystem.formatBytes(pageSize)} ÷ 4 bytes/PTE = ${summary.ptesPerPage.toLocaleString()} PTEs`}
                  />
                </div>

                <div>
                  <InfoHeader
                    children="PTE Index Bits"
                    value={summary.pteIndexBits.toString()}
                    definition="The number of bits needed to index into a page table (to select one PTE)."
                    calculation={`log₂(${summary.ptesPerPage.toLocaleString()}) = ${summary.pteIndexBits} bits`}
                  />
                </div>

                <div>
                  <InfoHeader
                    children="Page Table Levels"
                    value={summary.pageTableLevels.toString()}
                    definition="The number of levels in the hierarchical page table structure needed to translate addresses."
                    calculation={`ceil(${summary.vpnBits} VPN bits ÷ ${summary.pteIndexBits} bits/level) = ${summary.pageTableLevels} levels`}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

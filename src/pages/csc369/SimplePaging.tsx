import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { AnimatedBinaryBlock } from "./components/paging/ui/AnimatedBinaryBlock";
import { PagingSystem } from "./components/paging/PagingSystem";
import type { PhysicalMemorySize, PageSize, VirtualAddressBits } from "./components/paging/types";
import { instructorConfig } from "./components/paging/config";
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
  // Set default values from instructor config
  const [physicalMemory, setPhysicalMemory] = useState<PhysicalMemorySize>(
    instructorConfig.defaults.physicalMemory
  );
  const [pageSize, setPageSize] = useState<PageSize>(instructorConfig.defaults.pageSize);
  const [virtualBits, setVirtualBits] = useState<VirtualAddressBits>(
    instructorConfig.defaults.virtualBits
  );
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

  return (
    <div className="flex w-full flex-col items-center gap-10 p-8 pb-24">
      {/* Configuration Section */}
      <section className="w-full max-w-7xl overflow-x-auto">
        <SectionHeading>Paging System Visualization</SectionHeading>

        <p className="text-muted-foreground mb-6">
          This visualization demonstrates simple paging in a 32-bit byte-addressable system with
          32-bit page table entries using a single-level page table structure. Adjust the three
          parameters below to observe how changes in physical memory size, page size, and virtual
          address bits affect the address structure and system calculations.
        </p>

        <div className="grid w-full grid-cols-1 gap-8 p-1 md:grid-cols-3">
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
                {instructorConfig.physicalMemoryOptions.map((option) => (
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
                {instructorConfig.pageSizeOptions.map((option) => (
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
                {instructorConfig.virtualBitsOptions.map((option) => (
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
      <section className="-mt-1 w-full max-w-7xl overflow-x-auto">
        <LayoutGroup>
          <div className="flex min-w-fit flex-col gap-8">
            <div className="bg-muted/50 min-w-fit rounded-lg p-6">
              <SubsectionHeading>Virtual Address ({virtualBits} bits)</SubsectionHeading>
              <AnimatePresence mode="wait">
                <div className="w-full overflow-x-auto">
                  <motion.div
                    key={`virtual-${virtualBits}-${pageSize}-${physicalMemory}`}
                    className="flex min-w-fit flex-nowrap items-center justify-end gap-2 pr-1"
                  >
                    <AnimatedBinaryBlock
                      layoutId="vpn-single-level"
                      blocks={summary.vpnBits}
                      color="bg-purple-100"
                      borderColor="border-purple-300"
                      hoverColor="group-hover:bg-purple-200"
                      tooltip={
                        <div className="max-w-sm space-y-1">
                          <p className="text-sm font-medium">
                            Virtual Page Number (VPN) ({summary.vpnBits} bits)
                          </p>
                          <p className="text-xs">
                            Indexes directly into the page table to find the corresponding page
                            table entry (PTE).
                          </p>
                        </div>
                      }
                      showLeftBorder={true}
                      label="Virtual Page Number (VPN)"
                      startBitNumber={pageOffsetBlocks}
                    />
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
                </div>
              </AnimatePresence>
            </div>
          </div>
        </LayoutGroup>
      </section>

      {/* Physical Address Section */}
      <section className="w-full max-w-7xl overflow-x-auto">
        <LayoutGroup>
          <div className="flex min-w-fit flex-col gap-8">
            <div className="bg-muted/50 min-w-fit rounded-lg p-6">
              <SubsectionHeading>Physical Address (32 bits)</SubsectionHeading>
              <AnimatePresence mode="wait">
                <div className="w-full overflow-x-auto">
                  <motion.div
                    key={`physical-${virtualBits}-${pageSize}-${physicalMemory}`}
                    className="flex min-w-fit flex-nowrap items-center justify-end gap-2 pr-1"
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
                            Identifies which physical memory frame contains the page data. Comes
                            from the PTE.
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
                          <p className="text-sm font-medium">
                            Page Offset ({pageOffsetBlocks} bits)
                          </p>
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
                </div>
              </AnimatePresence>
            </div>
          </div>
        </LayoutGroup>
      </section>

      {/* Page Table Structure Section */}
      <section className="w-full max-w-7xl overflow-x-auto">
        <LayoutGroup>
          <div className="flex min-w-fit flex-col gap-4">
            {/* PTE Structure - Non-Collapsible */}
            <div className="bg-muted/50 min-w-fit rounded-lg p-6">
              <SubsectionHeading>Page Table Entry (PTE) Structure</SubsectionHeading>
              <AnimatePresence mode="wait">
                <div className="w-full overflow-x-auto">
                  <motion.div
                    key={`pte-${virtualBits}-${pageSize}-${physicalMemory}`}
                    className="flex min-w-fit flex-nowrap items-center justify-end gap-2 pr-1"
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
                            Set when page is written to. Tells OS which pages need saving to
                            storage.
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
                            Set when page is accessed. Used for page replacement algorithms like
                            LRU.
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
                </div>
              </AnimatePresence>
            </div>
          </div>
        </LayoutGroup>
      </section>

      {/* Calculation Hints Section */}
      <section className="bg-muted/50 w-full max-w-7xl overflow-x-auto rounded-lg p-6">
        <CollapsibleHeading
          collapsed={derivedValuesCollapsed}
          onClick={() => setDerivedValuesCollapsed(!derivedValuesCollapsed)}
        >
          Calculations for Common Problems
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
                    children="Page Table Size"
                    value={PagingSystem.formatBytes(summary.totalVirtualPages * 4)}
                    definition="The total size of the single-level page table (assuming 4 bytes per PTE)."
                    calculation={`${summary.totalVirtualPages.toLocaleString()} PTEs × 4 bytes/PTE = ${PagingSystem.formatBytes(summary.totalVirtualPages * 4)}`}
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

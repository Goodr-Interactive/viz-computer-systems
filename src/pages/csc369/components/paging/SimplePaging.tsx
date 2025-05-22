import React, { useState, useEffect } from "react";
import { BinaryBlock } from "./BinaryBlock";
import {
  PagingSystem,
  PhysicalMemorySize,
  PageSize,
  VirtualAddressBits,
  PageTableLevelColors,
} from "./PagingSystem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp } from "lucide-react";

export const SimplePaging: React.FunctionComponent = () => {
  // Set default values
  const [physicalMemory, setPhysicalMemory] = useState<PhysicalMemorySize>(
    PhysicalMemorySize.GB_1
  );
  const [pageSize, setPageSize] = useState<PageSize>(PageSize.B_512);
  const [virtualBits, setVirtualBits] = useState<VirtualAddressBits>(VirtualAddressBits.BITS_30);
  const [pagingSystem, setPagingSystem] = useState<PagingSystem>(
    new PagingSystem(physicalMemory, pageSize, virtualBits)
  );

  // Collapse state for sections
  const [derivedValuesCollapsed, setDerivedValuesCollapsed] = useState(true);
  const [pageTableOrgCollapsed, setPageTableOrgCollapsed] = useState(true);
  const [pageTableLevelCollapsed, setPageTableLevelCollapsed] = useState(true);

  // Update paging system when inputs change
  useEffect(() => {
    setPagingSystem(new PagingSystem(physicalMemory, pageSize, virtualBits));
  }, [physicalMemory, pageSize, virtualBits]);

  // Calculate binary representation of values
  const summary = pagingSystem.getSummary();
  const pageOffsetBlocks = summary.pageOffsetBits;
  const vpnBlocks = summary.vpnBits;
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

  const physicalMemoryOptions = [
    { value: PhysicalMemorySize.MB_128, label: "128 MB" },
    { value: PhysicalMemorySize.MB_256, label: "256 MB" },
    { value: PhysicalMemorySize.MB_512, label: "512 MB" },
    { value: PhysicalMemorySize.GB_1, label: "1 GB" },
    { value: PhysicalMemorySize.GB_2, label: "2 GB" },
    { value: PhysicalMemorySize.GB_4, label: "4 GB" },
  ];

  const pageSizeOptions = [
    { value: PageSize.B_512, label: "512 B" },
    { value: PageSize.KB_1, label: "1 KB" },
    { value: PageSize.KB_2, label: "2 KB" },
    { value: PageSize.KB_4, label: "4 KB" },
    { value: PageSize.KB_8, label: "8 KB" },
    { value: PageSize.KB_16, label: "16 KB" },
  ];

  const virtualBitsOptions = [
    { value: VirtualAddressBits.BITS_16, label: "16 bits" },
    { value: VirtualAddressBits.BITS_18, label: "18 bits" },
    { value: VirtualAddressBits.BITS_20, label: "20 bits" },
    { value: VirtualAddressBits.BITS_24, label: "24 bits" },
    { value: VirtualAddressBits.BITS_26, label: "26 bits" },
    { value: VirtualAddressBits.BITS_28, label: "28 bits" },
    { value: VirtualAddressBits.BITS_30, label: "30 bits" },
  ];

  // Consistent section heading style
  const SectionHeading = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-primary mb-6 text-2xl font-bold">{children}</h2>
  );

  // Consistent subsection heading style
  const SubsectionHeading = ({ children }: { children: React.ReactNode }) => (
    <h3 className="mb-4 text-xl font-medium">{children}</h3>
  );

  // Collapsible section heading style
  const CollapsibleHeading = ({
    children,
    collapsed,
    onClick,
  }: {
    children: React.ReactNode;
    collapsed: boolean;
    onClick: () => void;
  }) => (
    <div className="flex cursor-pointer items-center justify-between py-1" onClick={onClick}>
      <h3 className="text-xl font-medium">{children}</h3>
      {collapsed ? (
        <ChevronDown className="text-muted-foreground h-5 w-5" />
      ) : (
        <ChevronUp className="text-muted-foreground h-5 w-5" />
      )}
    </div>
  );

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

      {/* Derived Values Section - Collapsible */}
      <section className="bg-muted/30 w-full max-w-6xl rounded-lg p-6">
        <CollapsibleHeading
          collapsed={derivedValuesCollapsed}
          onClick={() => setDerivedValuesCollapsed(!derivedValuesCollapsed)}
        >
          System Information
        </CollapsibleHeading>

        {!derivedValuesCollapsed && (
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Virtual Address Space:</p>
              <p className="font-medium">{PagingSystem.formatBytes(summary.virtualAddressSpace)}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">Page Offset Bits:</p>
              <p className="font-medium">{summary.pageOffsetBits}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">VPN Bits:</p>
              <p className="font-medium">{summary.vpnBits}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">PFN Bits:</p>
              <p className="font-medium">{summary.pfnBits}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Virtual Pages:</p>
              <p className="font-medium">{summary.totalVirtualPages.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Physical Frames:</p>
              <p className="font-medium">{summary.totalPhysicalFrames.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">PTEs Per Page:</p>
              <p className="font-medium">{summary.ptesPerPage.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">PTE Index Bits:</p>
              <p className="font-medium">{summary.pteIndexBits}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">Page Table Levels:</p>
              <p className="font-medium">{summary.pageTableLevels}</p>
            </div>
          </div>
        )}
      </section>

      {/* Address Structure Section */}
      <section className="w-full max-w-6xl">
        <SectionHeading>Address Structure</SectionHeading>

        <div className="flex flex-col gap-8">
          <div className="bg-muted/30 rounded-lg p-6">
            <SubsectionHeading>Virtual Address ({virtualBits} bits)</SubsectionHeading>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {summary.bitsPerLevel.map((bits, index) => {
                    // Calculate the starting bit number for this level
                    let startBit = pageOffsetBlocks;
                    for (let i = summary.bitsPerLevel.length - 1; i > index; i--) {
                      startBit += summary.bitsPerLevel[i];
                    }
                    return (
                      <BinaryBlock
                        key={index}
                        blocks={bits}
                        color={PageTableLevelColors[index % PageTableLevelColors.length].background}
                        borderColor={PageTableLevelColors[index % PageTableLevelColors.length].border}
                        hoverColor={PageTableLevelColors[index % PageTableLevelColors.length].hover}
                        tooltip={`${getLevelLabel(index, summary.pageTableLevels)}: ${bits} bits`}
                        showLeftBorder={true}
                        label={getLevelLabel(index, summary.pageTableLevels)}
                        startBitNumber={startBit}
                      />
                    );
                  })}
                </div>
                <BinaryBlock
                  blocks={pageOffsetBlocks}
                  color="bg-emerald-100"
                  borderColor="border-emerald-300"
                  hoverColor="group-hover:bg-emerald-200"
                  tooltip={`Page Offset: ${pageOffsetBlocks} bits`}
                  showLeftBorder={true}
                  label="Page Offset"
                  startBitNumber={0}
                />
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-6">
            <SubsectionHeading>Physical Address (32 bits)</SubsectionHeading>
            <div className="flex flex-wrap items-center gap-2">
              {unusedBits > 0 && (
                <BinaryBlock
                  blocks={unusedBits}
                  color="bg-gray-100"
                  borderColor="border-gray-300"
                  hoverColor="group-hover:bg-gray-200"
                  tooltip={`Unused Bits: ${unusedBits} bits`}
                  showLeftBorder={true}
                  label="Unused"
                  startBitNumber={pageOffsetBlocks + pfnBlocks}
                />
              )}
              <BinaryBlock
                blocks={pfnBlocks}
                color="bg-sky-100"
                borderColor="border-sky-300"
                hoverColor="group-hover:bg-sky-200"
                tooltip={`PFN: ${pfnBlocks} bits`}
                showLeftBorder={true}
                label="Physical Frame Number (PFN)"
                startBitNumber={pageOffsetBlocks}
              />
              <BinaryBlock
                blocks={pageOffsetBlocks}
                color="bg-emerald-100"
                borderColor="border-emerald-300"
                hoverColor="group-hover:bg-emerald-200"
                tooltip={`Page Offset: ${pageOffsetBlocks} bits`}
                showLeftBorder={true}
                label="Page Offset"
                startBitNumber={0}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Page Table Structure Section */}
      <section className="w-full max-w-6xl">
        <SectionHeading>Page Table Structure</SectionHeading>

        <div className="flex flex-col gap-4">
          {/* PTE Structure - Non-Collapsible */}
          <div className="bg-muted/30 rounded-lg p-6">
            <SubsectionHeading>Page Table Entry (PTE) Structure</SubsectionHeading>
            <p className="text-muted-foreground mb-3 text-sm">Each PTE is 32 bits (4 bytes)</p>
            <div className="flex flex-wrap items-center gap-2">
              {/* Modified bit */}
              <BinaryBlock
                blocks={1}
                color="bg-red-100"
                borderColor="border-red-300"
                hoverColor="group-hover:bg-red-200"
                tooltip="Modified bit (M): Indicates if page has been written to"
                showLeftBorder={true}
                label="M"
                startBitNumber={31}
              />
              {/* Referenced bit */}
              <BinaryBlock
                blocks={1}
                color="bg-orange-100"
                borderColor="border-orange-300"
                hoverColor="group-hover:bg-orange-200"
                tooltip="Referenced bit (R): Indicates if page has been accessed"
                showLeftBorder={true}
                label="R"
                startBitNumber={30}
              />
              {/* Valid bit */}
              <BinaryBlock
                blocks={1}
                color="bg-amber-100"
                borderColor="border-amber-300"
                hoverColor="group-hover:bg-amber-200"
                tooltip="Valid bit (V): Indicates if PTE is valid"
                showLeftBorder={true}
                label="V"
                startBitNumber={29}
              />
              {/* Protection bits */}
              <BinaryBlock
                blocks={3}
                color="bg-lime-100"
                borderColor="border-lime-300"
                hoverColor="group-hover:bg-lime-200"
                tooltip="Protection bits (3 bits): R/W/X permissions"
                showLeftBorder={true}
                label="Prot"
                startBitNumber={26}
              />
              {/* Calculate unused bits in PTE */}
              {26 - pfnBlocks > 0 && (
                <BinaryBlock
                  blocks={26 - pfnBlocks}
                  color="bg-gray-100"
                  borderColor="border-gray-300"
                  hoverColor="group-hover:bg-gray-200"
                  tooltip={`Unused: ${26 - pfnBlocks} bits`}
                  showLeftBorder={true}
                  label="Unused"
                  startBitNumber={pfnBlocks}
                />
              )}
              {/* PFN bits */}
              <BinaryBlock
                blocks={pfnBlocks}
                color="bg-sky-100"
                borderColor="border-sky-300"
                hoverColor="group-hover:bg-sky-200"
                tooltip={`PFN: ${pfnBlocks} bits`}
                showLeftBorder={true}
                label="Physical Frame Number (PFN)"
                startBitNumber={0}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

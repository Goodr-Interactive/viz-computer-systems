import React, { type ReactElement } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiColorBinaryBlock } from "../../paging/ui/BinaryBlock";
import { type FileSystem, BlockType } from "../FileSystem";
import { getBlockColors, getBlockTypeName } from "./utils";

interface DiskLayoutProps {
  fileSystem: FileSystem;
  selectedBlock: number | null;
  onBlockClick: (blockIndex: number) => void;
}

export const DiskLayout: React.FC<DiskLayoutProps> = ({
  fileSystem,
  selectedBlock,
  onBlockClick,
}) => {
  const blocks: ReactElement[] = [];
  const totalBlocks = fileSystem.getTotalBlocks();

  // Create 4 rows of 16 blocks
  for (let row = 0; row < 4; row++) {
    const rowBlocks: ReactElement[] = [];
    for (let col = 0; col < 16; col++) {
      const blockIndex = row * 16 + col;
      if (blockIndex >= totalBlocks) break;

      const blockInfo = fileSystem.getBlockInfo(blockIndex);
      const colors = getBlockColors(blockInfo.type);
      const blockTypeName = getBlockTypeName(blockInfo.type);

      let description: string;
      if (blockInfo.type === BlockType.DATA) {
        const ownerInode = fileSystem.getOwnerInode(blockIndex);
        if (ownerInode !== null) {
          description = `Data block (used by Inode ${ownerInode})`;
        } else {
          description = `Data block (Free)`;
        }
      } else {
        description = blockTypeName;
      }

      rowBlocks.push(
        <Tooltip key={blockIndex} delayDuration={350}>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center">
              <div
                onClick={() => onBlockClick(blockIndex)}
                className={selectedBlock === blockIndex ? "ring-2 ring-blue-500" : ""}
              >
                <MultiColorBinaryBlock
                  blocks={1}
                  digits={[blockInfo.type]}
                  colors={[colors.color]}
                  borderColors={[colors.borderColor]}
                  hoverColors={[colors.hoverColor]}
                  isPadding={[false]}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={2} className="py-1">
            <div className="flex items-baseline gap-2.5">
              <p className="text-sm font-medium">Block {blockIndex}</p>
              <p>{description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }
    blocks.push(
      <div key={row} className="text-mono flex items-center gap-3 text-xs">
        <div className="text-muted-foreground w-8 text-right">{row * 16}</div>
        <div className="flex gap-2">{rowBlocks}</div>
        <div className="text-muted-foreground w-8 text-left">{row * 16 + 15}</div>
      </div>
    );
  }

  return <div className="flex flex-col gap-2">{blocks}</div>;
};

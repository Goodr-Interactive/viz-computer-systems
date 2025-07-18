import React from "react";
import type { FileSystem } from "../FileSystem";
import { MultiColorBinaryBlock } from "../../paging/ui/BinaryBlock";
import { TitleWithTooltip } from "./TitleWithTooltip";

interface EnhancedBitmapViewProps {
  fileSystem: FileSystem;
  bitmapType: "inode" | "data";
  onBlockClick?: (blockIndex: number) => void;
  onInodeClick?: (inodeNumber: number, isUsed: boolean) => void;
  highlightedItems?: Set<number>;
}

export const EnhancedBitmapView: React.FC<EnhancedBitmapViewProps> = ({
  fileSystem,
  bitmapType,
  onBlockClick,
  onInodeClick,
  highlightedItems,
}) => {
  const bitmap = bitmapType === "inode" ? fileSystem.getInodeBitmap() : fileSystem.getDataBitmap();
  const itemsPerRow = 16;
  const rows = [];

  // Calculate how many rows we need
  const totalRows = Math.ceil(bitmap.length / itemsPerRow);

  const handleItemClick = (itemIndex: number) => {
    const isUsed = bitmap[itemIndex];

    if (bitmapType === "inode") {
      // Calculate which inode block contains this inode
      const sb = fileSystem.getSuperBlock();
      const blockSize = Math.pow(2, sb.s_log_block_size);
      const inodesPerBlock = blockSize / sb.s_inode_size;
      const inodeBlockIndex = 3 + Math.floor(itemIndex / inodesPerBlock);

      if (isUsed && onInodeClick) {
        // For used inodes, navigate to block and select the specific inode
        if (onBlockClick) {
          onBlockClick(inodeBlockIndex);
        }

        setTimeout(() => {
          onInodeClick(itemIndex, isUsed);
        }, 50);
      } else if (!isUsed && onBlockClick) {
        // For free inodes, just open the inode block
        onBlockClick(inodeBlockIndex);
      }
    } else {
      // For data bitmap, allow clicking on any block to view it
      if (onBlockClick) {
        onBlockClick(itemIndex);
      }
    }
  };

  for (let row = 0; row < totalRows; row++) {
    const rowItems = [];
    for (let col = 0; col < itemsPerRow; col++) {
      const itemIndex = row * itemsPerRow + col;
      if (itemIndex >= bitmap.length) break;

      const isUsed = bitmap[itemIndex];
      const isHighlighted = highlightedItems?.has(itemIndex) || false;

      let colors;
      if (isHighlighted && isUsed) {
        colors = {
          color: "bg-orange-100",
          borderColor: "border-orange-400",
          hoverColor: "group-hover:bg-orange-200",
        };
      } else if (isUsed) {
        colors = {
          color: "bg-green-100",
          borderColor: "border-green-300",
          hoverColor: "group-hover:bg-green-200",
        };
      } else {
        colors = {
          color: "bg-gray-100",
          borderColor: "border-gray-300",
          hoverColor: "group-hover:bg-gray-200",
        };
      }

      rowItems.push(
        <div
          key={itemIndex}
          className="flex cursor-pointer flex-col items-center"
          onClick={() => handleItemClick(itemIndex)}
        >
          <MultiColorBinaryBlock
            blocks={1}
            digits={[itemIndex.toString()]}
            colors={[colors.color]}
            borderColors={[colors.borderColor]}
            hoverColors={[colors.hoverColor]}
            isPadding={[false]}
          />
        </div>
      );
    }
    rows.push(
      <div key={row} className="flex justify-center gap-2">
        {rowItems}
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center">
      <div className="flex flex-col gap-3">
        <TitleWithTooltip
          title={`${bitmapType === "inode" ? "Inode" : "Data"} Bitmap`}
          tooltipText={
            bitmapType === "inode"
              ? "Tracks the allocation status of all inodes. Each bit represents one inode: '1' for used, '0' for free. Click on used inodes to view their details."
              : "Tracks the allocation status of all data blocks. Each bit represents one block: '1' for used, '0' for free. Click on any block to view its content."
          }
          className="pt-2 text-start font-medium"
        />
        <div className="flex flex-col gap-2">{rows}</div>
        <div className="text-muted-foreground flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 border border-green-300 bg-green-100"></div>
            <span className="text-muted-foreground text-sm">Used</span>
          </div>
          {highlightedItems && highlightedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 border border-orange-400 bg-orange-100"></div>
              <span className="text-muted-foreground text-sm">New</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 border border-gray-300 bg-gray-100"></div>
            <span className="text-muted-foreground text-sm">Free</span>
          </div>
        </div>
      </div>
    </div>
  );
};

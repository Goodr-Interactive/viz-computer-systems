import React from "react";
import type { FileSystem } from "../FileSystem";
import { MultiColorBinaryBlock } from "../../paging/ui/BinaryBlock";
import { TitleWithTooltip } from "../TitleWithTooltip";

interface BitmapViewProps {
  fileSystem: FileSystem;
  bitmapType: "inode" | "data";
}

export const BitmapView: React.FC<BitmapViewProps> = ({ fileSystem, bitmapType }) => {
  const bitmap = bitmapType === "inode" ? fileSystem.getInodeBitmap() : fileSystem.getDataBitmap();
  const itemsPerRow = 16;
  const rows = [];

  // Calculate how many rows we need
  const totalRows = Math.ceil(bitmap.length / itemsPerRow);

  for (let row = 0; row < totalRows; row++) {
    const rowItems = [];
    for (let col = 0; col < itemsPerRow; col++) {
      const itemIndex = row * itemsPerRow + col;
      if (itemIndex >= bitmap.length) break;

      const isUsed = bitmap[itemIndex];
      const colors = isUsed
        ? {
            color: "bg-green-100",
            borderColor: "border-green-300",
            hoverColor: "group-hover:bg-green-200",
          }
        : { color: "bg-gray-100", borderColor: "border-gray-300", hoverColor: "" };

      rowItems.push(
        <div key={itemIndex} className="flex flex-col items-center">
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
              ? "Tracks the allocation status of all inodes. Each bit represents one inode: '1' for used, '0' for free."
              : "Tracks the allocation status of all data blocks. Each bit represents one block: '1' for used, '0' for free."
          }
          className="pt-2 text-start font-medium"
        />
        <div className="flex flex-col gap-2">{rows}</div>
        <div className="text-muted-foreground flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 border border-green-300 bg-green-100"></div>
            <span className="text-muted-foreground text-sm">Used</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 border border-gray-300 bg-gray-100"></div>
            <span className="text-muted-foreground text-sm">Free</span>
          </div>
        </div>
      </div>
    </div>
  );
};

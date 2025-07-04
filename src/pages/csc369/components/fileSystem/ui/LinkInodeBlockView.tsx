import React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { FileSystem } from "../FileSystem";
import { MultiColorBinaryBlock } from "../../paging/ui/BinaryBlock";
import { TitleWithTooltip } from "../TitleWithTooltip";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface EnhancedInodeBlockViewProps {
  blockIndex: number;
  fileSystem: FileSystem;
  selectedInode: number | null;
  previousInode: number | null;
  onInodeClick: (inodeNumber: number, isUsed: boolean) => void;
  onCloseInodeInfo: () => void;
  onBlockClick: (blockIndex: number) => void;
  highlightedInodes?: Set<number>;
  changedInodeAttributes?: Map<number, Set<string>>;
}

export const EnhancedInodeBlockView: React.FC<EnhancedInodeBlockViewProps> = ({
  blockIndex,
  fileSystem,
  selectedInode,
  previousInode,
  onInodeClick,
  onCloseInodeInfo,
  onBlockClick,
  highlightedInodes,
  changedInodeAttributes,
}) => {
  const inodeData = fileSystem.getInodeBlockData(blockIndex);
  const inodesPerRow = 8; // 8 inodes per row, 4 rows = 32 inodes
  const rows = [];

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number): string => {
    if (timestamp === 0) return "Not set";
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours());
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");
    return `${month}/${day} ${hour}:${minute}:${second}`;
  };

  for (let row = 0; row < 4; row++) {
    const rowInodes = [];
    for (let col = 0; col < inodesPerRow; col++) {
      const inodeIndex = row * inodesPerRow + col;
      if (inodeIndex >= inodeData.inodes.length) break;

      const inode = inodeData.inodes[inodeIndex];
      const isHighlighted = highlightedInodes?.has(inode.number) || false;
      const isSelected = selectedInode === inode.number && inode.used && inode.data;

      let colors;
      if (isHighlighted && inode.used) {
        colors = {
          color: "bg-orange-100",
          borderColor: "border-orange-400",
          hoverColor: "group-hover:bg-orange-200",
        };
      } else if (inode.used) {
        colors = {
          color: "bg-green-100",
          borderColor: "border-green-300",
          hoverColor: "group-hover:bg-green-200",
        };
      } else {
        colors = { color: "bg-gray-100", borderColor: "border-gray-300", hoverColor: "" };
      }

      rowInodes.push(
        <div key={inode.number} className="flex flex-col items-center">
          <div
            onClick={() => onInodeClick(inode.number, inode.used)}
            className={` ${
              inode.used ? "cursor-pointer" : "cursor-not-allowed"
            } ${isSelected ? "ring-2 ring-blue-500" : ""} `}
          >
            <MultiColorBinaryBlock
              blocks={1}
              digits={[inode.number.toString()]}
              colors={[colors.color]}
              borderColors={[colors.borderColor]}
              hoverColors={[colors.hoverColor]}
              isPadding={[false]}
            />
          </div>
        </div>
      );
    }
    rows.push(
      <div key={row} className="flex justify-center gap-2">
        {rowInodes}
      </div>
    );
  }

  return (
    <div className="flex min-h-[210px] w-full justify-center">
      <motion.div
        layout
        className="flex items-start gap-8 overflow-hidden"
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Main Grid */}
        <motion.div
          layout
          className="flex flex-shrink-0 flex-col gap-3 p-1"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <TitleWithTooltip
            title={`Inode Block ${blockIndex} (Inodes ${inodeData.inodes[0]?.number} - ${
              inodeData.inodes[inodeData.inodes.length - 1]?.number
            })`}
            tooltipText="Inode blocks store inodes, which contain metadata about files and directories (e.g., size, permissions, and pointers to data blocks)."
            className="pt-1 text-start font-medium"
          />
          <div className="flex flex-col gap-2">{rows}</div>
          <div className="text-muted-foreground flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 border border-green-300 bg-green-100"></div>
              <span className="text-muted-foreground text-sm">Used</span>
            </div>
            {highlightedInodes && highlightedInodes.size > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 border border-orange-400 bg-orange-100"></div>
                <span className="text-muted-foreground text-sm">Changed</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 border border-gray-300 bg-gray-100"></div>
              <span className="text-muted-foreground text-sm">Free</span>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Info Card */}
        <AnimatePresence mode="popLayout">
          {selectedInode !== null &&
            (() => {
              const inode = inodeData.inodes.find((i) => i.number === selectedInode);
              return inode && inode.used && inode.data;
            })() && (
              <motion.div
                key={`inode-card-${selectedInode}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: previousInode === null ? 0.15 : 0.1,
                  ease: "easeOut",
                  delay: previousInode === null ? 0.2 : 0,
                }}
                className="border-border w-[196px] flex-shrink-0 rounded-md border p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h5 className="font-medium">Inode {selectedInode}</h5>
                  <Button
                    onClick={onCloseInodeInfo}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 cursor-pointer p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {(() => {
                  const inode = inodeData.inodes.find((i) => i.number === selectedInode);
                  if (!inode || !inode.data) return null;

                  const changedAttributes =
                    changedInodeAttributes?.get(selectedInode) || new Set<string>();

                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span
                          className={`font-medium ${changedAttributes.has("type") ? "font-bold text-orange-600" : ""}`}
                        >
                          Type:
                        </span>
                        <span>{inode.data.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span
                          className={`font-medium ${changedAttributes.has("nlink") ? "font-bold text-orange-600" : ""}`}
                        >
                          Links:
                        </span>
                        <span className="font-mono">{inode.data.nlink}</span>
                      </div>

                      {/* <div className="flex justify-between">
                      <span className="font-medium">Created:</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {formatTimestamp(inode.data.ctime)}
                      </span>
                    </div> */}
                      <div className="flex justify-between">
                        <span
                          className={`font-medium ${changedAttributes.has("mtime") ? "font-bold text-orange-600" : ""}`}
                        >
                          Modified:
                        </span>
                        <span className="mt-0.5 font-mono text-xs tracking-tighter">
                          {formatTimestamp(inode.data.mtime)}
                        </span>
                      </div>

                      <div>
                        <div
                          className={`mb-2 font-medium ${changedAttributes.has("blockPointers") ? "font-bold text-orange-600" : ""}`}
                        >
                          Block Pointers:
                        </div>
                        {inode.data.blockPointers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {inode.data.blockPointers.map((pointer) => (
                              <Button
                                key={pointer}
                                variant="outline"
                                size="sm"
                                className="h-7 w-9 cursor-pointer rounded border border-zinc-400/50 bg-white font-mono"
                                onClick={() => onBlockClick(pointer)}
                              >
                                {pointer}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No blocks allocated</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

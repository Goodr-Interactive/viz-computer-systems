import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { MultiColorBinaryBlock } from "../../paging/ui/BinaryBlock";
import type { FileSystem } from "../FileSystem";
import { getBlockColors } from "./utils";

interface MemoryViewProps {
  memoryBlocks: number[];
  fileSystem: FileSystem;
  selectedBlock: number | null;
  onBlockClick: (blockIndex: number) => void;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
  memoryBlocks,
  fileSystem,
  selectedBlock,
  onBlockClick,
}) => {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-center gap-4 overflow-hidden p-1 pt-2">
        {memoryBlocks.length === 0 ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
                layout: {
                  duration: 0.2,
                  ease: "easeInOut",
                },
                delay: 0.2,
              }}
              layout
              className="text-muted-foreground flex origin-top items-center justify-center text-center"
            >
              Click on blocks in the disk layout <br /> to load them into memory
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="popLayout">
            {memoryBlocks.map((blockIndex) => {
              const blockInfo = fileSystem.getBlockInfo(blockIndex);
              const colors = getBlockColors(blockInfo.type);
              return (
                <motion.div
                  key={blockIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="flex flex-col items-center"
                >
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
                  <div className="text-muted-foreground mt-1 text-xs">{blockIndex}</div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

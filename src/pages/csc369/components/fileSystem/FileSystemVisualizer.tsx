import React, { useState, useReducer } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { FileSystem } from "./FileSystem";
import { SubsectionHeading } from "../paging/ui/SubsectionHeading";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { FileSystemIntro } from "./FileSystemIntro";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DiskLayout } from "./ui/DiskLayout";
import { MemoryView } from "./ui/MemoryView";
import { BlockContentView } from "./ui/BlockContentView";

interface FileSystemVisualizerProps {
  fileSystem: FileSystem;
}

export const FileSystemVisualizer: React.FC<FileSystemVisualizerProps> = ({ fileSystem }) => {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [memoryBlocks, setMemoryBlocks] = useState<number[]>([]);
  const [selectedInode, setSelectedInode] = useState<number | null>(null);
  const [previousInode, setPreviousInode] = useState<number | null>(null);
  const [, setIsFirstSelection] = useState<boolean>(false);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const handleBlockClick = (blockIndex: number) => {
    setSelectedBlock(blockIndex);
    if (!memoryBlocks.includes(blockIndex)) {
      setMemoryBlocks([...memoryBlocks, blockIndex]);
    }
    // Reset inode selection when switching blocks
    setPreviousInode(selectedInode);
    setSelectedInode(null);
    setIsFirstSelection(false);
  };

  const handleInodeClick = (inodeNumber: number, isUsed: boolean) => {
    if (isUsed) {
      const wasNothingSelected = selectedInode === null;
      setPreviousInode(selectedInode);
      setSelectedInode(inodeNumber);
      setIsFirstSelection(wasNothingSelected);
    }
  };

  const handleDirectoryRowClick = (inodeNumber: number) => {
    const sb = fileSystem.getSuperBlock();
    const blockSize = Math.pow(2, sb.s_log_block_size);
    const inodesPerBlock = blockSize / sb.s_inode_size;
    const inodeBlockIndex = 3 + Math.floor(inodeNumber / inodesPerBlock);

    handleBlockClick(inodeBlockIndex);
    // Use a timeout to ensure the inode click is processed after the block has been re-rendered
    setTimeout(() => {
      handleInodeClick(inodeNumber, true);
    }, 50);
  };

  return (
    <>
      <FileSystemIntro fileSystem={fileSystem} onUpload={forceUpdate} />
      <section className="w-full max-w-7xl overflow-x-auto">
        <TooltipProvider>
          <div className="bg-muted/50 min-w-fit rounded-lg p-6">
            <SubsectionHeading>Disk Layout</SubsectionHeading>
            <div className="flex min-w-fit items-center justify-center gap-2 overflow-x-auto p-1">
              <DiskLayout
                fileSystem={fileSystem}
                selectedBlock={selectedBlock}
                onBlockClick={handleBlockClick}
              />
            </div>
          </div>
        </TooltipProvider>
      </section>

      <div className="flex w-full max-w-7xl flex-grow flex-col gap-10 lg:h-[480px] lg:flex-row">
        <section className="flex w-full flex-col lg:w-1/3">
          <div className="bg-muted/50 flex h-full flex-col rounded-lg p-6">
            <div className="mb-3 flex items-center justify-between">
              <SubsectionHeading className="mb-0">Memory</SubsectionHeading>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => {
                    setMemoryBlocks([]);
                    setPreviousInode(selectedInode);
                    setSelectedBlock(null);
                  }}
                  variant="outline"
                  size="sm"
                  disabled={memoryBlocks.length === 0}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
            <div className="h-full overflow-hidden">
              <div className="flex h-full justify-center gap-2 overflow-y-auto p-1">
                <MemoryView
                  memoryBlocks={memoryBlocks}
                  fileSystem={fileSystem}
                  selectedBlock={selectedBlock}
                  onBlockClick={handleBlockClick}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="flex h-full w-full flex-col overflow-x-auto lg:w-2/3">
          <div className="bg-muted/50 flex h-full min-w-fit flex-col rounded-lg p-6">
            <SubsectionHeading>Block Content</SubsectionHeading>
            <div className="flex-grow overflow-y-auto p-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selectedBlock ?? "initial-state"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1, height: "auto" }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                    layout: {
                      duration: 0.2,
                      ease: "easeInOut",
                    },
                  }}
                  layout
                  className="origin-top"
                >
                  <BlockContentView
                    selectedBlock={selectedBlock}
                    fileSystem={fileSystem}
                    selectedInode={selectedInode}
                    previousInode={previousInode}
                    onInodeClick={handleInodeClick}
                    onCloseInodeInfo={() => setSelectedInode(null)}
                    onBlockClick={handleBlockClick}
                    onDirectoryRowClick={handleDirectoryRowClick}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { FileSystem } from "./FileSystem";
import { SubsectionHeading } from "../paging/ui/SubsectionHeading";
import { FileSystemIntro } from "./FileSystemIntro";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DiskLayout } from "./ui/DiskLayout";
import { BlockContentView } from "./ui/BlockContentView";
import { FILE_SYSTEM_CONFIG } from "./config";

interface FileSystemVisualizerProps {
  fileSystem: FileSystem;
}

export const FileSystemVisualizer: React.FC<FileSystemVisualizerProps> = ({ fileSystem }) => {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [selectedInode, setSelectedInode] = useState<number | null>(null);
  const [previousInode, setPreviousInode] = useState<number | null>(null);
  const [, setIsFirstSelection] = useState<boolean>(false);
  const [randomPath, setRandomPath] = useState(
    FILE_SYSTEM_CONFIG.files[Math.floor(Math.random() * FILE_SYSTEM_CONFIG.files.length)].path
  );
  const [correctBlock, setCorrectBlock] = useState<number | null>(null);

  // Log the block number where the randomPath file is stored
  useEffect(() => {
    const inodeNumber = fileSystem.findInodeByPath(randomPath);
    console.log(inodeNumber);
    if (inodeNumber !== -1) {
      const inode = fileSystem
        .getInodeBlockData(Math.floor(inodeNumber / 16) + 3)
        .inodes.find((i) => i.number === inodeNumber);
      if (inode?.data?.blockPointers) {
        setCorrectBlock(inode.data.blockPointers[0]);
      }
    }
  }, [randomPath, fileSystem]);

  const handleBlockClick = (blockIndex: number) => {
    setSelectedBlock(blockIndex);
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
      <FileSystemIntro
        fileSystem={fileSystem}
        randomPath={randomPath}
        onRandomPathChange={setRandomPath}
      />
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

      <section className="flex h-full w-full max-w-7xl flex-col overflow-x-auto">
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
                  correctBlock={correctBlock}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  );
};

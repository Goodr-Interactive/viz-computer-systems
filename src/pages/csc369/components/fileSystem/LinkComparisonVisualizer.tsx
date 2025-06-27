import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileSystem } from "./FileSystem";
import { SubsectionHeading } from "../paging/ui/SubsectionHeading";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DiskLayout } from "./ui/DiskLayout";
import { EnhancedBlockContentView } from "./ui/LinkBlockContentView";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "../paging/ui/SectionHeading";
import { FILE_SYSTEM_CONFIG, generateRandomLinkScenario, type LinkScenario } from "./config";

export const LinkComparisonVisualizer: React.FC = () => {
  const [linkType, setLinkType] = useState<"hard" | "soft">("hard");
  const [fileSystemBefore, setFileSystemBefore] = useState<FileSystem | null>(null);
  const [fileSystemAfter, setFileSystemAfter] = useState<FileSystem | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [selectedInode, setSelectedInode] = useState<number | null>(null);
  const [showingAfter, setShowingAfter] = useState(false);
  const [linkScenario, setLinkScenario] = useState<LinkScenario | null>(null);

  // Initialize file systems
  useEffect(() => {
    // Create the initial file system using the config
    const fs = new FileSystem(
      FILE_SYSTEM_CONFIG.dataBlocks,
      FILE_SYSTEM_CONFIG.totalInodes,
      FILE_SYSTEM_CONFIG.blockSize,
      FILE_SYSTEM_CONFIG.inodeSize
    );

    // Create all files from the config
    FILE_SYSTEM_CONFIG.files.forEach((file) => {
      fs.createFile(`/${file.path}`, file.type || "text", file.content || "Default file content");
    });

    // Generate a random link scenario
    const scenario = generateRandomLinkScenario();
    setLinkScenario(scenario);

    setFileSystemBefore(fs);

    // Create the "after" file system based on link type
    updateAfterFileSystem(fs, linkType, scenario);
  }, []);

  // Update the "after" file system when link type changes
  useEffect(() => {
    if (fileSystemBefore && linkScenario) {
      updateAfterFileSystem(fileSystemBefore, linkType, linkScenario);
    }
  }, [linkType, fileSystemBefore, linkScenario]);

  const updateAfterFileSystem = (
    _baseFsInstance: FileSystem,
    type: "hard" | "soft",
    scenario: LinkScenario
  ) => {
    // Clone the file system by creating a new one with the same structure using config
    const fs = new FileSystem(
      FILE_SYSTEM_CONFIG.dataBlocks,
      FILE_SYSTEM_CONFIG.totalInodes,
      FILE_SYSTEM_CONFIG.blockSize,
      FILE_SYSTEM_CONFIG.inodeSize
    );

    // Recreate all files from the config
    FILE_SYSTEM_CONFIG.files.forEach((file) => {
      fs.createFile(`/${file.path}`, file.type || "text", file.content || "Default file content");
    });

    // Create the link based on type using the random scenario
    if (type === "hard") {
      fs.createHardLink(scenario.targetFile, scenario.linkPath);
    } else {
      fs.createSymbolicLink(scenario.targetFile, scenario.linkPath);
    }

    setFileSystemAfter(fs);
  };

  const handleBlockClick = (blockIndex: number) => {
    setSelectedBlock(blockIndex);
    setSelectedInode(null);
  };

  const handleInodeClick = (inodeNumber: number, isUsed: boolean) => {
    if (isUsed) {
      setSelectedInode(inodeNumber);
    }
  };

  const handleDirectoryRowClick = (inodeNumber: number) => {
    const fs = showingAfter ? fileSystemAfter : fileSystemBefore;
    if (!fs) return;

    const sb = fs.getSuperBlock();
    const blockSize = Math.pow(2, sb.s_log_block_size);
    const inodesPerBlock = blockSize / sb.s_inode_size;
    const inodeBlockIndex = 3 + Math.floor(inodeNumber / inodesPerBlock);

    handleBlockClick(inodeBlockIndex);
    setTimeout(() => {
      handleInodeClick(inodeNumber, true);
    }, 50);
  };

  const getHighlightedInodes = (): Set<number> => {
    if (!fileSystemBefore || !fileSystemAfter || !linkScenario) return new Set();

    const highlightedInodes = new Set<number>();

    if (linkType === "hard") {
      // For hard links, highlight the target inode that the link points to
      try {
        const sb = fileSystemAfter.getSuperBlock();
        const targetFileName = linkScenario.targetFile.split("/").pop();
        // Look for the target file
        for (let blockIndex = sb.s_first_data_block; blockIndex < sb.s_blocks_count; blockIndex++) {
          const ownerAfter = fileSystemAfter.getOwnerInode(blockIndex);
          if (ownerAfter !== null && fileSystemAfter.isDirectory(ownerAfter)) {
            const entriesAfter = fileSystemAfter.getDirectoryEntriesFromBlock(blockIndex);
            const targetEntry = entriesAfter.find((entry) => entry.name === targetFileName);
            if (targetEntry) {
              highlightedInodes.add(targetEntry.inode);
              break;
            }
          }
        }
      } catch {
        // If we can't find the target inode, that's okay
      }
    } else {
      // For soft links, highlight newly allocated inodes
      const beforeInodeBitmap = fileSystemBefore.getInodeBitmap();
      const afterInodeBitmap = fileSystemAfter.getInodeBitmap();

      for (let i = 0; i < beforeInodeBitmap.length; i++) {
        if (!beforeInodeBitmap[i] && afterInodeBitmap[i]) {
          highlightedInodes.add(i);
        }
      }
    }

    return highlightedInodes;
  };

  const getHighlightedInodeBitmapItems = (): Set<number> => {
    if (!fileSystemBefore || !fileSystemAfter || linkType !== "soft") return new Set();

    const beforeInodeBitmap = fileSystemBefore.getInodeBitmap();
    const afterInodeBitmap = fileSystemAfter.getInodeBitmap();
    const highlightedItems = new Set<number>();

    // For soft links, highlight newly allocated inodes in the bitmap
    for (let i = 0; i < beforeInodeBitmap.length; i++) {
      if (!beforeInodeBitmap[i] && afterInodeBitmap[i]) {
        highlightedItems.add(i);
      }
    }

    return highlightedItems;
  };

  const getHighlightedDataBitmapItems = (): Set<number> => {
    if (!fileSystemBefore || !fileSystemAfter || linkType !== "soft") return new Set();

    const beforeDataBitmap = fileSystemBefore.getDataBitmap();
    const afterDataBitmap = fileSystemAfter.getDataBitmap();
    const highlightedItems = new Set<number>();

    // For soft links, highlight newly allocated data blocks in the bitmap
    for (let i = 0; i < beforeDataBitmap.length; i++) {
      if (!beforeDataBitmap[i] && afterDataBitmap[i]) {
        highlightedItems.add(i);
      }
    }

    return highlightedItems;
  };

  const getHighlightedDataBlocks = (): Set<number> => {
    if (!fileSystemBefore || !fileSystemAfter || linkType !== "soft") return new Set();

    const beforeDataBitmap = fileSystemBefore.getDataBitmap();
    const afterDataBitmap = fileSystemAfter.getDataBitmap();
    const highlightedBlocks = new Set<number>();

    // For soft links, highlight newly allocated data blocks
    for (let i = 0; i < beforeDataBitmap.length; i++) {
      if (!beforeDataBitmap[i] && afterDataBitmap[i]) {
        highlightedBlocks.add(i);
      }
    }

    return highlightedBlocks;
  };

  const getChangedInodeAttributes = (): Map<number, Set<string>> => {
    if (!fileSystemBefore || !fileSystemAfter || !linkScenario) return new Map();

    const changedAttributes = new Map<number, Set<string>>();

    if (linkType === "hard") {
      // For hard links, find the target inode and mark its attributes as changed
      try {
        const sb = fileSystemAfter.getSuperBlock();
        const targetFileName = linkScenario.targetFile.split("/").pop();
        // Look for the target file
        for (let blockIndex = sb.s_first_data_block; blockIndex < sb.s_blocks_count; blockIndex++) {
          const ownerAfter = fileSystemAfter.getOwnerInode(blockIndex);
          if (ownerAfter !== null && fileSystemAfter.isDirectory(ownerAfter)) {
            const entriesAfter = fileSystemAfter.getDirectoryEntriesFromBlock(blockIndex);
            const targetEntry = entriesAfter.find((entry) => entry.name === targetFileName);
            if (targetEntry) {
              // Found the target inode, mark mtime and nlink as changed
              const changes = new Set<string>();
              changes.add("mtime");
              changes.add("nlink");
              changedAttributes.set(targetEntry.inode, changes);
              break;
            }
          }
        }
      } catch {
        // If we can't find the target inode, that's okay
      }
    } else if (linkType === "soft") {
      // For soft links, find newly allocated inodes and mark all attributes as changed
      const beforeBitmap = fileSystemBefore.getInodeBitmap();
      const afterBitmap = fileSystemAfter.getInodeBitmap();

      for (let i = 0; i < beforeBitmap.length; i++) {
        if (!beforeBitmap[i] && afterBitmap[i]) {
          // This inode was newly allocated
          const changes = new Set<string>();
          changes.add("type");
          changes.add("nlink");
          changes.add("mtime");
          changes.add("blockPointers");
          changedAttributes.set(i, changes);
        }
      }
    }

    return changedAttributes;
  };

  const getHighlightedEntries = (): Set<string> => {
    if (!fileSystemBefore || !fileSystemAfter) return new Set();

    const highlightedEntries = new Set<string>();

    // Look for new directory entries in the backup directory
    try {
      const sb = fileSystemAfter.getSuperBlock();
      for (let blockIndex = sb.s_first_data_block; blockIndex < sb.s_blocks_count; blockIndex++) {
        const ownerBefore = fileSystemBefore.getOwnerInode(blockIndex);
        const ownerAfter = fileSystemAfter.getOwnerInode(blockIndex);

        // If block has an owner and it's a directory, compare entries
        if (ownerAfter !== null && fileSystemAfter.isDirectory(ownerAfter)) {
          try {
            const entriesBefore =
              ownerBefore !== null ? fileSystemBefore.getDirectoryEntriesFromBlock(blockIndex) : [];
            const entriesAfter = fileSystemAfter.getDirectoryEntriesFromBlock(blockIndex);

            // Find entries that exist in after but not in before
            for (const afterEntry of entriesAfter) {
              const existsInBefore = entriesBefore.some(
                (beforeEntry) => beforeEntry.name === afterEntry.name
              );
              if (!existsInBefore) {
                highlightedEntries.add(afterEntry.name);
              }
            }
          } catch {
            // If we can't read directory entries, skip
          }
        }
      }
    } catch {
      // If we can't compare entries, that's okay
    }

    return highlightedEntries;
  };

  const getChangedBlocks = (): Set<number> => {
    if (!fileSystemBefore || !fileSystemAfter) return new Set();

    const changes = new Set<number>();

    // Compare bitmaps to find changes
    const beforeInodeBitmap = fileSystemBefore.getInodeBitmap();
    const afterInodeBitmap = fileSystemAfter.getInodeBitmap();
    const beforeDataBitmap = fileSystemBefore.getDataBitmap();
    const afterDataBitmap = fileSystemAfter.getDataBitmap();

    // Check if inode bitmap changed
    for (let i = 0; i < beforeInodeBitmap.length; i++) {
      if (beforeInodeBitmap[i] !== afterInodeBitmap[i]) {
        changes.add(1); // inode bitmap block
        break;
      }
    }

    // Check if data bitmap changed
    for (let i = 0; i < beforeDataBitmap.length; i++) {
      if (beforeDataBitmap[i] !== afterDataBitmap[i]) {
        changes.add(2); // data bitmap block
        break;
      }
    }

    // Find blocks that are now allocated but weren't before
    for (let i = 0; i < afterDataBitmap.length; i++) {
      if (!beforeDataBitmap[i] && afterDataBitmap[i]) {
        changes.add(i); // newly allocated block
      }
    }

    // Find specific directory blocks that changed by comparing their content
    const sb = fileSystemAfter.getSuperBlock();
    for (let blockIndex = sb.s_first_data_block; blockIndex < sb.s_blocks_count; blockIndex++) {
      const ownerBefore = fileSystemBefore.getOwnerInode(blockIndex);
      const ownerAfter = fileSystemAfter.getOwnerInode(blockIndex);

      // If block has an owner and it's a directory, compare entries
      if (ownerAfter !== null && fileSystemAfter.isDirectory(ownerAfter)) {
        try {
          const entriesBefore =
            ownerBefore !== null ? fileSystemBefore.getDirectoryEntriesFromBlock(blockIndex) : [];
          const entriesAfter = fileSystemAfter.getDirectoryEntriesFromBlock(blockIndex);

          if (entriesBefore.length !== entriesAfter.length) {
            changes.add(blockIndex); // directory content changed
          }
        } catch {
          // If we can't read directory entries, assume it changed
          changes.add(blockIndex);
        }
      }
    }

    // Find inode blocks that contain changed inodes
    const inodeSize = sb.s_inode_size;
    const blockSize = Math.pow(2, sb.s_log_block_size);
    const inodesPerBlock = blockSize / inodeSize;

    for (let i = 0; i < afterInodeBitmap.length; i++) {
      if (beforeInodeBitmap[i] !== afterInodeBitmap[i]) {
        const inodeBlockIndex = 3 + Math.floor(i / inodesPerBlock);
        changes.add(inodeBlockIndex);
      }
    }

    // For hard links, also highlight the target inode block
    if (linkType === "hard" && linkScenario) {
      // Find the target file inode
      // We need to find which inode this file uses by looking through directory entries
      try {
        const targetFileName = linkScenario.targetFile.split("/").pop();
        // Look for the target file
        for (let blockIndex = sb.s_first_data_block; blockIndex < sb.s_blocks_count; blockIndex++) {
          const ownerAfter = fileSystemAfter.getOwnerInode(blockIndex);
          if (ownerAfter !== null && fileSystemAfter.isDirectory(ownerAfter)) {
            const entriesAfter = fileSystemAfter.getDirectoryEntriesFromBlock(blockIndex);
            const targetEntry = entriesAfter.find((entry) => entry.name === targetFileName);
            if (targetEntry) {
              // Found the target inode, highlight its block
              const targetInodeBlockIndex = 3 + Math.floor(targetEntry.inode / inodesPerBlock);
              changes.add(targetInodeBlockIndex);
              break;
            }
          }
        }
      } catch {
        // If we can't find the target inode, that's okay
      }
    }

    return changes;
  };

  const currentFS = showingAfter ? fileSystemAfter : fileSystemBefore;
  const changedBlocks = showingAfter ? getChangedBlocks() : new Set<number>();
  const highlightedInodes = showingAfter ? getHighlightedInodes() : new Set<number>();
  const highlightedEntries = showingAfter ? getHighlightedEntries() : new Set<string>();
  const highlightedInodeBitmapItems = showingAfter
    ? getHighlightedInodeBitmapItems()
    : new Set<number>();
  const highlightedDataBitmapItems = showingAfter
    ? getHighlightedDataBitmapItems()
    : new Set<number>();
  const highlightedDataBlocks = showingAfter ? getHighlightedDataBlocks() : new Set<number>();
  const changedInodeAttributes = showingAfter
    ? getChangedInodeAttributes()
    : new Map<number, Set<string>>();

  if (!fileSystemBefore || !fileSystemAfter) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Header */}
      <section className="w-full max-w-7xl">
        <SectionHeading>Hard Links vs Soft Links Comparison</SectionHeading>
        <div className="text-muted-foreground mt-2 mb-6 space-y-3">
          <p>
            This visualization demonstrates the differences between creating hard links and soft
            links in a simplified file system with {fileSystemBefore.getTotalBlocks()} total blocks
            and {fileSystemBefore.getSuperBlock().s_inodes_count} inodes. The system uses a block
            size of {Math.pow(2, fileSystemBefore.getSuperBlock().s_log_block_size)} bytes and an
            inode size of {fileSystemBefore.getSuperBlock().s_inode_size} bytes. Use the toggles
            below to explore different scenarios and see which blocks change.
            <br />
            <br />
            The current scenario is the command:{" "}
            <span className="bg-muted rounded border px-1 font-mono font-medium">
              {`ln ${linkType === "soft" ? "-s " : ""}${linkScenario?.targetFile || "..."} ${
                linkScenario?.linkPath || "..."
              }`}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              const newScenario = generateRandomLinkScenario();
              setLinkScenario(newScenario);
              if (fileSystemBefore) {
                updateAfterFileSystem(fileSystemBefore, linkType, newScenario);
              }
            }}
          >
            New Scenario
          </Button>
          <Button
            variant={linkType === "hard" ? "default" : "outline"}
            onClick={() => setLinkType("hard")}
            className="w-24"
          >
            Hard Link
          </Button>
          <Button
            variant={linkType === "soft" ? "default" : "outline"}
            onClick={() => setLinkType("soft")}
            className="w-24"
          >
            Soft Link
          </Button>
          <div className="border-border bg-background hover:bg-accent/50 flex h-9 items-center space-x-2 rounded-md border px-4 py-1 shadow-xs transition-colors">
            <Switch id="show-after" checked={showingAfter} onCheckedChange={setShowingAfter} />
            <Label htmlFor="show-after" className="cursor-pointer font-medium">
              {showingAfter ? "After" : "Before"}
            </Label>
          </div>
        </div>
      </section>

      <section className="w-full max-w-7xl overflow-x-auto">
        <TooltipProvider>
          <div className="bg-muted/50 min-w-fit rounded-lg p-6">
            <SubsectionHeading className="flex items-center">
              Disk Layout{" "}
              {showingAfter && (
                <Badge className="mt-0.5 ml-4 border-orange-400 bg-orange-100 py-1 pt-[3px] text-orange-600">
                  Changes Highlighted
                </Badge>
              )}
            </SubsectionHeading>
            <div className="flex min-w-fit items-center justify-center gap-2 overflow-x-auto p-1">
              {currentFS && (
                <DiskLayout
                  fileSystem={currentFS}
                  selectedBlock={selectedBlock}
                  onBlockClick={handleBlockClick}
                  highlightedBlocks={changedBlocks}
                />
              )}
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
                key={`${selectedBlock}-${showingAfter ? "after" : "before"}`}
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
                {currentFS && (
                  <EnhancedBlockContentView
                    selectedBlock={selectedBlock}
                    fileSystem={currentFS}
                    selectedInode={selectedInode}
                    previousInode={null}
                    onInodeClick={handleInodeClick}
                    onCloseInodeInfo={() => setSelectedInode(null)}
                    onBlockClick={handleBlockClick}
                    onDirectoryRowClick={handleDirectoryRowClick}
                    highlightedInodes={highlightedInodes}
                    highlightedEntries={highlightedEntries}
                    highlightedInodeBitmapItems={highlightedInodeBitmapItems}
                    highlightedDataBitmapItems={highlightedDataBitmapItems}
                    highlightedDataBlocks={highlightedDataBlocks}
                    changedInodeAttributes={changedInodeAttributes}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  );
};

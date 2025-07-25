import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { FileSystem } from "./FileSystem";
import { SubsectionHeading } from "../paging/ui/SubsectionHeading";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DiskLayout } from "./ui/DiskLayout";
import { EnhancedBlockContentView } from "./ui/LinkBlockContentView";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { FILE_SYSTEM_CONFIG, generateRandomLinkScenario, type LinkScenario } from "./config";
import { LinkComparisonIntro } from "./ui/LinkComparisonIntro";
import { LinkComparisonQuiz } from "./ui/LinkComparisonQuiz";
import {
  createInitialFileSystem,
  getHighlightedInodes,
  getHighlightedEntries,
  getHighlightedInodeBitmapItems,
  getHighlightedDataBitmapItems,
  getHighlightedDataBlocks,
  getChangedInodeAttributes,
  getChangedBlocks,
} from "./ui/linkComparisonUtils";

export const LinkComparisonVisualizerNew: React.FC = () => {
  const [linkType, setLinkType] = useState<"hard" | "soft">("hard");
  const [fileSystemBefore, setFileSystemBefore] = useState<FileSystem | null>(null);
  const [fileSystemAfter, setFileSystemAfter] = useState<FileSystem | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [selectedInode, setSelectedInode] = useState<number | null>(null);
  const [showingAfter, setShowingAfter] = useState(false);
  const [linkScenario, setLinkScenario] = useState<LinkScenario | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [selectedChangedAttributes, setSelectedChangedAttributes] = useState<Set<string>>(
    new Set()
  );
  const [shuffledFiles, setShuffledFiles] = useState<Array<(typeof FILE_SYSTEM_CONFIG.files)[0]>>(
    []
  );
  const [reservedBlock, setReservedBlock] = useState<number>(-1);
  const [foundInodes, setFoundInodes] = useState<Set<number>>(new Set());

  const generateNewScenario = () => {
    const newShuffledFiles = [...FILE_SYSTEM_CONFIG.files].sort(() => Math.random() - 0.5);
    setShuffledFiles(newShuffledFiles);
    setReservedBlock(Math.floor(Math.random() * 10000));
    setLinkScenario(generateRandomLinkScenario());
  };

  // Initialize file systems
  useEffect(() => {
    generateNewScenario();
  }, []);

  // Update file systems when scenario changes
  useEffect(() => {
    if (shuffledFiles.length > 0 && reservedBlock > -1) {
      const fs = createInitialFileSystem(
        shuffledFiles,
        reservedBlock,
        FILE_SYSTEM_CONFIG.dataBlocks,
        FILE_SYSTEM_CONFIG.totalInodes,
        FILE_SYSTEM_CONFIG.blockSize,
        FILE_SYSTEM_CONFIG.inodeSize
      );
      setFileSystemBefore(fs);

      const afterFs = createInitialFileSystem(
        shuffledFiles,
        reservedBlock,
        FILE_SYSTEM_CONFIG.dataBlocks,
        FILE_SYSTEM_CONFIG.totalInodes,
        FILE_SYSTEM_CONFIG.blockSize,
        FILE_SYSTEM_CONFIG.inodeSize
      );
      if (linkScenario) {
        if (linkType === "hard") {
          afterFs.createHardLink(linkScenario.targetFile, linkScenario.linkPath, reservedBlock);
        } else {
          afterFs.createSymbolicLink(linkScenario.targetFile, linkScenario.linkPath, reservedBlock);
        }
      }
      setFileSystemAfter(afterFs);
      setFoundInodes(new Set());
      setSelectedChangedAttributes(new Set());
    }
  }, [shuffledFiles, reservedBlock, linkType, linkScenario]);

  // Reset selected inode when switching between before/after if it's no longer valid
  useEffect(() => {
    if (selectedInode !== null && selectedBlock !== null) {
      const effectiveFS = (testMode ? true : showingAfter) ? fileSystemAfter : fileSystemBefore;
      if (effectiveFS) {
        try {
          const inodeData = effectiveFS.getInodeBlockData(selectedBlock);
          const inode = inodeData.inodes.find((i) => i.number === selectedInode);
          // If the inode doesn't exist, isn't used, or doesn't have data, reset selection
          if (!inode || !inode.used || !inode.data) {
            setSelectedInode(null);
          }
        } catch {
          // If we can't get the inode data, reset selection
          setSelectedInode(null);
        }
      }
    }
  }, [showingAfter, selectedInode, selectedBlock, fileSystemBefore, fileSystemAfter, testMode]);

  const handleBlockClick = (blockIndex: number) => {
    setSelectedBlock(blockIndex);
    setSelectedInode(null);
  };

  const handleInodeClick = (inodeNumber: number, isUsed: boolean) => {
    if (isUsed) {
      setSelectedInode(inodeNumber);
      // Reset selected attributes when changing inodes in test mode
      if (testMode) {
        setSelectedChangedAttributes(new Set());
      }
    }
  };

  const handleDirectoryRowClick = (inodeNumber: number) => {
    const fs = (testMode ? true : showingAfter) ? fileSystemAfter : fileSystemBefore;
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

  const handleCheckAnswer = () => {
    if (selectedInode === null) return;

    const correctInodes = getHighlightedInodes(
      fileSystemBefore,
      fileSystemAfter,
      linkType,
      linkScenario
    );
    const correctAttributesMap = getChangedInodeAttributes(
      fileSystemBefore,
      fileSystemAfter,
      linkType,
      linkScenario
    );

    if (foundInodes.has(selectedInode)) {
      toast.info("You've already correctly identified this inode.");
      return;
    }

    if (!correctInodes.has(selectedInode)) {
      toast.error("Incorrect. This inode was not modified.");
      return;
    }

    const actualChanges = correctAttributesMap.get(selectedInode) || new Set();
    const attributesCorrect =
      actualChanges.size === selectedChangedAttributes.size &&
      [...actualChanges].every((attr) => selectedChangedAttributes.has(attr));

    if (attributesCorrect) {
      const newFoundInodes = new Set(foundInodes);
      newFoundInodes.add(selectedInode);
      setFoundInodes(newFoundInodes);

      if (newFoundInodes.size === correctInodes.size) {
        toast.success("Congratulations! You've found all changed inodes.");
      } else {
        toast.success("Correct! You found one. Keep going!");
      }
    } else {
      toast.error("Correct inode, but the selected attributes are incomplete and/or incorrect.");
    }
  };

  // In test mode, lock to "after" state and remove all highlighting
  const effectiveShowingAfter = testMode ? true : showingAfter;
  const currentFS = effectiveShowingAfter ? fileSystemAfter : fileSystemBefore;
  const changedBlocks =
    showingAfter && !testMode
      ? getChangedBlocks(fileSystemBefore, fileSystemAfter, linkType, linkScenario)
      : new Set<number>();
  const highlightedInodes =
    showingAfter && !testMode
      ? getHighlightedInodes(fileSystemBefore, fileSystemAfter, linkType, linkScenario)
      : new Set<number>();
  const highlightedEntries =
    showingAfter && !testMode
      ? getHighlightedEntries(fileSystemBefore, fileSystemAfter)
      : new Set<string>();
  const highlightedInodeBitmapItems =
    showingAfter && !testMode
      ? getHighlightedInodeBitmapItems(fileSystemBefore, fileSystemAfter, linkType)
      : new Set<number>();
  const highlightedDataBitmapItems =
    showingAfter && !testMode
      ? getHighlightedDataBitmapItems(fileSystemBefore, fileSystemAfter, linkType)
      : new Set<number>();
  const highlightedDataBlocks =
    showingAfter && !testMode
      ? getHighlightedDataBlocks(fileSystemBefore, fileSystemAfter, linkType)
      : new Set<number>();
  // Always calculate changed attributes for test mode quiz, but only show highlighting when not in test mode
  const changedInodeAttributes = effectiveShowingAfter
    ? getChangedInodeAttributes(fileSystemBefore, fileSystemAfter, linkType, linkScenario)
    : new Map<number, Set<string>>();
  const displayedChangedInodeAttributes = testMode
    ? new Map<number, Set<string>>()
    : changedInodeAttributes;

  if (!fileSystemBefore || !fileSystemAfter) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <LinkComparisonIntro
        fileSystem={fileSystemBefore}
        linkType={linkType}
        linkScenario={linkScenario}
        onLinkTypeChange={setLinkType}
        showingAfter={effectiveShowingAfter}
        onShowingAfterChange={testMode ? undefined : setShowingAfter}
        testMode={testMode}
        onTestModeChange={setTestMode}
        onNewScenario={generateNewScenario}
        disabled={testMode}
      />

      <section className="w-full max-w-7xl overflow-x-auto">
        <TooltipProvider>
          <div className="bg-muted/50 min-w-fit rounded-lg p-6">
            <SubsectionHeading className="flex items-center">
              Disk Layout{" "}
              {effectiveShowingAfter && !testMode && (
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

      <section
        className={`flex w-full max-w-7xl overflow-x-auto ${testMode ? "h-full flex-col items-stretch gap-10 lg:flex-row" : "h-full flex-col"}`}
      >
        {/* Block Content Card */}
        <div
          className={`bg-muted/50 flex h-full min-w-fit flex-col rounded-lg p-6 ${testMode ? "flex-[7] lg:flex-[7]" : "w-full"}`}
        >
          <SubsectionHeading>Block Content</SubsectionHeading>
          <div className="flex-grow overflow-x-hidden overflow-y-auto p-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`block-${selectedBlock}`}
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
                    changedInodeAttributes={displayedChangedInodeAttributes}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {testMode && (
          <LinkComparisonQuiz
            selectedInode={selectedInode}
            foundInodes={foundInodes}
            selectedChangedAttributes={selectedChangedAttributes}
            onSelectedChangedAttributesChange={setSelectedChangedAttributes}
            onCheckAnswer={handleCheckAnswer}
            highlightedInodesCount={
              getHighlightedInodes(fileSystemBefore, fileSystemAfter, linkType, linkScenario).size
            }
          />
        )}
      </section>
      <Toaster />
    </>
  );
};

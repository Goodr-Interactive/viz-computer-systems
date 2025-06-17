import React, { useState, type ReactElement, useReducer } from "react";
import { motion, AnimatePresence } from "motion/react";
import { type FileSystem, BlockType } from "./FileSystem";
import { MultiColorBinaryBlock } from "../paging/ui/BinaryBlock";
import { SubsectionHeading } from "../paging/ui/SubsectionHeading";
import { Button } from "@/components/ui/button";
import { Trash2, X, Folder, File } from "lucide-react";
import { FileSystemIntro } from "./FileSystemIntro";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
} from "@/components/ui/table";

interface FileSystemVisualizerProps {
  fileSystem: FileSystem;
}

const getBlockColors = (type: BlockType) => {
  switch (type) {
    case BlockType.SUPERBLOCK:
      return {
        color: "bg-blue-100",
        borderColor: "border-blue-300",
        hoverColor: "group-hover:bg-blue-200",
      };
    case BlockType.INODE_BITMAP:
      return {
        color: "bg-green-100",
        borderColor: "border-green-300",
        hoverColor: "group-hover:bg-green-200",
      };
    case BlockType.DATA_BITMAP:
      return {
        color: "bg-yellow-100",
        borderColor: "border-yellow-300",
        hoverColor: "group-hover:bg-yellow-200",
      };
    case BlockType.INODE:
      return {
        color: "bg-purple-100",
        borderColor: "border-purple-300",
        hoverColor: "group-hover:bg-purple-200",
      };
    case BlockType.DATA:
      return {
        color: "bg-gray-100",
        borderColor: "border-gray-300",
        hoverColor: "group-hover:bg-gray-200",
      };
  }
};

export const FileSystemVisualizer: React.FC<FileSystemVisualizerProps> = ({ fileSystem }) => {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [memoryBlocks, setMemoryBlocks] = useState<number[]>([]);
  const [selectedInode, setSelectedInode] = useState<number | null>(null);
  const [previousInode, setPreviousInode] = useState<number | null>(null);
  const [, setIsFirstSelection] = useState<boolean>(false);
  const [, setRevealedInodeEntry] = useState<string | null>(null);
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
    setRevealedInodeEntry(null);
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

  const renderDiskLayout = () => {
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

        rowBlocks.push(
          <div key={blockIndex} className="flex flex-col items-center">
            <div
              onClick={() => handleBlockClick(blockIndex)}
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

  const renderMemorySection = () => {
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
                Click on blocks in the disk layout to load them into memory
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
                      onClick={() => handleBlockClick(blockIndex)}
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

  const renderInodeBlockContent = (blockIndex: number) => {
    const inodeData = fileSystem.getInodeBlockData(blockIndex);
    const inodesPerRow = 8; // 8 inodes per row, 4 rows = 32 inodes
    const rows = [];

    for (let row = 0; row < 4; row++) {
      const rowInodes = [];
      for (let col = 0; col < inodesPerRow; col++) {
        const inodeIndex = row * inodesPerRow + col;
        if (inodeIndex >= inodeData.inodes.length) break;

        const inode = inodeData.inodes[inodeIndex];
        const colors = inode.used
          ? {
              color: "bg-green-100",
              borderColor: "border-green-300",
              hoverColor: "group-hover:bg-green-200",
            }
          : { color: "bg-gray-100", borderColor: "border-gray-300", hoverColor: "" };

        rowInodes.push(
          <div key={inode.number} className="flex flex-col items-center">
            <div
              onClick={() => handleInodeClick(inode.number, inode.used)}
              className={` ${inode.used ? "cursor-pointer" : "cursor-not-allowed"} ${selectedInode === inode.number ? "ring-2 ring-blue-500" : ""} `}
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
      <div className="flex w-full justify-center">
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
            <h4 className="pt-1 text-start font-medium">
              Inode Block {blockIndex} (Inodes {inodeData.inodes[0]?.number} -{" "}
              {inodeData.inodes[inodeData.inodes.length - 1]?.number})
            </h4>
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
          </motion.div>

          {/* Info Card */}
          <AnimatePresence mode="popLayout">
            {selectedInode !== null && (
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
                className="border-border w-48 flex-shrink-0 rounded-md border p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h5 className="font-medium">Inode {selectedInode}</h5>
                  <Button
                    onClick={() => setSelectedInode(null)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {(() => {
                  const inode = inodeData.inodes.find((i) => i.number === selectedInode);
                  if (!inode || !inode.data) return null;

                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Type:</span>
                        <span>{inode.data.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Size:</span>
                        <span>{inode.data.size} bytes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Mode:</span>
                        <span className="font-mono">{inode.data.mode}</span>
                      </div>
                      <div>
                        <div className="mb-2 font-medium">Block Pointers:</div>
                        {inode.data.blockPointers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {inode.data.blockPointers.map((pointer) => (
                              <Button
                                key={pointer}
                                variant="outline"
                                size="sm"
                                className="h-7 w-9 cursor-pointer rounded bg-transparent font-mono"
                                onClick={() => handleBlockClick(pointer)}
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

  const renderBitmapBlockContent = (_blockIndex: number, bitmapType: "inode" | "data") => {
    const bitmap =
      bitmapType === "inode" ? fileSystem.getInodeBitmap() : fileSystem.getDataBitmap();
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
          <h4 className="pt-2 text-start font-medium">
            {bitmapType === "inode" ? "Inode" : "Data"} Bitmap
          </h4>
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

  const renderSuperblockContent = (_blockIndex: number) => {
    return (
      <div className="flex w-full justify-center">
        <div className="flex flex-col gap-3 pt-2">
          <h4 className="text-start font-medium">Superblock</h4>
          {/* Info Card */}
          <div className="border-border w-96 flex-shrink-0 rounded-md border p-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Total Inodes:</span>
                <span>{fileSystem.getSuperBlock().s_inodes_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Blocks:</span>
                <span>{fileSystem.getSuperBlock().s_blocks_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">First Data Block:</span>
                <span>{fileSystem.getSuperBlock().s_first_data_block}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Block Size:</span>
                <span>{Math.pow(2, fileSystem.getSuperBlock().s_log_block_size)} B</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Inode Size:</span>
                <span>{fileSystem.getSuperBlock().s_inode_size} B</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Root Inode:</span>
                <span>{fileSystem.getSuperBlock().s_root_inode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDirectoryDataBlockContent = (blockIndex: number) => {
    const entries = fileSystem.getDirectoryEntriesFromBlock(blockIndex);

    return (
      <div className="flex w-full justify-center">
        <div className="flex flex-col p-1">
          <div className="flex gap-8 pt-1">
            {/* Left half - Tree view */}
            <div className="flex flex-col gap-2">
              <h4 className="hidden pb-1 text-start font-medium lg:block">
                Directory Entries (Block {blockIndex})
              </h4>
              <h4 className="block pb-1 text-start font-medium lg:hidden">Entries</h4>
              {entries.length > 0 ? (
                entries.map((entry) => {
                  const isDirectory = fileSystem.isDirectory(entry.inode);
                  const icon = isDirectory ? (
                    <Folder size={16} className="text-blue-400" />
                  ) : (
                    <File size={16} className="text-orange-400" />
                  );

                  return (
                    <div
                      key={entry.name}
                      className={`flex h-8 items-center gap-2.5 border px-2 py-1 text-sm transition-colors ${
                        isDirectory
                          ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
                          : "border-orange-200 bg-orange-50 hover:bg-orange-100"
                      }`}
                    >
                      {icon}
                      <span className="truncate font-mono font-medium" title={entry.name}>
                        {entry.name}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-muted-foreground">Directory is empty.</div>
              )}
            </div>

            {/* Right half - Table */}
            <div className="-mt-2.5 border">
              <Table>
                <TableHeader>
                  <TableRow className="h-[41px]">
                    <TableHead className="h-8 w-32 pl-3 text-base">Name</TableHead>
                    <TableHead className="h-8 w-[72px] border-l pl-3 text-base">Inode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length > 0 ? (
                    entries.map((entry) => (
                      <TableRow
                        key={entry.name}
                        className="h-10 cursor-pointer"
                        onClick={() => handleDirectoryRowClick(entry.inode)}
                      >
                        <TableCell className="h-8 w-32 py-1 pl-3.5">{entry.name}</TableCell>
                        <TableCell className="h-8 w-[72px] border-l py-1 pl-3.5 font-mono">
                          {entry.inode}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="h-8">
                      <TableCell colSpan={2} className="text-muted-foreground h-8 py-1 text-center">
                        No entries
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBlockContent = () => {
    if (selectedBlock === null) {
      return (
        <div className="text-muted-foreground flex min-h-[60px] justify-center pt-2">
          Click on a block in the disk layout to view its contents
        </div>
      );
    }

    const content = fileSystem.getBlockContent(selectedBlock);

    if (content.startsWith("SUPERBLOCK:")) {
      return renderSuperblockContent(selectedBlock);
    }

    if (content.startsWith("INODE_BLOCK:")) {
      return renderInodeBlockContent(selectedBlock);
    }

    if (content.startsWith("INODE_BITMAP:")) {
      return renderBitmapBlockContent(selectedBlock, "inode");
    }

    if (content.startsWith("DATA_BITMAP:")) {
      return renderBitmapBlockContent(selectedBlock, "data");
    }

    if (content.startsWith("DIRECTORY_DATA_BLOCK:")) {
      return renderDirectoryDataBlockContent(selectedBlock);
    }

    // Regular block content display (for file data blocks)
    return (
      <div className="flex w-full justify-center">
        <div className="flex w-96 flex-col gap-3">
          <h4 className="pt-2 text-start font-medium">Block Content (Block {selectedBlock})</h4>
          <div className="border-border rounded-md border p-4 font-mono text-sm whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <FileSystemIntro fileSystem={fileSystem} onUpload={forceUpdate} />
      <section className="w-full max-w-7xl overflow-x-auto">
        <div className="bg-muted/50 min-w-fit rounded-lg p-6">
          <SubsectionHeading>Disk Layout</SubsectionHeading>
          <div className="flex min-w-fit items-center justify-center gap-2 overflow-x-auto p-1">
            {renderDiskLayout()}
          </div>
        </div>
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
                {renderMemorySection()}
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
                  {renderBlockContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

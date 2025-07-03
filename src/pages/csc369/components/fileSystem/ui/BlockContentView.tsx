import React from "react";
import type { FileSystem } from "../FileSystem";
import { SuperblockView } from "./SuperblockView";
import { InodeBlockView } from "./InodeBlockView";
import { BitmapView } from "./BitmapView";
import { DirectoryDataView } from "./DirectoryDataView";
import { DataBlockView } from "./DataBlockView";

interface BlockContentViewProps {
  selectedBlock: number | null;
  fileSystem: FileSystem;
  selectedInode: number | null;
  previousInode: number | null;
  onInodeClick: (inodeNumber: number, isUsed: boolean) => void;
  onCloseInodeInfo: () => void;
  onBlockClick: (blockIndex: number) => void;
  onDirectoryRowClick: (inodeNumber: number) => void;
}

export const BlockContentView: React.FC<BlockContentViewProps> = (props) => {
  const { selectedBlock, fileSystem } = props;

  if (selectedBlock === null) {
    return (
      <div className="text-muted-foreground flex min-h-[60px] justify-center pt-2">
        Click on a block in the disk layout to view its contents
      </div>
    );
  }

  const content = fileSystem.getBlockContent(selectedBlock);

  if (content.startsWith("SUPERBLOCK:")) {
    return <SuperblockView fileSystem={fileSystem} />;
  }

  if (content.startsWith("INODE_BLOCK:")) {
    return <InodeBlockView blockIndex={selectedBlock} {...props} />;
  }

  if (content.startsWith("INODE_BITMAP:")) {
    return (
      <BitmapView
        fileSystem={fileSystem}
        bitmapType="inode"
        onBlockClick={props.onBlockClick}
        onInodeClick={props.onInodeClick}
      />
    );
  }

  if (content.startsWith("DATA_BITMAP:")) {
    return (
      <BitmapView fileSystem={fileSystem} bitmapType="data" onBlockClick={props.onBlockClick} />
    );
  }

  if (content.startsWith("DIRECTORY_DATA_BLOCK:")) {
    return <DirectoryDataView blockIndex={selectedBlock} {...props} />;
  }

  // Regular block content display (for file data blocks)
  return <DataBlockView blockIndex={selectedBlock} content={content} />;
};

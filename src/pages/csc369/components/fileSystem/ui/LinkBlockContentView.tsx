import React from "react";
import type { FileSystem } from "../FileSystem";
import { SuperblockView } from "./SuperblockView";
import { EnhancedInodeBlockView } from "./LinkInodeBlockView";
import { EnhancedBitmapView } from "./LinkBitmapView";
import { EnhancedDirectoryDataView } from "./LinkDirectoryDataView";
import { EnhancedDataBlockView } from "./LinkDataBlockView";

interface EnhancedBlockContentViewProps {
  selectedBlock: number | null;
  fileSystem: FileSystem;
  selectedInode: number | null;
  previousInode: number | null;
  onInodeClick: (inodeNumber: number, isUsed: boolean) => void;
  onCloseInodeInfo: () => void;
  onBlockClick: (blockIndex: number) => void;
  onDirectoryRowClick: (inodeNumber: number) => void;
  highlightedInodes?: Set<number>;
  highlightedEntries?: Set<string>;
  highlightedInodeBitmapItems?: Set<number>;
  highlightedDataBitmapItems?: Set<number>;
  changedInodeAttributes?: Map<number, Set<string>>;
  highlightedDataBlocks?: Set<number>;
}

export const EnhancedBlockContentView: React.FC<EnhancedBlockContentViewProps> = (props) => {
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
    return (
      <EnhancedInodeBlockView
        blockIndex={selectedBlock}
        {...props}
        highlightedInodes={props.highlightedInodes}
        changedInodeAttributes={props.changedInodeAttributes}
      />
    );
  }

  if (content.startsWith("INODE_BITMAP:")) {
    return (
      <EnhancedBitmapView
        fileSystem={fileSystem}
        bitmapType="inode"
        onBlockClick={props.onBlockClick}
        onInodeClick={props.onInodeClick}
        highlightedItems={props.highlightedInodeBitmapItems}
      />
    );
  }

  if (content.startsWith("DATA_BITMAP:")) {
    return (
      <EnhancedBitmapView
        fileSystem={fileSystem}
        bitmapType="data"
        onBlockClick={props.onBlockClick}
        highlightedItems={props.highlightedDataBitmapItems}
      />
    );
  }

  if (content.startsWith("DIRECTORY_DATA_BLOCK:")) {
    return (
      <EnhancedDirectoryDataView
        blockIndex={selectedBlock}
        {...props}
        highlightedEntries={props.highlightedEntries}
      />
    );
  }

  // Regular block content display (for file data blocks)
  const isHighlighted = props.highlightedDataBlocks?.has(selectedBlock) || false;
  return (
    <EnhancedDataBlockView
      blockIndex={selectedBlock}
      content={content}
      isHighlighted={isHighlighted}
    />
  );
};

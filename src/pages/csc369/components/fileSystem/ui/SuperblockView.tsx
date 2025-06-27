import React from "react";
import type { FileSystem } from "../FileSystem";
import { InfoTooltip } from "../InfoTooltip";
import { TitleWithTooltip } from "../TitleWithTooltip";

interface SuperblockViewProps {
  fileSystem: FileSystem;
}

export const SuperblockView: React.FC<SuperblockViewProps> = ({ fileSystem }) => {
  return (
    <div className="flex w-full justify-center">
      <div className="flex flex-col gap-3 pt-2">
        <TitleWithTooltip
          title="Superblock"
          tooltipText="The superblock contains critical information about the file system, like its size, the number of blocks, and the location of key data structures."
          className="text-start font-medium"
        />
        {/* Info Card */}
        <div className="border-border w-96 flex-shrink-0 rounded-md border p-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <InfoTooltip
              label="Total Inodes"
              value={fileSystem.getSuperBlock().s_inodes_count}
              tooltipText="The total number of inodes available in the file system."
            />
            <InfoTooltip
              label="Total Blocks"
              value={fileSystem.getSuperBlock().s_blocks_count}
              tooltipText="The total number of blocks in the file system."
            />
            <InfoTooltip
              label="First Data Block"
              value={fileSystem.getSuperBlock().s_first_data_block}
              tooltipText="The index of the first block that can be used for storing file data."
            />
            <InfoTooltip
              label="Block Size"
              value={`${Math.pow(2, fileSystem.getSuperBlock().s_log_block_size)} B`}
              tooltipText="The size of each block in bytes."
            />
            <InfoTooltip
              label="Inode Size"
              value={`${fileSystem.getSuperBlock().s_inode_size} B`}
              tooltipText="The size of each inode structure in bytes."
            />
            <InfoTooltip
              label="Root Inode"
              value={fileSystem.getSuperBlock().s_root_inode}
              tooltipText="The inode number of the root directory."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

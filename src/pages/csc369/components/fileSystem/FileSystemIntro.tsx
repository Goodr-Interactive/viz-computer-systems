import React, { useState } from "react";
import type { FileSystem } from "./FileSystem";
import { SectionHeading } from "../paging/ui/SectionHeading";
import { FILE_SYSTEM_CONFIG } from "./config";
import { Button } from "@/components/ui/button";

interface FileSystemIntroProps {
  fileSystem: FileSystem;
}

export const FileSystemIntro: React.FC<FileSystemIntroProps> = ({ fileSystem }) => {
  const superBlock = fileSystem.getSuperBlock();
  const totalBlocks = fileSystem.getTotalBlocks();
  const blockSize = Math.pow(2, superBlock.s_log_block_size);
  const [randomPath, setRandomPath] = useState(
    FILE_SYSTEM_CONFIG.files[Math.floor(Math.random() * FILE_SYSTEM_CONFIG.files.length)].path
  );

  return (
    <section className="w-full max-w-7xl">
      <SectionHeading>File System Simulation</SectionHeading>
      <div className="text-muted-foreground mt-2 mb-6 space-y-3">
        <p>
          This visualization demonstrates a simplified file system with {totalBlocks} total blocks
          and {superBlock.s_inodes_count} inodes. The system uses a block size of {blockSize} bytes
          and an inode size of {superBlock.s_inode_size} bytes. The disk is organized into a
          superblock, bitmaps for inodes and data, inode tables, and data blocks. This simulation
          uses only direct pointers for simplicity. <br />
          <br />
          Click on blocks in the <span className="font-semibold">Disk Layout</span> to view their
          contents below. Try to determine the data block of the file{" "}
          <span className="bg-muted rounded border px-1 font-mono font-medium">{randomPath}</span>
        </p>
      </div>
      <Button
        onClick={() => {
          const randomFile =
            FILE_SYSTEM_CONFIG.files[Math.floor(Math.random() * FILE_SYSTEM_CONFIG.files.length)];
          setRandomPath(randomFile.path);
        }}
        variant="outline"
      >
        Get New File
      </Button>
    </section>
  );
};

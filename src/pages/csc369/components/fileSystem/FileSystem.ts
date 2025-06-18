import { faker } from "@faker-js/faker";

// Constants
const DEFAULT_BLOCK_SIZE = 4096; // 4KB
const DEFAULT_INODE_SIZE = 128; // 128 bytes
const MAGIC_SIGNATURE = 0x1234;
const POINTERS_PER_INODE = 15;
const DIRECT_POINTERS = 12; // Only using direct pointers for now

// File mode constants
const S_IFMT = 0o170000; // File type mask
const S_IFDIR = 0o040000; // Directory
const S_IFREG = 0o100000; // Regular file
const S_IRWXU = 0o700; // User permissions
const S_IRWXG = 0o070; // Group permissions
const S_IRWXO = 0o007; // Others permissions
const S_IRUSR = 0o400; // User read
const S_IWUSR = 0o200; // User write
const S_IRGRP = 0o040; // Group read
const S_IROTH = 0o004; // Others read

// Block types for visualization
export const BlockType = {
  SUPERBLOCK: "SB",
  INODE_BITMAP: "IB",
  DATA_BITMAP: "DB",
  INODE: "I",
  DATA: "D",
} as const;

export type BlockType = (typeof BlockType)[keyof typeof BlockType];

// Types
interface SuperBlock {
  s_inodes_count: number;
  s_blocks_count: number;
  s_first_data_block: number;
  s_log_block_size: number;
  s_magic: number;
  s_inode_size: number;
  s_root_inode: number; // Root directory inode number
}

interface Inode {
  i_mode: number;
  i_uid: number;
  i_size: number;
  i_block_pointers: number[]; // Array of block numbers
}

interface DirectoryEntry {
  inode: number;
  name: string;
}

interface BlockInfo {
  type: BlockType;
  index: number;
  inodeNumber?: number; // For inode blocks
  isDirectory?: boolean; // For inode blocks
  fileName?: string; // For inode blocks
}

interface InodeData {
  type: "File" | "Directory";
  size: number;
  mode: string;
  blockPointers: number[];
}

export class FileSystem {
  private superBlock: SuperBlock;
  private inodeBitmap: boolean[];
  private dataBitmap: boolean[];
  private inodes: Inode[];
  private dataBlocks: Uint8Array[];
  private blockSize: number;
  private inodeSize: number;

  constructor(
    numDataBlocks: number,
    numInodes: number,
    blockSize: number = DEFAULT_BLOCK_SIZE,
    inodeSize: number = DEFAULT_INODE_SIZE
  ) {
    this.blockSize = blockSize;
    this.inodeSize = inodeSize;

    // Calculate number of blocks needed for inodes
    const inodesPerBlock = blockSize / inodeSize;
    const inodeBlocks = Math.ceil(numInodes / inodesPerBlock);
    const firstDataBlock = 1 + 1 + 1 + inodeBlocks; // Superblock, Inode bitmap, Data bitmap, Inode blocks
    const totalBlocks = numDataBlocks;

    // Initialize superblock
    this.superBlock = {
      s_inodes_count: numInodes,
      s_blocks_count: totalBlocks,
      s_first_data_block: firstDataBlock,
      s_log_block_size: Math.log2(blockSize),
      s_magic: MAGIC_SIGNATURE,
      s_inode_size: inodeSize,
      s_root_inode: 0, // Root directory is always inode 0
    };

    // Initialize bitmaps
    this.inodeBitmap = new Array(numInodes).fill(false);
    this.dataBitmap = new Array(totalBlocks).fill(false);

    // Mark metadata blocks as used
    for (let i = 0; i < firstDataBlock; i++) {
      this.dataBitmap[i] = true;
    }

    // Initialize inodes array
    this.inodes = new Array(numInodes).fill(null).map(() => ({
      i_mode: 0,
      i_uid: 0,
      i_size: 0,
      i_block_pointers: new Array(POINTERS_PER_INODE).fill(-1),
    }));

    // Initialize data blocks
    this.dataBlocks = new Array(numDataBlocks).fill(null).map(() => new Uint8Array(blockSize));

    // Initialize root directory
    this.initializeRootDirectory();
  }

  private initializeRootDirectory(): void {
    // Mark root inode as used
    this.inodeBitmap[0] = true;

    // Allocate first data block for root directory
    const rootBlock = this.allocateDataBlock();
    if (rootBlock === -1) {
      throw new Error("Failed to allocate block for root directory");
    }

    // Set up root directory inode
    this.inodes[0].i_mode = S_IFDIR | S_IRWXU | S_IRWXG | S_IRWXO; // Directory with full permissions
    this.inodes[0].i_uid = 0;
    this.inodes[0].i_size = 0;
    this.inodes[0].i_block_pointers[0] = rootBlock;

    // Add . and .. entries for root directory (both point to inode 0)
    this.addDefaultDirectoryEntries(0, 0);
  }

  private addDefaultDirectoryEntries(dirInode: number, parentInode: number): void {
    // Add . entry (points to current directory)
    this.addDirectoryEntry(dirInode, ".", dirInode);

    // Add .. entry (points to parent directory)
    this.addDirectoryEntry(dirInode, "..", parentInode);
  }

  private allocateDataBlock(): number {
    for (let i = this.superBlock.s_first_data_block; i < this.superBlock.s_blocks_count; i++) {
      if (!this.dataBitmap[i]) {
        this.dataBitmap[i] = true;
        return i;
      }
    }
    return -1; // No free blocks
  }

  private allocateInode(): number {
    for (let i = 0; i < this.inodeBitmap.length; i++) {
      if (!this.inodeBitmap[i]) {
        this.inodeBitmap[i] = true;
        return i;
      }
    }
    return -1; // No free inodes
  }

  private findDirectoryEntry(
    inode: number,
    name: string
  ): { blockIndex: number; entryIndex: number; inode: number } | null {
    const inodeObj = this.inodes[inode];

    // First check if this is actually a directory
    if (!this.isDirectory(inode)) {
      return null;
    }

    // Check each block pointer up to DIRECT_POINTERS
    for (let i = 0; i < DIRECT_POINTERS; i++) {
      const blockNum = inodeObj.i_block_pointers[i];
      if (blockNum === -1) continue;

      const relativeBlockNum = blockNum - this.superBlock.s_first_data_block;
      const block = this.dataBlocks[relativeBlockNum];
      const entries = this.readDirectoryEntries(block);

      for (let j = 0; j < entries.length; j++) {
        if (entries[j].name === name) {
          return { blockIndex: i, entryIndex: j, inode: entries[j].inode };
        }
      }
    }

    // TODO: Implement indirect pointers
    return null;
  }

  private readDirectoryEntries(block: Uint8Array): DirectoryEntry[] {
    const entries: DirectoryEntry[] = [];
    const entrySize = 256; // 4 bytes for inode + 252 bytes for name
    const maxEntries = Math.floor(this.blockSize / entrySize);

    for (let i = 0; i < maxEntries; i++) {
      const offset = i * entrySize;
      const inode = new DataView(block.buffer).getUint32(offset, true);

      const nameBytes = block.slice(offset + 4, offset + 256);
      const name = new TextDecoder().decode(nameBytes).replace(/\0/g, "");

      // Only add entries that have a non-empty name
      if (name) {
        entries.push({ inode, name });
      }
    }
    return entries;
  }

  private addDirectoryEntry(inode: number, name: string, targetInode: number): boolean {
    const inodeObj = this.inodes[inode];

    if (!this.isDirectory(inode)) {
      return false;
    }

    // First try to find a block with space
    for (let i = 0; i < DIRECT_POINTERS; i++) {
      const blockNum = inodeObj.i_block_pointers[i];
      if (blockNum === -1) {
        // No block allocated yet, allocate a new one
        const newBlock = this.allocateDataBlock();
        if (newBlock === -1) return false;

        inodeObj.i_block_pointers[i] = newBlock;
        const relativeNewBlockNum = newBlock - this.superBlock.s_first_data_block;
        const block = this.dataBlocks[relativeNewBlockNum];

        // Write the entry at the start of the new block
        new DataView(block.buffer).setUint32(0, targetInode, true);
        const nameBytes = new TextEncoder().encode(name.padEnd(252, "\0"));
        block.set(nameBytes, 4);

        // Update directory size
        let allocatedBlocks = 0;
        for (let j = 0; j < DIRECT_POINTERS; j++) {
          if (inodeObj.i_block_pointers[j] !== -1) {
            allocatedBlocks++;
          }
        }
        inodeObj.i_size = allocatedBlocks * this.blockSize;
        return true;
      }

      const relativeBlockNum = blockNum - this.superBlock.s_first_data_block;
      const block = this.dataBlocks[relativeBlockNum];
      const entries = this.readDirectoryEntries(block);

      if (entries.length < Math.floor(this.blockSize / 256)) {
        // Space in this block
        const offset = entries.length * 256;
        new DataView(block.buffer).setUint32(offset, targetInode, true);
        const nameBytes = new TextEncoder().encode(name.padEnd(252, "\0"));
        block.set(nameBytes, offset + 4);

        // Directory size should be based on allocated blocks, not entries
        let allocatedBlocks = 0;
        for (let j = 0; j < DIRECT_POINTERS; j++) {
          if (inodeObj.i_block_pointers[j] !== -1) {
            allocatedBlocks++;
          }
        }
        inodeObj.i_size = allocatedBlocks * this.blockSize;
        return true;
      }
    }

    return false; // No space in any block
  }

  // Method overloads
  public createFile(path: string, size: number): boolean;
  public createFile(path: string, contentType: "text" | "base64", content: string): boolean;
  public createFile(
    path: string,
    sizeOrContentType: number | "text" | "base64",
    content?: string
  ): boolean {
    // Handle the content overload
    if (typeof sizeOrContentType === "string" && content !== undefined) {
      return this.createFileWithContent(path, sizeOrContentType, content);
    }

    // Handle the original size-based overload
    if (typeof sizeOrContentType === "number") {
      return this.createFileWithSize(path, sizeOrContentType);
    }

    return false;
  }

  private createFileWithSize(path: string, size: number): boolean {
    const components = path.split("/").filter((c) => c !== "");
    if (components.length === 0) return false;

    let currentInode = this.superBlock.s_root_inode;

    // Navigate through directories
    for (let i = 0; i < components.length - 1; i++) {
      const dirName = components[i];
      const entry = this.findDirectoryEntry(currentInode, dirName);

      if (!entry) {
        // Directory doesn't exist, create it
        const newInode = this.allocateInode();
        if (newInode === -1) return false;

        // Set up directory inode
        this.inodes[newInode].i_mode = S_IFDIR | S_IRWXU | S_IRWXG | S_IRWXO;
        this.inodes[newInode].i_uid = 0;
        this.inodes[newInode].i_size = 0; // Start with size 0

        if (!this.addDirectoryEntry(currentInode, dirName, newInode)) {
          this.inodeBitmap[newInode] = false; // Free the inode
          return false;
        }

        // Add . and .. entries for the new directory
        this.addDefaultDirectoryEntries(newInode, currentInode);

        currentInode = newInode;
      } else {
        currentInode = entry.inode;
      }
    }

    // Create the file
    const fileName = components[components.length - 1];
    const fileInode = this.allocateInode();
    if (fileInode === -1) return false;

    // Calculate number of blocks needed (size parameter is already in blocks)
    const blocksNeeded = size;
    if (blocksNeeded > DIRECT_POINTERS) return false; // File too large

    // Allocate blocks for the file
    for (let i = 0; i < blocksNeeded; i++) {
      const block = this.allocateDataBlock();
      if (block === -1) {
        // Cleanup allocated blocks
        for (let j = 0; j < i; j++) {
          const blockToFree = this.inodes[fileInode].i_block_pointers[j];
          const relativeBlockToFree = blockToFree - this.superBlock.s_first_data_block;
          this.dataBitmap[relativeBlockToFree] = false;
        }
        this.inodeBitmap[fileInode] = false;
        return false;
      }
      this.inodes[fileInode].i_block_pointers[i] = block;
    }

    // Set up file inode - size should be in BYTES
    this.inodes[fileInode].i_mode = S_IFREG | S_IRUSR | S_IWUSR | S_IRGRP | S_IROTH; // Regular file with rw-r--r--
    this.inodes[fileInode].i_uid = 0;
    this.inodes[fileInode].i_size = blocksNeeded * this.blockSize; // Convert blocks to bytes

    // Add directory entry
    return this.addDirectoryEntry(currentInode, fileName, fileInode);
  }

  // Private method for creating files with content (limited to 1 block = 4KB max)
  private createFileWithContent(
    path: string,
    contentType: "text" | "base64",
    content: string
  ): boolean {
    // Validate content size - must fit in 1 block (4KB)
    let contentBytes: Uint8Array;
    let metadataBytes: Uint8Array;

    try {
      if (contentType === "text") {
        contentBytes = new TextEncoder().encode(content);
        // Store metadata: 1 byte for type (0 = text), then content
        metadataBytes = new Uint8Array(1 + contentBytes.length);
        metadataBytes[0] = 0; // 0 = text
        metadataBytes.set(contentBytes, 1);
      } else if (contentType === "base64") {
        // For base64, store the original base64 string as text with metadata
        const base64Bytes = new TextEncoder().encode(content);
        // Store metadata: 1 byte for type (1 = base64), then base64 string
        metadataBytes = new Uint8Array(1 + base64Bytes.length);
        metadataBytes[0] = 1; // 1 = base64
        metadataBytes.set(base64Bytes, 1);
      } else {
        return false; // Invalid content type
      }
    } catch {
      return false; // Invalid base64 or encoding error
    }

    if (metadataBytes.length > this.blockSize) {
      return false; // Content too large for 1 block
    }

    const components = path.split("/").filter((c) => c !== "");
    if (components.length === 0) return false;

    let currentInode = this.superBlock.s_root_inode;

    // Navigate through directories (same as original method)
    for (let i = 0; i < components.length - 1; i++) {
      const dirName = components[i];
      const entry = this.findDirectoryEntry(currentInode, dirName);

      if (!entry) {
        // Directory doesn't exist, create it
        const newInode = this.allocateInode();
        if (newInode === -1) return false;

        // Set up directory inode
        this.inodes[newInode].i_mode = S_IFDIR | S_IRWXU | S_IRWXG | S_IRWXO;
        this.inodes[newInode].i_uid = 0;
        this.inodes[newInode].i_size = 0;

        if (!this.addDirectoryEntry(currentInode, dirName, newInode)) {
          this.inodeBitmap[newInode] = false;
          return false;
        }

        this.addDefaultDirectoryEntries(newInode, currentInode);
        currentInode = newInode;
      } else {
        currentInode = entry.inode;
      }
    }

    // Create the file
    const fileName = components[components.length - 1];
    const fileInode = this.allocateInode();
    if (fileInode === -1) return false;

    // Allocate exactly 1 data block
    const dataBlock = this.allocateDataBlock();
    if (dataBlock === -1) {
      this.inodeBitmap[fileInode] = false;
      return false;
    }

    // Write content to the data block
    const relativeBlockNum = dataBlock - this.superBlock.s_first_data_block;
    const block = this.dataBlocks[relativeBlockNum];

    // Clear the block first
    block.fill(0);

    // Copy content with metadata to the block
    block.set(metadataBytes, 0);

    // Set up file inode
    this.inodes[fileInode].i_mode = S_IFREG | S_IRUSR | S_IWUSR | S_IRGRP | S_IROTH;
    this.inodes[fileInode].i_uid = 0;
    this.inodes[fileInode].i_size = metadataBytes.length; // Actual content size in bytes
    this.inodes[fileInode].i_block_pointers[0] = dataBlock;

    // Add directory entry
    return this.addDirectoryEntry(currentInode, fileName, fileInode);
  }

  // Helper method to check if an inode is a directory
  public isDirectory(inode: number): boolean {
    return (this.inodes[inode].i_mode & S_IFMT) === S_IFDIR;
  }

  // Helper method to check if an inode is a regular file
  public isRegularFile(inode: number): boolean {
    return (this.inodes[inode].i_mode & S_IFMT) === S_IFREG;
  }

  // Visualization helpers
  public getBlockInfo(blockIndex: number): BlockInfo {
    // Superblock is always block 0
    if (blockIndex === 0) {
      return { type: BlockType.SUPERBLOCK, index: blockIndex };
    }

    // Inode bitmap is block 1
    if (blockIndex === 1) {
      return { type: BlockType.INODE_BITMAP, index: blockIndex };
    }

    // Data bitmap is block 2
    if (blockIndex === 2) {
      return { type: BlockType.DATA_BITMAP, index: blockIndex };
    }

    // Calculate inode blocks
    const inodeBlocks = Math.ceil(
      (this.superBlock.s_inodes_count * this.inodeSize) / this.blockSize
    );
    if (blockIndex >= 3 && blockIndex < 3 + inodeBlocks) {
      const inodeIndex = Math.floor((blockIndex - 3) * (this.blockSize / this.inodeSize));
      const inode = this.inodes[inodeIndex];
      if (inode) {
        return {
          type: BlockType.INODE,
          index: blockIndex,
          inodeNumber: inodeIndex,
          isDirectory: this.isDirectory(inodeIndex),
          fileName: this.getInodeFileName(inodeIndex),
        };
      }
    }

    // Remaining blocks are data blocks
    return { type: BlockType.DATA, index: blockIndex };
  }

  private getInodeFileName(inodeNumber: number): string | undefined {
    // Root directory is always inode 0
    if (inodeNumber === this.superBlock.s_root_inode) {
      return "/";
    }

    // Search through all directory blocks to find the filename
    for (let i = 0; i < this.superBlock.s_inodes_count; i++) {
      if (!this.isDirectory(i)) continue;

      const inode = this.inodes[i];
      for (let j = 0; j < DIRECT_POINTERS; j++) {
        const blockNum = inode.i_block_pointers[j];
        if (blockNum === -1) continue;

        const relativeBlockNum = blockNum - this.superBlock.s_first_data_block;
        const block = this.dataBlocks[relativeBlockNum];
        const entries = this.readDirectoryEntries(block);
        const entry = entries.find((e) => e.inode === inodeNumber);
        if (entry) {
          return entry.name;
        }
      }
    }
    return undefined;
  }

  public getBlockContent(blockIndex: number): string {
    const blockInfo = this.getBlockInfo(blockIndex);

    switch (blockInfo.type) {
      case BlockType.SUPERBLOCK:
        // Return special indicator for superblock to trigger custom display
        return `SUPERBLOCK:${blockIndex}`;

      case BlockType.INODE_BITMAP:
        return `INODE_BITMAP:${blockIndex}`;

      case BlockType.DATA_BITMAP:
        return `DATA_BITMAP:${blockIndex}`;

      case BlockType.INODE:
        // Return special indicator for inode blocks to trigger custom display
        return `INODE_BLOCK:${blockIndex}`;

      case BlockType.DATA:
        // Check if this is a directory data block
        for (let i = 0; i < this.superBlock.s_inodes_count; i++) {
          if (!this.isDirectory(i)) continue;

          const inode = this.inodes[i];
          for (let j = 0; j < DIRECT_POINTERS; j++) {
            if (inode.i_block_pointers[j] === blockIndex) {
              return `DIRECTORY_DATA_BLOCK:${blockIndex}`;
            }
          }
        }

        // Check if this is a file data block and get its content
        const fileContent = this.getFileContentFromBlock(blockIndex);
        if (fileContent !== null) {
          return fileContent;
        }

        // Regular data block (assumed to be file content)
        return "null";
    }
  }

  // New method to get inode block data for custom display
  public getInodeBlockData(blockIndex: number): {
    inodes: Array<{ number: number; used: boolean; data?: InodeData }>;
  } {
    const inodesPerBlock = this.blockSize / this.inodeSize;
    const firstInode = (blockIndex - 3) * inodesPerBlock;

    const inodeInfo = [];
    for (let i = 0; i < inodesPerBlock; i++) {
      const inodeNumber = firstInode + i;
      if (inodeNumber < this.superBlock.s_inodes_count) {
        const isUsed = this.inodeBitmap[inodeNumber];
        let inodeData: InodeData | undefined;

        if (isUsed) {
          const inode = this.inodes[inodeNumber];
          inodeData = {
            type: this.isDirectory(inodeNumber) ? "Directory" : "File",
            size: inode.i_size,
            mode: inode.i_mode.toString(8),
            blockPointers: inode.i_block_pointers.filter((p) => p !== -1),
          };
        }

        inodeInfo.push({
          number: inodeNumber,
          used: isUsed,
          data: inodeData,
        });
      }
    }

    return { inodes: inodeInfo };
  }

  public getTotalBlocks(): number {
    return this.superBlock.s_blocks_count;
  }

  public getInodeBitmap(): boolean[] {
    return this.inodeBitmap;
  }

  public getDataBitmap(): boolean[] {
    return this.dataBitmap;
  }

  public getDirectoryEntriesFromBlock(blockIndex: number): DirectoryEntry[] {
    const relativeBlockNum = blockIndex - this.superBlock.s_first_data_block;
    const block = this.dataBlocks[relativeBlockNum];
    return this.readDirectoryEntries(block);
  }

  public getOwnerInode(blockIndex: number): number | null {
    if (blockIndex < this.superBlock.s_first_data_block) {
      return null; // Not a data block
    }
    for (let i = 0; i < this.inodes.length; i++) {
      if (this.inodeBitmap[i]) {
        const inode = this.inodes[i];
        if (inode.i_block_pointers.includes(blockIndex)) {
          return i;
        }
      }
    }
    return null;
  }

  public getSuperBlock() {
    return this.superBlock;
  }

  private getFileContentFromBlock(blockIndex: number): string | null {
    // Find which file uses this block
    for (let i = 0; i < this.superBlock.s_inodes_count; i++) {
      if (!this.inodeBitmap[i] || this.isDirectory(i)) continue;

      const inode = this.inodes[i];
      for (let j = 0; j < DIRECT_POINTERS; j++) {
        if (inode.i_block_pointers[j] === blockIndex) {
          // Found the file that uses this block
          const relativeBlockNum = blockIndex - this.superBlock.s_first_data_block;
          const block = this.dataBlocks[relativeBlockNum];

          // Get the actual file size (not the full block size)
          const fileSize = inode.i_size;
          const contentBytes = block.slice(0, fileSize);

          const isEmptyOrZeros =
            contentBytes.length === 0 || contentBytes.every((byte) => byte === 0);

          if (isEmptyOrZeros) {
            const loremText = faker.lorem.words(50);
            return loremText;
          }

          // Check if this file has metadata (files created with content)
          if (contentBytes.length > 0) {
            const contentType = contentBytes[0];
            const actualContent = contentBytes.slice(1);

            if (contentType === 0) {
              // Text file - return as plain text
              try {
                return new TextDecoder("utf-8", { fatal: true }).decode(actualContent);
              } catch {
                // Fallback to regular text decoding
                return new TextDecoder().decode(actualContent);
              }
            } else if (contentType === 1) {
              // Base64 file - return the base64 string
              try {
                return new TextDecoder("utf-8", { fatal: true }).decode(actualContent);
              } catch {
                return new TextDecoder().decode(actualContent);
              }
            }
          }

          // Try to decode as text first
          try {
            const textContent = new TextDecoder("utf-8", { fatal: true }).decode(contentBytes);
            // Check if it's printable text (no control characters except common ones)
            const isPrintableText = /^[\x20-\x7E\x09\x0A\x0D]*$/.test(textContent);

            if (isPrintableText) {
              return textContent;
            }
          } catch {
            // Not valid UTF-8 text
          }

          // If not text, generate lorem ipsum content
          // Generate lorem ipsum based on file size to make it realistic
          const wordsNeeded = Math.max(10, Math.floor(fileSize / 6)); // Approximate words based on file size
          const loremText = faker.lorem.words(wordsNeeded);
          return loremText;
        }
      }
    }

    return null; // Block is not used by any file
  }
}

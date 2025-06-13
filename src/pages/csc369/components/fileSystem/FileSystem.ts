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
    const inodeBlocks = Math.ceil((numInodes * inodeSize) / blockSize);

    // Initialize superblock
    this.superBlock = {
      s_inodes_count: numInodes,
      s_blocks_count: numDataBlocks, // +3 for superblock and bitmaps
      s_first_data_block: 3 + inodeBlocks, // After superblock and bitmaps
      s_log_block_size: Math.log2(blockSize),
      s_magic: MAGIC_SIGNATURE,
      s_inode_size: inodeSize,
      s_root_inode: 0, // Root directory is always inode 0
    };

    // Initialize bitmaps
    this.inodeBitmap = new Array(numInodes).fill(false);
    this.dataBitmap = new Array(numDataBlocks).fill(false);

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
  }

  private allocateDataBlock(): number {
    for (let i = 0; i < this.dataBitmap.length; i++) {
      if (!this.dataBitmap[i]) {
        this.dataBitmap[i] = true;
        return i + this.superBlock.s_first_data_block;
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
      if (inode === 0) continue; // Empty entry

      const nameBytes = block.slice(offset + 4, offset + 256);
      const name = new TextDecoder().decode(nameBytes).replace(/\0/g, "");

      entries.push({ inode, name });
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
      if (blockNum === -1) continue;

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
        // Count the number of allocated blocks
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

    // No space in existing blocks, allocate new block
    const newBlock = this.allocateDataBlock();
    if (newBlock === -1) return false;

    // Find first empty block pointer
    for (let i = 0; i < DIRECT_POINTERS; i++) {
      if (inodeObj.i_block_pointers[i] === -1) {
        inodeObj.i_block_pointers[i] = newBlock;
        const relativeNewBlockNum = newBlock - this.superBlock.s_first_data_block;
        const block = this.dataBlocks[relativeNewBlockNum];
        new DataView(block.buffer).setUint32(0, targetInode, true);
        const nameBytes = new TextEncoder().encode(name.padEnd(252, "\0"));
        block.set(nameBytes, 4);

        // Update directory size based on allocated blocks
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

    return false;
  }

  public createFile(path: string, size: number): boolean {
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

        // Regular data block (assumed to be file content)
        return `File Data Block (Block ${blockIndex})\n\nContent display to be implemented for now.`;
    }
  }

  // New method to get inode block data for custom display
  public getInodeBlockData(blockIndex: number): {
    inodes: Array<{ number: number; used: boolean; data?: InodeData }>;
  } {
    const inodesPerBlock = this.blockSize / this.inodeSize;
    const startInode = (blockIndex - 3) * inodesPerBlock; // 3 blocks for SB, IB, DB

    const inodes = [];
    for (let inodeNum = startInode; inodeNum < startInode + inodesPerBlock; inodeNum++) {
      const inode = this.inodes[inodeNum];
      const isUsed = this.inodeBitmap[inodeNum];

      let data: InodeData | undefined;
      if (isUsed && inode) {
        data = {
          type: this.isDirectory(inodeNum) ? "Directory" : "File",
          size: inode.i_size,
          mode: `0o${inode.i_mode.toString(8)}`,
          blockPointers: inode.i_block_pointers.filter((p) => p !== -1),
        };
      }

      inodes.push({
        number: inodeNum,
        used: isUsed,
        data: data,
      });
    }

    return { inodes };
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
    const relativeBlockIndex = blockIndex - this.superBlock.s_first_data_block;
    const block = this.dataBlocks[relativeBlockIndex];
    if (!block) return [];
    return this.readDirectoryEntries(block);
  }

  public getSuperBlock() {
    return this.superBlock;
  }
}

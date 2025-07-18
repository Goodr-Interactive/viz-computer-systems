import { faker } from "@faker-js/faker";

// Constants
const DEFAULT_BLOCK_SIZE = 4096; // 4KB
const DEFAULT_INODE_SIZE = 128; // 128 bytes
const MAGIC_SIGNATURE = 0x1234;
const POINTERS_PER_INODE = 15;
const DIRECT_POINTERS = 12; // Only using direct pointers for now
const ROOT_DIRECTORY_DATA_BLOCK = 8; // First data block allocated for root directory

// File mode constants
const S_IFMT = 0o170000; // File type mask
const S_IFDIR = 0o040000; // Directory
const S_IFREG = 0o100000; // Regular file
const S_IFLNK = 0o120000; // Symbolic link
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
  i_ctime: number; // Creation time
  i_mtime: number; // Modification time
  i_nlink: number; // Number of hard links
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
  type: "File" | "Directory" | "Symlink";
  size: number;
  mode: string;
  ctime: number;
  mtime: number;
  nlink: number;
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
  private allocationCounter = 0;

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
      i_ctime: 0,
      i_mtime: 0,
      i_nlink: 0,
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
    const currentTime = Date.now();
    this.inodes[0].i_mode = S_IFDIR | S_IRWXU | S_IRWXG | S_IRWXO; // Directory with full permissions
    this.inodes[0].i_uid = 0;
    this.inodes[0].i_size = 0;
    this.inodes[0].i_ctime = currentTime;
    this.inodes[0].i_mtime = currentTime;
    this.inodes[0].i_nlink = 2; // . and .. entries
    this.inodes[0].i_block_pointers[0] = rootBlock;

    // Add . and .. entries for root directory (both point to inode 0)
    this.addDefaultDirectoryEntries(0, 0);
  }

  private addDefaultDirectoryEntries(
    dirInode: number,
    parentInode: number,
    skipDataBlock = -1
  ): void {
    // Add . entry (points to current directory)
    this.addDirectoryEntry(dirInode, ".", dirInode, skipDataBlock);

    // Add .. entry (points to parent directory)
    this.addDirectoryEntry(dirInode, "..", parentInode, skipDataBlock);
  }

  // Helper method to create a new directory inode with proper initialization
  private createDirectoryInode(skipInode = -1): number {
    const newInode = this.allocateInode(skipInode);
    if (newInode === -1) return -1;

    // Set up directory inode
    const currentTime = Date.now();
    this.inodes[newInode].i_mode = S_IFDIR | S_IRWXU | S_IRWXG | S_IRWXO;
    this.inodes[newInode].i_uid = 0;
    this.inodes[newInode].i_size = 0;
    this.inodes[newInode].i_ctime = currentTime;
    this.inodes[newInode].i_mtime = currentTime;
    this.inodes[newInode].i_nlink = 2; // . and .. entries

    return newInode;
  }

  // Helper method to navigate to parent directory, creating directories as needed
  private navigateToParentDirectory(
    path: string,
    createMissing = false,
    skipDataBlock = -1
  ): number {
    const components = path.split("/").filter((c) => c !== "");
    if (components.length === 0) return this.superBlock.s_root_inode;

    let currentInode = this.superBlock.s_root_inode;

    // Navigate through directories (excluding the last component)
    for (let i = 0; i < components.length - 1; i++) {
      const dirName = components[i];
      const entry = this.findDirectoryEntry(currentInode, dirName);

      if (!entry) {
        if (!createMissing) {
          return -1; // Directory doesn't exist and we're not creating it
        }

        // Create the missing directory
        const newInode = this.createDirectoryInode(skipDataBlock);
        if (newInode === -1) return -1;

        if (!this.addDirectoryEntry(currentInode, dirName, newInode, skipDataBlock)) {
          this.inodeBitmap[newInode] = false;
          return -1;
        }

        this.addDefaultDirectoryEntries(newInode, currentInode, skipDataBlock);

        // Increment parent directory's link count
        this.inodes[currentInode].i_nlink++;

        currentInode = newInode;
      } else {
        if (!this.isDirectory(entry.inode)) {
          return -1; // Path component is not a directory
        }
        currentInode = entry.inode;
      }
    }

    return currentInode;
  }

  // Helper method to get the filename from a path
  private getFilenameFromPath(path: string): string {
    const components = path.split("/").filter((c) => c !== "");
    return components[components.length - 1] || "";
  }

  private allocateDataBlock(skipBlock = -1): number {
    if (skipBlock == -1) {
      this.dataBitmap[ROOT_DIRECTORY_DATA_BLOCK] = true;
      return ROOT_DIRECTORY_DATA_BLOCK;
    }

    const availableBlocks: number[] = [];

    // First pass: collect all available blocks
    for (let i = this.superBlock.s_first_data_block; i < this.superBlock.s_blocks_count; i++) {
      if (!this.dataBitmap[i]) {
        availableBlocks.push(i);
      }
    }

    if (availableBlocks.length === 0) {
      return -1; // No free blocks
    }

    faker.seed(skipBlock + this.allocationCounter);

    const randomIndex = Math.floor(faker.number.float() * availableBlocks.length);
    const selectedBlock = availableBlocks[randomIndex];
    this.dataBitmap[selectedBlock] = true;

    // Increment counter for next allocation
    this.allocationCounter++;

    return selectedBlock;
  }

  private allocateInode(skipInode: number): number {
    const availableInodes: number[] = [];

    // First pass: collect all available inodes
    for (let i = 0; i < this.inodeBitmap.length; i++) {
      if (!this.inodeBitmap[i]) {
        availableInodes.push(i);
      }
    }

    if (availableInodes.length === 0) {
      return -1; // No free inodes
    }

    faker.seed(skipInode + this.allocationCounter);

    const randomIndex = Math.floor(faker.number.float() * availableInodes.length);
    const selectedInode = availableInodes[randomIndex];
    this.inodeBitmap[selectedInode] = true;

    // Increment counter for next allocation
    this.allocationCounter++;

    return selectedInode;
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

  private addDirectoryEntry(
    inode: number,
    name: string,
    targetInode: number,
    skipDataBlock = -1
  ): boolean {
    const inodeObj = this.inodes[inode];

    if (!this.isDirectory(inode)) {
      return false;
    }

    // First try to find a block with space
    for (let i = 0; i < DIRECT_POINTERS; i++) {
      const blockNum = inodeObj.i_block_pointers[i];
      if (blockNum === -1) {
        // No block allocated yet, allocate a new one
        const newBlock = this.allocateDataBlock(skipDataBlock);
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

  // Create a file with text content (limited to 1 block = 4KB max)
  public createFile(path: string, content: string, skipDataBlock = -1): boolean {
    // Validate content size - must fit in 1 block (4KB)
    let contentBytes: Uint8Array;

    try {
      contentBytes = new TextEncoder().encode(content);
    } catch {
      return false; // Encoding error
    }

    if (contentBytes.length > this.blockSize) {
      return false; // Content too large for 1 block
    }

    // Navigate to parent directory, creating missing directories as needed
    const parentInode = this.navigateToParentDirectory(path, true, skipDataBlock);
    if (parentInode === -1) return false;

    // Create the file
    const fileName = this.getFilenameFromPath(path);
    const fileInode = this.allocateInode(skipDataBlock);
    if (fileInode === -1) return false;

    // Allocate exactly 1 data block
    const dataBlock = this.allocateDataBlock(skipDataBlock);
    if (dataBlock === -1) {
      this.inodeBitmap[fileInode] = false;
      return false;
    }

    // Write content to the data block
    const relativeBlockNum = dataBlock - this.superBlock.s_first_data_block;
    const block = this.dataBlocks[relativeBlockNum];

    // Clear the block first
    block.fill(0);

    // Copy content directly to the block
    block.set(contentBytes, 0);

    // Set up file inode
    const currentTime = Date.now();
    this.inodes[fileInode].i_mode = S_IFREG | S_IRUSR | S_IWUSR | S_IRGRP | S_IROTH;
    this.inodes[fileInode].i_uid = 0;
    this.inodes[fileInode].i_size = contentBytes.length; // Actual content size in bytes
    this.inodes[fileInode].i_ctime = currentTime;
    this.inodes[fileInode].i_mtime = currentTime;
    this.inodes[fileInode].i_nlink = 1; // Regular file has 1 link
    this.inodes[fileInode].i_block_pointers[0] = dataBlock;

    // Add directory entry
    return this.addDirectoryEntry(parentInode, fileName, fileInode, skipDataBlock);
  }

  // Helper method to check if an inode is a directory
  public isDirectory(inode: number): boolean {
    return (this.inodes[inode].i_mode & S_IFMT) === S_IFDIR;
  }

  // Helper method to check if an inode is a regular file
  public isRegularFile(inode: number): boolean {
    return (this.inodes[inode].i_mode & S_IFMT) === S_IFREG;
  }

  // Helper method to check if an inode is a symbolic link
  public isSymbolicLink(inode: number): boolean {
    return (this.inodes[inode].i_mode & S_IFMT) === S_IFLNK;
  }

  // Create a hard link to an existing file
  public createHardLink(targetPath: string, linkPath: string, skipDataBlock = -1): boolean {
    // Find the target file's inode
    const targetInode = this.findInodeByPath(targetPath);
    if (targetInode === -1) {
      return false; // Target file doesn't exist
    }

    // Hard links can only be created for regular files, not directories or symlinks
    if (!this.isRegularFile(targetInode)) {
      return false; // Cannot create hard link to non-regular file
    }

    // Navigate to parent directory (don't create missing directories for hard links)
    const parentInode = this.navigateToParentDirectory(linkPath, false);
    if (parentInode === -1) return false;

    // Get the link name
    const linkName = this.getFilenameFromPath(linkPath);

    // Check if the link name already exists in the directory
    if (this.findDirectoryEntry(parentInode, linkName)) {
      return false; // File with this name already exists
    }

    // Add directory entry pointing to the target inode
    if (!this.addDirectoryEntry(parentInode, linkName, targetInode, skipDataBlock)) {
      return false; // Failed to add directory entry
    }

    // Increment the target file's link count
    this.inodes[targetInode].i_nlink++;

    // Update modification times
    const newMtime = Date.now() + 1000 * 3600;
    this.inodes[targetInode].i_mtime = newMtime;
    this.inodes[parentInode].i_mtime = newMtime;

    return true;
  }

  // Create a symbolic link (soft link) to a target path
  public createSymbolicLink(targetPath: string, linkPath: string, skipDataBlock = -1): boolean {
    // Validate target path length - must fit in one block
    const targetPathBytes = new TextEncoder().encode(targetPath);
    if (targetPathBytes.length > this.blockSize) {
      return false; // Target path too long
    }

    // Navigate to parent directory, creating missing directories as needed
    const parentInode = this.navigateToParentDirectory(linkPath, true);
    if (parentInode === -1) return false;

    // Get the link name
    const linkName = this.getFilenameFromPath(linkPath);

    // Check if the link name already exists in the directory
    if (this.findDirectoryEntry(parentInode, linkName)) {
      return false; // File with this name already exists
    }

    // Create the symlink inode
    const symlinkInode = this.allocateInode(skipDataBlock);
    if (symlinkInode === -1) return false;

    // Allocate exactly 1 data block for the symlink
    const dataBlock = this.allocateDataBlock(skipDataBlock);
    if (dataBlock === -1) {
      this.inodeBitmap[symlinkInode] = false;
      return false;
    }

    // Write target path to the data block
    const relativeBlockNum = dataBlock - this.superBlock.s_first_data_block;
    const block = this.dataBlocks[relativeBlockNum];

    // Clear the block first
    block.fill(0);

    // Copy target path to the block
    block.set(targetPathBytes, 0);

    // Set up symlink inode
    const currentTime = Date.now();
    const laterTime = currentTime + 1000 * 3600; // 1 hour later to show recent creation
    this.inodes[symlinkInode].i_mode = S_IFLNK | S_IRWXU | S_IRWXG | S_IRWXO; // Symlink with full permissions
    this.inodes[symlinkInode].i_uid = 0;
    this.inodes[symlinkInode].i_size = targetPathBytes.length; // Size is length of target path
    this.inodes[symlinkInode].i_ctime = laterTime;
    this.inodes[symlinkInode].i_mtime = laterTime;
    this.inodes[symlinkInode].i_nlink = 1; // Symlinks always have link count of 1
    this.inodes[symlinkInode].i_block_pointers[0] = dataBlock;

    // Add directory entry for the symlink
    if (this.addDirectoryEntry(parentInode, linkName, symlinkInode)) {
      this.inodes[parentInode].i_mtime = laterTime;
      return true;
    }

    return false;
  }

  // Helper method to read the target path from a symbolic link
  public readSymbolicLink(symlinkInode: number): string | null {
    if (!this.isSymbolicLink(symlinkInode)) {
      return null; // Not a symbolic link
    }

    const inode = this.inodes[symlinkInode];
    const blockNum = inode.i_block_pointers[0];
    if (blockNum === -1) {
      return null; // No data block allocated
    }

    const relativeBlockNum = blockNum - this.superBlock.s_first_data_block;
    const block = this.dataBlocks[relativeBlockNum];

    // Read the target path (size is stored in inode)
    const targetPathBytes = block.slice(0, inode.i_size);
    return new TextDecoder().decode(targetPathBytes);
  }

  // Helper method to find a file's inode by path
  public findInodeByPath(path: string): number {
    const components = path.split("/").filter((c) => c !== "");
    if (components.length === 0) return this.superBlock.s_root_inode;

    let currentInode = this.superBlock.s_root_inode;

    // Navigate through the path
    for (const component of components) {
      const entry = this.findDirectoryEntry(currentInode, component);
      if (!entry) {
        return -1; // Path component not found
      }
      currentInode = entry.inode;
    }

    return currentInode;
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
          let type: "File" | "Directory" | "Symlink";
          if (this.isDirectory(inodeNumber)) {
            type = "Directory";
          } else if (this.isSymbolicLink(inodeNumber)) {
            type = "Symlink";
          } else {
            type = "File";
          }

          inodeData = {
            type,
            size: inode.i_size,
            mode: inode.i_mode.toString(8),
            ctime: inode.i_ctime,
            mtime: inode.i_mtime,
            nlink: inode.i_nlink,
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

          // Check if this is a symbolic link
          if (this.isSymbolicLink(i)) {
            const targetPath = this.readSymbolicLink(i);
            return targetPath ? `${targetPath}` : "(invalid symlink)";
          }

          // Get the actual file size (not the full block size)
          const fileSize = inode.i_size;
          const contentBytes = block.slice(0, fileSize);

          const isEmptyOrZeros =
            contentBytes.length === 0 || contentBytes.every((byte) => byte === 0);

          if (isEmptyOrZeros) {
            const loremText = faker.lorem.words(50);
            return loremText;
          }

          // Decode content as text
          try {
            return new TextDecoder("utf-8", { fatal: true }).decode(contentBytes);
          } catch {
            // Fallback to regular text decoding
            return new TextDecoder().decode(contentBytes);
          }
        }
      }
    }

    return null; // Block is not used by any file
  }
}

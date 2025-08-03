import { FileSystem } from "../FileSystem";
import type { LinkScenario } from "../config";

export const createInitialFileSystem = (
  files: Array<{ path: string; content?: string }>,
  blockToSkip: number,
  dataBlocks: number,
  totalInodes: number,
  blockSize: number,
  inodeSize: number
): FileSystem => {
  const fs = new FileSystem(dataBlocks, totalInodes, blockSize, inodeSize);

  files.forEach((file) => {
    fs.createFile(`/${file.path}`, file.content || "Default file content", blockToSkip);
  });
  return fs;
};

export const getHighlightedInodes = (
  fileSystemBefore: FileSystem | null,
  fileSystemAfter: FileSystem | null,
  linkType: "hard" | "soft",
  linkScenario: LinkScenario | null
): Set<number> => {
  if (!fileSystemBefore || !fileSystemAfter || !linkScenario) return new Set();

  const highlightedInodes = new Set<number>();

  // For both hard and soft links, the parent directory inode is modified.
  try {
    const parentPath =
      linkScenario.linkPath.substring(0, linkScenario.linkPath.lastIndexOf("/")) || "/";
    const parentDirInode = fileSystemAfter.findInodeByPath(parentPath);
    if (parentDirInode !== -1) {
      highlightedInodes.add(parentDirInode);
    }
  } catch {
    // could fail if path is weird, just ignore.
  }

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

export const getHighlightedInodeBitmapItems = (
  fileSystemBefore: FileSystem | null,
  fileSystemAfter: FileSystem | null,
  linkType: "hard" | "soft"
): Set<number> => {
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

export const getHighlightedDataBitmapItems = (
  fileSystemBefore: FileSystem | null,
  fileSystemAfter: FileSystem | null,
  linkType: "hard" | "soft"
): Set<number> => {
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

export const getHighlightedDataBlocks = (
  fileSystemBefore: FileSystem | null,
  fileSystemAfter: FileSystem | null,
  linkType: "hard" | "soft"
): Set<number> => {
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

export const getChangedInodeAttributes = (
  fileSystemBefore: FileSystem | null,
  fileSystemAfter: FileSystem | null,
  linkType: "hard" | "soft",
  linkScenario: LinkScenario | null
): Map<number, Set<string>> => {
  if (!fileSystemBefore || !fileSystemAfter || !linkScenario) return new Map();

  const changedAttributes = new Map<number, Set<string>>();

  // For both link types, the parent directory's mtime changes
  try {
    const parentPath =
      linkScenario.linkPath.substring(0, linkScenario.linkPath.lastIndexOf("/")) || "/";
    const parentDirInode = fileSystemAfter.findInodeByPath(parentPath);
    if (parentDirInode !== -1) {
      changedAttributes.set(parentDirInode, new Set(["mtime"]));
    }
  } catch {
    // ignore
  }

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

export const getHighlightedEntries = (
  fileSystemBefore: FileSystem | null,
  fileSystemAfter: FileSystem | null
): Set<string> => {
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

export const getChangedBlocks = (
  fileSystemBefore: FileSystem | null,
  fileSystemAfter: FileSystem | null,
  linkType: "hard" | "soft",
  linkScenario: LinkScenario | null
): Set<number> => {
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

  // Also highlight the parent directory's inode block since its mtime changed
  if (linkScenario) {
    try {
      const parentPath =
        linkScenario.linkPath.substring(0, linkScenario.linkPath.lastIndexOf("/")) || "/";
      const parentDirInode = fileSystemAfter.findInodeByPath(parentPath);
      if (parentDirInode !== -1) {
        const parentInodeBlockIndex = 3 + Math.floor(parentDirInode / inodesPerBlock);
        changes.add(parentInodeBlockIndex);
      }
    } catch {
      // ignore
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

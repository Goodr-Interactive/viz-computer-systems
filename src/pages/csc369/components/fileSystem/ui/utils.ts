import { BlockType } from "../FileSystem";

export const getBlockColors = (type: BlockType) => {
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

export const getBlockTypeName = (type: BlockType) => {
  switch (type) {
    case BlockType.SUPERBLOCK:
      return "Superblock";
    case BlockType.INODE_BITMAP:
      return "Inode Bitmap";
    case BlockType.DATA_BITMAP:
      return "Data Bitmap";
    case BlockType.INODE:
      return "Inode Block";
    case BlockType.DATA:
      return "Data Block";
  }
};

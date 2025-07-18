import React, { useEffect, useState } from "react";
import { FileSystem } from "./FileSystem";
import { FileSystemVisualizer } from "./FileSystemVisualizer";
import { FILE_SYSTEM_CONFIG } from "./config";
export const FileSystemExample: React.FC = () => {
  const [fileSystem, setFileSystem] = useState<FileSystem | null>(null);

  useEffect(() => {
    // Initialize filesystem from config
    const fs = new FileSystem(
      FILE_SYSTEM_CONFIG.dataBlocks,
      FILE_SYSTEM_CONFIG.totalInodes,
      FILE_SYSTEM_CONFIG.blockSize,
      FILE_SYSTEM_CONFIG.inodeSize
    );

    // Create all files from config
    FILE_SYSTEM_CONFIG.files.forEach((fileConfig) => {
      fs.createFile(
        fileConfig.path,
        fileConfig.content || "null",
        Math.floor(Math.random() * 10000)
      );
    });

    setFileSystem(fs);
  }, []);

  if (!fileSystem) {
    return (
      <div className="flex w-full flex-col items-center gap-10 p-8 pb-14">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-10 p-8 pb-14">
      <FileSystemVisualizer fileSystem={fileSystem} />
    </div>
  );
};

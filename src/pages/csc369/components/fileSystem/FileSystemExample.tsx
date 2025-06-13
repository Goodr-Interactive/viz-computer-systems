import React, { useEffect, useState } from "react";
import { FileSystem } from "./FileSystem";
import { FileSystemVisualizer } from "./FileSystemVisualizer";

export const FileSystemExample: React.FC = () => {
  const [fileSystem, setFileSystem] = useState<FileSystem | null>(null);

  useEffect(() => {
    // Initialize filesystem with 64 data blocks and 5 inode blocks
    // Each block can hold 32 inodes (4096/128 = 32 inodes per block)
    // So 5 blocks = 160 inodes total
    const fs = new FileSystem(64, 160);

    // Create a test file
    fs.createFile("one/test1.txt", 1);
    fs.createFile("four/test2.txt", 1);
    fs.createFile("nine/test3.txt", 1);
    fs.createFile("seven/test4.txt", 1);
    fs.createFile("five/test5.txt", 1);
    fs.createFile("six/test6.txt", 1);
    fs.createFile("eight/test2.txt", 1);
    fs.createFile("one/four/test2.txt", 1);
    fs.createFile("one/test5.txt", 1);
    fs.createFile("one/test6.txt", 1);
    fs.createFile("one/test7.txt", 1);
    fs.createFile("one/five/test8.txt", 1);
    fs.createFile("one/test9.txt", 1);
    fs.createFile("one/two/three/test.txt", 1); // 1 block file

    setFileSystem(fs);
  }, []);

  if (!fileSystem) {
    return <div>Loading filesystem...</div>;
  }

  return (
    <div className="flex w-full flex-col items-center gap-10 p-8 pb-24">
      <FileSystemVisualizer fileSystem={fileSystem} />
    </div>
  );
};

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

    fs.createFile("docs/readme.txt", 1);
    fs.createFile("docs/index.txt", 1);
    fs.createFile("docs/reports/quarterly.txt", 2);
    fs.createFile("docs/reports/annual.txt", 1);
    fs.createFile("docs/notes/meeting.txt", 1);
    fs.createFile("docs/notes/ideas.txt", 1);
    fs.createFile("docs/archive/old_data.txt", 3);

    fs.createFile("docs/notes/a4_solutions.txt", "text", "Hehe :D");

    fs.createFile("projects/todo.txt", 1);
    fs.createFile("projects/roadmap.txt", 1);
    fs.createFile("projects/timeline.txt", 1);
    fs.createFile("projects/web/frontend.txt", 3);
    fs.createFile("projects/web/backend.txt", 2);
    fs.createFile("projects/mobile/android.txt", 2);
    fs.createFile("projects/mobile/ios.txt", 1);

    fs.createFile("media/metadata.txt", 1);
    fs.createFile("media/catalog.txt", 2);
    fs.createFile("media/backup.txt", 1);
    fs.createFile("media/settings.txt", 1);
    fs.createFile("media/images/originals.txt", 4);
    fs.createFile("media/videos/clips.txt", 2);
    fs.createFile("media/audio/tracks.txt", 1);

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

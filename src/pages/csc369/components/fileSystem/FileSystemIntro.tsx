import React, { useState } from "react";
import type { FileSystem } from "./FileSystem";
import { SectionHeading } from "../paging/ui/SectionHeading";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FileSystemIntroProps {
  fileSystem: FileSystem;
  onUpload: () => void;
}

export const FileSystemIntro: React.FC<FileSystemIntroProps> = ({ fileSystem, onUpload }) => {
  const superBlock = fileSystem.getSuperBlock();
  const totalBlocks = fileSystem.getTotalBlocks();
  const blockSize = Math.pow(2, superBlock.s_log_block_size);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFeedbackMessage(null);
    const file = event.target.files?.[0];

    if (file) {
      const allowedTypes = ["text/plain"];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        setFeedbackMessage({
          text: "Unsupported file type. Please use .txt files.",
          type: "error",
        });
        setSelectedFile(null);
        event.target.value = "";
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setFeedbackMessage({ text: "Please select a file first.", type: "error" });
      return;
    }

    setIsLoading(true);
    setFeedbackMessage(null);

    const path = `docs/archive/${selectedFile.name}`;
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = fileSystem.createFile(path, "text", content);

      setIsLoading(false);
      if (success) {
        setFeedbackMessage({ text: "File uploaded successfully!", type: "success" });
        onUpload();
        setTimeout(() => {
          setIsPopoverOpen(false);
          setFeedbackMessage(null);
          setSelectedFile(null);
        }, 500);
      } else {
        setFeedbackMessage({
          text: "Upload failed. Not enough space or directory missing.",
          type: "error",
        });
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
      setFeedbackMessage({ text: "Error reading file.", type: "error" });
    };

    if (selectedFile.type === "text/plain") {
      reader.readAsText(selectedFile);
    } else {
      setFeedbackMessage({ text: "Unsupported file type.", type: "error" });
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full max-w-7xl">
      <SectionHeading>File System Simulation</SectionHeading>
      <div className="text-muted-foreground mt-2 mb-2 space-y-3">
        <p>
          This visualization demonstrates a simplified file system with {totalBlocks} total blocks
          and {superBlock.s_inodes_count} inodes. The system uses a block size of {blockSize} bytes
          and an inode size of {superBlock.s_inode_size} bytes. The disk is organized into a
          superblock, bitmaps for inodes and data, inode tables, and data blocks. This simulation
          uses only direct pointers for simplicity. Click on blocks in the{" "}
          <span className="font-semibold">Disk Layout</span> to load them into{" "}
          <span className="font-semibold">Memory</span> and view their contents below. Try to
          determine the data block of the file{" "}
          <span className="bg-muted rounded border px-1 font-mono font-medium">
            docs/notes/a4_solutions.txt
          </span>
        </p>
      </div>
      <div className="mt-6">
        <Popover
          open={isPopoverOpen}
          onOpenChange={(isOpen) => {
            setIsPopoverOpen(isOpen);
            if (!isOpen) {
              setSelectedFile(null);
              setFeedbackMessage(null);
              setIsLoading(false);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button>
              <Upload className="mr-1 h-4 w-4" strokeWidth={2.5} />
              Upload File
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-6">
            <div className="grid gap-4">
              <div className="space-y-3">
                <h4 className="text-lg leading-none font-medium">Upload a file</h4>
                <p className="text-muted-foreground text-sm">
                  Upload a file to add it to the file system. File content must be able to fit
                  within a single 4KB data block. Files are uploaded to{" "}
                  <span className="bg-muted rounded border px-1 font-mono font-medium">
                    docs/archive/[filename]
                  </span>
                  <br />
                  Supported file types: .txt.
                </p>
              </div>
              <div className="grid gap-3">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="file" className="text-right text-base">
                    File
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    className="col-span-2 h-9 file:mr-5"
                    accept=".txt"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1">
                  {feedbackMessage && (
                    <p
                      className={`text-center text-sm ${
                        feedbackMessage.type === "success" ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      {feedbackMessage.text}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
};

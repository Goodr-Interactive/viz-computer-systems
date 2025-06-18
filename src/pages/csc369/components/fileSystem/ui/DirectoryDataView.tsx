import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Folder, File } from "lucide-react";
import type { FileSystem } from "../FileSystem";
import { TitleWithTooltip } from "../TitleWithTooltip";

interface DirectoryDataViewProps {
  blockIndex: number;
  fileSystem: FileSystem;
  onDirectoryRowClick: (inodeNumber: number) => void;
}

export const DirectoryDataView: React.FC<DirectoryDataViewProps> = ({
  blockIndex,
  fileSystem,
  onDirectoryRowClick,
}) => {
  const entries = fileSystem.getDirectoryEntriesFromBlock(blockIndex);

  return (
    <div className="flex w-full justify-center">
      <div className="flex flex-col p-1">
        <div className="flex gap-8 pt-1">
          {/* Left half - Tree view */}
          <div className="flex flex-col gap-2">
            <TitleWithTooltip
              title={`Directory Entries (Block ${blockIndex})`}
              tooltipText="Directory data blocks store a list of entries, mapping file/directory names to corresponding inode numbers."
              className="hidden pb-1 text-start font-medium lg:block"
            />
            <h4 className="block pb-1 text-start font-medium lg:hidden">Entries</h4>
            {entries.length > 0 ? (
              entries.map((entry) => {
                const isDirectory = fileSystem.isDirectory(entry.inode);
                const icon = isDirectory ? (
                  <Folder size={16} className="text-blue-400" />
                ) : (
                  <File size={16} className="text-orange-400" />
                );

                return (
                  <div
                    key={entry.name}
                    className={`flex h-8 items-center gap-2.5 border px-2 py-1 text-sm transition-colors ${
                      isDirectory
                        ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
                        : "border-orange-200 bg-orange-50 hover:bg-orange-100"
                    }`}
                  >
                    {icon}
                    <span className="truncate font-mono font-medium" title={entry.name}>
                      {entry.name}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground">Directory is empty.</div>
            )}
          </div>

          {/* Right half - Table */}
          <div className="-mt-2.5 border">
            <Table>
              <TableHeader>
                <TableRow className="h-[41px]">
                  <TableHead className="h-8 w-32 pl-3 text-base">Name</TableHead>
                  <TableHead className="h-8 w-[72px] border-l pl-3 text-base">Inode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <TableRow
                      key={entry.name}
                      className="h-10 cursor-pointer"
                      onClick={() => onDirectoryRowClick(entry.inode)}
                    >
                      <TableCell className="h-8 w-32 py-1 pl-3.5">{entry.name}</TableCell>
                      <TableCell className="h-8 w-[72px] border-l py-1 pl-3.5 font-mono">
                        {entry.inode}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="h-8">
                    <TableCell colSpan={2} className="text-muted-foreground h-8 py-1 text-center">
                      No entries
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

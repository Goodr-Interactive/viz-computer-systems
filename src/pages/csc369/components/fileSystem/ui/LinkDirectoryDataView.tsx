import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Folder, File, ArrowRight } from "lucide-react";
import type { FileSystem } from "../FileSystem";
import { TitleWithTooltip } from "./TitleWithTooltip";

interface EnhancedDirectoryDataViewProps {
  blockIndex: number;
  fileSystem: FileSystem;
  onDirectoryRowClick: (inodeNumber: number) => void;
  highlightedEntries?: Set<string>;
}

export const EnhancedDirectoryDataView: React.FC<EnhancedDirectoryDataViewProps> = ({
  blockIndex,
  fileSystem,
  onDirectoryRowClick,
  highlightedEntries,
}) => {
  const entries = fileSystem.getDirectoryEntriesFromBlock(blockIndex);
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);

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
                const isHighlighted = highlightedEntries?.has(entry.name) || false;
                const icon = isDirectory ? (
                  <Folder size={16} className="text-blue-400" />
                ) : (
                  <File
                    size={16}
                    className={`${isHighlighted ? "text-orange-400" : "text-pink-400"}`}
                  />
                );

                // Determine styling based on highlighting
                let borderColor, bgColor, hoverColor;
                if (isHighlighted) {
                  borderColor = "border-orange-400";
                  bgColor = "bg-orange-50";
                  hoverColor = "bg-orange-100";
                } else if (isDirectory) {
                  borderColor = "border-blue-200";
                  bgColor = "bg-blue-50";
                  hoverColor = "bg-blue-100";
                } else {
                  borderColor = "border-pink-200";
                  bgColor = "bg-pink-50";
                  hoverColor = "bg-pink-100";
                }

                return (
                  <div
                    key={entry.name}
                    className={`flex h-8 items-center gap-2.5 border px-2 py-1 text-sm transition-colors ${borderColor} ${bgColor} ${
                      hoveredEntry === entry.name ? hoverColor : ""
                    }`}
                    onMouseEnter={() => setHoveredEntry(entry.name)}
                    onMouseLeave={() => setHoveredEntry(null)}
                  >
                    {icon}
                    <span className="truncate font-mono font-medium" title={entry.name}>
                      {entry.name}
                    </span>
                    {isHighlighted && (
                      <span className="font-mono text-xs font-medium text-orange-600">NEW</span>
                    )}
                    <div className="flex-grow" />
                    <ArrowRight
                      size={16}
                      className={`text-muted-foreground relative -right-8 transition-all duration-300 ${
                        hoveredEntry === entry.name
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-2 opacity-0"
                      }`}
                    />
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
                  <TableHead className="h-8 w-40 pl-3 text-base">Name</TableHead>
                  <TableHead className="h-8 w-[72px] border-l pl-3 text-base">Inode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <TableRow
                      key={entry.name}
                      className={`h-10 cursor-pointer ${
                        hoveredEntry === entry.name ? "bg-muted" : ""
                      }`}
                      onClick={() => onDirectoryRowClick(entry.inode)}
                      onMouseEnter={() => setHoveredEntry(entry.name)}
                      onMouseLeave={() => setHoveredEntry(null)}
                    >
                      <TableCell className="h-8 w-40 py-1 pl-3.5">{entry.name}</TableCell>
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

import React from "react";
import { SectionHeading } from "../../paging/ui/SectionHeading";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { FileSystem } from "../FileSystem";
import type { LinkScenario } from "../config";

interface LinkComparisonIntroProps {
  fileSystem: FileSystem;
  linkType: "hard" | "soft";
  linkScenario: LinkScenario | null;
  onLinkTypeChange: (type: "hard" | "soft") => void;
  showingAfter: boolean;
  onShowingAfterChange: ((showing: boolean) => void) | undefined;
  testMode: boolean;
  onTestModeChange: (mode: boolean) => void;
  onNewScenario: () => void;
  disabled?: boolean;
}

export const LinkComparisonIntro: React.FC<LinkComparisonIntroProps> = ({
  fileSystem,
  linkType,
  linkScenario,
  onLinkTypeChange,
  showingAfter,
  onShowingAfterChange,
  testMode,
  onTestModeChange,
  onNewScenario,
  disabled = false,
}) => {
  return (
    <section className="w-full max-w-7xl">
      <SectionHeading>Hard Links vs Soft Links Comparison</SectionHeading>
      <div className="text-muted-foreground mt-2 mb-6 space-y-3">
        <p>
          This visualization demonstrates the differences between creating hard links and soft links
          in a simplified file system with {fileSystem.getTotalBlocks()} total blocks and{" "}
          {fileSystem.getSuperBlock().s_inodes_count} inodes. The system uses a block size of{" "}
          {Math.pow(2, fileSystem.getSuperBlock().s_log_block_size)} bytes and an inode size of{" "}
          {fileSystem.getSuperBlock().s_inode_size} bytes. Use the toggles below to explore
          different scenarios and see which blocks change.
          <br />
          <br />
          The current scenario is the command:{" "}
          <span className="bg-muted rounded border px-1 font-mono font-medium">
            {`ln ${linkType === "soft" ? "-s " : ""}${linkScenario?.targetFile || "..."} ${
              linkScenario?.linkPath || "..."
            }`}
          </span>
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" onClick={onNewScenario}>
            New Scenario
          </Button>
          <Button
            variant={linkType === "hard" ? "default" : "outline"}
            onClick={() => onLinkTypeChange("hard")}
            className="w-24"
          >
            Hard Link
          </Button>
          <Button
            variant={linkType === "soft" ? "default" : "outline"}
            onClick={() => onLinkTypeChange("soft")}
            className="w-24"
          >
            Soft Link
          </Button>
          <div className="border-border bg-background hover:bg-accent/50 flex h-9 items-center space-x-2 rounded-md border px-4 py-1 shadow-xs transition-colors">
            <Switch
              id="show-after"
              checked={showingAfter}
              onCheckedChange={disabled ? undefined : onShowingAfterChange}
              disabled={disabled}
            />
            <Label
              htmlFor="show-after"
              className={`cursor-pointer font-medium ${disabled ? "text-muted-foreground" : ""}`}
            >
              {showingAfter ? "After" : "Before"}
            </Label>
          </div>
          <div className="border-border bg-background hover:bg-accent/50 flex h-9 items-center space-x-2 rounded-md border px-4 py-1 shadow-xs transition-colors md:hidden">
            <Switch id="test-mode" checked={testMode} onCheckedChange={onTestModeChange} />
            <Label htmlFor="test-mode" className="cursor-pointer font-medium">
              Test Mode
            </Label>
          </div>
        </div>
        <div className="border-border bg-background hover:bg-accent/50 hidden h-9 items-center space-x-2 rounded-md border px-4 py-1 shadow-xs transition-colors md:flex">
          <Switch id="test-mode" checked={testMode} onCheckedChange={onTestModeChange} />
          <Label htmlFor="test-mode" className="cursor-pointer font-medium">
            Test Mode
          </Label>
        </div>
      </div>
    </section>
  );
};

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubsectionHeading } from "../../paging/ui/SubsectionHeading";

interface LinkComparisonQuizProps {
  selectedInode: number | null;
  foundInodes: Set<number>;
  selectedChangedAttributes: Set<string>;
  onSelectedChangedAttributesChange: (attributes: Set<string>) => void;
  onCheckAnswer: () => void;
  highlightedInodesCount: number;
}

export const LinkComparisonQuiz: React.FC<LinkComparisonQuizProps> = ({
  selectedInode,
  foundInodes,
  selectedChangedAttributes,
  onSelectedChangedAttributesChange,
  onCheckAnswer,
  highlightedInodesCount,
}) => {
  const handleAttributeChange = (attr: string, checked: boolean) => {
    const newSet = new Set(selectedChangedAttributes);
    if (checked) {
      newSet.add(attr);
    } else {
      newSet.delete(attr);
    }
    onSelectedChangedAttributesChange(newSet);
  };

  const getAttributeDisplayName = (attr: string): string => {
    switch (attr) {
      case "nlink":
        return "Links";
      case "mtime":
        return "Modified";
      case "blockPointers":
        return "Block Pointers";
      default:
        return "Type";
    }
  };

  return (
    <div className="bg-muted/50 flex w-full flex-col rounded-lg p-6 lg:min-w-0 lg:flex-[3]">
      <SubsectionHeading className="flex items-center">
        Changed Inodes
        <Badge className="mt-0.5 ml-4 border-blue-400 bg-blue-100 py-1 pt-[3px] text-blue-600">
          {foundInodes.size} / {highlightedInodesCount} Found
        </Badge>
      </SubsectionHeading>
      <div className="h-full flex-grow overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`quiz-${selectedInode !== null ? "has-selection" : "no-selection"}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, height: "auto" }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
              layout: {
                duration: 0.2,
                ease: "easeInOut",
              },
            }}
            layout
            className="h-full origin-top"
          >
            <div className="flex h-full flex-col justify-between space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">
                  Select an affected inode and the attributes that have changed after the link is
                  created.
                </p>
              </div>

              {selectedInode !== null ? (
                <>
                  {/* Attribute selection checkboxes */}
                  <div className="space-y-2">
                    {["type", "nlink", "mtime", "blockPointers"].map((attr) => {
                      const isSelected = selectedChangedAttributes.has(attr);
                      const displayName = getAttributeDisplayName(attr);

                      return (
                        <div key={attr} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`attr-${attr}`}
                            checked={isSelected}
                            onChange={(e) => handleAttributeChange(attr, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                            disabled={foundInodes.has(selectedInode)}
                          />
                          <label
                            htmlFor={`attr-${attr}`}
                            className={`cursor-pointer text-sm font-medium ${
                              foundInodes.has(selectedInode) ? "text-muted-foreground" : ""
                            }`}
                          >
                            {displayName}
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit button */}
                  <Button
                    onClick={onCheckAnswer}
                    className="w-full"
                    variant="default"
                    disabled={foundInodes.has(selectedInode)}
                  >
                    Check Answer
                  </Button>
                </>
              ) : (
                <></>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

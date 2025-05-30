import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface InputBinaryBlockProps {
  /**
   * Number of blocks to render
   */
  blocks: number;
  /**
   * Background color for the blocks
   */
  color?: string;
  /**
   * Border color for the blocks
   */
  borderColor?: string;
  /**
   * Hover color class for blocks (full Tailwind class name)
   */
  hoverColor?: string;
  /**
   * Tooltip content to display on hover
   */
  tooltip?: React.ReactNode;
  /**
   * Show left border on the first block
   */
  showLeftBorder?: boolean;
  /**
   * Label to display below the blocks
   */
  label?: React.ReactNode;
  /**
   * Starting bit number (for continuous numbering across multiple blocks)
   */
  startBitNumber?: number;
  /**
   * Whether to show bit numbers
   */
  showBitNumbers?: boolean;
  /**
   * Optional class name for styling
   */
  className?: string;
  /**
   * Initial values for the binary digits (0 or 1)
   */
  initialValues?: Array<0 | 1>;
  /**
   * Callback when values change
   */
  onChange?: (values: Array<0 | 1>) => void;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
}

export const InputBinaryBlock: React.FC<InputBinaryBlockProps> = ({
  blocks,
  color = "bg-blue-50",
  borderColor = "border-blue-300",
  hoverColor = "hover:bg-blue-100",
  tooltip,
  showLeftBorder = false,
  label,
  startBitNumber = 0,
  showBitNumbers = true,
  className,
  initialValues,
  onChange,
  disabled = false,
}) => {
  // Generate a unique ID for this InputBinaryBlock instance
  const blockId = useRef(`input-binary-block-${Math.random().toString(36).substr(2, 9)}`);

  const [values, setValues] = useState<string[]>(() => {
    if (initialValues && initialValues.length === blocks) {
      // Treat 0 as unset/empty, only 1 as explicitly set
      return initialValues.map((val) => (val === 1 ? "1" : ""));
    }
    return Array(blocks).fill("");
  });

  const blockArray = Array.from({ length: blocks }, (_, i) => i);

  const handleInputChange = useCallback(
    (index: number, value: string) => {
      if (disabled) return;

      // Handle empty string as truly empty (unset)
      if (value === "") {
        const newValues = [...values];
        newValues[index] = "";
        setValues(newValues);
        // Convert to numbers, treating empty as 0 for the callback
        const numericValues = newValues.map((val) => (val === "" ? 0 : (parseInt(val) as 0 | 1)));
        onChange?.(numericValues);
        return;
      }

      // Only allow 0 or 1
      if (value !== "0" && value !== "1") return;

      const newValues = [...values];
      newValues[index] = value;
      setValues(newValues);
      const numericValues = newValues.map((val) => (val === "" ? 0 : (parseInt(val) as 0 | 1)));
      onChange?.(numericValues);
    },
    [values, onChange, disabled]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      // Allow navigation keys
      if (["Tab", "ArrowLeft", "ArrowRight", "Backspace", "Delete"].includes(e.key)) {
        return;
      }

      // Only allow 0 and 1
      if (e.key !== "0" && e.key !== "1") {
        e.preventDefault();
        return;
      }

      // Auto-advance to next input on valid entry within this block only
      if ((e.key === "0" || e.key === "1") && index < blocks - 1) {
        setTimeout(() => {
          const nextInput = document.querySelector(
            `input[data-bit-index="${blockId.current}-${index + 1}"]`
          ) as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        }, 0);
      }
    },
    [disabled, blocks, blockId]
  );

  const blockContent = (
    <div className="flex flex-col items-center">
      {showBitNumbers && (
        <div className="mb-1 flex w-full items-center justify-center">
          {blockArray.map((index) => (
            <div key={`bit-${index}`} className="w-8 text-center">
              <span className="text-muted-foreground text-xs">
                {startBitNumber + (blocks - 1 - index)}
              </span>
            </div>
          ))}
        </div>
      )}
      <div
        className={cn("flex rounded-md transition-colors", className)}
        aria-label={`Editable binary block group with ${blocks} blocks`}
      >
        {blockArray.map((index) => (
          <div key={index}>
            <div
              className={cn(
                "relative flex h-8 w-8 items-center justify-center border-y border-r transition-colors",
                index === 0 && showLeftBorder && "border-l",
                color,
                borderColor,
                !disabled && hoverColor
              )}
            >
              <input
                type="text"
                value={values[index]}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={(e) => e.target.select()}
                data-bit-index={`${blockId.current}-${index}`}
                disabled={disabled}
                placeholder="0"
                className={cn(
                  "h-full w-full rounded-sm border-none bg-transparent text-center font-mono text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                  disabled ? "cursor-not-allowed text-gray-400" : "cursor-text text-gray-800",
                  "placeholder:text-gray-300"
                )}
                maxLength={1}
                aria-label={`Bit ${startBitNumber + (blocks - 1 - index)}`}
              />
            </div>
          </div>
        ))}
      </div>
      {label && <div className="text-muted-foreground mt-2 text-center text-sm">{label}</div>}
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{blockContent}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return blockContent;
};

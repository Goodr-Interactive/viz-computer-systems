import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface AccessSequenceEditorProps {
  sequence: Array<string | number>;
  onChange: (newSequence: Array<string | number>) => void;
}

export const AccessSequenceEditor: React.FC<AccessSequenceEditorProps> = ({
  sequence,
  onChange,
}) => {
  const [values, setValues] = useState<string[]>(sequence.map(String));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Update values when sequence prop changes
  useEffect(() => {
    setValues(sequence.map(String));
  }, [sequence]);

  const handleInputChange = useCallback(
    (index: number, value: string) => {
      const newValues = [...values];
      newValues[index] = value;
      setValues(newValues);

      // Only update the sequence if the value is not empty
      if (value.trim() !== "") {
        onChange(newValues);
      }

      // Auto-advance to next input if we just entered a character
      if (value && index < values.length - 1) {
        setTimeout(() => {
          const nextInput = inputRefs.current[index + 1];
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        }, 0);
      }
    },
    [values, onChange]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow navigation keys
      if (["Tab", "ArrowLeft", "ArrowRight", "Backspace", "Delete"].includes(e.key)) {
        // Handle backspace to go to previous input when current is empty
        if (e.key === "Backspace" && !values[index] && index > 0) {
          setTimeout(() => {
            const prevInput = inputRefs.current[index - 1];
            if (prevInput) {
              prevInput.focus();
              prevInput.select();
            }
          }, 0);
        }
        return;
      }

      // For any other single character, replace the current value
      if (e.key.length === 1) {
        e.preventDefault();
        handleInputChange(index, e.key);
      }
    },
    [values, handleInputChange]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {values.map((value, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "relative flex h-8 w-8 items-center justify-center border transition-colors",
                "border-yellow-400 bg-yellow-100 hover:bg-yellow-200"
              )}
            >
              <input
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                value={value}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={(e) => e.target.select()}
                className={cn(
                  "-mt-[1px] h-full w-full border-none bg-transparent text-center font-mono text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                  "cursor-text text-gray-800 placeholder:text-gray-300"
                )}
                maxLength={1}
                aria-label={`Access ${index + 1}`}
              />
            </div>
            <div className="text-muted-foreground mt-2 text-center text-sm">{index + 1}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "lucide-react";

interface TranslationControlsProps {
  generateNewTranslation: () => void;
  showHex: boolean;
  setShowHex: (show: boolean) => void;
  testMode: boolean;
  setTestMode: (test: boolean) => void;
  hexHintMode: boolean;
  setHexHintMode: (value: boolean) => void;
}

export const TranslationControls: React.FC<TranslationControlsProps> = ({
  generateNewTranslation,
  showHex,
  setShowHex,
  testMode,
  setTestMode,
  hexHintMode,
  setHexHintMode,
}) => {
  return (
    <div className="flex flex-wrap justify-start gap-4">
      <Button onClick={generateNewTranslation} className="w-fit">
        Generate New Translation
      </Button>
      <Button onClick={() => setShowHex(!showHex)} variant="outline" className="w-fit">
        Display: {showHex ? "Hex" : "Decimal"}
      </Button>
      <div className="border-border bg-background hover:bg-accent/50 flex h-9 items-center space-x-2 rounded-md border px-4 py-1 shadow-xs transition-colors">
        <Switch id="test-mode" checked={testMode} onCheckedChange={setTestMode} />
        <Label htmlFor="test-mode" className="cursor-pointer">
          Test Mode
        </Label>
      </div>
      {testMode && (
        <Button
          variant={hexHintMode ? "default" : "outline"}
          size="sm"
          onClick={() => setHexHintMode(!hexHintMode)}
          className="flex h-9 items-center gap-2"
        >
          <HelpCircle size={16} />
          Hex Hint
        </Button>
      )}
    </div>
  );
};

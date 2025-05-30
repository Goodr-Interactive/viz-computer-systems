import React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TranslationControlsProps {
  generateNewTranslation: () => void;
  showHex: boolean;
  setShowHex: (show: boolean) => void;
  testMode: boolean;
  setTestMode: (test: boolean) => void;
}

export const TranslationControls: React.FC<TranslationControlsProps> = ({
  generateNewTranslation,
  showHex,
  setShowHex,
  testMode,
  setTestMode,
}) => {
  return (
    <div className="flex justify-start gap-4">
      <Button onClick={generateNewTranslation} className="w-fit">
        Generate New Translation
      </Button>
      <Button onClick={() => setShowHex(!showHex)} variant="outline" className="w-fit">
        Display: {showHex ? "Hex" : "Decimal"}
      </Button>
      <div className="flex items-center space-x-2">
        <Switch id="test-mode" checked={testMode} onCheckedChange={setTestMode} />
        <Label htmlFor="test-mode">Test Mode</Label>
      </div>
    </div>
  );
};

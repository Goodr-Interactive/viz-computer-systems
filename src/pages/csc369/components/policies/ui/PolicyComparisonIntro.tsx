import React from "react";
import { type PagingPolicyName } from "../CompareController";
import { SectionHeading } from "../../paging/ui/SectionHeading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";

interface CacheComparisonIntroProps {
  policy1: PagingPolicyName;
  policy2: PagingPolicyName;
  onPolicy1Change: (policy: PagingPolicyName) => void;
  onPolicy2Change: (policy: PagingPolicyName) => void;
  onReset: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onNewScenario: () => void;
  canStepBackward: boolean;
  canStepForward: boolean;
}

const PAGING_POLICIES: { value: PagingPolicyName; label: string; description: string }[] = [
  { value: "LRU", label: "LRU", description: "Least Recently Used" },
  { value: "FIFO", label: "FIFO", description: "First In, First Out" },
  { value: "Clock", label: "Clock", description: "Clock (Second Chance)" },
  { value: "Random", label: "Random", description: "Random Replacement" },
  { value: "Optimal", label: "Optimal", description: "Optimal (Belady's)" },
  { value: "2Q", label: "2Q", description: "Simplified 2Q" },
];

export const CacheComparisonIntro: React.FC<CacheComparisonIntroProps> = ({
  policy1,
  policy2,
  onPolicy1Change,
  onPolicy2Change,
  onReset,
  onPrevious,
  onNext,
  onNewScenario,
  canStepBackward,
  canStepForward,
}) => {
  const policy1Info = PAGING_POLICIES.find((p) => p.value === policy1);
  const policy2Info = PAGING_POLICIES.find((p) => p.value === policy2);

  return (
    <section className="w-full max-w-7xl">
      <SectionHeading>Paging Policy Comparison</SectionHeading>
      <div className="text-muted-foreground mt-2 mb-6 space-y-3">
        <p>
          Compare how different paging replacement policies perform on the same sequence of memory
          accesses. Each policy has different strategies for deciding which page to evict
          when the memory is full. Use the controls below to step through each access and observe how
          each policy behaves differently.
        </p>
      </div>

              {/* Controls Row */}
        <div className="flex items-center justify-between gap-4 h-9">
          {/* Left Side - Policy Selection and New Scenario */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={policy1} onValueChange={onPolicy1Change}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select policy" />
                </SelectTrigger>
                <SelectContent>
                  {PAGING_POLICIES.map((policy) => (
                    <SelectItem key={policy.value} value={policy.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{policy.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Select value={policy2} onValueChange={onPolicy2Change}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select policy" />
                </SelectTrigger>
                <SelectContent>
                  {PAGING_POLICIES.map((policy) => (
                    <SelectItem key={policy.value} value={policy.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{policy.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={onNewScenario} variant="outline" size="sm" className="flex items-center gap-2 h-9">
              <Shuffle className="h-4 w-4" />
              New Access Sequence
            </Button>
          </div>

          {/* Right Side - Navigation Controls */}
          <div className="flex items-center gap-4 h-9">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="flex items-center gap-2 h-9"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={!canStepBackward}
              className="flex items-center gap-2 h-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={!canStepForward}
              className="flex items-center gap-2 h-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    );
  };

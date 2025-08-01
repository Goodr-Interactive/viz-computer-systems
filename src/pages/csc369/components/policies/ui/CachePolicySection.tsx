import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SubsectionHeading } from "../../paging/ui/SubsectionHeading";
import { CacheVisualization } from "./CacheVisualization";
import {
  convertCacheStateToSlots,
  getClockHand,
  getRandomSlotSelected,
  getEvictedFromQueue,
} from "./cacheVisualizationUtils";
import { POLICY_COMPARISON_CONFIG } from "../config";
import type { PagingPolicyName } from "../CompareController";

// Cache result interface
interface CacheResult {
  hit: boolean;
  evictedValue?: string | number;
  insertedValue?: string | number;
  missType?: "cold" | "capacity";
  randomSlotSelected?: number;
  evictedFromQueue?: "A1" | "Am";
}

// Cache statistics interface
interface CacheStats {
  totalAccesses: number;
  hits: number;
  misses: number;
  coldMisses?: number;
  capacityMisses?: number;
  hitRate: number;
  coldMissRate?: number;
  capacityMissRate?: number;
  capacity: number;
  occupancy: number;
  uniqueValuesSeen?: number;
}

// Cache display item interface
interface CacheDisplayItem {
  index: number;
  value: string;
  lastAccessTime?: number | null;
  insertionOrder?: number | null;
  isLRU?: boolean;
  isMRU?: boolean;
  isOldest?: boolean;
  isNewest?: boolean;
  isEmpty: boolean;
  referenceBit?: boolean;
  isClockHand?: boolean;
}

// Cache state interface
interface CacheState {
  displayInfo: CacheDisplayItem[];
  values: Array<string | number | null>;
  clockHand?: number;
}

interface CachePolicySectionProps {
  policyName: PagingPolicyName;
  currentAccessValue: string | number | null;
  cacheState: CacheState | undefined;
  cacheResult: CacheResult | null | undefined;
  cacheStats: CacheStats | undefined;
  hideClockOnSmall?: boolean;
}

export const CachePolicySection: React.FC<CachePolicySectionProps> = ({
  policyName,
  currentAccessValue,
  cacheState,
  cacheResult,
  cacheStats,
  hideClockOnSmall = false,
}) => {
  return (
    <section className="overflow-x-auto">
      <TooltipProvider>
        <div className="bg-muted/50 min-w-fit rounded-lg p-6">
          <SubsectionHeading className="flex items-center justify-between gap-4">
            {policyName} Policy Visualization
            <div className="mt-[1px] flex items-center gap-4">
              <Badge className="w-20 border-blue-400 bg-blue-100 py-1 pt-[3px] text-blue-600">
                Access: {currentAccessValue ? `${currentAccessValue}` : "-"}
              </Badge>
              <Badge className="w-20 border-red-400 bg-red-100 py-1 pt-[3px] text-red-600">
                Evicted: {cacheResult?.evictedValue ? cacheResult.evictedValue : "-"}
              </Badge>
              {policyName === "Clock" && (
                <Badge
                  className={`w-20 border-violet-400 bg-violet-100 py-1 pt-[3px] text-violet-600 ${
                    hideClockOnSmall ? "hidden sm:flex" : "flex"
                  }`}
                >
                  Hand:{" "}
                  {cacheState && getClockHand(cacheState) !== undefined
                    ? `${getClockHand(cacheState)}`
                    : "-"}
                </Badge>
              )}
            </div>
          </SubsectionHeading>

          <div className="flex w-full items-center overflow-x-auto">
            <CacheVisualization
              policyName={policyName}
              slots={convertCacheStateToSlots(
                cacheState || { displayInfo: [], values: [] },
                POLICY_COMPARISON_CONFIG.cacheSize
              )}
              capacity={POLICY_COMPARISON_CONFIG.cacheSize}
              currentAccess={currentAccessValue}
              isHit={cacheResult?.hit}
              evictedValue={cacheResult?.evictedValue}
              insertedValue={cacheResult?.insertedValue}
              clockHand={cacheState ? getClockHand(cacheState) : undefined}
              randomSlotSelected={getRandomSlotSelected(cacheResult ?? null)}
              evictedFromQueue={getEvictedFromQueue(cacheResult ?? null)}
            />
          </div>

          {/* Statistics */}
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-background rounded-md p-3 text-center">
                <div className="text-lg font-bold">{cacheStats?.hits || 0}</div>
                <Tooltip delayDuration={350}>
                  <TooltipTrigger asChild>
                    <div className="text-muted-foreground border-muted-foreground/50 hover:border-muted-foreground inline-block cursor-help border-b border-dotted text-sm transition-colors">
                      Hits
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm" side="bottom">
                    Hits occur when the accessed page is found in memory already.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="bg-background rounded-md p-3 text-center">
                <div className="text-lg font-bold">{cacheStats?.misses || 0}</div>
                <Tooltip delayDuration={350}>
                  <TooltipTrigger asChild>
                    <div className="text-muted-foreground border-muted-foreground/50 hover:border-muted-foreground inline-block cursor-help border-b border-dotted text-sm transition-colors">
                      Misses
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm" side="bottom">
                    Misses occur when the accessed page is not found in memory, this can be a
                    combination of cold-start and capacity misses.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="bg-background rounded-md p-3 text-center">
                <div className="text-lg font-bold">
                  {cacheStats?.hitRate ? `${(cacheStats.hitRate * 100).toFixed(1)}%` : "0%"}
                </div>
                <Tooltip delayDuration={350}>
                  <TooltipTrigger asChild>
                    <div className="text-muted-foreground border-muted-foreground/50 hover:border-muted-foreground inline-block cursor-help border-b border-dotted text-sm transition-colors">
                      Hit Rate
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm" side="bottom">
                    Hits / (Hits + Misses)
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </section>
  );
};

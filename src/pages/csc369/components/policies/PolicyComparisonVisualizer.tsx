import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CompareController, type PagingPolicyName } from "./CompareController";
import { SubsectionHeading } from "../paging/ui/SubsectionHeading";
import { CacheComparisonIntro } from "./ui/PolicyComparisonIntro";
import { AccessSequenceDisplay } from "./ui/AccessSequenceDisplay";
import { CacheVisualization } from "./ui/CacheVisualization";
import {
  convertCacheStateToSlots,
  getClockHand,
  getRandomSlotSelected,
  getEvictedFromQueue,
} from "./ui/cacheVisualizationUtils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface PolicyComparisonVisualizerProps {
  // Props can be extended later
}

export const PolicyComparisonVisualizer: React.FC<PolicyComparisonVisualizerProps> = () => {
  const [policy1, setPolicy1] = useState<PagingPolicyName>("LRU");
  const [policy2, setPolicy2] = useState<PagingPolicyName>("FIFO");
  const [controller, setController] = useState<CompareController | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [maxStep, setMaxStep] = useState<number>(0);
  const [sequenceVersion, setSequenceVersion] = useState<number>(0);

  // Initialize controller on first render
  useEffect(() => {
    if (!controller) {
      const newController = new CompareController(policy1, policy2, 5, 20);
      setController(newController);
      setCurrentStep(newController.getCurrentStep());
      setMaxStep(newController.getMaxStep());
    }
  }, []);

  // Update controller when policies change
  useEffect(() => {
    if (controller) {
      controller.updatePolicies(policy1, policy2);
      setCurrentStep(controller.getCurrentStep());
      setMaxStep(controller.getMaxStep());
    }
  }, [policy1, policy2]);

  const handlePolicyChange = (policyNumber: 1 | 2, newPolicy: PagingPolicyName) => {
    if (policyNumber === 1) {
      setPolicy1(newPolicy);
    } else {
      setPolicy2(newPolicy);
    }
    // Automatically reset when policy changes
    setTimeout(() => {
      if (controller) {
        controller.reset();
        setCurrentStep(controller.getCurrentStep());
      }
    }, 0);
  };

  const handleReset = () => {
    if (controller) {
      controller.reset();
      setCurrentStep(controller.getCurrentStep());
    }
  };

  const handlePrevious = () => {
    if (controller && controller.stepBackward()) {
      setCurrentStep(controller.getCurrentStep());
    }
  };

  const handleNext = () => {
    if (controller && controller.stepForward()) {
      setCurrentStep(controller.getCurrentStep());
    }
  };

  const handleNewScenario = () => {
    if (controller) {
      controller.generateNewSequence(20);
      setCurrentStep(controller.getCurrentStep());
      setMaxStep(controller.getMaxStep());
      // Force a re-render by incrementing sequence version
      setSequenceVersion((prev) => prev + 1);
    }
  };

  const canStepBackward = currentStep > -1;
  const canStepForward = currentStep < maxStep;

  return (
    <>
      <CacheComparisonIntro
        policy1={policy1}
        policy2={policy2}
        onPolicy1Change={(policy: PagingPolicyName) => handlePolicyChange(1, policy)}
        onPolicy2Change={(policy: PagingPolicyName) => handlePolicyChange(2, policy)}
        onReset={handleReset}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onNewScenario={handleNewScenario}
        canStepBackward={canStepBackward}
        canStepForward={canStepForward}
      />

      <AccessSequenceDisplay
        key={`sequence-${sequenceVersion}`}
        accessSequence={controller?.getAccessSequence() || []}
        currentStep={currentStep}
        maxStep={maxStep}
      />

      {/* Cache Sections Side by Side */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Cache 1 Section */}
        <section className="overflow-x-auto">
          <TooltipProvider>
            <div className="bg-muted/50 min-w-fit rounded-lg p-6">
                <SubsectionHeading className="flex items-center">
                  {policy1} Policy Visualization
                  <Badge className="ml-4 w-20 border-blue-400 bg-blue-100 py-1 pt-[3px] text-blue-600">
                    Access:{" "}
                    {controller && controller.getCurrentAccessValue()
                      ? `${controller.getCurrentAccessValue()}`
                      : "-"}
                  </Badge>
                  <Badge className="ml-4 w-20 border-red-400 bg-red-100 py-1 pt-[3px] text-red-600">
                    Evicted:{" "}
                    {controller && controller.getCurrentComparison()?.cache1.result?.evictedValue
                      ? controller.getCurrentComparison()?.cache1.result?.evictedValue
                      : "-"}
                  </Badge>
                </SubsectionHeading>
     
  
                          <div className="flex min-w-fit items-center overflow-x-auto">
              {controller && (
                <CacheVisualization
                  policyName={policy1}
                  slots={convertCacheStateToSlots(
                    policy1,
                    controller.getCurrentComparison()?.cache1.state || { displayInfo: [] },
                    5
                  )}
                  capacity={5}
                  currentAccess={controller.getCurrentAccessValue()}
                  isHit={controller.getCurrentComparison()?.cache1.result?.hit}
                  evictedValue={controller.getCurrentComparison()?.cache1.result?.evictedValue}
                  insertedValue={controller.getCurrentComparison()?.cache1.result?.insertedValue}
                  clockHand={getClockHand(controller.getCurrentComparison()?.cache1.state)}
                  randomSlotSelected={getRandomSlotSelected(
                    controller.getCurrentComparison()?.cache1.result
                  )}
                  evictedFromQueue={getEvictedFromQueue(
                    controller.getCurrentComparison()?.cache1.result
                  )}
                />
              )}
            </div>

            {/* Policy 1 Statistics */}
            <div className="mt-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-background rounded-md p-3 text-center">
                  <div className="text-lg font-bold">
                    {controller?.getCurrentComparison()?.cache1.stats?.hits || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Hits</div>
                </div>
                <div className="bg-background rounded-md p-3 text-center">
                  <div className="text-lg font-bold">
                    {controller?.getCurrentComparison()?.cache1.stats?.misses || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Misses</div>
                </div>
                <div className="bg-background rounded-md p-3 text-center">
                  <div className="text-lg font-bold">
                    {controller?.getCurrentComparison()?.cache1.stats?.hitRate 
                      ? `${(controller!.getCurrentComparison()!.cache1.stats.hitRate * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                  <div className="text-sm text-muted-foreground">Hit Rate</div>
                </div>
              </div>
            </div>
            </div>
          </TooltipProvider>
        </section>

        {/* Cache 2 Section */}
        <section className="overflow-x-auto">
          <TooltipProvider>
            <div className="bg-muted/50 min-w-fit rounded-lg p-6">
                <SubsectionHeading className="flex items-center">
                  {policy2} Policy Visualization
                  <Badge className="ml-4 w-20 border-blue-400 bg-blue-100 py-1 pt-[3px] text-blue-600">
                    Access:{" "}
                    {controller && controller.getCurrentAccessValue()
                      ? `${controller.getCurrentAccessValue()}`
                      : "-"}
                  </Badge>
                  <Badge className="ml-4 w-20 border-red-400 bg-red-100 py-1 pt-[3px] text-red-600">
                    Evicted:{" "}
                    {controller && controller.getCurrentComparison()?.cache2.result?.evictedValue
                      ? controller.getCurrentComparison()?.cache2.result?.evictedValue
                      : "-"}
                  </Badge>
                </SubsectionHeading>

                          <div className="flex min-w-fit items-center overflow-x-auto">
              {controller && (
                <CacheVisualization
                  policyName={policy2}
                  slots={convertCacheStateToSlots(
                    policy2,
                    controller.getCurrentComparison()?.cache2.state || { displayInfo: [] },
                    5
                  )}
                  capacity={5}
                  currentAccess={controller.getCurrentAccessValue()}
                  isHit={controller.getCurrentComparison()?.cache2.result?.hit}
                  evictedValue={controller.getCurrentComparison()?.cache2.result?.evictedValue}
                  insertedValue={controller.getCurrentComparison()?.cache2.result?.insertedValue}
                  clockHand={getClockHand(controller.getCurrentComparison()?.cache2.state)}
                  randomSlotSelected={getRandomSlotSelected(
                    controller.getCurrentComparison()?.cache2.result
                  )}
                  evictedFromQueue={getEvictedFromQueue(
                    controller.getCurrentComparison()?.cache2.result
                  )}
                />
              )}
            </div>

            {/* Policy 2 Statistics */}
            <div className="mt-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-background rounded-md p-3 text-center">
                  <div className="text-lg font-bold">
                    {controller?.getCurrentComparison()?.cache2.stats?.hits || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Hits</div>
                </div>
                <div className="bg-background rounded-md p-3 text-center">
                  <div className="text-lg font-bold">
                    {controller?.getCurrentComparison()?.cache2.stats?.misses || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Misses</div>
                </div>
                <div className="bg-background rounded-md p-3 text-center">
                  <div className="text-lg font-bold">
                    {controller?.getCurrentComparison()?.cache2.stats?.hitRate 
                      ? `${(controller!.getCurrentComparison()!.cache2.stats.hitRate * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                  <div className="text-sm text-muted-foreground">Hit Rate</div>
                </div>
              </div>
            </div>
            </div>
          </TooltipProvider>
        </section>
      </div>
    </>
  );
};

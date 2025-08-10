import { AccessSequenceDisplay } from "./ui/AccessSequenceDisplay";
import { CacheComparisonIntro } from "./ui/PolicyComparisonIntro";
import { CachePolicySection } from "./ui/CachePolicySection";
import { useEffect, useState } from "react";
import type { PagingPolicyName } from "./CompareController";
import { CompareController } from "./CompareController";
import { POLICY_COMPARISON_CONFIG } from "./config";

export const PolicyComparisonVisualizer: React.FC = () => {
  const [policy1, setPolicy1] = useState<PagingPolicyName>("LRU");
  const [policy2, setPolicy2] = useState<PagingPolicyName>("FIFO");
  const [controller, setController] = useState<CompareController | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [maxStep, setMaxStep] = useState<number>(0);
  const [sequenceVersion, setSequenceVersion] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [shouldSaveChanges, setShouldSaveChanges] = useState<boolean>(false);

  // Initialize controller on first render
  useEffect(() => {
    if (!controller) {
      const newController = new CompareController(
        policy1,
        policy2,
        POLICY_COMPARISON_CONFIG.cacheSize,
        POLICY_COMPARISON_CONFIG.sequenceLength
      );
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
      controller.generateNewSequence(POLICY_COMPARISON_CONFIG.sequenceLength);
      setCurrentStep(controller.getCurrentStep());
      setMaxStep(controller.getMaxStep());
      // Force a re-render by incrementing sequence version
      setSequenceVersion((prev) => prev + 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (controller && controller.jumpToStep(step)) {
      setCurrentStep(controller.getCurrentStep());
    }
  };

  const handleSequenceChange = (newSequence: Array<string | number>) => {
    if (controller) {
      // Recreate the controller with the new sequence
      const newController = new CompareController(
        policy1,
        policy2,
        POLICY_COMPARISON_CONFIG.cacheSize,
        POLICY_COMPARISON_CONFIG.sequenceLength,
        newSequence
      );
      setController(newController);
      setCurrentStep(newController.getCurrentStep());
      setMaxStep(newController.getMaxStep());
      setSequenceVersion((prev) => prev + 1);
    }
  };

  const toggleEditing = () => {
    if (isEditing) {
      // Switching from edit to view mode - trigger save
      setShouldSaveChanges(true);
    } else {
      // Switching from view to edit mode
      setIsEditing(true);
    }
  };

  const handleSaveComplete = () => {
    setShouldSaveChanges(false);
    setIsEditing(false);
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
        isEditing={isEditing}
        onToggleEditing={toggleEditing}
      />

      <AccessSequenceDisplay
        key={`sequence-${sequenceVersion}`}
        accessSequence={controller?.getAccessSequence() || []}
        currentStep={currentStep}
        maxStep={maxStep}
        onStepClick={handleStepClick}
        isEditing={isEditing}
        onSequenceChange={handleSequenceChange}
        shouldSaveChanges={shouldSaveChanges}
        onSaveComplete={handleSaveComplete}
      />

      {/* Cache Sections Side by Side */}
      <div className="grid w-full max-w-7xl grid-cols-1 gap-10 lg:grid-cols-2">
        {controller && (
          <>
            <CachePolicySection
              policyName={policy1}
              currentAccessValue={controller.getCurrentAccessValue()}
              cacheState={controller.getCurrentComparison()?.cache1.state}
              cacheResult={controller.getCurrentComparison()?.cache1.result}
              cacheStats={controller.getCurrentComparison()?.cache1.stats}
              hideClockOnSmall={true}
            />
            <CachePolicySection
              policyName={policy2}
              currentAccessValue={controller.getCurrentAccessValue()}
              cacheState={controller.getCurrentComparison()?.cache2.state}
              cacheResult={controller.getCurrentComparison()?.cache2.result}
              cacheStats={controller.getCurrentComparison()?.cache2.stats}
              hideClockOnSmall={false}
            />
          </>
        )}
      </div>
    </>
  );
};

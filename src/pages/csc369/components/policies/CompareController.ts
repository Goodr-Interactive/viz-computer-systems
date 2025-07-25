import { LRUCache } from './LRUCache';
import { FIFOCache } from './FIFOCache';
import { ClockCache } from './ClockCache';
import { RandomCache } from './RandomCache';
import { OptimalCache } from './OptimalCache';
import { Simplified2QCache } from './Simplified2QCache';

// Union type for all available cache policies
type CacheInstance = LRUCache | FIFOCache | ClockCache | RandomCache | OptimalCache | Simplified2QCache;

// Available paging policy names
export type PagingPolicyName = 'LRU' | 'FIFO' | 'Clock' | 'Random' | 'Optimal' | '2Q';

interface ComparisonStep {
  stepIndex: number;
  accessValue: string | number;
  cache1Result: any;
  cache2Result: any;
  cache1State: any;
  cache2State: any;
  cache1Stats: any;
  cache2Stats: any;
}

export class CompareController {
  private cache1: CacheInstance;
  private cache2: CacheInstance;
  private policy1Name: PagingPolicyName;
  private policy2Name: PagingPolicyName;
  private accessSequence: (string | number)[];
  private currentStep: number = -1; // -1 means before first access
  private maxStep: number;
  private stepHistory: ComparisonStep[] = [];

  constructor(
    policy1: PagingPolicyName, 
    policy2: PagingPolicyName, 
    cacheSize: number = 10, 
    sequenceLength: number = 20
  ) {
    this.policy1Name = policy1;
    this.policy2Name = policy2;
    
    // Create cache instances
    this.cache1 = this.createCacheInstance(policy1, cacheSize);
    this.cache2 = this.createCacheInstance(policy2, cacheSize);
    
    // Generate random access sequence
    this.accessSequence = this.generateAccessSequence(sequenceLength);
    this.maxStep = this.accessSequence.length - 1;
    
    // Build initial step history
    this.buildStepHistory();
  }

  private createCacheInstance(policyName: PagingPolicyName, capacity: number): CacheInstance {
    switch (policyName) {
      case 'LRU':
        return new LRUCache(capacity);
      case 'FIFO':
        return new FIFOCache(capacity);
      case 'Clock':
        return new ClockCache(capacity);
      case 'Random':
        return new RandomCache(capacity);
      case 'Optimal':
        // For optimal cache, we need to provide the entire sequence
        return new OptimalCache(capacity, this.accessSequence);
      case '2Q':
        return new Simplified2QCache(capacity);
      default:
        throw new Error(`Unknown cache policy: ${policyName}`);
    }
  }

  private generateAccessSequence(length: number): (string | number)[] {
    const sequence: (string | number)[] = [];
    // Generate values from a limited set to ensure some hits
    const possibleValues = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * possibleValues.length);
      sequence.push(possibleValues[randomIndex]);
    }
    
    return sequence;
  }

  private buildStepHistory(): void {
    // Reset caches
    this.cache1.reset();
    this.cache2.reset();
    this.stepHistory = [];

    // Rebuild optimal cache with the current sequence if needed
    if (this.policy1Name === 'Optimal') {
      this.cache1 = new OptimalCache(this.cache1.getStats?.()?.capacity || 5, this.accessSequence);
    }
    if (this.policy2Name === 'Optimal') {
      this.cache2 = new OptimalCache(this.cache2.getStats?.()?.capacity || 5, this.accessSequence);
    }

    // Play through each access and record the state
    for (let i = 0; i < this.accessSequence.length; i++) {
      const accessValue = this.accessSequence[i];
      
      const cache1Result = this.cache1.checkCache(accessValue);
      const cache2Result = this.cache2.checkCache(accessValue);
      
      // Capture state after this access
      const step: ComparisonStep = {
        stepIndex: i,
        accessValue,
        cache1Result,
        cache2Result,
        cache1State: this.captureState(this.cache1),
        cache2State: this.captureState(this.cache2),
        cache1Stats: this.cache1.getStats(),
        cache2Stats: this.cache2.getStats(),
      };
      
      this.stepHistory.push(step);
    }
  }

  private captureState(cache: CacheInstance): any {
    // All cache policies should have getDisplayInfo
    const displayInfo = ('getDisplayInfo' in cache && typeof cache.getDisplayInfo === 'function') 
      ? cache.getDisplayInfo() 
      : [];
    
    // Extract values from display info or use getValues if available
    let values: (string | number | null)[] = [];
    
    if ('getValues' in cache && typeof cache.getValues === 'function') {
      values = cache.getValues();
    } else if (displayInfo && Array.isArray(displayInfo)) {
      // Extract values from display info
      values = displayInfo.map((item: any) => {
        if (item && typeof item === 'object' && 'value' in item) {
          return item.value === '---' ? null : item.value;
        }
        return null;
      });
    }
    
    return {
      displayInfo,
      values
    };
  }

  // Navigation methods
  stepForward(): boolean {
    if (this.currentStep < this.maxStep) {
      this.currentStep++;
      return true;
    }
    return false;
  }

  stepBackward(): boolean {
    if (this.currentStep > -1) {
      this.currentStep--;
      return true;
    }
    return false;
  }

  jumpToStep(step: number): boolean {
    if (step >= -1 && step <= this.maxStep) {
      this.currentStep = step;
      return true;
    }
    return false;
  }

  reset(): void {
    this.currentStep = -1;
  }

  // Getters for current state
  getCurrentStep(): number {
    return this.currentStep;
  }

  getMaxStep(): number {
    return this.maxStep;
  }

  getAccessSequence(): (string | number)[] {
    return [...this.accessSequence];
  }

  getCurrentAccessValue(): string | number | null {
    return this.currentStep >= 0 ? this.accessSequence[this.currentStep] : null;
  }

  getCurrentStepData(): ComparisonStep | null {
    return this.currentStep >= 0 ? this.stepHistory[this.currentStep] : null;
  }

  getCurrentComparison(): {
    step: number;
    accessValue: string | number | null;
          cache1: {
        name: PagingPolicyName;
        result: any;
        state: any;
        stats: any;
      };
      cache2: {
        name: PagingPolicyName;
        result: any;
        state: any;
        stats: any;
      };
  } | null {
    if (this.currentStep < 0) {
      // Before first access - show initial empty state
      return {
        step: -1,
        accessValue: null,
        cache1: {
          name: this.policy1Name,
          result: null,
          state: { values: Array(5).fill(null), displayInfo: [] },
          stats: {
            totalAccesses: 0,
            hits: 0,
            misses: 0,
            hitRate: 0,
            capacity: 5,
            occupancy: 0
          }
        },
        cache2: {
          name: this.policy2Name,
          result: null,
          state: { values: Array(5).fill(null), displayInfo: [] },
          stats: {
            totalAccesses: 0,
            hits: 0,
            misses: 0,
            hitRate: 0,
            capacity: 5,
            occupancy: 0
          }
        }
      };
    }

    const stepData = this.stepHistory[this.currentStep];
    if (!stepData) return null;

    return {
      step: this.currentStep,
      accessValue: stepData.accessValue,
      cache1: {
        name: this.policy1Name,
        result: stepData.cache1Result,
        state: stepData.cache1State,
        stats: stepData.cache1Stats,
      },
      cache2: {
        name: this.policy2Name,
        result: stepData.cache2Result,
        state: stepData.cache2State,
        stats: stepData.cache2Stats,
      },
    };
  }

  // Method to generate a new random sequence
  generateNewSequence(length: number = 10): void {
    this.accessSequence = this.generateAccessSequence(length);
    this.maxStep = this.accessSequence.length - 1;
    this.currentStep = -1;
    this.buildStepHistory();
  }

  // Method to set a custom sequence
  setCustomSequence(sequence: (string | number)[]): void {
    this.accessSequence = [...sequence];
    this.maxStep = this.accessSequence.length - 1;
    this.currentStep = -1;
    this.buildStepHistory();
  }

  // Method to update policies without recreating the controller
  updatePolicies(policy1: PagingPolicyName, policy2: PagingPolicyName): void {
    this.policy1Name = policy1;
    this.policy2Name = policy2;
    
    // Recreate cache instances with new policies
    this.cache1 = this.createCacheInstance(policy1, this.cache1.getStats?.()?.capacity || 5);
    this.cache2 = this.createCacheInstance(policy2, this.cache2.getStats?.()?.capacity || 5);
    
    // Rebuild step history with new caches but keep the same access sequence
    this.buildStepHistory();
  }

  // Get comparison summary
  getComparisonSummary(): {
    policy1: PagingPolicyName;
    policy2: PagingPolicyName;
    sequenceLength: number;
    finalStats: {
      cache1: any;
      cache2: any;
    };
  } {
    const finalStep = this.stepHistory[this.stepHistory.length - 1];
    
    return {
      policy1: this.policy1Name,
      policy2: this.policy2Name,
      sequenceLength: this.accessSequence.length,
      finalStats: {
        cache1: finalStep?.cache1Stats || {},
        cache2: finalStep?.cache2Stats || {},
      },
    };
  }
} 
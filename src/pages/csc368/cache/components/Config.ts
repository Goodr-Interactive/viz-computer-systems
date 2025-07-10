export const stageSizesConfig = {
  processorChip: {
    width: 300,
    borderStyle: "dashed",
    borderColor: "gray-400",
  },
  cpu: {
    width: 60,
    height: 50,
    borderStyle: "solid",
    borderColor: "gray-400",
  },
  l1Cache: {
    width: 60,
    height: 60,
    borderStyle: "solid",
    borderColor: "gray-400",
  },
  l2Cache: {
    width: 120,
    height: 120,
    borderStyle: "solid",
    borderColor: "gray-400",
  },
  mainMemory: {
    width: 180,
    height: 180,
    borderStyle: "solid",
    borderColor: "gray-400",
  },
};

export const latencyConfigDefaults = {
  l1: 1,
  l2: 10,
  l3: 30,
  ram: 300,
};

export const latencyConfigUIEnabled = false; // Added flag to enable/disable latency config UI
export const accessCountsUIEnabled = true; // Added flag to enable/disable access counts visualization

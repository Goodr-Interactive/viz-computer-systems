export const stageSizesConfig = {
  processorChip: {
    width: 400,
    borderStyle: "dashed",
    borderColor: "gray-400",
  },
  cpu: {
    width: 100,
    height: 75,
    borderStyle: "solid",
    borderColor: "gray-400",
  },
  l1Cache: {
    width: 100,
    height: 100,
    borderStyle: "solid",
    borderColor: "gray-400",
  },
  l2Cache: {
    width: 200,
    height: 200,
    borderStyle: "solid",
    borderColor: "gray-400",
  },
  mainMemory: {
    width: 300,
    height: 300,
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

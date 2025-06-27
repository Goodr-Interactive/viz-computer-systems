import { faker } from "@faker-js/faker";

faker.seed(494);

const generateFoodText = (): string => {
  const foodMethods = [
    () => faker.food.adjective(),
    () => faker.food.fruit(),
    () => faker.food.ingredient(),
    () => faker.food.spice(),
    () => faker.food.meat(),
    () => faker.food.vegetable(),
  ];

  const words: string[] = [];
  for (let i = 0; i < 50; i++) {
    const randomMethod = foodMethods[Math.floor(faker.number.float() * foodMethods.length)];
    words.push(randomMethod());
  }

  return words.join(" ");
};

export interface FileConfig {
  path: string;
  blocks: number;
  type?: "text" | "base64";
  content?: string;
}

export interface FileSystemConfig {
  dataBlocks: number;
  totalInodes: number;
  files: FileConfig[];
  blockSize: number;
  inodeSize: number;
}

export const FILE_SYSTEM_CONFIG: FileSystemConfig = {
  // Initialize filesystem with 64 data blocks and 5 inode blocks
  // Each block can hold 32 inodes (4096/128 = 32 inodes per block)
  // So 5 blocks = 160 inodes total
  dataBlocks: 64,
  totalInodes: 80,
  blockSize: 4096,
  inodeSize: 256,

  files: [
    {
      path: "persistence/storage/ssd_internals.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/locks/deadlock_avoidance.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/memory/malloc_impl.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/filesystems/journaling.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/synchronization/semaphores.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/paging/page_replacement.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/recovery/checkpoint_rollback.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/scheduling/lottery_scheduling.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/thread_creation.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/storage/flash_translation.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/context_switch.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/locks/lock_free_structures.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/filesystems/copy_on_write.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/memory/segmentation.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/synchronization/readers_writers.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/directory_traversal.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/scheduling/fcfs_scheduling.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/parallel/work_stealing.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/storage/disk_scheduling.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/paging/tlb_management.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/locks/spinlock.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/recovery/log_structured.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/memory/address_spaces.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/synchronization/barriers.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/filesystems/ext4_design.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/scheduling/round_robin.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/atomic_operations.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/storage/raid_levels.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/paging/demand_paging.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/locks/mutex_impl.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/recovery/write_ahead_logging.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    { path: "virtualization/fork_exec.txt", blocks: 1, type: "text", content: generateFoodText() },
    {
      path: "concurrency/synchronization/cond_variables.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/filesystems/inode_allocation.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/memory/vm_mechanism.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/parallel/thread_pools.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/file_descriptors.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/scheduling/mlfq_policy.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "concurrency/race_conditions.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "persistence/fsync_durability.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/paging/swap_mechanisms.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "virtualization/process_api.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
  ],
};

// Utility functions for link comparison
export interface LinkScenario {
  targetFile: string;
  linkPath: string;
  linkDirectory: string;
  linkFileName: string;
}

export const generateRandomLinkScenario = (): LinkScenario => {
  // Get all available files from the config
  const availableFiles = FILE_SYSTEM_CONFIG.files;

  // Pick a random file to link to
  const targetFile = availableFiles[Math.floor(faker.number.float() * availableFiles.length)];

  // Pick one of the three main directories for the link
  const mainDirectories = ["/concurrency", "/virtualization", "/persistence"];
  const linkDirectory = mainDirectories[Math.floor(faker.number.float() * mainDirectories.length)];

  // Always name the link file "copy.txt"
  const linkFileName = "copy.txt";
  const linkPath = `${linkDirectory}/${linkFileName}`;

  return {
    targetFile: "/" + targetFile.path,
    linkPath,
    linkDirectory,
    linkFileName,
  };
};

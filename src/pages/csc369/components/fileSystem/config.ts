import { faker } from "@faker-js/faker";

faker.seed(494);

const generateFoodText = (): string => {
  const foodMethods = [
    () => faker.food.adjective(),
    () => faker.food.fruit(),
    () => faker.food.vegetable(),
  ];

  const words: string[] = [];
  for (let i = 0; i < 20; i++) {
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
      path: "apple/mango/carrot.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/grape/broccoli.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/lime/spinach.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/cherry/tomato.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/peach/potato.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/plum/lettuce.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/guava/cucumber.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/kiwi/onion.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/pepper.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/mango/corn.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/cauliflower.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/grape/celery.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/cherry/radish.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/lime/eggplant.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/peach/zucchini.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/mushroom.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/kiwi/peas.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/melon/kale.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/mango/beets.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/plum/cabbage.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/grape/asparagus.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/guava/turnip.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/lime/beans.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/peach/leek.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/cherry/squash.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/kiwi/artichoke.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/strawberry.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/mango/garlic.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/plum/cilantro.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/grape/okra.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/guava/ginger.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    { path: "orange/watercress.txt", blocks: 1, type: "text", content: generateFoodText() },
    {
      path: "banana/peach/avocado.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/cherry/lemon.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/lime/blueberry.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/melon/raspberry.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/parsley.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/kiwi/pineapple.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "banana/mint.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "apple/basil.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/plum/durian.txt",
      blocks: 1,
      type: "text",
      content: generateFoodText(),
    },
    {
      path: "orange/coconut.txt",
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
  const mainDirectories = ["/apple", "/banana", "/orange"];
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

## 1. Overview

- We simulate a system with:
  - **Physical memory size** (e.g., 16 MB)
  - **Page size** (e.g., 4 KB)
  - **N levels** of page tables (usually 2 by default)
- The goal is to generate:
  1. A chain of page tables where exactly one “correct” entry at each level leads to the next level (or final data page).
  2. A random virtual address that follows this chain.
  3. The matching physical address for that virtual address.

Everything is chosen randomly (within limits), so each run gives a new scenario.

---

## 2. Key Parameters and Derived Values

1. **Page Size (bytes)**
   - Example: 4 KB (4 096 bytes)
   - Determines how many bits are used for the offset.
   - ‣ `offsetBits = log₂(4096) = 12 bits` (because 2¹² = 4096).

2. **Physical Memory Size (bytes)**
   - Example: 16 MB (16 × 1 048 576 = 16 777 216 bytes)
   - Determines how many total pages fit in RAM.
   - ‣ `totalPages = 16 777 216 / 4096 = 4096 pages`
   - ‣ `pfnBits = log₂(4096) = 12 bits` (because PFN must identify one of those 4096 frames).

3. **Entries per Page Table**
   - Each page table is one page in memory (4096 bytes).
   - Each entry is 4 bytes.
   - ‣ `numEntries = 4096 / 4 = 1024 entries per table`
   - To index 1024 entries, you need  
     ‣ `pageTableBits = log₂(1024) = 10 bits` (because 2¹⁰ = 1024).

4. **Number of Levels**
   - Default is 2 (a Page Directory + a Page Table).
   - You can configure more, but each extra level adds another 10-bit group to extract from the virtual address.

---

## 3. Picking “Reserved” PFNs

To build a valid translation path, we need exactly one PFN for each level of page table + one PFN for the final data page.

1. **Pick Random PFNs**
   - We draw random numbers between `0` and `totalPages – 1`.
   - In our example, that’s between `0` and `4095`.

2. **Avoid Collisions**
   - If a PFN is already “taken,” we skip it and draw again.
   - We repeat until we have exactly `(levels + 1)` distinct PFNs.

3. **Result**
   - Suppose we chose PFNs `[17, 203, 799]` for a 2-level system.
   - `17` → root page directory (PDBR)
   - `203` → second-level page table
   - `799` → final data page

---

## 4. Generating Each Page Table

For each level (starting at the root), we create one page-table page as follows:

1. **Decide How Many Entries to Put (`numEntriesPerLevel`)**
   - By default, we pick 7 entries at each level (configurable).
   - These 7 entries will occupy a random contiguous block inside the 1024 possible slots.

2. **Choose a Random `startIndex`**
   - `startIndex` is where this block of 7 entries begins.
   - We randomly pick `startIndex` between `0` and `(1024 – 7)` (here, up to 1017).

3. **Fill Each of the 7 Entries**
   - For each of those 7 slots:
     1. **Pick a random candidate PFN** between `0` and `4095`.
     2. **Decide if it’s valid**:
        - If that PFN is already reserved, mark it invalid (because you can’t collide).
        - Otherwise, flip a coin with probability = `invalidEntryProbability` (e.g., 0.3).
          - If it loses the coin flip, mark invalid.
          - If it wins, mark valid and reserve that PFN for this entry.
     3. **Set `rwx`**:
        - If we’re on the final level (PTEs), pick a random permission value 0–7.
        - If we’re an intermediate level (PDEs), `rwx = null`.

4. **Insert the One “Correct” Entry**
   - Pick a random index among those 7.
   - Overwrite that entry with:
     - `pfn = nextLevelPfn` (the PFN we reserved for the next table or data page).
     - `valid = true` (must be valid).
     - If it’s the last level, pick a slightly higher `rwx` (e.g. 4–7) to ensure read permissions.

5. **Store That Page Table**
   - Now you have 7 filled entries starting at `startIndex`.
   - Keep `tablePfn = currentLevelPFN`.
   - Mark `numEntries = 7`.
   - Save it in a map so no other table can reuse these PFNs.

Repeat for each level until you’ve connected all levels down to the final data page.

---

## 5. Generating Tables on Demand

When you inspect an entry that wasn’t on the “correct” path, the system may not have built that table yet. In that case, it **generates a page table on demand**:

1. **Check for Existing Table**
   - Call `getPageTableForDisplay(pfn, currentLevel)`.
   - If the map already has a populated `PageTable` for that `pfn`, return it.

2. **Generate a New Table**
   - If there’s no existing table (or it’s empty), call `populatePageTableOnDemand(pfn, currentLevel)`.
   - This method does:
     1. **Ensure `currentLevel < pageTableLevels`** (no extra levels beyond the configured ones).
     2. **Pick a random `startIndex`** between `0` and `(1024 – numEntriesPerLevel)`—just like the initial tables.
     3. **Fill `numEntriesPerLevel` entries**:
        - For each entry:
          - Pick a random PFN (`0` to `4095`).
          - Mark invalid if PFN is already reserved, or by flipping against `invalidEntryProbability`.
          - If it’s the last level, assign a random `rwx` (0–7). If intermediate, `rwx = null`.
          - Reserve valid PFNs in the core map to avoid collisions.

3. **Return the Generated Table**

# Coherence Documentation

Each variable occupies exactly one byte in memory.
Variable addresses are manually assigned and can overlap (allowing true sharing).

The cache block size is fixed (CACHE_BLOCK_SIZE = 8), and blocks are indexed by integer division of the address.

Variables are not allowed to span multiple bytes (no size property).

The visualization only shows direct mapping of variables to bytes; no support for structs, arrays, or complex types.

The system does not model cache associativity, replacement policies, or multi-level caches.

All memory accesses are treated as if they are writes (no distinction between read/write in the visualization).

The address range is limited (0–255), and input validation is minimal.

Each core has its own list of variables, but variables can be assigned to the same address for sharing.

The UI does not model cache coherence protocols (MESI, MOESI, etc.), only highlights sharing scenarios.

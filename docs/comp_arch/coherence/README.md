# Coherence Documentation

Coherence corresponds with Week 7 of CSC368 discussing Cache Coherence. Here, my visualization looks into MSI, MOSI, and MOESI protocols further. 

Goal: build an interactive state diagram that reflects cache block state transitions under MSI (or later, MOESI) coherence protocols. These protocols have well-defined finite state machines (FSMs), where events like processor reads (PrRd) or bus reads (BusRd) trigger transitions between states like I, S, M.

I will have three different "systems" utilizing MSI, MOSI, and MOESI. Each of the systems will have the ability for users to learn more about the systems. 

I will also have a cache block at the bottom of the 

Users need to:
- See cache contents per core
- Watch registers change due to reads/writes
- Observe data transfer via bus (e.g., from cache-to-cache or cache-to-memory)
- Understand miss types: true sharing, false sharing, etc.
- Compare behavior under MSI vs MOESI vs MOSI


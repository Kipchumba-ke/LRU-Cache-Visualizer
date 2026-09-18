# LRU Cache Visualizer

An interactive, in-browser visualizer for the Least Recently Used (LRU) cache eviction algorithm, built with plain HTML, CSS, and JavaScript. It models the cache as a hash map combined with a doubly linked list and lets you watch both structures update in real time as you run operations.

## Overview

A cache with a fixed capacity needs a rule for deciding what to remove when it's full. LRU removes whatever item has gone the longest without being accessed. This project makes that rule visible: every `GET` and `PUT` call redraws the linked list, the hash map table, the pointer inspector, and an operation log, so you can see exactly how nodes move, get promoted, or get evicted.

## Features

- **Live doubly linked list** showing node order from most recently used (head) to least recently used (tail), including each node's `prev` and `next` pointers
- **Hash map table** mapping each key to its value and underlying node reference
- **PUT(key, value)** form for inserting new entries or updating existing ones
- **GET(key)** form for reading a value and promoting it to the head of the list
- **Adjustable capacity** (1–10) with automatic eviction when the cache shrinks below its current size
- **Stats dashboard**: capacity, current size, fill percentage, total operations, and hit rate
- **Pointer inspector** showing the current head, tail, hit count, and miss count
- **Operation log** of recent GET/PUT/capacity events with timestamps
- **Execution trace** with back/next controls to step through the history of operations
- **Guided practice panel** with a pre-built sequence of steps you can click through to see a worked example
- **Reset button** to clear the cache and start over

## How It Works

The core algorithm is implemented independently of the UI, in two classes:

- `CacheNode` — a node in the doubly linked list, storing a key, value, and `prev`/`next` pointers
- `LRUCache` — the cache itself, combining a `Map` (for O(1) key lookup) with a doubly linked list (for O(1) reordering and eviction)

Key operations:

| Method | Behavior |
|---|---|
| `get(key)` | Returns the value for `key` if present and moves that node to the head (most recently used). Returns a miss if the key isn't found. |
| `put(key, value)` | Inserts a new key/value pair at the head, or updates and promotes an existing key. If capacity is exceeded, removes the tail node (least recently used). |
| `resize(capacity)` | Changes the capacity, evicting from the tail as needed if the new capacity is smaller than the current size. |
| `clear()` | Empties the cache. |
| `toArray()` | Returns all nodes in order from head to tail, used for rendering. |

A separate `CacheDashboard` class owns all DOM rendering and event handling — form submissions, capacity controls, the operation log, the trace stepper, and the guided example — keeping the algorithm free of any UI concerns.

## File Structure

```
.
├── index.html   # Page structure and layout
├── style.css    # Styling 
└── script.js    # LRUCache algorithm + CacheDashboard UI logic
```

## Usage

1. Open `https://lrucachevisualize.netlify.app/` in a browser.
2. Use the **PUT** form to insert a key/value pair.
3. Use the **GET** form to read a key and promote it to most-recently-used.
4. Adjust **capacity** with the +/− controls or by typing a value; if the new capacity is smaller than the current size, the least recently used items are evicted automatically.
5. Click through the **guided practice** steps to see a scripted example of insertions, a hit, an eviction, and a miss.
6. Use the **execution trace** controls to step back and forward through the history of operations you've run.
7. Click **Reset** to clear the cache and start fresh.

## Tech Stack

- Vanilla JavaScript (ES modules)
- HTML5
- CSS3

No external libraries or frameworks are used.

## Possible Extensions

- Persist cache state across page reloads (e.g., via `localStorage`)
- Add an LFU (Least Frequently Used) mode for comparison
- Visualize time/space complexity annotations alongside each operation
- Export the operation log as a downloadable file
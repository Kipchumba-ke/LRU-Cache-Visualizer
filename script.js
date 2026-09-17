export class CacheNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
    this.id = `node-${CacheNode.nextId++}`;
  }
}

CacheNode.nextId = 1;

export class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.Map = new Map();
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  get(key) {
    const node = this.Map.get(key);
    if (!node) return {hit:false, value: undefined, node: null};
    this.moveToHead(node);
    return {hit:true, value: node.value, node: node};
  }

  put(key, value) {
    const existingNode = this.Map.get(key);
    if (existingNode) {
      existingNode.value = value;
      this.moveToHead(existingNode);
      return {type: 'update', node: existingNode, evicted: null};
    }
    const node = new CacheNode(key, value);
    this.Map.set(key, node);
    this.addToHead(node);
    this.size += 1;

    let evicted = null;
    if (this.size > this.capacity) {
      evicted = this.removeTail();
    }
    return {type: 'insert', node, evicted};
  }

    setCapacityLimit(capacity) {
      const numericCapacity = Number(capacity);
      if (!Number.isInteger(numericCapacity) || numericCapacity < 1) {
        throw new Error('Capacity must be a positive integer.');
      }
      this.capacity = numericCapacity;
    }

    resize(capacity) {
      this.setCapacityLimit(capacity);
      const evicted = [];
      while (this.size > this.capacity) {
        evicted.push(this.removeTail());
      }
      return evicted;
    }

    addToHead(node) {
      node.prev = null;
      node.next = this.head;
      if (this.head) {
        this.head.prev = node;
      }else {
        this.tail = node;
      }
      this.head = node;
    }

    removeNode(node) {
      if (node.prev) {
        node.prev.next = node.next;
      } else {
        this.head = node.next;
      }
      if (node.next) {
        node.next.prev = node.prev;
      } else {
        this.tail = node.prev;
      }
      node.prev = null;
      node.next = null;
    }

    moveToHead(node) {
      if(node === this.head) return;
      this.removeNode(node);
      this.addToHead(node);
    }
    
    removeTail() {
      if (!this.tail) return null;
      const node = this.tail;
      this.removeNode(node);
      this.Map.delete(node.key);
      this.size -= 1;
      return node;
    }

    clear() {
      this.Map.clear();
      this.head = null;
      this.tail = null;
      this.size = 0;
    }

    toArray() {
      const nodes = [];
      let current = this.head;
      while (current) {
        nodes.push(current);
        current = current.next;
      }
      return nodes;
    }
}

class CacheDashboard {
  constructor(cache) {
    this.cache = cache;
    this.operations = 0;
    this.hits = 0;
    this.misses = 0;
    this.logs = [];
    this.selectedKey = null;
    this.isAnimating = true;
    this.trace = [];
    this.traceIndex = -1;
    this.elements = this.getElements();
    this.bindEvents();
    this.render();
  }

  getElements(){
    const get = document.getElementById(id)
    return {
      capacityStat: get("capacity-stat"),
      sizeStat: get("size-stat"),
      fillStat: get("fill-stat"),
      operationsStat: get("operations-stat"),
      hitRateStat: get("hit-rate-stat"),
      capacityInput: get("capacity-input"),
      capacityProgress: get("capacity-progress"),
      putForm: get("put-form"),
      putKey: get("put-key"),
      putValue: get("put-value"),
      getForm: get("get-form"),
      getKey: get("get-key"),
      resetButton: get("reset-button"),
      decreaseCapacity: get("decrease-capacity"),
      increaseCapacity: get("increase-capacity"),
      status: get("status-message"),
      chain: get("cache-chain"),
      mapCount: get("map-count"),
      mapBody: get("map-body"),
      log: get("operation-log"),
      headPointer: get("head-pointer"),
      tailPointer: get("tail-pointer"),
      hitsPointer: get("hits-pointer"),
      missesPointer: get("misses-pointer"),
      inspector: get("node-inspector"),
      steps: get("example-steps"),
      traceTitle: get("trace-title"),
      traceDetail: get("trace-detail"),
      traceBack: get("trace-back"),
      traceNext: get("trace-next"),
    }
  }

  bindEvents(){
    this.elements.putForm.addEventListener("submit", (e)=>{
      e.preventDefault();
      const key = this.elements.putKey.value.trim();
      const value = this.elements.putValue.value.trim();
      if(!key || !value) return;
      this.put(key, value)
      this.elements.putForm.reset();
      this.elements.putKey.focus()
    })

    this.elements.getForm.addEventListener("submit", (e)=>{
      e.preventDefault()
      const key = this.elements.getKey.value.trim();
      if(!key) return;
      this.get(key);
      this.elements.getForm.reset()
      this.elements.getKey.focus()
    })

    this.elements.capacityInput.addEventListener("change", ()=>{
      this.resize(this.elements.capacityInput.value)
    })

    this.decreaseCapacity.addEventListener("click", ()=> this.resize(this.cache.capacity - 1));
    this.increaseCapacity.addEventListener("click", ()=> this.resize(this.cache.capacity + 1));
    this.elements.resetButton.addEventListener("click", ()=> this.reset());
    this.elements.traceBack.addEventListener("click", ()=> this.moveTrace(-1));
    this.elements.traceNext.addEventListener("click", ()=> this.moveTrace(1));
  }

  put(key, value) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.operations += 1;
    this.selectedKey = key;

    const before = this.cache.toArray().map((node)=> node.key).join(" ⇄ ") || "empty";
    const result = this.cache.put(key, value);
    this.recordTrace(`PUT(${key}, ${value})`, `Before: ${before}`, result.evicted ? `Evicted ${result.evicted.key}` : `Head is now ${key}`)
    this.render()

    const nodeElement = this.findeNodeElement(key);
    nodeElement?.classList.add("promote");

    if(result.evicted) {
      this.setStatus(`PUT ${key} inserted. Evicting LRU ${result.evicted.key}.`, "good");
      this.addLog("PUT", `${key} inserted · evicted ${result.evicted.key}`);
      this.findNodeElement(result.evicted.key)?.classList.add("evict");
    } else {
      this.setStatus(`PUT ${key} ${result.type === "update" ? "updated" : "inserted"} → MRU.`, "good");
      this.addLog("PUT", `${key} ${result.type === "update" ? "updated" : "inserted"} → MRU`);
    }

    this.finishAfterAnimation(600)
  }

  get(key) {
    if (this.isAnimating) return;
    this.isAnimating= true;
    this.operations += 1;

    const before = this.cache.toArray().map((node) => node.key).join(" ⇄ ") || "empty";
    const result = this.cache.get(key);

    if(!result.hit) {
      this.misses += 1;
      this.selectedKey = null;
      this.setStatus(`GET ${key}: MISS — key not found.`, "bad");
      this.addLog("GET", `MISS · ${key}`);
      this.recordTrace(`GET(${key})`, `Before: ${before}`, "MISS — list unchanged");
      this.isAnimating = false;
      this.render();
      return;
    }

    this.hits += 1;
    this.selectedKey = key;
    this.setStatus(`GET ${key}: HIT — ${result.value} moved to MRU.`, "good");
    this.addLog("GET", `HIT · ${key} → MRU`);
    this.recordTrace(`GET(${key})`, `Before: ${before}`, `Moved ${key} to Head / MRU`);
    this.render();
    this.findNodeElement(key)?.classList.add("promote");
    this.finishAfterAnimation(520);
  }

  resize(value){
    if(this.isAnimating) return;
    const capacity = Math.max(1, Math.min(10, Math.round(Number(value) || 3)));
    if (capacity === this.cache.capacity) return;

    const oldCapacity = this.cache.capacity;
    const evicted = this.cache.resize(capacity);
    this.selectedKey = null;
    this.recordTrace(`RESIZE(${capacity})`, `Capacity changed from ${oldCapacity}`, evicted.length ? `Evicted ${evicted.map((node) => node.key).join(", ")}` : "No eviction");
    this.render();

    if (evicted.length) {
      this.setStatus(`Capacity ${capacity}. Evicted ${evicted.map((node) => node.key).join(", ")}.`, "good");
      this.addLog("CAPACITY", `${oldCapacity} → ${capacity} · evicted ${evicted.map((node) => node.key).join(", ")}`);
    } else {
      this.setStatus(`Capacity changed from ${oldCapacity} to ${capacity}.`, "good");
      this.addLog("CAPACITY", `${oldCapacity} → ${capacity}`);
    }
    this.render();
  }

  reset(){
    if(this.isAnimating) return;
    this.cache.clear()
    this.operations = 0
    this.hits = 0;
    this.misses = 0;
    this.logs = [];
    this.selectedKey = null;
    this.trace = [];
    this.traceIndex = -1;
    this.setStatus("Cache reset. Ready for new operations.")
    this.render()
  }

  recordTrace(title, detail, result){
    this.trace.push({title, detail, result})
    this.traceIndex = this.trace.length -1
    this.renderTrace()
  }

  moveTrace(direction){
    if (!this.trace.length) return;
    this.traceIndex = Math.max(0, Math.min(this.trace.length - 1, this.traceIndex + direction));
    this.renderTrace()
  }

  renderTrace(){
    const entry = this.trace[this.traceIndex];
    this.elements.traceTitle.textContent = entry ? `${this.traceIndex + 1}. ${entry.title}` : "Waiting for an operation";
    this.elements.traceDetail.textContent = entry ? `${entry.detail} · ${entry.result}` : "Run a GET or PUT to see the cache change.";
    this.elements.traceBack.disabled = this.traceIndex <= 0;
    this.elements.traceNext.disabled = this.traceIndex < 0 || this.traceIndex >= this.trace.length - 1;
  }

  finishAfterAnimation(delay) {
    window.setTimeout(() => {
      this.isAnimating = false;
      this.render();
    }, delay);
  }

  setStatus(message, type = "") {
    this.elements.status.textContent = message;
    this.elements.status.className = `status-message ${type}`.trim();
  }

  addLog(operation, message) {
    this.logs.unshift({ operation, message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) });
    this.logs = this.logs.slice(0, 8);
  }

  render() {
    this.renderStats();
    this.renderList();
    this.renderInspector();
    this.renderTrace();
  }

  renderStats() {
    const fill = Math.round((this.cache.size / this.cache.capacity) * 100);
    const hitRate = this.hits + this.misses ? Math.round((this.hits / (this.hits + this.misses)) * 100) : 0;
    this.elements.capacityStat.textContent = this.cache.capacity;
    this.elements.sizeStat.textContent = this.cache.size;
    this.elements.fillStat.textContent = `${fill}% full`;
    this.elements.operationsStat.textContent = this.operations;
    this.elements.hitRateStat.textContent = `${hitRate}%`;
    this.elements.capacityProgress.style.width = `${fill}%`;
    this.elements.headPointer.textContent = this.cache.head?.key ?? "null";
    this.elements.tailPointer.textContent = this.cache.tail?.key ?? "null";
    this.elements.hitsPointer.textContent = this.hits;
    this.elements.missesPointer.textContent = this.misses;
    this.elements.mapCount.textContent = `${this.cache.map.size} entr${this.cache.map.size === 1 ? "y" : "ies"}`;
  }

  renderList() {
    this.elements.chain.replaceChildren();
    const nodes = this.cache.toArray();

    if (!nodes.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = "⌘<br><strong>Cache is empty</strong><br><span>Use PUT to add your first node.</span>";
      this.elements.chain.append(empty);
      return;
    }

    nodes.forEach((node, index) => {
      if (index > 0) {
        const arrow = document.createElement("div");
        arrow.className = "chain-arrow";
        arrow.textContent = "⇄";
        this.elements.chain.append(arrow);
      }
      this.elements.chain.append(this.createNodeElement(node, index, nodes.length));
    });
  }
}
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
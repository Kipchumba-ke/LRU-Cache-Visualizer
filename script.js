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
  }}
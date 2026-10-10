import { Order, Product, Table, Waiter, OfflineOrder } from "../types";

const OFFLINE_ORDERS_KEY = "inpos_offline_orders_queue";
const OFFLINE_MUTATIONS_KEY = "inpos_offline_mutations_queue";
const OFFLINE_TABLES_KEY = "inpos_offline_tables_cache";
const OFFLINE_PRODUCTS_KEY = "inpos_offline_products_cache";
const OFFLINE_CATEGORIES_KEY = "pos_cached_categories";
const OFFLINE_WAITERS_KEY = "inpos_offline_waiters_cache";
const OFFLINE_ROLES_KEY = "inpos_roles";
const OFFLINE_LAST_SYNC_KEY = "inpos_last_sync_timestamp";

export interface EntityMutation {
  entity: "category" | "product" | "role" | "waiter";
  action: "upsert" | "delete";
  id: string;
  data?: any;
  timestamp: string;
}

export type SyncStatus = {
  isOnline: boolean;
  pendingCount: number;
  ordersCount: number;
  mutationsCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncedJustNow?: number;
};

type SyncListener = (status: SyncStatus) => void;

const listeners: Set<SyncListener> = new Set();
let isSyncingInProgress = false;
let currentIsOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

// 1. Notify all subscribed UI components
export function notifyListeners(syncedJustNow?: number) {
  const orders = getOfflineOrdersQueue();
  const mutations = getOfflineMutationsQueue();
  const lastSyncTime = localStorage.getItem(OFFLINE_LAST_SYNC_KEY);
  
  const status: SyncStatus = {
    isOnline: currentIsOnline,
    pendingCount: orders.length + mutations.length,
    ordersCount: orders.length,
    mutationsCount: mutations.length,
    isSyncing: isSyncingInProgress,
    lastSyncTime,
    syncedJustNow
  };

  listeners.forEach(fn => {
    try {
      fn(status);
    } catch (e) {
      console.error("Error in sync listener:", e);
    }
  });
}

// 2. Orders Queue Management
export function getOfflineOrdersQueue(): OfflineOrder[] {
  try {
    const raw = localStorage.getItem(OFFLINE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOfflineOrder(order: Order, action: 'create' | 'finalize' | 'kitchen_update' = 'finalize'): OfflineOrder {
  const queue = getOfflineOrdersQueue();
  
  const offlineOrder: OfflineOrder = {
    ...order,
    offlineSavedAt: new Date().toISOString(),
    offlineAction: action
  };

  const existingIdx = queue.findIndex(o => o.id === order.id);
  if (existingIdx >= 0) {
    queue[existingIdx] = offlineOrder;
  } else {
    queue.push(offlineOrder);
  }

  localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(queue));
  updateOfflineTableStatus(order.tableNumber, action === 'finalize' ? 'available' : 'occupied', order.waiterId, order.waiterName, order.id);

  notifyListeners();
  return offlineOrder;
}

export function removeOfflineOrders(orderIds: string[]) {
  const queue = getOfflineOrdersQueue();
  const remaining = queue.filter(o => !orderIds.includes(o.id));
  localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(remaining));
  notifyListeners();
}

// 3. Entity Mutations Queue (Categories, Products, Roles, Employees)
export function getOfflineMutationsQueue(): EntityMutation[] {
  try {
    const raw = localStorage.getItem(OFFLINE_MUTATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOfflineMutation(
  entity: "category" | "product" | "role" | "waiter",
  action: "upsert" | "delete",
  id: string,
  data?: any
) {
  const queue = getOfflineMutationsQueue();
  
  const mutation: EntityMutation = {
    entity,
    action,
    id,
    data,
    timestamp: new Date().toISOString()
  };

  // Dedup: replace pending mutation for same entity and id
  const existingIdx = queue.findIndex(m => m.entity === entity && m.id === id);
  if (existingIdx >= 0) {
    queue[existingIdx] = mutation;
  } else {
    queue.push(mutation);
  }

  localStorage.setItem(OFFLINE_MUTATIONS_KEY, JSON.stringify(queue));
  notifyListeners();
}

export function removeOfflineMutations(entity: string, ids: string[]) {
  const queue = getOfflineMutationsQueue();
  const remaining = queue.filter(m => !(m.entity === entity && ids.includes(m.id)));
  localStorage.setItem(OFFLINE_MUTATIONS_KEY, JSON.stringify(remaining));
  notifyListeners();
}

// 4. Cache Helpers for Local Persistence
export function cacheLocalCategories(cats: any[]) {
  try {
    localStorage.setItem(OFFLINE_CATEGORIES_KEY, JSON.stringify(cats));
  } catch (e) {}
}

export function getCachedLocalCategories(): any[] {
  try {
    const raw = localStorage.getItem(OFFLINE_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function cacheLocalProducts(products: Product[]) {
  try {
    localStorage.setItem(OFFLINE_PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem("pos_cached_products", JSON.stringify(products));
  } catch (e) {}
}

export function getCachedLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem("pos_cached_products") || localStorage.getItem(OFFLINE_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function cacheLocalRoles(roles: any[]) {
  try {
    localStorage.setItem(OFFLINE_ROLES_KEY, JSON.stringify(roles));
  } catch (e) {}
}

export function getCachedLocalRoles(): any[] {
  try {
    const raw = localStorage.getItem(OFFLINE_ROLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function cacheLocalTables(tables: Table[]) {
  try {
    localStorage.setItem(OFFLINE_TABLES_KEY, JSON.stringify(tables));
  } catch (e) {}
}

export function getCachedLocalTables(): Table[] {
  try {
    const raw = localStorage.getItem(OFFLINE_TABLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function updateOfflineTableStatus(
  tableNumber: string, 
  status: 'available' | 'occupied', 
  waiterId?: string, 
  waiterName?: string, 
  orderId?: string
) {
  try {
    const tables = getCachedLocalTables();
    const updated = tables.map(tbl => {
      if (String(tbl.number) === String(tableNumber) || String(tbl.id) === String(tableNumber)) {
        return {
          ...tbl,
          status,
          activeOrderId: status === 'occupied' ? orderId : undefined,
          activeWaiterId: status === 'occupied' ? waiterId : undefined,
          activeWaiterName: status === 'occupied' ? waiterName : undefined,
        };
      }
      return tbl;
    });
    cacheLocalTables(updated);
  } catch (e) {}
}

export function cacheLocalWaiters(waiters: Waiter[]) {
  try {
    localStorage.setItem(OFFLINE_WAITERS_KEY, JSON.stringify(waiters));
    localStorage.setItem("pos_cached_waiters", JSON.stringify(waiters));
  } catch (e) {}
}

export function getCachedLocalWaiters(): Waiter[] {
  try {
    const raw = localStorage.getItem("pos_cached_waiters") || localStorage.getItem(OFFLINE_WAITERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// 5. Universal Batch Synchronization to Backend
export async function syncOfflineOrdersToServer(cafeId: string = "default"): Promise<{
  success: boolean;
  syncedCount: number;
  error?: string;
}> {
  if (isSyncingInProgress) {
    return { success: false, syncedCount: 0, error: "Sync already in progress" };
  }

  const orders = getOfflineOrdersQueue();
  const mutations = getOfflineMutationsQueue();

  if (orders.length === 0 && mutations.length === 0) {
    return { success: true, syncedCount: 0 };
  }

  isSyncingInProgress = true;
  notifyListeners();

  try {
    // Group mutations by entity
    const categoriesMut = mutations.filter(m => m.entity === "category");
    const productsMut = mutations.filter(m => m.entity === "product");
    const rolesMut = mutations.filter(m => m.entity === "role");
    const waitersMut = mutations.filter(m => m.entity === "waiter");

    const payload = {
      orders,
      categories: categoriesMut.map(m => ({ action: m.action, id: m.id, data: m.data })),
      products: productsMut.map(m => ({ action: m.action, id: m.id, data: m.data })),
      roles: rolesMut.map(m => ({ action: m.action, id: m.id, data: m.data })),
      waiters: waitersMut.map(m => ({ action: m.action, id: m.id, data: m.data })),
      sentAt: new Date().toISOString()
    };

    const res = await fetch("/api/sync/offline-batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cafe-id": cafeId
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success) {
      currentIsOnline = true;
      const syncedIds = data.syncedIds || {};
      
      // Remove synced orders
      if (Array.isArray(syncedIds.orders) && syncedIds.orders.length > 0) {
        removeOfflineOrders(syncedIds.orders);
      } else if (orders.length > 0) {
        removeOfflineOrders(orders.map(o => o.id));
      }

      // Remove synced mutations
      if (Array.isArray(syncedIds.categories)) removeOfflineMutations("category", syncedIds.categories);
      if (Array.isArray(syncedIds.products)) removeOfflineMutations("product", syncedIds.products);
      if (Array.isArray(syncedIds.roles)) removeOfflineMutations("role", syncedIds.roles);
      if (Array.isArray(syncedIds.waiters)) removeOfflineMutations("waiter", syncedIds.waiters);

      // If fallback cleared everything
      if (!syncedIds.categories && !syncedIds.products && !syncedIds.roles && !syncedIds.waiters) {
        localStorage.setItem(OFFLINE_MUTATIONS_KEY, "[]");
      }

      const now = new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      localStorage.setItem(OFFLINE_LAST_SYNC_KEY, now);
      
      isSyncingInProgress = false;
      const count = data.syncedCount || (orders.length + mutations.length);
      notifyListeners(count);
      return { success: true, syncedCount: count };
    } else {
      throw new Error(data.message || "Failed to process offline batch");
    }
  } catch (err: any) {
    console.warn("Offline sync warning (will retry automatically):", err.message);
    isSyncingInProgress = false;
    notifyListeners();
    return { success: false, syncedCount: 0, error: err.message || "Sync failed" };
  }
}

// 6. Network Detection & Auto-Sync Heartbeat
export async function checkNetworkHealth(): Promise<boolean> {
  try {
    const res = await fetch("/api/sync/ping", { method: "GET", cache: "no-store" });
    const isOk = res.ok;
    if (currentIsOnline !== isOk) {
      currentIsOnline = isOk;
      notifyListeners();
    }
    return isOk;
  } catch {
    if (currentIsOnline !== false) {
      currentIsOnline = false;
      notifyListeners();
    }
    return false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    currentIsOnline = true;
    notifyListeners();
    setTimeout(() => {
      syncOfflineOrdersToServer();
    }, 1200);
  });

  window.addEventListener("offline", () => {
    currentIsOnline = false;
    notifyListeners();
  });

  // Periodic heartbeat: check connectivity and sync if items are pending
  setInterval(() => {
    checkNetworkHealth().then(online => {
      if (online && (getOfflineOrdersQueue().length > 0 || getOfflineMutationsQueue().length > 0) && !isSyncingInProgress) {
        syncOfflineOrdersToServer();
      }
    });
  }, 20000);
}

// 7. Subscription Hook Helper
export function subscribeToSync(listener: SyncListener): () => void {
  listeners.add(listener);
  listener({
    isOnline: currentIsOnline,
    pendingCount: getOfflineOrdersQueue().length + getOfflineMutationsQueue().length,
    ordersCount: getOfflineOrdersQueue().length,
    mutationsCount: getOfflineMutationsQueue().length,
    isSyncing: isSyncingInProgress,
    lastSyncTime: localStorage.getItem(OFFLINE_LAST_SYNC_KEY)
  });

  return () => {
    listeners.delete(listener);
  };
}

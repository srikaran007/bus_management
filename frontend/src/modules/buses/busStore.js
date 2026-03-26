import api from "../../services/api";
import { extractItems } from "../../services/listUtils";

const BUS_STORAGE_KEY = "bus_management_buses";

const defaultBuses = [
  {
    id: 1,
    busNumber: "TN-45-AB-1234",
    busName: "College Bus 1",
    capacity: 52,
    status: "Active"
  },
  {
    id: 2,
    busNumber: "TN-45-AB-3312",
    busName: "College Bus 2",
    capacity: 46,
    status: "Maintenance"
  }
];

const readBuses = () => {
  const raw = localStorage.getItem(BUS_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (_error) {
    return null;
  }
};

const saveBuses = (buses) => {
  localStorage.setItem(BUS_STORAGE_KEY, JSON.stringify(buses));
};

const ensureLocalData = () => {
  const existing = readBuses();
  if (existing) return existing;
  saveBuses(defaultBuses);
  return defaultBuses;
};

const fromApiBus = (bus) => ({
  id: bus._id || bus.id,
  busNumber: bus.busNumber,
  busName: bus.busName,
  capacity: bus.capacity,
  status: bus.status
});

export const getBuses = async () => {
  try {
    const response = await api.get("/buses");
    const mapped = extractItems(response.data).map(fromApiBus);
    saveBuses(mapped);
    return mapped;
  } catch (_error) {
    return ensureLocalData();
  }
};

export const addBusRecord = async (payload) => {
  try {
    const response = await api.post("/buses", {
      busNumber: payload.busNumber,
      busName: payload.busName,
      capacity: Number(payload.capacity),
      status: payload.status
    });
    const created = fromApiBus(response.data);
    const current = ensureLocalData();
    const updated = [created, ...current.filter((b) => b.id !== created.id)];
    saveBuses(updated);
    return created;
  } catch (_error) {
    const buses = ensureLocalData();
    const nextId = buses.length ? Math.max(...buses.map((bus) => Number(bus.id) || 0)) + 1 : 1;
    const newBus = { id: nextId, ...payload };
    saveBuses([newBus, ...buses]);
    return newBus;
  }
};

export const updateBusRecord = async (id, updates) => {
  try {
    const response = await api.put(`/buses/${id}`, {
      busName: updates.busName,
      capacity: Number(updates.capacity),
      status: updates.status
    });
    const updatedBus = fromApiBus(response.data);
    const current = ensureLocalData();
    saveBuses(current.map((b) => (b.id === id ? { ...b, ...updatedBus } : b)));
    return updatedBus;
  } catch (_error) {
    const current = ensureLocalData();
    const next = current.map((bus) => (bus.id === id ? { ...bus, ...updates } : bus));
    saveBuses(next);
    return next.find((bus) => bus.id === id) || null;
  }
};

export const deleteBusRecord = async (id) => {
  try {
    await api.delete(`/buses/${id}`);
  } catch (_error) {
    // fallback below
  }
  const current = ensureLocalData();
  const updated = current.filter((bus) => bus.id !== id);
  saveBuses(updated);
  return updated;
};

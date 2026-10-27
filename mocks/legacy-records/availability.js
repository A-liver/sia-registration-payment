// In-memory on/off switch. When off, the mock behaves like a legacy system that is down.
export function createAvailability(initial = true) {
  let available = initial;
  return {
    isAvailable: () => available,
    set(value) {
      available = value;
    },
  };
}

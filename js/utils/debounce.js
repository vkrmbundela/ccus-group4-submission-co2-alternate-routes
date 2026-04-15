// ===== Debounce Utility =====

/**
 * Returns a debounced version of the given function.
 * The function will only execute after `delay` ms of inactivity.
 *
 * @param {Function} fn - function to debounce
 * @param {number} delay - milliseconds to wait (default 200)
 * @returns {Function} debounced function
 */
export function debounce(fn, delay = 200) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Simple sleep utility for adding delays in execution
 */

/**
 * Pauses execution for a specified number of milliseconds
 * 
 * @param {number} delay - The delay in milliseconds
 * @returns {Promise} Promise that resolves after the specified delay
 * 
 * @example
 * await sleep(1000); // Wait for 1 second
 */
export const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export default {sleep}

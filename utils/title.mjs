/**
 * Cross-platform process title utility
 * Handles process title updates for both Windows and Linux/Unix systems
 */

import { logger } from './logger.mjs';

/**
 * Updates the process title in a cross-platform way
 * @param {string} title - The new title to set
 */
export function updateProcessTitle(title) {
    try {
        // Linux has a character limit for process titles (usually 15-16 chars for the process name)
        // but Node.js handles this internally. We'll truncate if too long to be safe.
        const maxLength = process.platform === 'linux' ? 80 : 200;
        const truncatedTitle = title.length > maxLength ? title.substring(0, maxLength - 3) + '...' : title;
        
        process.title = truncatedTitle;
        
        // On some Linux systems, the title might not update in all terminal emulators
        // Log the progress as a fallback
        if (process.platform === 'linux') {
            logger.debug(`Process title: ${truncatedTitle}`);
        }
    } catch (error) {
        // If setting process title fails, just log it as debug (not critical)
        logger.debug(`Could not set process title: ${error.message}`);
    }
}

/**
 * Creates a formatted title showing current progress
 * @param {number} round - Current round number
 * @param {number} roundSize - Number of wallets per round
 * @returns {string} Formatted title string
 */
export function createProgressTitle(round, roundSize) {
    const walletsGenerated = round * roundSize;
    return `Krypto Luck | Generated: ${walletsGenerated.toLocaleString()} wallets`;
}

export default { updateProcessTitle, createProgressTitle };
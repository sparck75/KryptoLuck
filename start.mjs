#!/usr/bin/env node

/**
 * Cross-platform startup script for KryptoLuck
 * Automatically detects platform and provides appropriate guidance
 */

import { logger } from './utils/logger.mjs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎲 KryptoLuck - Cross-Platform Startup');
console.log('=====================================\n');

console.log(`Platform: ${process.platform}`);
console.log(`Node.js: ${process.version}`);
console.log(`Architecture: ${process.arch}\n`);

console.log('Available modes:');
console.log('  1. Offline mode (no internet required)');
console.log('  2. Online mode (requires Infura API key)\n');

console.log('To run:');
console.log('  npm run offline   # Start offline mode');
console.log('  npm run online    # Start online mode');

if (process.platform === 'linux') {
    console.log('\n🐧 Linux-specific notes:');
    console.log('  - Process title updates work in most terminals');
    console.log('  - Use Ctrl+C or send SIGTERM to stop gracefully');
    console.log('  - For background execution: nohup npm run offline &');
} else if (process.platform === 'win32') {
    console.log('\n🪟 Windows-specific notes:');
    console.log('  - Process title updates in terminal window title');
    console.log('  - Use Ctrl+C to stop gracefully');
} else if (process.platform === 'darwin') {
    console.log('\n🍎 macOS-specific notes:');
    console.log('  - Process title updates work in Terminal.app');
    console.log('  - Use Cmd+C or Ctrl+C to stop gracefully');
}

console.log('\n📝 Logs are written to console with timestamps');
console.log('🔧 Set LOG_LEVEL environment variable for verbosity (error/warn/info/verbose/debug)');
console.log('\nExample: LOG_LEVEL=debug npm run offline\n');
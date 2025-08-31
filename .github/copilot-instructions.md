# KryptoLuck Copilot Instructions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Dependencies
- Install dependencies:
  - `npm install` -- takes 8 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- No build process required - this is a Node.js ES6 module project that runs directly.
- No linting or testing infrastructure is currently configured.

### Running the Application
- ALWAYS install dependencies first with `npm install`.
- Test offline mode (no setup required):
  - `npm run offline` -- starts immediately, loads 10,000 rich addresses, runs indefinitely
- Test online mode (requires Infura API key):
  - Set up environment: `cp .example_env .env`
  - Edit `.env` and add your Infura API key
  - `npm run online` -- fails gracefully without valid API key, runs indefinitely with valid key
- Both modes handle CTRL-C gracefully for shutdown
- Use `LOG_LEVEL=debug npm run offline` for verbose logging

### Environment Configuration
- Copy environment template: `cp .example_env .env`
- Edit `.env` file with your Infura API key:
  ```
  INFURA_KEY=your_actual_api_key_here
  RPC=https://mainnet.infura.io/v3/
  ```
- LOG_LEVEL options: `error`, `warn`, `info` (default), `verbose`, `debug`

## Validation

### Required Validation Scenarios
After making any changes, ALWAYS run through these complete scenarios:

1. **Offline Mode Test**:
   - `npm install` (should complete in ~8 seconds)
   - `npm run offline` (should load 10,000 addresses and start generating wallets)
   - Check process title updates with wallet count
   - Verify graceful shutdown with CTRL-C

2. **Online Mode Without API Key**:
   - `npm run online` (should fail with "could not detect network" error)
   - This is expected behavior and confirms network validation works

3. **Online Mode With API Key** (if available):
   - Edit `.env` with valid Infura API key
   - `npm run online` (should connect to blockchain and start multicall operations)
   - Check process title updates with wallet count
   - Verify graceful shutdown with CTRL-C

4. **Debug Logging Test**:
   - `LOG_LEVEL=debug npm run offline` (should show verbose logging including "Reading data from disk...")

### Manual Validation Requirements
- NEVER CANCEL builds or long-running commands - the application runs indefinitely by design
- Applications start quickly (1-2 seconds) but run continuously
- Both modes should update process title with wallet generation progress
- Both modes should handle CTRL-C interruption gracefully
- Offline mode should load exactly 10,000 wallet addresses from RichEtherAddress.json

## Common Commands and Expected Results

### Dependencies
```bash
npm install
# Expected: Completes in ~8 seconds, installs 84 packages, 0 vulnerabilities
```

### Available Scripts
```bash
npm run
# Shows: start, online, offline scripts available
```

### Test Offline Mode
```bash
npm run offline
# Expected output:
# [info]: Krypto luck is initializing...
# [info]: Loading rich wallet list from: RichEtherAddress.json  
# [info]: 10000 wallet addresses loaded successfully.
# [info]: Krypto luck is running...
# (then runs indefinitely until CTRL-C)
```

### Test Online Mode (without API key)
```bash
npm run online
# Expected output:
# [info]: Krypto luck is initializing...
# [info]: Krypto luck is using provider: https://mainnet.infura.io/v3/xxx
# Error: could not detect network (event="noNetwork", code=NETWORK_ERROR)
# (this is expected behavior)
```

## Project Structure and Key Files

### Repository Root
```
KryptoLuck/
├── src/
│   ├── blockchain.mjs      # Online blockchain interaction logic
│   ├── offline.mjs         # Offline mode functionality  
│   └── create_account.mjs  # Wallet generation utilities
├── utils/
│   ├── logger.mjs          # Winston-based logging configuration
│   └── sleep.mjs           # Sleep utility function
├── luck-online.mjs         # Main script for online mode
├── luck-offline.mjs        # Main script for offline mode
├── RichEtherAddress.json   # List of 10,000 wealthy Ethereum addresses
├── .example_env            # Environment variables template
├── package.json            # Dependencies and scripts
└── README.md               # Project documentation
```

### Important Files for Development
- **Main entry points**: `luck-online.mjs`, `luck-offline.mjs`
- **Core logic**: `src/blockchain.mjs` (online mode), `src/offline.mjs` (offline mode)
- **Wallet generation**: `src/create_account.mjs` (creates random Ethereum wallets)
- **Configuration**: `.env` (from `.example_env`), `package.json`
- **Logging**: `utils/logger.mjs` (Winston with multiple levels)

### Key Dependencies
- `ethers`: Ethereum wallet generation and blockchain interaction
- `ethcall`: Multicall optimization for batch blockchain requests
- `winston`: Structured logging with timestamps
- `dotenv`: Environment variable management
- `luxon`: Date/time formatting for logs

## Development Guidelines

### Prerequisites
- Node.js 14.0 or higher (tested with Node.js 20.19.4)
- npm (comes with Node.js)
- For online mode: Infura account and API key from infura.io

### No Build Process
- This project uses ES6 modules (.mjs files) that run directly with Node.js
- No compilation, bundling, or build steps required
- No TypeScript conversion needed

### No Testing Infrastructure  
- Currently relies on manual testing scenarios listed above
- No unit tests, integration tests, or test runners configured
- No `npm test` script available

### No Linting/Formatting
- No ESLint, Prettier, or other code quality tools configured
- Follow existing code style when making changes
- Use JSDoc comments for functions (see existing examples)

### Performance Characteristics
- Dependency installation: ~8 seconds
- Application startup: 1-2 seconds  
- Offline mode: Processes 1000 wallets per batch with 10ms delays
- Online mode: Uses multicall for efficient batch blockchain queries
- Both modes run indefinitely until manually stopped

### Expected Behavior
- Offline mode: Generates random wallets and compares against 10,000 known rich addresses
- Online mode: Generates random wallets and checks live Ethereum blockchain balances
- Success case: Logs "🎉 JACKPOT!" if a wallet with balance is found (extremely unlikely)
- Both modes: Update process title with wallet generation count
- Graceful shutdown: Handle CTRL-C interruption properly

### Configuration Options
- `ROUND_SIZE`: Number of wallets per batch (default: 1000)
- `LOG_LEVEL`: Logging verbosity (error, warn, info, verbose, debug)
- `INFURA_KEY`: Required for online mode blockchain access
- `RPC`: Ethereum RPC endpoint (default: Infura mainnet)

## Troubleshooting

### Common Issues
- **"Missing script: test"**: No test infrastructure configured, this is expected
- **"could not detect network"**: Expected when running online mode without valid API key
- **"No .env file found"**: Expected for offline mode, optional warning
- **Long execution times**: Both modes run indefinitely by design, not a bug

### Debug Mode
Run with verbose logging to troubleshoot issues:
```bash
LOG_LEVEL=debug npm run offline
# or
LOG_LEVEL=debug npm run online
```

### Environment Setup
Ensure you have the correct Node.js version:
```bash
node --version  # Should be 14.0 or higher
npm --version   # Should work with npm 6+
```
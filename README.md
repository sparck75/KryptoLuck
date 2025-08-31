# KryptoLuck 🍀

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js Version](https://img.shields.io/badge/Node.js-14%2B-green.svg)](https://nodejs.org/)

> **⚠️ IMPORTANT DISCLAIMER**: This project is for educational purposes only. The probability of finding a wallet with funds is astronomically low (approximately 1 in 2^160). This is essentially equivalent to winning the lottery millions of times in a row. Do not expect to find any funds.

KryptoLuck is a cryptocurrency wallet generator that creates random Ethereum wallets and checks if they contain any funds. The project demonstrates the concept of brute-force wallet generation and the mathematical impossibility of successfully finding funded wallets through random generation.

## 🎯 What Does This Do?

This application continuously generates random Ethereum wallet addresses and private keys, then checks if those addresses contain any Ether. It operates in two modes:

1. **Online Mode**: Queries the Ethereum blockchain in real-time to check wallet balances
2. **Offline Mode**: Compares generated addresses against a pre-loaded list of known wealthy addresses

## 🧮 Mathematical Reality

The Ethereum address space contains 2^160 possible addresses (approximately 1.46 × 10^48). Even if you could generate and check 1 billion addresses per second, it would take longer than the age of the universe to have a reasonable chance of finding a funded wallet.

**This project is purely educational and demonstrates:**
- Ethereum wallet generation
- Blockchain interaction with ethers.js
- The security of cryptographic address spaces
- Why cryptocurrency is secure against brute force attacks

## 📋 Prerequisites

- **Node.js** 14.0 or higher
- **npm** (comes with Node.js)
- **Infura Account** (for online mode) - Get free API key at [infura.io](https://infura.io/)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sparck75/KryptoLuck.git
   cd KryptoLuck
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (for online mode)
   ```bash
   cp .example_env .env
   ```
   
   Edit `.env` and add your Infura API key:
   ```env
   INFURA_KEY=your_infura_api_key_here
   RPC=https://mainnet.infura.io/v3/
   ```

## 🎮 Usage

### Online Mode (Blockchain Queries)

Generates wallets and checks their balance on the Ethereum mainnet:

```bash
node luck-online.mjs
```

**Features:**
- Real-time blockchain balance checking
- Uses Infura RPC endpoint
- Multicall optimization for batch requests
- Logs any wallets with non-zero balance

### Offline Mode (Local Address List)

Generates wallets and compares against a local list of known wealthy addresses:

```bash
node luck-offline.mjs
```

**Features:**
- No internet connection required
- Uses pre-loaded `RichEtherAddress.json` file
- Faster execution (no network delays)
- Purely statistical demonstration

## 📁 Project Structure

```
KryptoLuck/
├── src/
│   ├── blockchain.mjs      # Blockchain interaction logic
│   ├── offline.mjs         # Offline mode functionality
│   └── create_account.mjs  # Wallet generation utilities
├── utils/
│   ├── logger.mjs          # Winston-based logging
│   └── sleep.mjs           # Sleep utility function
├── luck-online.mjs         # Main script for online mode
├── luck-offline.mjs        # Main script for offline mode
├── RichEtherAddress.json   # List of wealthy Ethereum addresses
├── .example_env            # Environment variables template
└── README.md               # This file
```

## ⚙️ Configuration

### Environment Variables

| Variable    | Description                | Required | Default |
|-------------|----------------------------|----------|---------|
| `INFURA_KEY`| Your Infura API key       | Yes      | None    |
| `RPC`       | Ethereum RPC endpoint      | Yes      | `https://mainnet.infura.io/v3/` |
| `LOG_LEVEL` | Logging level             | No       | `info`  |

### Logging Levels

- `error`: Only errors
- `warn`: Warnings and errors
- `info`: General information (default)
- `verbose`: Detailed logging
- `debug`: Debug information

Set logging level:
```bash
export LOG_LEVEL=debug
node luck-online.mjs
```

## 🔧 Troubleshooting

### Common Issues

**1. "UNMET DEPENDENCY" errors**
```bash
npm install
```

**2. "Invalid Infura API key"**
- Verify your API key in `.env`
- Ensure no extra spaces or characters
- Check your Infura dashboard for key status

**3. "Connection timeout"**
- Check your internet connection
- Verify Infura service status
- Try reducing batch size in code

**4. High memory usage**
- This is normal due to continuous wallet generation
- Monitor with `top` or `htop`
- Consider reducing `ROUND_SIZE` in the code

### Performance Notes

- **Online mode**: Limited by network latency and Infura rate limits
- **Offline mode**: Limited by CPU and memory
- **Expected rate**: ~1000-10000 wallets per second depending on hardware
- **Memory usage**: Moderate, scales with batch size

## 🎲 Expected Results

**Probability of finding funds**: ~0% (mathematically negligible)

**What you'll see:**
- Continuous wallet generation statistics
- Process title showing progress
- Logs of generated wallet count
- **IF** funds are found (extremely unlikely): Address and private key logged

## 🤝 Contributing

Contributions are welcome! This project can be improved in several ways:

### Areas for Contribution

1. **Performance optimizations**
   - Faster wallet generation
   - Better batch processing
   - Memory usage improvements

2. **Additional features**
   - Support for other cryptocurrencies
   - Database storage of results
   - Web interface
   - Statistics dashboard

3. **Code quality**
   - Additional error handling
   - Unit tests
   - Code documentation
   - TypeScript conversion

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## ⚖️ Legal & Ethical Considerations

- This software is for educational purposes only
- Do not use this to attempt actual cryptocurrency theft
- Respect rate limits of blockchain services
- Consider the environmental impact of continuous computation
- The authors are not responsible for any misuse of this software

## 🙏 Acknowledgments

- [ethers.js](https://docs.ethers.io/) - Ethereum library
- [Infura](https://infura.io/) - Ethereum node infrastructure
- [ethcall](https://github.com/Destiner/ethcall) - Multicall functionality
- The Ethereum community for creating secure cryptographic systems

## ❓ Frequently Asked Questions

### Q: Will I actually find any funds?
**A: No.** The probability is so astronomically low that it's effectively impossible. You're more likely to be struck by lightning while winning the lottery on the same day.

### Q: How long would it take to find a funded wallet?
**A: Longer than the age of the universe.** Even with quantum computers, the time required would be impractical.

### Q: Is this legal?
**A: Yes, generating random wallets is legal.** However, if you were to find a funded wallet (which won't happen), using someone else's funds would be theft.

### Q: What's the point of this project?
**A: Education.** This demonstrates why cryptocurrency is secure and why brute force attacks don't work.

### Q: Can I modify this to be more effective?
**A: No amount of optimization will make this practically successful.** The fundamental mathematics of cryptography prevent it.

### Q: Why does it say "JACKPOT!" in the code?
**A: It's aspirational messaging.** If the impossible happened, you'd want to know immediately!

---

**Remember**: The house always wins. In cryptocurrency, the mathematics always wins. This project proves that point beautifully. 🎰

# Contributing to KryptoLuck

Thank you for your interest in contributing to KryptoLuck! This project welcomes contributions from developers of all skill levels.

## 🎯 Project Goals

KryptoLuck is an educational project that demonstrates:
- The mathematical impossibility of brute-force cryptocurrency wallet discovery
- Ethereum wallet generation and blockchain interaction
- The security of cryptographic address spaces
- Responsible development practices in cryptocurrency tools

## 🚀 Getting Started

### Prerequisites

- Node.js 14.0 or higher
- npm (comes with Node.js)
- Git
- Basic understanding of JavaScript/ES6
- (Optional) Basic understanding of Ethereum and cryptocurrency

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/KryptoLuck.git
   cd KryptoLuck
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (for testing online mode)
   ```bash
   cp .example_env .env
   # Edit .env and add your Infura API key
   ```

4. **Test the setup**
   ```bash
   # Test offline mode (no API key required)
   npm run offline
   
   # Test online mode (requires Infura API key)
   npm run online
   ```

## 📝 How to Contribute

### Areas Where We Need Help

1. **Performance Improvements**
   - Optimize wallet generation speed
   - Improve memory usage
   - Better batch processing algorithms
   - Parallel processing implementation

2. **Feature Enhancements**
   - Support for other cryptocurrencies (Bitcoin, Litecoin, etc.)
   - Database storage for results and statistics
   - Web interface for monitoring
   - Real-time statistics dashboard
   - API endpoint for external monitoring

3. **Code Quality**
   - Unit tests and integration tests
   - TypeScript conversion
   - Better error handling
   - Code coverage improvements
   - ESLint/Prettier configuration

4. **Documentation**
   - API documentation
   - Code examples
   - Video tutorials
   - Translation to other languages

5. **DevOps & Infrastructure**
   - Docker containerization
   - CI/CD pipeline setup
   - Automated testing
   - Performance benchmarking

### Contribution Process

1. **Choose an issue or propose a feature**
   - Look at existing [issues](https://github.com/sparck75/KryptoLuck/issues)
   - Create a new issue for bugs or feature requests
   - Discuss major changes before implementing

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed
   - Keep changes focused and atomic

4. **Test your changes**
   ```bash
   # Test both modes
   npm run offline
   npm run online  # (if you have Infura API key)
   
   # Run any tests (when available)
   npm test
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add detailed description of your changes"
   ```

6. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub.

## 📋 Code Guidelines

### Code Style

- Use ES6+ features (async/await, arrow functions, destructuring)
- Use JSDoc comments for functions and classes
- Follow existing naming conventions
- Keep functions small and focused
- Use meaningful variable names

### Example Code Style

```javascript
/**
 * Generates random Ethereum wallets
 * @param {number} count - Number of wallets to generate
 * @returns {Array<{address: string, privateKey: string}>} Generated wallets
 */
const generateWallets = async function(count) {
    const wallets = [];
    
    for (let i = 0; i < count; i++) {
        const { address, privateKey } = ethers.Wallet.createRandom();
        wallets.push({ address, privateKey });
    }
    
    return wallets;
}
```

### Commit Message Guidelines

Use conventional commit format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `perf:` for performance improvements

Examples:
```
feat: add support for Bitcoin wallet generation
fix: resolve memory leak in wallet validation
docs: update README with new configuration options
```

## 🧪 Testing

Currently, the project relies on manual testing. We welcome contributions to add:

- Unit tests for individual functions
- Integration tests for full workflows
- Performance benchmarks
- Error condition testing

## 🚨 Important Considerations

### Ethical Guidelines

- This project is for educational purposes only
- Do not promote illegal activities
- Include appropriate warnings about the impossibility of success
- Respect rate limits of external services
- Consider environmental impact of computational resources

### Security

- Never commit API keys or sensitive data
- Validate all inputs
- Handle errors gracefully
- Follow secure coding practices

### Performance

- Consider memory usage in long-running processes
- Respect API rate limits
- Optimize for the common use case
- Document performance characteristics

## 📞 Getting Help

- **Questions**: Create a GitHub issue with the "question" label
- **Bugs**: Create a GitHub issue with detailed reproduction steps
- **Feature Ideas**: Create a GitHub issue with the "enhancement" label
- **General Discussion**: Use GitHub Discussions (if available)

## 🏆 Recognition

Contributors will be recognized in:
- README acknowledgments
- CONTRIBUTORS.md file (to be created)
- Release notes for significant contributions

## 📄 License

By contributing to KryptoLuck, you agree that your contributions will be licensed under the GNU General Public License v3.0.

---

**Remember**: This project demonstrates why cryptocurrency is secure. The mathematics of cryptography make brute force attacks impractical. Your contributions help educate others about this important concept! 🔐
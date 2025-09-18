#!/bin/bash

# KryptoLuck Linux startup script
# Makes it easy to run the application on Linux systems

set -e  # Exit on any error

echo "🎲 KryptoLuck - Linux Startup Script"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt 14 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 14+ and try again."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ npm is available"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "Available commands:"
echo "  1. ./run.sh offline   # Run offline mode"
echo "  2. ./run.sh online    # Run online mode"
echo "  3. ./run.sh debug     # Run offline mode with debug logging"
echo ""

# Parse command line argument
case "${1:-}" in
    "offline")
        echo "🔌 Starting KryptoLuck in offline mode..."
        exec npm run offline
        ;;
    "online")
        echo "🌐 Starting KryptoLuck in online mode..."
        if [ ! -f ".env" ]; then
            echo "⚠️  No .env file found. Online mode requires an Infura API key."
            echo "💡 Copy .example_env to .env and add your API key:"
            echo "   cp .example_env .env"
            echo "   # Edit .env and add your INFURA_KEY"
            echo ""
        fi
        exec npm run online
        ;;
    "debug")
        echo "🐛 Starting KryptoLuck in offline mode with debug logging..."
        exec LOG_LEVEL=debug npm run offline
        ;;
    *)
        echo "❓ Please specify a mode:"
        echo "   ./run.sh offline"
        echo "   ./run.sh online"
        echo "   ./run.sh debug"
        exit 1
        ;;
esac
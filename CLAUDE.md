# Moonbag Intro - Dojo Game Development Guide

## Project Overview

This is a simple educational Dojo game built to showcase the Dojo framework for on-chain applications and games on Starknet. The project demonstrates basic player movement mechanics with position tracking and move counting.

## Project Structure

```
moonbag-intro/
├── client/                     # Frontend web application
│   ├── index.html              # Main HTML entry point
│   ├── game.js                 # Game logic and UI updates
│   ├── controller.js           # Cartridge Controller wallet configuration
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.js          # Vite development server config
│   └── pkg/                    # WASM bindings for Torii client
├── contracts/                  # Dojo smart contracts
│   ├── src/
│   │   ├── lib.cairo           # Main contract library
│   │   ├── models.cairo        # Data models (Position, Moves, Direction)
│   │   └── systems/
│   │       └── actions.cairo   # Game actions (spawn, move, move_random)
│   ├── Scarb.toml              # Cairo package configuration
│   ├── dojo_dev.toml           # Dojo world configuration
│   ├── katana.toml             # Katana sequencer configuration
│   ├── torii_dev.toml          # Torii indexer configuration
│   └── manifest_dev.json       # Generated contract manifest
└── moonbagcontracts/           # Additional contracts directory
```

## Technology Stack

### Blockchain & Framework
- **Dojo v1.5.0**: On-chain game framework for Starknet
- **Cairo 2.10.1**: Smart contract programming language
- **Starknet**: Layer 2 blockchain
- **Cartridge VRF**: Verifiable Random Function provider

### Development Tools
- **Katana**: Starknet sequencer for local development
- **Torii**: Automatic indexer for Dojo contracts
- **Scarb**: Cairo package manager and build tool

### Frontend
- **Vite**: Frontend build tool and development server
- **Vanilla JavaScript**: No framework, pure JS implementation
- **Cartridge Controller**: Wallet integration for Starknet
- **WASM Bindings**: WebAssembly client for Torii interaction

### Dependencies
- `@cartridge/controller`: Wallet connection and transaction signing
- `starknet`: Starknet JavaScript SDK
- `starknetkit`: Additional Starknet utilities
- `@metamask/sdk`: MetaMask integration
- `@solana/web3.js`: Solana integration (unused in current implementation)

## Key Configuration Files

### contracts/Scarb.toml
- Cairo version: 2.10.1
- Dojo dependency: v1.5.0 from GitHub
- Package name: dojo_intro

### contracts/dojo_dev.toml
- World name: "Dojo intro"
- Namespace: "di" (default)
- Local RPC: http://localhost:5050/
- Pre-configured accounts and world address

### contracts/katana.toml
- Development mode enabled
- CORS origins: "*"
- Cartridge controllers and paymaster enabled

### client/vite.config.js
- HTTPS enabled via mkcert plugin for Cartridge Controller compatibility

## Smart Contract Architecture

### Models (contracts/src/models.cairo)
- **Position**: Player coordinates (x, y) with ContractAddress key
- **Moves**: Remaining move count per player
- **Direction**: Enum for movement directions (Left, Right, Up, Down)

### Actions (contracts/src/systems/actions.cairo)
- **spawn()**: Initialize player at (10, 10) with 100 moves
- **move(direction)**: Move player in specified direction, decrement moves
- **move_random()**: Move player randomly using Cartridge VRF

### VRF Integration
- Uses Cartridge VRF provider for random movement
- VRF address: 0x15f542e25a4ce31481f986888c179b6e57412be340b8095f72f75a328fbb27b
- Implements sandwich pattern: request_random → consume_random

## Frontend Architecture

### index.html
- Simple UI with connect button, position display, and movement controls
- Imports WASM bindings and game modules
- Handles Cartridge Controller connection

### game.js
- Parses Torii entity updates to update UI
- Handles transaction execution for game actions
- Maps direction strings to Cairo enum indices
- Implements VRF sandwich pattern for random moves

### controller.js
- Configures Cartridge Controller policies
- Defines allowed contract methods and descriptions
- Sets up local Katana chain connection

## Development Commands

### Contracts
```bash
cd contracts/
sozo build           # Build contracts
sozo migrate         # Deploy contracts to configured network
```

### Local Development Environment
```bash
# Start Katana sequencer
katana --config contracts/katana.toml

# Start Torii indexer
torii --config contracts/torii_dev.toml
```

### Frontend
```bash
cd client/
pnpm install         # Install dependencies
pnpm run dev         # Start development server with HTTPS
pnpm run format      # Format code with Prettier
```

## Setup Requirements

### Dojo Installation Options
1. **Docker**: `docker pull ghcr.io/dojoengine/dojo:v1.5.0`
2. **dojoup script**: `curl -L https://install.dojoengine.org | bash`
3. **asdf version manager**: `asdf install dojo 1.5.0`

### Additional Requirements
- Scarb 2.10.1 (Cairo package manager)
- LLVM 19 (for Katana on some systems): `brew install llvm@19`
- pnpm (for frontend package management)

## Game Mechanics

1. **Connect**: Use Cartridge Controller to connect wallet
2. **Spawn**: Initialize player at starting position (10, 10) with 100 moves
3. **Move**: Use arrow buttons to move in cardinal directions
4. **Random Move**: Use VRF to move in random direction
5. **State Tracking**: Position and remaining moves are tracked on-chain and displayed in real-time

## Real-time Updates

- Torii indexer provides real-time blockchain state updates
- Frontend subscribes to entity changes via WebSocket
- UI automatically updates when on-chain state changes
- Subscription cleanup on page unload

## Development Notes

- Uses HTTPS locally for Cartridge Controller compatibility
- Contract addresses and configuration are environment-specific
- VRF integration requires specific transaction sandwich pattern
- Cairo enum serialization uses variant indices (0, 1, 2, 3)
- Game state is entirely on-chain with no local state persistence
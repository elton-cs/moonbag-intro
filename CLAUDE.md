# Moon Bag - Dojo Game Development Guide

## Project Overview

This project is evolving from a simple Dojo movement demo into the full "Moon Bag" bag-building rogue-like game as specified in prd.md. The game features cosmic-themed orb drawing mechanics, milestone progression, and strategic resource management built on the Dojo framework for Starknet.

## Development Ground Rules

### 1. Always Use Dojo Sensei MCP for Contracts
- **MANDATORY**: Use the Dojo Sensei MCP tools when writing or modifying smart contracts
- Leverage `mcp__sensei-mcp__dojo_sensei` for comprehensive guidance
- Use specialized tools like `mcp__sensei-mcp__dojo_model` for data structures
- Use `mcp__sensei-mcp__dojo_logic` for game mechanics implementation

### 2. Frontend-Contract Synchronization
- **CRITICAL**: Every new contract feature (data types, functions) MUST have corresponding frontend implementation
- New contract models require frontend parsing and UI display
- New contract functions require frontend transaction handling
- All features must be user-testable through the interface

### 3. Atomic Incremental Development
- **APPROACH**: Implement features in small, atomic increments
- Each increment should be fully functional and testable
- Avoid massive changes that could break existing functionality
- Progress tracking through incremental milestones
- Immediate testing after each feature addition

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

## Current Implementation Status

### Completed (Movement Demo)
1. **Connect**: Use Cartridge Controller to connect wallet
2. **Spawn**: Initialize player at starting position (10, 10) with 100 moves
3. **Move**: Use arrow buttons to move in cardinal directions
4. **Random Move**: Use VRF to move in random direction
5. **State Tracking**: Position and remaining moves are tracked on-chain and displayed in real-time

### Target Implementation (Moon Bag Game - from prd.md)
- **Core Mechanics**: Orb drawing from bag with push-your-luck gameplay
- **Resource Management**: Health (5), Moon Rocks (304), Cheddah (0), Points systems
- **Progression**: 7 levels with escalating requirements and costs
- **Orb System**: 12 starting orbs + 13 purchasable shop orbs with unique effects
- **Shop Mechanics**: 3 rarity tiers (Common/Rare/Cosmic) with price scaling
- **Combat**: Bomb damage system affecting health
- **Multipliers**: Dynamic point calculation with multiplier orbs

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

## Implementation Roadmap

### Phase 1: Core Player State (Next)
- Replace Position/Moves models with PlayerState model
- Add Health, Moon Rocks, Cheddah, Points tracking
- Update frontend to display all player resources

### Phase 2: Orb System Foundation
- Create Orb model with type, value, rarity properties
- Implement basic bag mechanics (add/remove orbs)
- Add orb drawing functionality

### Phase 3: Game Mechanics
- Level progression system with milestones
- Orb effects implementation (points, health, multipliers)
- Win/loss conditions

### Phase 4: Shop System
- Shop inventory generation
- Purchase mechanics with price scaling
- Cheddah earning system

### Phase 5: Advanced Features
- Bomb damage system
- Special orb behaviors (dynamic values)
- Complete UI/UX overhaul with cosmic theme
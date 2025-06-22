# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a hybrid game development project combining Dojo smart contracts (Starknet blockchain) with a PixiJS frontend client. The project structure indicates development of "Moon Bag", a cosmic-themed rogue-like bag-building game as specified in prd.md.

## Project Structure

```
pixijs/
├── contracts/                  # Dojo smart contracts (Cairo)
│   ├── src/
│   │   ├── lib.cairo          # Main contract library
│   │   ├── models.cairo       # Data models
│   │   └── systems/
│   │       └── actions.cairo  # Game actions
│   ├── Scarb.toml             # Cairo package configuration
│   ├── dojo_dev.toml          # Dojo world configuration
│   ├── katana.toml            # Katana sequencer config
│   └── torii_dev.toml         # Torii indexer config
├── pixi-client/               # PixiJS frontend application
│   ├── src/
│   │   ├── app/               # Application components
│   │   │   ├── screens/       # Game screens
│   │   │   ├── ui/            # UI components
│   │   │   └── utils/         # Utilities
│   │   ├── engine/            # Game engine core
│   │   ├── graphql/           # GraphQL client & queries
│   │   ├── wallet/            # Wallet integration
│   │   └── main.ts            # Application entry point
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
└── prd.md                     # Product requirements document
```

## Technology Stack

### Blockchain & Smart Contracts
- **Dojo v1.5.1**: On-chain game framework for Starknet
- **Cairo 2.10.1**: Smart contract programming language
- **Starknet**: Layer 2 blockchain platform
- **Cartridge Controller**: Wallet integration for Starknet

### Frontend Application
- **PixiJS 8.8.1**: 2D WebGL rendering engine
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Apollo GraphQL**: Data fetching and state management
- **Motion**: Animation library
- **@pixi/ui**: UI components for PixiJS
- **@pixi/sound**: Audio capabilities

### Development Tools
- **Katana**: Starknet sequencer for local development
- **Torii**: Automatic indexer for Dojo contracts
- **Scarb**: Cairo package manager
- **AssetPack**: Asset pipeline for game assets

## Development Commands

### Smart Contracts (Dojo)
```bash
cd contracts/
sozo build           # Build contracts
sozo migrate         # Deploy contracts to configured network
```

### Local Blockchain Environment
```bash
# Start Katana sequencer
katana --config contracts/katana.toml

# Start Torii indexer  
torii --config contracts/torii_dev.toml
```

### Frontend Development
```bash
cd pixi-client/
npm install          # Install dependencies
npm run dev          # Start development server (port 7070)
npm run build        # Build for production
npm run lint         # Run ESLint
```

## Key Configuration

### Frontend (pixi-client/vite.config.ts)
- HTTPS enabled via mkcert plugin for Cartridge Controller compatibility
- Custom AssetPack plugin for game asset processing
- Development server runs on port 7070

### Contracts (contracts/Scarb.toml)
- Cairo version: 2.10.1
- Dojo dependency: v1.5.1 from GitHub
- Package name: dojo_intro

## Architecture Patterns

### PixiJS Engine Architecture
- **CreationEngine**: Core engine class managing initialization and systems
- **Plugin System**: Modular plugins for audio, navigation, and resize handling
- **Screen-based Navigation**: Structured screen management system
- **Component-based UI**: Reusable UI components built on PixiJS

### Smart Contract Architecture
- **Models**: Data structures for game state (Position, Moves, Direction)
- **Systems**: Game logic and actions (spawn, move, move_random)
- **VRF Integration**: Cartridge VRF for verifiable randomness

### State Management
- **Apollo GraphQL**: Client-side state management and server communication
- **UserSettings**: Persistent user preferences
- **Real-time Updates**: WebSocket subscriptions via GraphQL

## Development Ground Rules

### 1. Use Dojo Sensei MCP for Smart Contracts
- **MANDATORY**: Use Dojo Sensei MCP tools when writing or modifying smart contracts
- Leverage `mcp__sensei-mcp__dojo_sensei` for comprehensive guidance
- Use specialized tools like `mcp__sensei-mcp__dojo_model` for data structures

### 2. Frontend-Contract Synchronization
- Every new contract feature requires corresponding frontend implementation
- New contract models need frontend parsing and UI display
- All features must be user-testable through the interface

### 3. Asset Management
- Game assets stored in `raw-assets/` with automatic processing
- AssetPack handles sprite sheets, audio, and texture optimization
- Assets organized by loading context (preload, main)

## Game Development Notes

### Audio System
- Uses @pixi/sound plugin
- Supports both MP3 and OGG formats
- Background music and sound effects organized in asset pipeline

### Graphics Pipeline
- Sprite sheets generated via AssetPack with multiple resolutions
- WebP and PNG formats for optimal loading
- Texture atlas generation for efficient rendering

### Wallet Integration
- Cartridge Controller for Starknet wallet connection
- GraphQL mutations for blockchain transactions
- Real-time state synchronization between frontend and contracts

## Current Implementation Status

Based on prd.md, this project is implementing the "Moon Bag" game with:
- Push-your-luck orb drawing mechanics
- Bag-building progression system
- Multiple currencies (Health, Moon Rocks, Cheddah, Points)
- 7-level milestone progression
- Shop system with rarity-based orb purchasing

The project combines traditional game development (PixiJS) with blockchain integration (Dojo/Starknet) for a unique web3 gaming experience.
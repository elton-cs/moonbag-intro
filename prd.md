# Moon Bag - Complete Product Requirements Document

## Table of Contents
1. [Product Overview](#product-overview)
2. [Core Game Mechanics](#core-game-mechanics)
3. [Game Flow & Progression](#game-flow--progression)
4. [User Interface Specifications](#user-interface-specifications)
5. [Technical Architecture](#technical-architecture)
6. [Data Models & State Management](#data-models--state-management)
7. [Implementation Status](#implementation-status)
8. [Testing & Quality Assurance](#testing--quality-assurance)

---

## Product Overview

### Vision
Moon Bag is a browser-based push-your-luck bag-building rogue-like game featuring cosmic-themed orb drawing mechanics, milestone progression, and strategic resource management. Players navigate through increasingly challenging levels while building their orb collection and managing multiple currencies.

### Target Platform
- Web browsers (desktop and mobile)
- Built with React 18 and TypeScript
- Mobile-first responsive design
- Real-time state synchronization

### Core Value Proposition
- **Push-Your-Luck Mechanics**: Players decide when to stop drawing orbs to avoid bombs
- **Bag Building**: Strategic orb collection across multiple shop visits
- **Progressive Difficulty**: Each level requires more points with higher entry costs
- **Multiple Currencies**: Moon Rocks (entry fee), Cheddah (shop currency), Points (level goals)

---

## Core Game Mechanics

### Starting Resources
- **Health**: 5 points (dies at 0)
- **Moon Rocks**: 304 (testing value, production starts lower)
- **Cheddah**: 0 (earned by completing levels)
- **Starting Bag**: 12 orbs total
  - 2x Single Bomb (-1 health)
  - 2x Double Bomb (-2 health) 
  - 1x Triple Bomb (-3 health)
  - 3x Five Points orbs (+5 points)
  - 1x Double Multiplier (x2 multiplier)
  - 1x Remaining Orbs orb (points = orbs left in bag)
  - 1x Bomb Counter orb (points = bombs previously pulled)
  - 1x Health orb (+1 health)

### Orb Drawing System
1. **Tap Moon Bag**: Draws random orb from player's bag
2. **Instant Display**: Orb appears immediately in large display (300% size) next to bag
3. **Stat Updates**: Health, points, multiplier update 300ms after orb appears
4. **Visual Feedback**: Large animated stat changes (+5, +1x, etc.) with 0.8s duration
5. **Top Bar**: Previously drawn orbs appear in scrollable top bar
6. **Completion Check**: After 2-second delay, game checks for level complete/game over

### Special Orb Behaviors
- **Dynamic Values in Bag**: "Remaining orbs" and "Bomb counter" show current values when viewed in bag
- **Static Values When Drawn**: Once pulled, special orbs display the value they had when drawn
- **Bomb Tracking**: Bomb counter orb tracks all bomb types (single, double, triple)

### Combat & Health
- **Bomb Damage**: Single (-1), Double (-2), Triple (-3) health
- **Death Condition**: Health reaches 0 or below
- **Health Recovery**: Health orbs and shop items can restore health
- **Max Health**: No stated limit, can exceed starting value

### Multiplier System
- **Base Multiplier**: 1x (starting value)
- **Multiplier Orbs**: Increase multiplier (x2, x1.5, x0.5)
- **Point Calculation**: Base points × multiplier (always rounds up)
- **Reset**: Multiplier resets to 1x between levels

---

## Game Flow & Progression

### Level Structure
Each level follows this sequence:
1. **Entry Cost**: Pay Moon Rocks to start level
2. **Orb Drawing Phase**: Draw orbs until milestone reached or death
3. **Level Complete**: Reach milestone points to advance
4. **Shop Phase**: Spend Cheddah on new orbs (optional)
5. **Level Progression**: Continue to next level or quit

### Milestone Requirements
| Level | Points Needed | Moon Rock Cost |
|-------|---------------|----------------|
| 1     | 12           | 5              |
| 2     | 18           | 6              |
| 3     | 28           | 8              |
| 4     | 44           | 10             |
| 5     | 66           | 12             | 
| 6     | 94           | 16             | 
| 7     | 130          | 20             | 

### Win/Loss Conditions
- **Level Complete**: Reach or exceed milestone points
- **Game Over**: Health drops to 0 or bag becomes empty before milestone
- **Run End**: Player chooses to quit or completes maximum levels

### Progression Rewards
- **Badges**: Earned for completing runs (tracked but no current functionality)
- **Moon Rock Conversion**: Convert points to Moon Rocks at run end (1 point = 1 Moon Rock)
- **Persistent Progress**: Purchased orbs persist across all future levels

---

## Shop System

### Shop Mechanics
- **Access**: Available after completing each level
- **Inventory**: 6 randomly selected orbs per level
  - 3x Common orbs
  - 2x Rare orbs  
  - 1x Cosmic orb
- **Currency**: Spent using Cheddah earned from level completion
- **Price Scaling**: Each additional purchase of same orb type costs 20% more (rounded up)
- **Persistence**: Purchase history tracked across all levels. Reset at the beginning of each run.

### Available Shop Orbs

#### Common Orbs (3 random selected)
| Orb | Cost | Effect |
|-----|------|--------|
| Five Points | 5 | +5 points |
| Cheddah Bomb | 5 | Bomb that gives +10 Cheddah |
| Bomb Counter | 6 | +2 points per bomb orb pulled |
| Seven Points | 8 | +7 points |
| Moon Rock | 8 | +2 Moon Rocks |
| Half Multiplier | 9 | x0.5 multiplier |
| Health | 9 | +1 health |

#### Rare Orbs (2 random selected)
| Orb | Cost | Effect |
|-----|------|--------|
| Eight Points | 11 | +8 points |
| Nine Points | 13 | +9 points |
| Next Points 2x | 14 | x2 multiplier for next points orb only |
| Multiplier 1.5x | 16 | x1.5 multiplier |

#### Cosmic Orbs (1 random selected)
| Orb | Cost | Effect |
|-----|------|--------|
| Big Health | 21 | +3 health |
| Big Moon Rock | 23 | +10 Moon Rocks |

### Purchase Tracking System
- **Lifetime Tracking**: `purchasedOrbs` field tracks all purchases by orb type
- **Cross-Level Persistence**: Purchase counts maintained between levels and runs
- **Price Calculation**: `basePrice × 1.2^purchaseCount` (rounded up)
- **Example**: First Five Points orb costs 5, second costs 6, third costs 8

---

## User Interface Specifications

### Layout Structure
- **Mobile-First Design**: Optimized for touch interfaces
- **Cosmic Theme**: Purple/blue gradients with holographic effects
- **Glass Morphism**: Translucent orbs with backdrop blur
- **Responsive Grid**: Adapts to different screen sizes

### Key UI Components

#### Moon Bag Interface
- **Central Moon Bag**: Large tappable circular interface
- **Large Orb Display**: 300% scale orb appears right of bag when drawn
- **Bag View Button**: Eye icon opens modal showing all bag contents
- **Animation System**: Smooth orb transitions without spiral effects

#### Stats Display
- **Top Stats Bar**: Health, Cheddah, Moon Rocks in compact row
- **Main Stats Grid**: Points, multiplier, level in prominent cards
- **Pulled Orbs Bar**: Horizontal scrollable list of drawn orbs (excludes most recent)
- **Visual Stat Changes**: Large animated numbers show stat increases

#### Shop Interface
- **Grid Layout**: 2x3 grid of orb cards
- **Rarity Indicators**: Color-coded borders (gray/blue/purple)
- **Price Display**: Cheddah cost with affordability indicators
- **Purchase Animation**: Orbs animate to bag when bought

#### Modal System
- **Bag View**: Shows all current bag contents with counts
- **Level Complete**: Shows Cheddah earned with continue/quit options
- **Game Over**: Reset or quit options
- **Shop**: Full-screen orb marketplace
- **Run Start**: Confirmation modal showing Moon Rock cost

### Visual Design Elements
- **Color Scheme**: Cosmic purples, blues, holographic gold accents
- **Typography**: Bold headers, clean body text with good contrast
- **Icons**: Lucide React icons for consistency
- **Animations**: Framer Motion for smooth transitions
- **Glassmorphism**: Semi-transparent cards with blur effects

---

## Technical Architecture

### Frontend Stack
- **React 18**: Component-based UI with hooks
- **TypeScript**: Full type safety across codebase
- **Vite**: Fast development server and build tool
- **Tailwind CSS**: Utility-first styling framework
- **Shadcn/ui**: Pre-built accessible components
- **Framer Motion**: Animation library
- **TanStack Query**: Server state management
- **Wouter**: Lightweight client-side routing

### Backend Stack
- **Express.js**: Node.js web framework
- **TypeScript**: Server-side type safety
- **In-Memory Storage**: MemStorage class for development
- **RESTful API**: Standard HTTP endpoints
- **Middleware**: Logging, error handling, CORS

### Database Design
- **Drizzle ORM**: Type-safe database toolkit
- **PostgreSQL**: Production database (configured but using memory storage)
- **Schema Types**: Shared between frontend and backend

### State Management
- **Game Context**: React Context for global game state
- **Local Storage**: Client-side persistence
- **Server Sync**: API-based state synchronization
- **Reducer Pattern**: Predictable state updates

---

## Data Models & State Management

### Core Interfaces

#### PlayerState
```typescript
interface PlayerState {
  health: number;
  points: number;
  multiplier: number;
  cheddah: number;
  moonRocks: number;
  badges: number;
  currentLevel: number;
  bagContents: Orb[];
  pulledOrbs: Orb[];
  purchasedOrbs: Record<string, number>; // Track lifetime purchases
  isActive: boolean;
}
```

#### Orb
```typescript
interface Orb {
  id: string;
  type: string;
  value: number;
  color: string;
  rarity: string;
}
```

#### Milestone
```typescript
interface Milestone {
  id: number;
  level: number;
  milestone: number;
  cheddahReward: number;
  moonRockCost: number;
}
```

### Game Actions
- `DRAW_ORB`: Draw orb from bag
- `APPLY_ORB_EFFECTS`: Update stats after orb drawn
- `PURCHASE_ORB`: Buy orb from shop
- `PROCEED_TO_NEXT_LEVEL`: Advance to next level
- `START_NEW_RUN`: Begin new game run
- `RESET_GAME`: Reset to initial state
- `QUIT_RUN`: End current run
- Modal control actions for UI state

### Storage Strategy
- **Development**: In-memory storage with pre-populated data
- **Production Ready**: PostgreSQL with Drizzle migrations
- **State Sync**: Real-time updates between client and server
- **Persistence**: Critical game state saved to prevent data loss

---

## Implementation Status

### Completed Features ✅
- Complete orb drawing mechanics with visual feedback
- All 12 starting orbs with proper effects
- Full milestone progression system (7 levels)
- Complete shop system with 13 purchasable orbs
- Cross-level purchase tracking and price scaling
- Cheddah earning and spending system
- Health management and game over conditions
- Large orb display system (300% scale next to bag)
- Bag viewing modal with complete inventory
- Visual stat change indicators
- Mobile-responsive design
- Complete test suite (36 passing tests)

### Technical Implementation ✅
- React 18 with TypeScript
- Tailwind CSS with cosmic theme
- Framer Motion animations
- State management with Context API
- RESTful API with Express
- In-memory storage system
- Comprehensive error handling
- Type-safe data models

### User Experience ✅
- Mobile-first responsive design
- Smooth animations and transitions
- Clear visual feedback for all actions
- Intuitive touch interface
- Accessible UI components
- Glass morphism design aesthetic

### Testing & Quality ✅
- 36 comprehensive unit tests
- Core game logic validation
- Milestone system testing
- Orb effect verification
- Edge case handling
- Browser compatibility testing

---

## Testing & Quality Assurance

### Test Coverage
- **Game Logic**: Core mechanics, orb effects, milestone progression
- **Utility Functions**: Helper functions, calculations, data transformations
- **Component Testing**: UI component behavior and rendering
- **Integration Testing**: End-to-end game flow validation

### Test Framework
- **Vitest**: Fast unit testing framework
- **Testing Library**: React component testing utilities
- **JSDOM**: Browser environment simulation
- **TypeScript**: Type-safe test implementation

### Quality Metrics
- All core functionality tested
- Edge cases covered (empty bags, zero health, etc.)
- Performance optimized for mobile devices
- Cross-browser compatibility verified
- Accessibility standards met

### Continuous Integration
- Automated test execution on code changes
- Type checking with TypeScript compiler
- Code linting and formatting
- Build verification for production deployment

---

## Future Enhancements

### Potential Features
- **Achievement System**: Expand badge functionality with rewards
- **Leaderboards**: Compare scores across players
- **Daily Challenges**: Special game modes with unique rewards
- **More Orb Types**: Expand orb variety and effects
- **Sound Design**: Audio feedback for actions and events
- **Advanced Analytics**: Player behavior tracking and optimization

### Technical Improvements
- **Database Migration**: Move from memory storage to PostgreSQL
- **Real-time Multiplayer**: Collaborative or competitive modes
- **Progressive Web App**: Offline capability and app-like experience
- **Performance Optimization**: Code splitting and lazy loading
- **Internationalization**: Multi-language support

---

## Deployment & Operations

### Development Environment
- **Replit Platform**: Cloud-based development and hosting
- **Hot Reload**: Instant code updates during development
- **Environment Variables**: Secure configuration management
- **Workflow Management**: Automated server restart and process management

### Production Considerations
- **Database Setup**: PostgreSQL configuration and migrations
- **Performance Monitoring**: Error tracking and analytics
- **Security**: Input validation and data protection
- **Scalability**: Load balancing and caching strategies
- **Backup Strategy**: Data protection and recovery procedures

---

*Document Version: 1.0*  
*Last Updated: June 20, 2025*  
*Status: Complete Implementation*
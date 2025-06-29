use starknet::ContractAddress;

// Moon Rocks currency model - separate from game instances
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct MoonRocks {
    #[key]
    pub player: ContractAddress,
    pub amount: u32,
}

// Game model for Moon Bag - represents a single playable game instance
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Game {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub game_id: u32,
    pub health: u8,
    pub points: u32,
    pub multiplier: u32,              // stored as fixed point (100 = 1.0x)
    pub cheddah: u32,
    pub current_level: u8,
    pub is_active: bool,
    pub game_state: GameState,        // Current game state for progression
    pub orb_bag_size: u32,            // Number of orbs currently in bag
    pub orbs_drawn_count: u32,        // Number of orbs drawn this level
    pub bombs_drawn_count: u32,       // Number of bomb orbs drawn this level (for BombCounter)
    pub temp_multiplier_active: bool, // Whether NextPoints2x is active
    pub temp_multiplier_value: u32,   // Temporary multiplier value (100 = 1.0x)
}

// Counter model to track next game ID for each player
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GameCounter {
    #[key]
    pub player: ContractAddress,
    pub next_game_id: u32,
}

// Track active game per player for single-game restriction
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct ActiveGame {
    #[key]
    pub player: ContractAddress,
    pub game_id: u32,  // 0 = no active game
}

// Orb types for Moon Bag game - complete enum with all PRD orbs
#[derive(Serde, Copy, Drop, Introspect, PartialEq)]
pub enum OrbType {
    // Starting bag bomb orbs
    SingleBomb,        // -1 health
    DoubleBomb,        // -2 health
    TripleBomb,        // -3 health
    
    // Starting bag points orbs
    FivePoints,        // +5 points
    
    // Starting bag multiplier orbs
    DoubleMultiplier,  // ×2 multiplier
    
    // Starting bag dynamic orbs
    RemainingOrbs,     // points = orbs left in bag
    BombCounter,       // points = bombs drawn this level
    
    // Starting bag utility orbs
    Health,            // +1 health
    
    // Shop orbs - Common
    CheddahBomb,       // bomb that gives +10 Cheddah instead of damage
    SevenPoints,       // +7 points
    MoonRock,          // +2 Moon Rocks
    HalfMultiplier,    // ×0.5 multiplier
    
    // Shop orbs - Rare
    EightPoints,       // +8 points
    NinePoints,        // +9 points
    NextPoints2x,      // ×2 multiplier for next points orb only
    Multiplier1_5x,    // ×1.5 multiplier
    
    // Shop orbs - Cosmic
    BigHealth,         // +3 health
    BigMoonRock,       // +10 Moon Rocks
}

// Game state enum for win/lose logic and level progression
#[derive(Serde, Copy, Drop, Introspect, PartialEq)]
pub enum GameState {
    Active,        // Game in progress
    LevelComplete, // Level completed, awaiting player choice
    GameWon,       // All 7 levels completed
    GameLost,      // Health = 0 or bag empty before milestone
}

// Orb bag slot model - represents individual orb slots in the bag
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct OrbBagSlot {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub game_id: u32,
    #[key]
    pub slot_index: u32,
    pub orb_type: OrbType,
    pub is_active: bool,  // false means slot is empty/orb was drawn
}

// Drawn orb model - tracks orbs that have been drawn from the bag
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct DrawnOrb {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub game_id: u32,
    #[key]
    pub draw_index: u32,
    pub orb_type: OrbType,
}

// Shop rarity enum for orb categorization and pricing
#[derive(Serde, Copy, Drop, Introspect, PartialEq)]
pub enum ShopRarity {
    Common,    // 3 slots in shop, base cost multiplier: 1x
    Rare,      // 2 slots in shop, base cost multiplier: 1x
    Cosmic,    // 1 slot in shop, base cost multiplier: 1x
}

// Shop inventory model - tracks available orbs for purchase per level
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct ShopInventory {
    #[key]
    pub player: ContractAddress,
    #[key] 
    pub game_id: u32,
    #[key]
    pub level: u8,
    #[key]
    pub slot_index: u8,  // 0-5 for 6 shop slots
    pub orb_type: OrbType,
    pub base_price: u32,
    pub rarity: ShopRarity,
}

// Purchase history model - tracks purchases per orb type for price scaling
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PurchaseHistory {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub game_id: u32,
    #[key]
    pub orb_type: OrbType,
    pub purchase_count: u32,
}


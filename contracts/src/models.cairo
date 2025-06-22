use starknet::ContractAddress;
use core::num::traits::{SaturatingAdd, SaturatingSub};

#[derive(Serde, Copy, Drop, Introspect)]
pub enum Direction {
    // Serialized as 0.
    Left,
    // Serialized as 1.
    Right,
    // Serialized as 2.
    Up,
    // Serialized as 3.
    Down,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Position {
    #[key]
    pub player: ContractAddress,
    pub x: u32,
    pub y: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Moves {
    #[key]
    pub player: ContractAddress,
    pub remaining: u8,
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
    pub multiplier: u32,  // stored as fixed point (100 = 1.0x)
    pub cheddah: u32,
    pub moon_rocks: u32,
    pub current_level: u8,
    pub is_active: bool,
}

// Counter model to track next game ID for each player
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GameCounter {
    #[key]
    pub player: ContractAddress,
    pub next_game_id: u32,
}

#[generate_trait]
pub impl PositionImpl of PositionTrait {
    fn apply_direction(ref self: Position, direction: Direction) {
        match direction {
            Direction::Left => { self.x = self.x.saturating_sub(1) },
            Direction::Right => { self.x = self.x.saturating_add(1) },
            Direction::Up => { self.y = self.y.saturating_add(1) },
            Direction::Down => { self.y = self.y.saturating_sub(1) },
        }
    }
}


#[starknet::interface]
pub trait IActions<T> {
    fn spawn_game(ref self: T);
    fn pull_orb(ref self: T);
    fn advance_to_next_level(ref self: T);
    fn quit_game(ref self: T);
    fn gift_moonrocks(ref self: T);
}


#[dojo::contract]
pub mod actions {
    use super::IActions;
    use crate::models::{Game, GameCounter, MoonRocks, OrbType, ActiveGame, GameState, OrbBagSlot, DrawnOrb};

    use core::num::traits::{SaturatingAdd, SaturatingSub};
    use dojo::model::ModelStorage;
    use starknet::{get_caller_address, get_block_timestamp, get_tx_info};

    
    // Moon Bag starting values from PRD
    pub const INIT_HEALTH: u8 = 5;
    pub const INIT_CHEDDAH: u32 = 0;
    pub const INIT_POINTS: u32 = 0;
    pub const INIT_MULTIPLIER: u32 = 100; // 100 = 1.0x multiplier
    pub const INIT_LEVEL: u8 = 1;
    
    // Moon Rocks currency constants
    pub const GAME_ENTRY_COST: u32 = 10; // Moon rocks cost per game
    pub const GIFT_AMOUNT: u32 = 500;    // Gift for new players

    // Level progression constants from PRD
    pub const MAX_LEVEL: u8 = 7;

    // Helper functions for level data (using 0-based indexing for Cairo match requirements)
    fn get_milestone_points(level: u8) -> u32 {
        match level.saturating_sub(1) {
            0 => 12,  // Level 1
            1 => 18,  // Level 2
            2 => 28,  // Level 3
            3 => 44,  // Level 4
            4 => 66,  // Level 5
            5 => 94,  // Level 6
            6 => 130, // Level 7
            _ => 0,
        }
    }

    fn get_level_cost(level: u8) -> u32 {
        match level.saturating_sub(1) {
            0 => 5,   // Level 1
            1 => 6,   // Level 2
            2 => 8,   // Level 3
            3 => 10,  // Level 4
            4 => 12,  // Level 5
            5 => 16,  // Level 6
            6 => 20,  // Level 7
            _ => 0,
        }
    }

    fn get_cheddah_reward(level: u8) -> u32 {
        match level.saturating_sub(1) {
            0 => 10,  // Level 1
            1 => 15,  // Level 2
            2 => 20,  // Level 3
            3 => 25,  // Level 4
            4 => 30,  // Level 5
            5 => 40,  // Level 6
            6 => 50,  // Level 7
            _ => 0,
        }
    }

    // Pseudo-random function for orb selection
    fn get_pseudo_random(player: starknet::ContractAddress, game_id: u32, max_value: u32) -> u32 {
        let block_timestamp = get_block_timestamp();
        let tx_info = get_tx_info().unbox();
        let tx_hash = tx_info.transaction_hash;
        
        // Combine entropy sources using Poseidon hash
        let entropy = core::poseidon::poseidon_hash_span(
            array![
                player.into(),
                game_id.into(), 
                block_timestamp.into(),
                tx_hash
            ].span()
        );
        
        // Convert to index within range
        let random_u256: u256 = entropy.into();
        (random_u256 % max_value.into()).try_into().unwrap()
    }

    // Check if an orb type is a bomb
    fn is_bomb_orb(orb_type: OrbType) -> bool {
        match orb_type {
            OrbType::SingleBomb => true,
            OrbType::DoubleBomb => true,
            OrbType::TripleBomb => true,
            OrbType::CheddahBomb => true,
            _ => false,
        }
    }

    // Check if an orb type gives points (for temporary multiplier application)
    fn is_points_orb(orb_type: OrbType) -> bool {
        match orb_type {
            OrbType::FivePoints => true,
            OrbType::SevenPoints => true,
            OrbType::EightPoints => true,
            OrbType::NinePoints => true,
            OrbType::RemainingOrbs => true,
            OrbType::BombCounter => true,
            _ => false,
        }
    }

    // Calculate points with multiplier (always rounds up)
    fn calculate_points_with_multiplier(base_points: u32, multiplier: u32) -> u32 {
        let result = base_points * multiplier;
        // If there's a remainder when dividing by 100, round up
        if result % 100 == 0 {
            result / 100
        } else {
            (result / 100).saturating_add(1)
        }
    }

    // Apply multiplier to a value, supporting fractional multipliers
    fn apply_multiplier(base_value: u32, multiplier: u32) -> u32 {
        calculate_points_with_multiplier(base_value, multiplier)
    }

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {

        fn spawn_game(ref self: ContractState) {
            let mut world = self.world_default();

            let player = get_caller_address();

            // Check if player already has an active game
            let active_game: ActiveGame = world.read_model(player);
            assert(active_game.game_id == 0, 'Already have active game');

            // Check player has sufficient moon rocks for game
            let mut moon_rocks: MoonRocks = world.read_model(player);
            assert(moon_rocks.amount >= GAME_ENTRY_COST, 'Insufficient moon rocks');
            
            // Deduct game entry cost
            moon_rocks.amount = moon_rocks.amount.saturating_sub(GAME_ENTRY_COST);
            world.write_model(@moon_rocks);

            // Get or initialize the game counter for this player
            let mut game_counter: GameCounter = world.read_model(player);
            
            // If this is the first game for this player, initialize counter
            if game_counter.next_game_id == 0 {
                game_counter.next_game_id = 1;
            }

            let current_game_id = game_counter.next_game_id;

            // Create new game instance with PRD starting values
            let new_game = Game {
                player,
                game_id: current_game_id,
                health: INIT_HEALTH,
                points: INIT_POINTS,
                multiplier: INIT_MULTIPLIER,
                cheddah: INIT_CHEDDAH,
                current_level: INIT_LEVEL,
                is_active: true,
                game_state: GameState::Active,
                orb_bag_size: 12,  // PRD starting bag has 12 orbs
                orbs_drawn_count: 0,
                bombs_drawn_count: 0,
                temp_multiplier_active: false,
                temp_multiplier_value: 100,
            };

            // Create starting orb bag slots with PRD starting orbs (12 total)
            // 2x Single Bomb, 2x Double Bomb, 1x Triple Bomb
            let orb_slot_0 = OrbBagSlot { player, game_id: current_game_id, slot_index: 0, orb_type: OrbType::SingleBomb, is_active: true };
            let orb_slot_1 = OrbBagSlot { player, game_id: current_game_id, slot_index: 1, orb_type: OrbType::SingleBomb, is_active: true };
            let orb_slot_2 = OrbBagSlot { player, game_id: current_game_id, slot_index: 2, orb_type: OrbType::DoubleBomb, is_active: true };
            let orb_slot_3 = OrbBagSlot { player, game_id: current_game_id, slot_index: 3, orb_type: OrbType::DoubleBomb, is_active: true };
            let orb_slot_4 = OrbBagSlot { player, game_id: current_game_id, slot_index: 4, orb_type: OrbType::TripleBomb, is_active: true };
            // 3x Five Points
            let orb_slot_5 = OrbBagSlot { player, game_id: current_game_id, slot_index: 5, orb_type: OrbType::FivePoints, is_active: true };
            let orb_slot_6 = OrbBagSlot { player, game_id: current_game_id, slot_index: 6, orb_type: OrbType::FivePoints, is_active: true };
            let orb_slot_7 = OrbBagSlot { player, game_id: current_game_id, slot_index: 7, orb_type: OrbType::FivePoints, is_active: true };
            // 1x Double Multiplier, 1x Remaining Orbs, 1x Bomb Counter, 1x Health
            let orb_slot_8 = OrbBagSlot { player, game_id: current_game_id, slot_index: 8, orb_type: OrbType::DoubleMultiplier, is_active: true };
            let orb_slot_9 = OrbBagSlot { player, game_id: current_game_id, slot_index: 9, orb_type: OrbType::RemainingOrbs, is_active: true };
            let orb_slot_10 = OrbBagSlot { player, game_id: current_game_id, slot_index: 10, orb_type: OrbType::BombCounter, is_active: true };
            let orb_slot_11 = OrbBagSlot { player, game_id: current_game_id, slot_index: 11, orb_type: OrbType::Health, is_active: true };

            // Increment the counter for next game
            game_counter.next_game_id = game_counter.next_game_id.saturating_add(1);

            // Set this game as active for the player
            let new_active_game = ActiveGame {
                player,
                game_id: current_game_id,
            };

            // Write models to world
            world.write_model(@new_game);
            world.write_model(@game_counter);
            world.write_model(@new_active_game);
            
            // Write all orb bag slots
            world.write_model(@orb_slot_0);
            world.write_model(@orb_slot_1);
            world.write_model(@orb_slot_2);
            world.write_model(@orb_slot_3);
            world.write_model(@orb_slot_4);
            world.write_model(@orb_slot_5);
            world.write_model(@orb_slot_6);
            world.write_model(@orb_slot_7);
            world.write_model(@orb_slot_8);
            world.write_model(@orb_slot_9);
            world.write_model(@orb_slot_10);
            world.write_model(@orb_slot_11);
        }

        fn pull_orb(ref self: ContractState) {
            let mut world = self.world_default();
            let player = get_caller_address();

            // Get active game for this player
            let active_game: ActiveGame = world.read_model(player);
            assert(active_game.game_id > 0, 'No active game');

            // Get the active game data
            let mut game: Game = world.read_model((player, active_game.game_id));
            assert(game.is_active, 'Game is not active');
            assert(game.orb_bag_size > 0, 'Orb bag is empty');

            // Generate pseudo-random index for orb selection within bag size
            let random_index = get_pseudo_random(player, game.game_id, game.orb_bag_size);
            
            // Find the Nth active orb slot (where N = random_index)
            let mut active_count = 0;
            let mut selected_slot_index = 0;
            let mut selected_orb_type = OrbType::SingleBomb;
            let mut found_slot = false;
            
            // Search through all possible slots to find the random_index-th active one
            let mut slot_idx = 0;
            loop {
                if slot_idx == 100 { break; } // Safety limit to prevent infinite loop
                
                let orb_slot: OrbBagSlot = world.read_model((player, game.game_id, slot_idx));
                if orb_slot.is_active {
                    if active_count == random_index {
                        selected_slot_index = slot_idx;
                        selected_orb_type = orb_slot.orb_type;
                        found_slot = true;
                        break;
                    }
                    active_count += 1;
                }
                slot_idx += 1;
            };
            
            assert(found_slot, 'Failed to find active orb');

            // Apply orb effects to game state
            match selected_orb_type {
                // Bomb orbs
                OrbType::SingleBomb => {
                    game.health = game.health.saturating_sub(1);
                    game.bombs_drawn_count = game.bombs_drawn_count.saturating_add(1);
                },
                OrbType::DoubleBomb => {
                    game.health = game.health.saturating_sub(2);
                    game.bombs_drawn_count = game.bombs_drawn_count.saturating_add(1);
                },
                OrbType::TripleBomb => {
                    game.health = game.health.saturating_sub(3);
                    game.bombs_drawn_count = game.bombs_drawn_count.saturating_add(1);
                },
                OrbType::CheddahBomb => {
                    // Special bomb that gives Cheddah instead of damage
                    game.cheddah = game.cheddah.saturating_add(10);
                    game.bombs_drawn_count = game.bombs_drawn_count.saturating_add(1);
                },
                
                // Static points orbs
                OrbType::FivePoints => {
                    let mut effective_multiplier = game.multiplier;
                    if game.temp_multiplier_active && is_points_orb(selected_orb_type) {
                        effective_multiplier = game.temp_multiplier_value;
                        game.temp_multiplier_active = false; // Consume temp multiplier
                    }
                    game.points = game.points.saturating_add(apply_multiplier(5, effective_multiplier));
                },
                OrbType::SevenPoints => {
                    let mut effective_multiplier = game.multiplier;
                    if game.temp_multiplier_active && is_points_orb(selected_orb_type) {
                        effective_multiplier = game.temp_multiplier_value;
                        game.temp_multiplier_active = false;
                    }
                    game.points = game.points.saturating_add(apply_multiplier(7, effective_multiplier));
                },
                OrbType::EightPoints => {
                    let mut effective_multiplier = game.multiplier;
                    if game.temp_multiplier_active && is_points_orb(selected_orb_type) {
                        effective_multiplier = game.temp_multiplier_value;
                        game.temp_multiplier_active = false;
                    }
                    game.points = game.points.saturating_add(apply_multiplier(8, effective_multiplier));
                },
                OrbType::NinePoints => {
                    let mut effective_multiplier = game.multiplier;
                    if game.temp_multiplier_active && is_points_orb(selected_orb_type) {
                        effective_multiplier = game.temp_multiplier_value;
                        game.temp_multiplier_active = false;
                    }
                    game.points = game.points.saturating_add(apply_multiplier(9, effective_multiplier));
                },
                
                // Dynamic points orbs
                OrbType::RemainingOrbs => {
                    // Points = orbs remaining in bag after this draw
                    let remaining_orbs = game.orb_bag_size.saturating_sub(1);
                    let mut effective_multiplier = game.multiplier;
                    if game.temp_multiplier_active && is_points_orb(selected_orb_type) {
                        effective_multiplier = game.temp_multiplier_value;
                        game.temp_multiplier_active = false;
                    }
                    game.points = game.points.saturating_add(apply_multiplier(remaining_orbs, effective_multiplier));
                },
                OrbType::BombCounter => {
                    // Points = bombs drawn so far this level
                    let mut effective_multiplier = game.multiplier;
                    if game.temp_multiplier_active && is_points_orb(selected_orb_type) {
                        effective_multiplier = game.temp_multiplier_value;
                        game.temp_multiplier_active = false;
                    }
                    game.points = game.points.saturating_add(apply_multiplier(game.bombs_drawn_count, effective_multiplier));
                },
                
                // Multiplier orbs
                OrbType::DoubleMultiplier => {
                    game.multiplier = game.multiplier.saturating_add(100); // +1.0x (200 total = 2.0x)
                },
                OrbType::HalfMultiplier => {
                    game.multiplier = game.multiplier / 2; // ×0.5
                },
                OrbType::Multiplier1_5x => {
                    game.multiplier = (game.multiplier * 150) / 100; // ×1.5
                },
                OrbType::NextPoints2x => {
                    // Activate temporary 2x multiplier for next points orb only
                    game.temp_multiplier_active = true;
                    game.temp_multiplier_value = 200; // 2.0x
                },
                
                // Health orbs
                OrbType::Health => {
                    game.health = game.health.saturating_add(1);
                },
                OrbType::BigHealth => {
                    game.health = game.health.saturating_add(3);
                },
                
                // Currency orbs
                OrbType::MoonRock => {
                    let mut moon_rocks: MoonRocks = world.read_model(player);
                    moon_rocks.amount = moon_rocks.amount.saturating_add(2);
                    world.write_model(@moon_rocks);
                },
                OrbType::BigMoonRock => {
                    let mut moon_rocks: MoonRocks = world.read_model(player);
                    moon_rocks.amount = moon_rocks.amount.saturating_add(10);
                    world.write_model(@moon_rocks);
                },
            }

            // Deactivate the selected orb slot
            let mut selected_slot: OrbBagSlot = world.read_model((player, game.game_id, selected_slot_index));
            selected_slot.is_active = false;
            world.write_model(@selected_slot);
            
            // Decrease bag size and increase drawn count
            game.orb_bag_size = game.orb_bag_size.saturating_sub(1);
            game.orbs_drawn_count = game.orbs_drawn_count.saturating_add(1);
            
            // Add to drawn orbs tracking
            let drawn_orb = DrawnOrb {
                player,
                game_id: game.game_id,
                draw_index: game.orbs_drawn_count.saturating_sub(1),
                orb_type: selected_orb_type,
            };
            world.write_model(@drawn_orb);

            // Check win/lose conditions
            let milestone_points = get_milestone_points(game.current_level);
            
            if game.health == 0 {
                // Loss condition: health depleted
                game.game_state = GameState::GameLost;
                game.is_active = false;
                // Clear active game tracking
                let cleared_active_game = ActiveGame {
                    player,
                    game_id: 0,
                };
                world.write_model(@cleared_active_game);
            } else if game.points >= milestone_points {
                // Win condition: milestone reached
                if game.current_level == MAX_LEVEL {
                    // Completed final level - game won!
                    game.game_state = GameState::GameWon;
                    game.is_active = false;
                    // Clear active game tracking
                    let cleared_active_game = ActiveGame {
                        player,
                        game_id: 0,
                    };
                    world.write_model(@cleared_active_game);
                } else {
                    // Level completed - await player choice
                    game.game_state = GameState::LevelComplete;
                    // Award Cheddah for level completion
                    game.cheddah = game.cheddah.saturating_add(get_cheddah_reward(game.current_level));
                }
            } else if game.orb_bag_size == 0 {
                // Loss condition: bag empty before milestone reached
                game.game_state = GameState::GameLost;
                game.is_active = false;
                // Clear active game tracking
                let cleared_active_game = ActiveGame {
                    player,
                    game_id: 0,
                };
                world.write_model(@cleared_active_game);
            }

            // Write updated game state
            world.write_model(@game);
        }

        fn advance_to_next_level(ref self: ContractState) {
            let mut world = self.world_default();
            let player = get_caller_address();

            // Get active game for this player
            let active_game: ActiveGame = world.read_model(player);
            assert(active_game.game_id > 0, 'No active game');

            // Get the active game data
            let mut game: Game = world.read_model((player, active_game.game_id));
            assert(game.game_state == GameState::LevelComplete, 'Level not completed');

            // Check player has sufficient moon rocks for next level
            let next_level = game.current_level.saturating_add(1);
            assert(next_level <= MAX_LEVEL, 'Already at max level');
            
            let level_cost = get_level_cost(next_level);
            let mut moon_rocks: MoonRocks = world.read_model(player);
            assert(moon_rocks.amount >= level_cost, 'Insufficient moon rocks');

            // Deduct level cost
            moon_rocks.amount = moon_rocks.amount.saturating_sub(level_cost);
            world.write_model(@moon_rocks);

            // Advance to next level
            game.current_level = next_level;
            game.game_state = GameState::Active;
            game.multiplier = INIT_MULTIPLIER; // Reset multiplier between levels
            game.orbs_drawn_count = 0; // Clear drawn orbs count for new level
            game.bombs_drawn_count = 0; // Clear bombs drawn count for new level
            game.temp_multiplier_active = false; // Clear temporary multiplier
            game.temp_multiplier_value = 100; // Reset temp multiplier value
            game.orb_bag_size = 12; // Reset bag size to PRD starting size

            // Reset all orb bag slots for new level with PRD starting orbs
            // 2x Single Bomb, 2x Double Bomb, 1x Triple Bomb
            let orb_slot_0 = OrbBagSlot { player, game_id: game.game_id, slot_index: 0, orb_type: OrbType::SingleBomb, is_active: true };
            let orb_slot_1 = OrbBagSlot { player, game_id: game.game_id, slot_index: 1, orb_type: OrbType::SingleBomb, is_active: true };
            let orb_slot_2 = OrbBagSlot { player, game_id: game.game_id, slot_index: 2, orb_type: OrbType::DoubleBomb, is_active: true };
            let orb_slot_3 = OrbBagSlot { player, game_id: game.game_id, slot_index: 3, orb_type: OrbType::DoubleBomb, is_active: true };
            let orb_slot_4 = OrbBagSlot { player, game_id: game.game_id, slot_index: 4, orb_type: OrbType::TripleBomb, is_active: true };
            // 3x Five Points
            let orb_slot_5 = OrbBagSlot { player, game_id: game.game_id, slot_index: 5, orb_type: OrbType::FivePoints, is_active: true };
            let orb_slot_6 = OrbBagSlot { player, game_id: game.game_id, slot_index: 6, orb_type: OrbType::FivePoints, is_active: true };
            let orb_slot_7 = OrbBagSlot { player, game_id: game.game_id, slot_index: 7, orb_type: OrbType::FivePoints, is_active: true };
            // 1x Double Multiplier, 1x Remaining Orbs, 1x Bomb Counter, 1x Health
            let orb_slot_8 = OrbBagSlot { player, game_id: game.game_id, slot_index: 8, orb_type: OrbType::DoubleMultiplier, is_active: true };
            let orb_slot_9 = OrbBagSlot { player, game_id: game.game_id, slot_index: 9, orb_type: OrbType::RemainingOrbs, is_active: true };
            let orb_slot_10 = OrbBagSlot { player, game_id: game.game_id, slot_index: 10, orb_type: OrbType::BombCounter, is_active: true };
            let orb_slot_11 = OrbBagSlot { player, game_id: game.game_id, slot_index: 11, orb_type: OrbType::Health, is_active: true };
            
            // Write updated orb slots
            world.write_model(@orb_slot_0);
            world.write_model(@orb_slot_1);
            world.write_model(@orb_slot_2);
            world.write_model(@orb_slot_3);
            world.write_model(@orb_slot_4);
            world.write_model(@orb_slot_5);
            world.write_model(@orb_slot_6);
            world.write_model(@orb_slot_7);
            world.write_model(@orb_slot_8);
            world.write_model(@orb_slot_9);
            world.write_model(@orb_slot_10);
            world.write_model(@orb_slot_11);

            // Write updated game state
            world.write_model(@game);
        }

        fn quit_game(ref self: ContractState) {
            let mut world = self.world_default();
            let player = get_caller_address();

            // Get active game for this player
            let active_game: ActiveGame = world.read_model(player);
            assert(active_game.game_id > 0, 'No active game');

            // Get the active game data
            let mut game: Game = world.read_model((player, active_game.game_id));
            assert(
                game.game_state == GameState::LevelComplete || 
                game.game_state == GameState::GameWon ||
                game.game_state == GameState::GameLost, 
                'Cannot quit active game'
            );

            // Convert points to Moon Rocks (1:1 ratio per PRD)
            let mut moon_rocks: MoonRocks = world.read_model(player);
            moon_rocks.amount = moon_rocks.amount.saturating_add(game.points);
            world.write_model(@moon_rocks);

            // End the game
            game.is_active = false;
            
            // Clear active game tracking
            let cleared_active_game = ActiveGame {
                player,
                game_id: 0,
            };

            // Write final state
            world.write_model(@game);
            world.write_model(@cleared_active_game);
        }

        fn gift_moonrocks(ref self: ContractState) {
            let mut world = self.world_default();

            let player = get_caller_address();

            // Check if player already has moon rocks (only gift to new players)
            let moon_rocks: MoonRocks = world.read_model(player);
            assert(moon_rocks.amount == 0, 'Player already has moon rocks');

            // Give gift to new player
            let gift = MoonRocks {
                player,
                amount: GIFT_AMOUNT,
            };

            world.write_model(@gift);
        }


    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"di")
        }
    }
}

use crate::models::Direction;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IActions<T> {
    fn spawn(ref self: T);
    fn spawn_game(ref self: T);
    fn pull_orb(ref self: T);
    fn advance_to_next_level(ref self: T);
    fn quit_game(ref self: T);
    fn gift_moonrocks(ref self: T);
    fn move(ref self: T, direction: Direction);
    fn move_random(ref self: T);
}

#[starknet::interface]
trait IVrfProvider<T> {
    fn request_random(self: @T, caller: ContractAddress, source: Source);
    fn consume_random(ref self: T, source: Source) -> felt252;
}

#[derive(Drop, Copy, Clone, Serde)]
pub enum Source {
    Nonce: ContractAddress,
    Salt: felt252,
}

#[dojo::contract]
pub mod actions {
    use super::{IActions, IVrfProviderDispatcher, IVrfProviderDispatcherTrait, Source};
    use crate::models::{Direction, Moves, Position, PositionTrait, Game, GameCounter, MoonRocks, OrbType, ActiveGame, GameState, OrbBagSlot, DrawnOrb};

    use core::num::traits::SaturatingSub;
    use dojo::model::ModelStorage;
    use starknet::{get_caller_address, get_block_timestamp, get_tx_info};

    pub const INIT_COORD: u32 = 10;
    pub const INIT_REMAINING_MOVES: u8 = 100;
    const VRF_PROVIDER_ADDRESS: felt252 = 0x15f542e25a4ce31481f986888c179b6e57412be340b8095f72f75a328fbb27b;
    
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
        match level - 1 {
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
        match level - 1 {
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
        match level - 1 {
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

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn spawn(ref self: ContractState) {
            let mut world = self.world_default();

            let player = get_caller_address();

            let position = Position {
                player,
                x: INIT_COORD,
                y: INIT_COORD,
            };

            let moves = Moves {
                player,
                remaining: INIT_REMAINING_MOVES,
            };

            world.write_model(@position);
            world.write_model(@moves);
        }

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
            moon_rocks.amount -= GAME_ENTRY_COST;
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
                orb_bag_size: 6,  // Starting with 6 orbs
                orbs_drawn_count: 0,
            };

            // Create starting orb bag slots with PRD starting orbs
            let orb_slot_0 = OrbBagSlot { player, game_id: current_game_id, slot_index: 0, orb_type: OrbType::SingleBomb, is_active: true };
            let orb_slot_1 = OrbBagSlot { player, game_id: current_game_id, slot_index: 1, orb_type: OrbType::SingleBomb, is_active: true };
            let orb_slot_2 = OrbBagSlot { player, game_id: current_game_id, slot_index: 2, orb_type: OrbType::FivePoints, is_active: true };
            let orb_slot_3 = OrbBagSlot { player, game_id: current_game_id, slot_index: 3, orb_type: OrbType::FivePoints, is_active: true };
            let orb_slot_4 = OrbBagSlot { player, game_id: current_game_id, slot_index: 4, orb_type: OrbType::FivePoints, is_active: true };
            let orb_slot_5 = OrbBagSlot { player, game_id: current_game_id, slot_index: 5, orb_type: OrbType::Health, is_active: true };

            // Increment the counter for next game
            game_counter.next_game_id += 1;

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
                OrbType::SingleBomb => {
                    game.health = game.health.saturating_sub(1);
                },
                OrbType::FivePoints => {
                    game.points += 5 * game.multiplier / 100;
                },
                OrbType::Health => {
                    game.health += 1;
                },
            }

            // Deactivate the selected orb slot
            let mut selected_slot: OrbBagSlot = world.read_model((player, game.game_id, selected_slot_index));
            selected_slot.is_active = false;
            world.write_model(@selected_slot);
            
            // Decrease bag size and increase drawn count
            game.orb_bag_size -= 1;
            game.orbs_drawn_count += 1;
            
            // Add to drawn orbs tracking
            let drawn_orb = DrawnOrb {
                player,
                game_id: game.game_id,
                draw_index: game.orbs_drawn_count - 1,
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
                    game.cheddah += get_cheddah_reward(game.current_level);
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
            let next_level = game.current_level + 1;
            assert(next_level <= MAX_LEVEL, 'Already at max level');
            
            let level_cost = get_level_cost(next_level);
            let mut moon_rocks: MoonRocks = world.read_model(player);
            assert(moon_rocks.amount >= level_cost, 'Insufficient moon rocks');

            // Deduct level cost
            moon_rocks.amount -= level_cost;
            world.write_model(@moon_rocks);

            // Advance to next level
            game.current_level = next_level;
            game.game_state = GameState::Active;
            game.multiplier = INIT_MULTIPLIER; // Reset multiplier between levels
            game.orbs_drawn_count = 0; // Clear drawn orbs count for new level
            game.orb_bag_size = 6; // Reset bag size to starting size

            // Reset all orb bag slots for new level (using same starting orbs for now)
            let orb_slot_0 = OrbBagSlot { player, game_id: game.game_id, slot_index: 0, orb_type: OrbType::SingleBomb, is_active: true };
            let orb_slot_1 = OrbBagSlot { player, game_id: game.game_id, slot_index: 1, orb_type: OrbType::SingleBomb, is_active: true };
            let orb_slot_2 = OrbBagSlot { player, game_id: game.game_id, slot_index: 2, orb_type: OrbType::FivePoints, is_active: true };
            let orb_slot_3 = OrbBagSlot { player, game_id: game.game_id, slot_index: 3, orb_type: OrbType::FivePoints, is_active: true };
            let orb_slot_4 = OrbBagSlot { player, game_id: game.game_id, slot_index: 4, orb_type: OrbType::FivePoints, is_active: true };
            let orb_slot_5 = OrbBagSlot { player, game_id: game.game_id, slot_index: 5, orb_type: OrbType::Health, is_active: true };
            
            // Write updated orb slots
            world.write_model(@orb_slot_0);
            world.write_model(@orb_slot_1);
            world.write_model(@orb_slot_2);
            world.write_model(@orb_slot_3);
            world.write_model(@orb_slot_4);
            world.write_model(@orb_slot_5);

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
            moon_rocks.amount += game.points;
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

        fn move(ref self: ContractState, direction: Direction) {
            let mut world = self.world_default();

            let player = get_caller_address();

            let mut position: Position = world.read_model(player);
            position.apply_direction(direction);
            world.write_model(@position);

            let mut moves: Moves = world.read_model(player);
            moves.remaining = moves.remaining.saturating_sub(1);
            world.write_model(@moves);
        }

        fn move_random(ref self: ContractState) {
            let player = starknet::get_caller_address();

            let vrf_provider = IVrfProviderDispatcher { contract_address: VRF_PROVIDER_ADDRESS.try_into().unwrap() };
            let random_value: u256 = vrf_provider.consume_random(Source::Nonce(player)).into();
            let random_dir: felt252 = (random_value % 4).try_into().unwrap();

            let direction = match random_dir {
                0 => Direction::Up,
                1 => Direction::Down,
                2 => Direction::Left,
                3 => Direction::Right,
                _ => panic!("Invalid random direction"),
            };

            self.move(direction);
        }

    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"di")
        }
    }
}

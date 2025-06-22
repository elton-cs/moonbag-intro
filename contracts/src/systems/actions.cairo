use crate::models::Direction;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IActions<T> {
    fn spawn(ref self: T);
    fn spawn_game(ref self: T);
    fn pull_orb(ref self: T);
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
    use crate::models::{Direction, Moves, Position, PositionTrait, Game, GameCounter, MoonRocks, OrbType, ActiveGame};

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

            // Create starting orb bag with PRD starting orbs
            let mut starting_orb_bag = array![];
            starting_orb_bag.append(OrbType::SingleBomb);
            starting_orb_bag.append(OrbType::SingleBomb);
            starting_orb_bag.append(OrbType::FivePoints);
            starting_orb_bag.append(OrbType::FivePoints);
            starting_orb_bag.append(OrbType::FivePoints);
            starting_orb_bag.append(OrbType::Health);

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
                orb_bag: starting_orb_bag,
                orbs_drawn: array![],
            };

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
            assert(game.orb_bag.len() > 0, 'Orb bag is empty');

            // Generate pseudo-random index for orb selection
            let random_index = get_pseudo_random(player, game.game_id, game.orb_bag.len());
            
            // Get the selected orb
            let selected_orb = *game.orb_bag.at(random_index);

            // Apply orb effects to game state
            match selected_orb {
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

            // Remove orb from bag and add to drawn
            let mut new_orb_bag = array![];
            let mut i = 0;
            loop {
                if i == game.orb_bag.len() { break; }
                if i != random_index {
                    new_orb_bag.append(*game.orb_bag.at(i));
                }
                i += 1;
            };
            game.orb_bag = new_orb_bag;
            
            // Add to drawn orbs
            let mut new_orbs_drawn = array![];
            let mut j = 0;
            loop {
                if j == game.orbs_drawn.len() { break; }
                new_orbs_drawn.append(*game.orbs_drawn.at(j));
                j += 1;
            };
            new_orbs_drawn.append(selected_orb);
            game.orbs_drawn = new_orbs_drawn;

            // Check for game over conditions
            if game.health == 0 || game.orb_bag.len() == 0 {
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

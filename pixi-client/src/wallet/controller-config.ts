/**
 * Cartridge Controller configuration for Dojo game
 * Based on working implementation from client/controller.js
 */

// Import manifest - path relative to pixi-client directory
import manifest from "../../../contracts/manifest_dev.json";

const actionsContract = manifest.contracts.find(
  (contract: { tag: string; address: string }) => contract.tag === "di-actions",
);
const VRF_PROVIDER_ADDRESS =
  "0x15f542e25a4ce31481f986888c179b6e57412be340b8095f72f75a328fbb27b";

export const controllerOptions = {
  chains: [{ rpcUrl: "http://localhost:5050" }],
  // "KATANA"
  defaultChainId: "0x4b4154414e41",
  policies: {
    contracts: {
      [actionsContract!.address]: {
        name: "Actions",
        description: "Actions contract to control the player movement",
        methods: [
          {
            name: "Spawn",
            entrypoint: "spawn",
            description: "Spawn the player in the game (legacy)",
          },
          {
            name: "Spawn Game",
            entrypoint: "spawn_game",
            description:
              "Start a new Moon Bag game instance (costs 10 Moon Rocks)",
          },
          {
            name: "Pull Orb",
            entrypoint: "pull_orb",
            description:
              "Draw a random orb from your bag and apply its effects",
          },
          {
            name: "Advance to Next Level",
            entrypoint: "advance_to_next_level",
            description:
              "Progress to the next level after completing current milestone",
          },
          {
            name: "Quit Game",
            entrypoint: "quit_game",
            description:
              "End the current game and convert points to Moon Rocks",
          },
          {
            name: "Gift Moon Rocks",
            entrypoint: "gift_moonrocks",
            description: "Receive 500 Moon Rocks for new players",
          },
          {
            name: "Move",
            entrypoint: "move",
            description: "Move the player in the game",
          },
          {
            name: "Move Random",
            entrypoint: "move_random",
            description: "Move the player randomly",
          },
        ],
      },
      [VRF_PROVIDER_ADDRESS]: {
        methods: [{ entrypoint: "request_random" }],
      },
    },
  },
};

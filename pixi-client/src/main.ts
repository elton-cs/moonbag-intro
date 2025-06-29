import { setEngine } from "./app/getEngine";
import { HomeScreen } from "./app/screens/HomeScreen";
import { userSettings } from "./app/utils/userSettings";
import { CreationEngine } from "./engine/engine";
import { setupGlobalClient } from "./graphql/apollo-client";

/**
 * Importing these modules will automatically register there plugins with the engine.
 */
import "@pixi/sound";
// import "@esotericsoftware/spine-pixi-v8";

// Set up global Apollo GraphQL client
setupGlobalClient();

// Create a new creation engine instance
const engine = new CreationEngine();
setEngine(engine);

(async () => {
  // Initialize the creation engine instance
  await engine.init({
    background: "#1E1E1E",
    resizeOptions: { minWidth: 768, minHeight: 1024, letterbox: false },
  });

  // Initialize the user settings
  userSettings.init();

  // Show the home screen first
  await engine.navigation.showScreen(HomeScreen);
})();

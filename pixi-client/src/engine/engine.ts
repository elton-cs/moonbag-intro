import { sound } from "@pixi/sound";
import type {
  ApplicationOptions,
  DestroyOptions,
  RendererDestroyOptions,
} from "pixi.js";
import { Application, Assets, extensions, ResizePlugin } from "pixi.js";
import "pixi.js/app";

import { GameDataService } from "../graphql/services/GameDataService";
import { WalletService } from "../wallet/WalletService";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - This is a dynamically generated file by AssetPack
import manifest from "../manifest.json";

import { CreationAudioPlugin } from "./audio/AudioPlugin";
import { CreationNavigationPlugin } from "./navigation/NavigationPlugin";
import { CreationResizePlugin } from "./resize/ResizePlugin";
import { getResolution } from "./utils/getResolution";

extensions.remove(ResizePlugin);
extensions.add(CreationResizePlugin);
extensions.add(CreationAudioPlugin);
extensions.add(CreationNavigationPlugin);

/**
 * The main creation engine class.
 *
 * This is a lightweight wrapper around the PixiJS Application class.
 * It provides a few additional features such as:
 * - Navigation manager
 * - Audio manager
 * - Resize handling
 * - Visibility change handling (pause/resume sounds)
 * - Game data service for GraphQL integration
 * - Wallet service for blockchain transactions
 *
 * It also initializes the PixiJS application and loads any assets in the `preload` bundle.
 */
export class CreationEngine extends Application {
  /** Game data service for GraphQL queries and subscriptions */
  public gameData!: GameDataService;
  /** Wallet service for blockchain transactions */
  public wallet!: WalletService;
  /** Initialize the application */
  public async init(opts: Partial<ApplicationOptions>): Promise<void> {
    opts.resizeTo ??= window;
    opts.resolution ??= getResolution();

    await super.init(opts);

    // Initialize game data service
    this.gameData = new GameDataService();

    // Initialize wallet service
    this.wallet = new WalletService();

    // Append the application canvas to the document body
    document.getElementById("pixi-container")!.appendChild(this.canvas);
    // Add a visibility listener, so the app can pause sounds and screens
    document.addEventListener("visibilitychange", this.visibilityChange);

    // Init PixiJS assets with this asset manifest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Assets.init({ manifest: manifest as any, basePath: "assets" });
    await Assets.loadBundle("preload");

    // List all existing bundles names
    const allBundles =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (manifest as any).bundles?.map((item: any) => item.name) || [];
    // Start up background loading of all bundles
    Assets.backgroundLoadBundle(allBundles);
  }

  public override destroy(
    rendererDestroyOptions: RendererDestroyOptions = false,
    options: DestroyOptions = false,
  ): void {
    document.removeEventListener("visibilitychange", this.visibilityChange);

    // Clean up GraphQL subscriptions
    if (this.gameData) {
      this.gameData.clearSubscriptions();
    }

    super.destroy(rendererDestroyOptions, options);
  }

  /** Fire when document visibility changes - lose or regain focus */
  protected visibilityChange = () => {
    if (document.hidden) {
      sound.pauseAll();
      this.navigation.blur();
    } else {
      sound.resumeAll();
      this.navigation.focus();
    }
  };
}

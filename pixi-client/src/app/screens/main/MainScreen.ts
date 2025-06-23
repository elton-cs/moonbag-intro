import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container, Graphics } from "pixi.js";

import { engine } from "../../getEngine";
import { CustomButton } from "../../ui/CustomButton";
import { Label } from "../../ui/Label";
import { OrbsDrawnList } from "../../ui/OrbsDrawnList";
import type { WalletConnectionState } from "../../../wallet";
import { ConnectionStatus } from "../../../wallet";
import { GameDataService } from "../../../graphql/services/GameDataService";
import type { MoonBagData } from "../../../graphql/types";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  // Layout constants for consistent spacing
  private static readonly LAYOUT = {
    PADDING: 15,
    MARGIN: 25,
    PANEL_SPACING: 15, // Reduced spacing between rows
    RESOURCE_BAR: {
      WIDTH: 500,
      HEIGHT: 50,
      BORDER_RADIUS: 8,
    },
    GAME_STATUS: {
      WIDTH: 500,
      HEIGHT: 200, // Reduced height for game status area
      BORDER_RADIUS: 15,
    },
    ORB_INFO_ROW: {
      WIDTH: 500,
      HEIGHT: 60, // New row for orb bag contents
      BORDER_RADIUS: 8,
    },
    DRAWN_ORBS_ROW: {
      WIDTH: 500,
      HEIGHT: 160, // New row for drawn orbs list
      BORDER_RADIUS: 8,
    },
    CONTROL_PANEL: {
      WIDTH: 500, // Back to original width
      HEIGHT: 80,
      BORDER_RADIUS: 8,
    },
  };

  // UI Containers
  public mainContainer!: Container;

  // Connection UI
  private connectButton!: CustomButton;
  private usernameLabel!: Label;
  private titleLabel!: Label;

  // Game UI
  private resourceBar!: Container;
  private gameStatusArea!: Container;
  private orbInfoRow!: Container;
  private drawnOrbsRow!: Container;
  private controlPanel!: Container;
  private startGameButton!: CustomButton;
  private pullOrbButton!: CustomButton;
  private advanceLevelButton!: CustomButton;
  private cashOutButton!: CustomButton;
  private giftRocksButton!: CustomButton;

  // Resource labels (updateable)
  private healthLabel!: Label;
  private moonRocksLabel!: Label;
  private cheddahLabel!: Label;
  private pointsLabel!: Label;
  private multiplierLabel!: Label;
  private tempMultiplierLabel!: Label;

  // Game state labels
  private gameStateLabel!: Label;
  private levelLabel!: Label;
  private orbBagLabel!: Label;
  private orbsDrawnList!: OrbsDrawnList;

  // Settings UI (inline)
  private settingsContainer!: Container;
  private pauseButton!: CustomButton;

  // Background
  private background!: Graphics;

  private paused = false;
  private walletUnsubscribe?: () => void;
  private gameDataService: GameDataService;
  private moonBagDataUnsubscribe?: () => void;

  constructor() {
    super();

    this.gameDataService = new GameDataService();
    this.createBackground();
    this.createContainers();
    this.createUI();
    this.setupWalletConnection();
  }

  private createBackground(): void {
    // Create cosmic space background
    this.background = new Graphics();
    this.background.rect(0, 0, 1920, 1080); // Large size, will be resized
    this.background.fill(0x0a0a1a); // Deep space color
    this.addChild(this.background);
  }

  private createContainers(): void {
    // Main container for all UI
    this.mainContainer = new Container();
    this.addChild(this.mainContainer);

    // UI sub-containers - all visible simultaneously in rows
    this.resourceBar = new Container();
    this.gameStatusArea = new Container();
    this.orbInfoRow = new Container();
    this.drawnOrbsRow = new Container();
    this.controlPanel = new Container();
    this.settingsContainer = new Container();

    this.mainContainer.addChild(this.resourceBar);
    this.mainContainer.addChild(this.gameStatusArea);
    this.mainContainer.addChild(this.orbInfoRow);
    this.mainContainer.addChild(this.drawnOrbsRow);
    this.mainContainer.addChild(this.controlPanel);
    this.mainContainer.addChild(this.settingsContainer);
  }

  private createUI(): void {
    this.createTitle();
    this.createConnectionSection();
    this.createResourceBar();
    this.createGameStatusArea();
    this.createOrbInfoRow();
    this.createDrawnOrbsRow();
    this.createControlPanel();
    this.createSettingsSection();
  }

  private createTitle(): void {
    // Title label - always visible at top
    this.titleLabel = new Label({
      text: "🌙 MOON BAG 🌙",
      style: {
        fill: 0x8a4fff, // Cosmic purple
        align: "center",
        fontSize: 36,
        fontWeight: "bold",
      },
    });
    this.titleLabel.anchor.set(0.5);
    this.mainContainer.addChild(this.titleLabel);
  }

  private createConnectionSection(): void {
    // Connect wallet button
    this.connectButton = new CustomButton({
      text: "Connect Wallet",
      width: 200,
      height: 50,
      backgroundColor: 0x2a2a3a,
      borderColor: 0x8a4fff,
      textColor: 0xffffff,
    });
    this.connectButton.pivot.set(100, 25); // Center the button
    this.connectButton.onPress.on(() => this.handleConnectWallet());
    this.mainContainer.addChild(this.connectButton);

    // Username display label
    this.usernameLabel = new Label({
      text: "",
      style: {
        fill: 0xc0c0d0, // Moon silver
        align: "center",
        fontSize: 14,
      },
    });
    this.usernameLabel.anchor.set(0.5);
    this.usernameLabel.visible = false;
    this.mainContainer.addChild(this.usernameLabel);
  }

  private createResourceBar(): void {
    const layout = MainScreen.LAYOUT;

    // Resource display bar
    const barBackground = new Graphics();
    barBackground.roundRect(
      0,
      0,
      layout.RESOURCE_BAR.WIDTH,
      layout.RESOURCE_BAR.HEIGHT,
      layout.RESOURCE_BAR.BORDER_RADIUS,
    );
    barBackground.fill(0x1a1a2a);
    barBackground.stroke({ color: 0x8a4fff, width: 2 });
    this.resourceBar.addChild(barBackground);

    // Create updateable resource labels - now 6 items
    const spacing = layout.RESOURCE_BAR.WIDTH / 6;

    // Health label
    this.healthLabel = new Label({
      text: "❤️ 5",
      style: { fill: 0xff4a6a, fontSize: 12, fontWeight: "bold" },
    });
    this.healthLabel.anchor.set(0.5);
    this.healthLabel.position.set(
      spacing * 0.5,
      layout.RESOURCE_BAR.HEIGHT / 2,
    );
    this.resourceBar.addChild(this.healthLabel);

    // Moon Rocks label
    this.moonRocksLabel = new Label({
      text: "🌙 0",
      style: { fill: 0xffdd44, fontSize: 12, fontWeight: "bold" },
    });
    this.moonRocksLabel.anchor.set(0.5);
    this.moonRocksLabel.position.set(
      spacing * 1.5,
      layout.RESOURCE_BAR.HEIGHT / 2,
    );
    this.resourceBar.addChild(this.moonRocksLabel);

    // Cheddah label
    this.cheddahLabel = new Label({
      text: "💰 0",
      style: { fill: 0x44ff88, fontSize: 12, fontWeight: "bold" },
    });
    this.cheddahLabel.anchor.set(0.5);
    this.cheddahLabel.position.set(
      spacing * 2.5,
      layout.RESOURCE_BAR.HEIGHT / 2,
    );
    this.resourceBar.addChild(this.cheddahLabel);

    // Points label
    this.pointsLabel = new Label({
      text: "⭐ 0",
      style: { fill: 0x8a4fff, fontSize: 12, fontWeight: "bold" },
    });
    this.pointsLabel.anchor.set(0.5);
    this.pointsLabel.position.set(
      spacing * 3.5,
      layout.RESOURCE_BAR.HEIGHT / 2,
    );
    this.resourceBar.addChild(this.pointsLabel);

    // Base Multiplier label
    this.multiplierLabel = new Label({
      text: "⚡ 1x",
      style: { fill: 0xff9933, fontSize: 12, fontWeight: "bold" },
    });
    this.multiplierLabel.anchor.set(0.5);
    this.multiplierLabel.position.set(
      spacing * 4.5,
      layout.RESOURCE_BAR.HEIGHT / 2,
    );
    this.resourceBar.addChild(this.multiplierLabel);

    // Temporary Multiplier label (initially hidden)
    this.tempMultiplierLabel = new Label({
      text: "🔥 +2x NEXT",
      style: { fill: 0xff4444, fontSize: 12, fontWeight: "bold" },
    });
    this.tempMultiplierLabel.anchor.set(0.5);
    this.tempMultiplierLabel.position.set(
      spacing * 5.5,
      layout.RESOURCE_BAR.HEIGHT / 2,
    );
    this.tempMultiplierLabel.visible = false; // Hidden by default
    this.resourceBar.addChild(this.tempMultiplierLabel);
  }

  private createGameStatusArea(): void {
    const layout = MainScreen.LAYOUT;

    // Game status area background
    const gameBackground = new Graphics();
    gameBackground.roundRect(
      0,
      0,
      layout.GAME_STATUS.WIDTH,
      layout.GAME_STATUS.HEIGHT,
      layout.GAME_STATUS.BORDER_RADIUS,
    );
    gameBackground.fill(0x1a1a2a);
    gameBackground.stroke({ color: 0x8a4fff, width: 2 });
    this.gameStatusArea.addChild(gameBackground);

    const centerX = layout.GAME_STATUS.WIDTH / 2;
    const centerY = layout.GAME_STATUS.HEIGHT / 2;

    // Moon bag representation
    const bag = new Graphics();
    bag.circle(0, 0, 60); // Smaller bag to fit reduced height
    bag.fill(0x2a2a3a);
    bag.stroke({ color: 0xc0c0d0, width: 3 });
    bag.position.set(centerX, centerY - 20);
    this.gameStatusArea.addChild(bag);

    // Bag label with game state
    this.gameStateLabel = new Label({
      text: "🎒 Moon Bag - Ready to Play",
      style: { fill: 0xc0c0d0, align: "center", fontSize: 16 },
    });
    this.gameStateLabel.anchor.set(0.5);
    this.gameStateLabel.position.set(centerX, centerY + 50);
    this.gameStatusArea.addChild(this.gameStateLabel);

    // Level label
    this.levelLabel = new Label({
      text: "Level 1",
      style: {
        fill: 0x8a4fff,
        align: "center",
        fontSize: 14,
        fontWeight: "bold",
      },
    });
    this.levelLabel.anchor.set(0.5);
    this.levelLabel.position.set(centerX, centerY + 75);
    this.gameStatusArea.addChild(this.levelLabel);
  }

  private createOrbInfoRow(): void {
    const layout = MainScreen.LAYOUT;

    // Orb info row background
    const orbBackground = new Graphics();
    orbBackground.roundRect(
      0,
      0,
      layout.ORB_INFO_ROW.WIDTH,
      layout.ORB_INFO_ROW.HEIGHT,
      layout.ORB_INFO_ROW.BORDER_RADIUS,
    );
    orbBackground.fill(0x1a1a2a);
    orbBackground.stroke({ color: 0x8a4fff, width: 2 });
    this.orbInfoRow.addChild(orbBackground);

    const centerX = layout.ORB_INFO_ROW.WIDTH / 2;
    const centerY = layout.ORB_INFO_ROW.HEIGHT / 2;

    // Orb bag contents label
    this.orbBagLabel = new Label({
      text: "No orbs yet",
      style: { fill: 0x999999, align: "center", fontSize: 14 },
    });
    this.orbBagLabel.anchor.set(0.5);
    this.orbBagLabel.position.set(centerX, centerY);
    this.orbInfoRow.addChild(this.orbBagLabel);
  }

  private createDrawnOrbsRow(): void {
    const layout = MainScreen.LAYOUT;

    // Create background for drawn orbs row
    const drawnBackground = new Graphics();
    drawnBackground.roundRect(
      0,
      0,
      layout.DRAWN_ORBS_ROW.WIDTH,
      layout.DRAWN_ORBS_ROW.HEIGHT,
      layout.DRAWN_ORBS_ROW.BORDER_RADIUS,
    );
    drawnBackground.fill(0x1a1a2a);
    drawnBackground.stroke({ color: 0x8a4fff, width: 2 });
    this.drawnOrbsRow.addChild(drawnBackground);

    // Orbs drawn list centered in the row
    this.orbsDrawnList = new OrbsDrawnList({
      width: layout.DRAWN_ORBS_ROW.WIDTH - 20, // 10px padding on each side
      height: layout.DRAWN_ORBS_ROW.HEIGHT - 20, // 10px padding top/bottom
    });
    this.orbsDrawnList.position.set(10, 10); // 10px padding from edges
    this.drawnOrbsRow.addChild(this.orbsDrawnList);
  }

  private createControlPanel(): void {
    const layout = MainScreen.LAYOUT;

    // Control panel background
    const panelBackground = new Graphics();
    panelBackground.roundRect(
      0,
      0,
      layout.CONTROL_PANEL.WIDTH,
      layout.CONTROL_PANEL.HEIGHT,
      layout.CONTROL_PANEL.BORDER_RADIUS,
    );
    panelBackground.fill(0x1a1a2a);
    panelBackground.stroke({ color: 0x8a4fff, width: 2 });
    this.controlPanel.addChild(panelBackground);

    const buttonY = layout.CONTROL_PANEL.HEIGHT / 2;
    const buttonWidth = 95; // Smaller to fit 5 buttons
    const buttonHeight = 50;
    const totalButtonsWidth = buttonWidth * 5; // Now 5 buttons
    const spacing = (layout.CONTROL_PANEL.WIDTH - totalButtonsWidth) / 6; // 6 spaces for 5 buttons

    let currentX = spacing;

    // Start Game button
    this.startGameButton = new CustomButton({
      text: "🎮 START",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x2a2a3a,
      borderColor: 0x8a4fff,
      textColor: 0xffffff,
      fontSize: 11,
    });
    this.startGameButton.position.set(currentX, buttonY - buttonHeight / 2);
    this.startGameButton.onPress.on(() => this.handleStartGame());
    this.controlPanel.addChild(this.startGameButton);

    currentX += buttonWidth + spacing;

    // Pull Orb button
    this.pullOrbButton = new CustomButton({
      text: "🎲 PULL ORB",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x2a2a3a,
      borderColor: 0x4a9eff, // Blue for main game action
      textColor: 0xffffff,
      fontSize: 10,
    });
    this.pullOrbButton.position.set(currentX, buttonY - buttonHeight / 2);
    this.pullOrbButton.onPress.on(() => this.handlePullOrb());
    this.pullOrbButton.visible = false; // Initially hidden
    this.controlPanel.addChild(this.pullOrbButton);

    currentX += buttonWidth + spacing;

    // Advance Level button
    this.advanceLevelButton = new CustomButton({
      text: "⬆️ ADVANCE",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x2a2a3a,
      borderColor: 0x44ff88, // Green for progression
      textColor: 0xffffff,
      fontSize: 10,
    });
    this.advanceLevelButton.position.set(currentX, buttonY - buttonHeight / 2);
    this.advanceLevelButton.onPress.on(() => this.handleAdvanceLevel());
    this.advanceLevelButton.visible = false; // Initially hidden
    this.controlPanel.addChild(this.advanceLevelButton);

    currentX += buttonWidth + spacing;

    // Cash Out button
    this.cashOutButton = new CustomButton({
      text: "💰 CASH OUT",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x2a2a3a,
      borderColor: 0xff6644, // Orange/red for ending
      textColor: 0xffffff,
      fontSize: 10,
    });
    this.cashOutButton.position.set(currentX, buttonY - buttonHeight / 2);
    this.cashOutButton.onPress.on(() => this.handleCashOut());
    this.cashOutButton.visible = false; // Initially hidden
    this.controlPanel.addChild(this.cashOutButton);

    currentX += buttonWidth + spacing;

    // Gift Rocks button
    this.giftRocksButton = new CustomButton({
      text: "🎁 GIFT",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x2a2a3a,
      borderColor: 0xffaa00, // Golden color for gift
      textColor: 0xffffff,
      fontSize: 11,
    });
    this.giftRocksButton.position.set(currentX, buttonY - buttonHeight / 2);
    this.giftRocksButton.onPress.on(() => this.handleGiftMoonRocks());
    this.controlPanel.addChild(this.giftRocksButton);
  }

  private createSettingsSection(): void {
    // Inline settings in top-right corner
    this.pauseButton = new CustomButton({
      text: "⏸️",
      width: 50,
      height: 50,
      backgroundColor: 0x2a2a3a,
      borderColor: 0x8a4fff,
      textColor: 0xffffff,
      fontSize: 20,
    });
    this.pauseButton.pivot.set(25, 25); // Center the button
    this.pauseButton.onPress.on(() => this.handlePause());
    this.settingsContainer.addChild(this.pauseButton);
  }

  private setupWalletConnection(): void {
    // Subscribe to wallet state changes
    this.walletUnsubscribe = engine().wallet.onConnectionChange((state) =>
      this.onWalletStateChange(state),
    );
  }

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    if (this.paused) return;
    // Game update logic will go here
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {
    this.mainContainer.interactiveChildren = false;
    this.paused = true;
  }

  /** Resume gameplay */
  public async resume() {
    this.mainContainer.interactiveChildren = true;
    this.paused = false;
  }

  /** Fully reset */
  public reset() {}

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    const layout = MainScreen.LAYOUT;
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    // Resize background to cover full screen
    this.background.clear();
    this.background.rect(0, 0, width, height);
    this.background.fill(0x0a0a1a);

    // Center main container
    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;

    // Calculate total height needed for all elements
    const totalHeight =
      60 + // title
      40 + // connection button
      30 + // username
      layout.RESOURCE_BAR.HEIGHT +
      layout.PANEL_SPACING +
      layout.GAME_STATUS.HEIGHT +
      layout.PANEL_SPACING +
      layout.ORB_INFO_ROW.HEIGHT +
      layout.PANEL_SPACING +
      layout.DRAWN_ORBS_ROW.HEIGHT +
      layout.PANEL_SPACING +
      layout.CONTROL_PANEL.HEIGHT;

    let currentY = -totalHeight / 2;

    // Title at the top
    this.titleLabel.anchor.set(0.5);
    this.titleLabel.x = 0;
    this.titleLabel.y = currentY;
    currentY += 60;

    // Connection button
    this.connectButton.x = 0;
    this.connectButton.y = currentY;
    currentY += 40;

    // Username label
    this.usernameLabel.x = 0;
    this.usernameLabel.y = currentY;
    currentY += 30;

    // Resource bar
    this.resourceBar.x = -layout.RESOURCE_BAR.WIDTH / 2;
    this.resourceBar.y = currentY;
    currentY += layout.RESOURCE_BAR.HEIGHT + layout.PANEL_SPACING;

    // Game status area
    this.gameStatusArea.x = -layout.GAME_STATUS.WIDTH / 2;
    this.gameStatusArea.y = currentY;
    currentY += layout.GAME_STATUS.HEIGHT + layout.PANEL_SPACING;

    // Orb info row
    this.orbInfoRow.x = -layout.ORB_INFO_ROW.WIDTH / 2;
    this.orbInfoRow.y = currentY;
    currentY += layout.ORB_INFO_ROW.HEIGHT + layout.PANEL_SPACING;

    // Drawn orbs row
    this.drawnOrbsRow.x = -layout.DRAWN_ORBS_ROW.WIDTH / 2;
    this.drawnOrbsRow.y = currentY;
    currentY += layout.DRAWN_ORBS_ROW.HEIGHT + layout.PANEL_SPACING;

    // Control panel
    this.controlPanel.x = -layout.CONTROL_PANEL.WIDTH / 2;
    this.controlPanel.y = currentY;

    // Settings in top-right corner
    this.settingsContainer.x = width / 2 - 60;
    this.settingsContainer.y = -(height / 2) + 60;
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    // Animate all UI elements together
    const allElements = [
      this.titleLabel,
      this.connectButton,
      this.resourceBar,
      this.gameStatusArea,
      this.orbInfoRow,
      this.drawnOrbsRow,
      this.controlPanel,
      this.settingsContainer,
    ];

    let finalPromise!: AnimationPlaybackControls;

    for (const element of allElements) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.5, delay: 0.1, ease: "backOut" },
      );
    }

    await finalPromise;
  }

  /** Hide screen with animations */
  public async hide() {
    // Clean up wallet subscription
    if (this.walletUnsubscribe) {
      this.walletUnsubscribe();
    }

    // Clean up Moon Bag data subscription
    this.clearMoonBagDataSubscription();

    // Clear all GraphQL subscriptions
    this.gameDataService.clearSubscriptions();
  }

  /** Handle wallet connection button press */
  private async handleConnectWallet(): Promise<void> {
    try {
      await engine().wallet.connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }

  /** Handle start game button press */
  private async handleStartGame(): Promise<void> {
    try {
      console.log("Starting new Moon Bag game...");
      this.startGameButton.enabled = false;
      this.startGameButton.text = "🔄 STARTING...";

      await engine().wallet.spawnGame();
      console.log("Game started successfully!");

      // Refresh blockchain data with polling after successful transaction
      await this.refreshMoonBagDataWithPolling();

      // Button state will be updated by game state logic
      this.startGameButton.enabled = true;
      this.startGameButton.text = "🎮 START";
    } catch (error) {
      console.error("Failed to start game:", error);

      // Re-enable button on error
      this.startGameButton.enabled = true;
      this.startGameButton.text = "❌ FAILED";

      // Reset button text after showing error
      setTimeout(() => {
        this.startGameButton.text = "🎮 START";
      }, 2000);
    }
  }

  /** Handle pull orb button press */
  private async handlePullOrb(): Promise<void> {
    try {
      console.log("Pulling orb from bag...");
      this.pullOrbButton.enabled = false;
      this.pullOrbButton.text = "🔄 PULLING...";

      await engine().wallet.pullOrb();
      console.log("Orb pulled successfully!");

      // Refresh blockchain data with polling after successful transaction
      await this.refreshMoonBagDataWithPolling();

      // Button state will be updated by game state logic
      this.pullOrbButton.enabled = true;
      this.pullOrbButton.text = "🎲 PULL ORB";
    } catch (error) {
      console.error("Failed to pull orb:", error);

      // Re-enable button and show error state
      this.pullOrbButton.enabled = true;
      this.pullOrbButton.text = "❌ FAILED";

      // Reset button text after showing error
      setTimeout(() => {
        this.pullOrbButton.text = "🎲 PULL ORB";
      }, 2000);
    }
  }

  /** Handle advance level button press */
  private async handleAdvanceLevel(): Promise<void> {
    try {
      console.log("Advancing to next level...");
      this.advanceLevelButton.enabled = false;
      this.advanceLevelButton.text = "🔄 ADVANCING...";

      await engine().wallet.advanceToNextLevel();
      console.log("Advanced to next level successfully!");

      // Refresh blockchain data with polling after successful transaction
      await this.refreshMoonBagDataWithPolling();

      // Button visibility will be updated by game state logic
    } catch (error) {
      console.error("Failed to advance level:", error);

      // Re-enable button and show error state
      this.advanceLevelButton.enabled = true;
      this.advanceLevelButton.text = "❌ FAILED";

      // Reset button text after showing error
      setTimeout(() => {
        this.advanceLevelButton.text = "⬆️ ADVANCE";
      }, 2000);
    }
  }

  /** Handle quit game button press */
  private async handleCashOut(): Promise<void> {
    try {
      console.log("Quitting game and cashing out...");
      this.cashOutButton.enabled = false;
      this.cashOutButton.text = "🔄 CASHING...";

      await engine().wallet.cashOut();
      console.log("Game quit successfully!");

      // Refresh blockchain data with polling after successful transaction
      await this.refreshMoonBagDataWithPolling();

      // Button visibility will be updated by game state logic
    } catch (error) {
      console.error("Failed to quit game:", error);

      // Re-enable button and show error state
      this.cashOutButton.enabled = true;
      this.cashOutButton.text = "❌ FAILED";

      // Reset button text after showing error
      setTimeout(() => {
        this.cashOutButton.text = "💰 CASH OUT";
      }, 2000);
    }
  }

  /** Handle pause button press */
  private handlePause(): void {
    this.paused = !this.paused;
    this.pauseButton.text = this.paused ? "▶️" : "⏸️";
    console.log(this.paused ? "Game paused" : "Game resumed");
  }

  /** Handle gift moon rocks button press */
  private async handleGiftMoonRocks(): Promise<void> {
    try {
      // Check if wallet is connected
      if (!engine().wallet.isConnected()) {
        console.error("Wallet must be connected to receive gift");
        return;
      }

      console.log("Requesting moon rocks gift...");
      this.giftRocksButton.enabled = false;
      this.giftRocksButton.text = "🔄 GIFTING...";

      // Call the gift moon rocks function
      const result = await engine().wallet.giftMoonRocks();

      console.log("Moon rocks gift successful!", result);
      this.giftRocksButton.text = "✅ GIFTED!";

      // Refresh blockchain data with polling after successful transaction
      await this.refreshMoonBagDataWithPolling();

      // Keep button disabled after successful gift
      setTimeout(() => {
        this.giftRocksButton.text = "🎁 GIFT USED";
      }, 2000);
    } catch (error) {
      console.error("Failed to gift moon rocks:", error);

      // Re-enable button and show error state
      this.giftRocksButton.enabled = true;
      this.giftRocksButton.text = "❌ FAILED";

      // Reset button text after showing error
      setTimeout(() => {
        this.giftRocksButton.text = "🎁 GIFT";
      }, 2000);
    }
  }

  /** Fetch and log all Moon Bag data for connected player */
  private async fetchMoonBagData(): Promise<void> {
    try {
      const playerAddress = engine().wallet.getState().address;
      if (!playerAddress) {
        console.log("🚫 No player address available");
        return;
      }

      console.log("🔍 Fetching Moon Bag data for player:", playerAddress);

      // Fetch all data types individually for detailed logging
      console.log("📊 ==> FETCHING INDIVIDUAL DATA TYPES <==");

      await this.gameDataService.getPlayerMoonRocks(playerAddress);
      await this.gameDataService.getPlayerActiveGame(playerAddress);
      await this.gameDataService.getPlayerGameHistory(playerAddress);
      await this.gameDataService.getPlayerGameCounter(playerAddress);
      await this.gameDataService.getPlayerOrbBagSlots(playerAddress);
      await this.gameDataService.getPlayerDrawnOrbs(playerAddress);

      // Fetch combined data
      console.log("📊 ==> FETCHING COMBINED DATA <==");
      const allData = await this.gameDataService.getMoonBagData(playerAddress);

      // Update UI with fetched data
      if (allData) {
        this.updateUIWithMoonBagData(allData);
      }

      // Also fetch global data for debugging
      console.log("📊 ==> FETCHING GLOBAL DATA (ALL PLAYERS) <==");
      await this.gameDataService.getAllMoonBagDataGlobal();

      console.log("✅ Moon Bag data fetch complete!");
    } catch (error) {
      console.error("❌ Error fetching Moon Bag data:", error);
    }
  }

  /** Refresh Moon Bag data with fresh network fetch and polling */
  private async refreshMoonBagDataWithPolling(): Promise<void> {
    try {
      const playerAddress = engine().wallet.getState().address;
      if (!playerAddress) {
        console.log("🚫 No player address available for refresh");
        return;
      }

      console.log("🔄 Starting data refresh with polling...");

      // Wait a bit for transaction to be indexed by Torii
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Start polling for updates
      await this.gameDataService.pollForUpdates(
        playerAddress,
        (data: MoonBagData) => {
          console.log("🔄 Polling update received, updating UI");
          this.updateUIWithMoonBagData(data);
        },
      );
    } catch (error) {
      console.error("❌ Error refreshing Moon Bag data:", error);
    }
  }

  /** Update UI with Moon Bag data */
  private updateUIWithMoonBagData(data: MoonBagData): void {
    console.log("🎨 Updating UI with Moon Bag data:", data);

    // Update resource bar
    if (data.moonRocks) {
      this.moonRocksLabel.text = `🌙 ${data.moonRocks.amount}`;
    }

    // Find active game
    const activeGame =
      data.games.find((game) => game.is_active) || data.games[0];

    if (activeGame) {
      // Update resource displays
      this.healthLabel.text = `❤️ ${activeGame.health}`;
      this.cheddahLabel.text = `💰 ${activeGame.cheddah}`;
      this.pointsLabel.text = `⭐ ${activeGame.points}`;

      // Update multiplier displays
      this.multiplierLabel.text = `⚡ ${activeGame.multiplier}x`;

      // Show/hide temporary multiplier based on active state
      if (activeGame.temp_multiplier_active) {
        this.tempMultiplierLabel.text = `🔥 +${activeGame.temp_multiplier_value}x NEXT`;
        this.tempMultiplierLabel.visible = true;
      } else {
        this.tempMultiplierLabel.visible = false;
      }

      // Update level display
      this.levelLabel.text = `Level ${activeGame.current_level}`;

      // Update game state
      let gameStateText = "🎒 Moon Bag";
      switch (activeGame.game_state) {
        case "Active":
          gameStateText = "🎮 Game Active";
          break;
        case "LevelComplete":
          gameStateText = "🎉 Level Complete!";
          break;
        case "GameWon":
          gameStateText = "🏆 Game Won!";
          break;
        case "GameLost":
          gameStateText = "💀 Game Over";
          break;
      }
      this.gameStateLabel.text = gameStateText;

      // Update button states based on game state
      this.updateControlsForGameState(
        activeGame.game_state,
        activeGame.is_active,
      );
    } else {
      // No active game
      this.healthLabel.text = "❤️ --";
      this.cheddahLabel.text = "💰 --";
      this.pointsLabel.text = "⭐ --";
      this.multiplierLabel.text = "⚡ --";
      this.tempMultiplierLabel.visible = false;
      this.levelLabel.text = "No Game";
      this.gameStateLabel.text = "🎒 Moon Bag - Ready to Play";
      this.updateControlsForGameState("", false);
    }

    // Update orb bag display
    if (data.orbBagSlots && data.orbBagSlots.length > 0) {
      const orbCounts: Record<string, number> = {};
      data.orbBagSlots
        .filter((slot) => slot.is_active)
        .forEach((slot) => {
          orbCounts[slot.orb_type] = (orbCounts[slot.orb_type] || 0) + 1;
        });

      const orbTexts = Object.entries(orbCounts).map(([type, count]) => {
        const emoji = this.getOrbEmoji(type);
        return `${emoji}${count}`;
      });

      this.orbBagLabel.text =
        orbTexts.length > 0 ? orbTexts.join(" ") : "Empty bag";
    } else {
      this.orbBagLabel.text = "No orbs yet";
    }

    // Update drawn orbs list
    if (data.drawnOrbs && activeGame) {
      this.orbsDrawnList.updateDrawnOrbs(data.drawnOrbs, activeGame.game_id);
    } else {
      this.orbsDrawnList.updateDrawnOrbs([]);
    }
  }

  /** Get emoji for orb type */
  private getOrbEmoji(orbType: string): string {
    switch (orbType) {
      case "Health":
        return "❤️";
      case "FivePoints":
        return "⭐";
      case "SingleBomb":
        return "💣";
      default:
        return "🔮";
    }
  }

  /** Update control states based on game state */
  private updateControlsForGameState(
    gameState: string,
    hasActiveGame: boolean,
  ): void {
    // Hide all game action buttons initially
    this.pullOrbButton.visible = false;
    this.advanceLevelButton.visible = false;
    this.cashOutButton.visible = false;

    if (!hasActiveGame) {
      // No active game - show start button only
      this.startGameButton.enabled = true;
      this.startGameButton.text = "🎮 START";
      this.startGameButton.visible = true;
      return;
    }

    switch (gameState) {
      case "Active":
        // Game is active - show pull orb button, hide start
        this.startGameButton.visible = false;
        this.pullOrbButton.visible = true;
        this.pullOrbButton.enabled = true;
        break;

      case "LevelComplete":
        // Level completed - show advance and quit options
        this.startGameButton.visible = false;
        this.advanceLevelButton.visible = true;
        this.advanceLevelButton.enabled = true;
        this.cashOutButton.visible = true;
        this.cashOutButton.enabled = true;
        break;

      case "GameWon":
      case "GameLost":
        // Game over - show quit option only
        this.startGameButton.visible = false;
        this.cashOutButton.visible = true;
        this.cashOutButton.enabled = true;
        this.cashOutButton.text =
          gameState === "GameWon" ? "🏆 CLAIM VICTORY" : "💀 END GAME";
        break;

      default:
        // Fallback - show start button
        this.startGameButton.enabled = true;
        this.startGameButton.text = "🎮 START";
        this.startGameButton.visible = true;
        break;
    }
  }

  /** Setup real-time subscription to Moon Bag data changes */
  private setupMoonBagDataSubscription(playerAddress: string): void {
    // Clear existing subscription
    if (this.moonBagDataUnsubscribe) {
      this.moonBagDataUnsubscribe();
    }

    console.log(
      "🔔 Setting up real-time Moon Bag data subscription for:",
      playerAddress,
    );

    this.moonBagDataUnsubscribe = this.gameDataService.watchMoonBagData(
      playerAddress,
      (data: MoonBagData) => {
        console.log("🔔 Real-time Moon Bag data update:", data);
        this.updateUIWithMoonBagData(data);
      },
    );
  }

  /** Clear Moon Bag data subscription */
  private clearMoonBagDataSubscription(): void {
    if (this.moonBagDataUnsubscribe) {
      console.log("🔕 Clearing Moon Bag data subscription");
      this.moonBagDataUnsubscribe();
      this.moonBagDataUnsubscribe = undefined;
    }
  }

  /** Handle wallet state changes and update UI accordingly */
  private onWalletStateChange(state: WalletConnectionState): void {
    switch (state.status) {
      case ConnectionStatus.Disconnected:
        this.connectButton.text = "Connect Wallet";
        this.connectButton.enabled = true;
        this.usernameLabel.visible = false;
        this.startGameButton.enabled = false;
        this.pullOrbButton.enabled = false;
        this.advanceLevelButton.enabled = false;
        this.cashOutButton.enabled = false;
        this.giftRocksButton.enabled = false;
        this.clearMoonBagDataSubscription();
        break;

      case ConnectionStatus.Connecting:
        this.connectButton.text = "Connecting...";
        this.connectButton.enabled = false;
        this.usernameLabel.visible = false;
        this.giftRocksButton.enabled = false;
        this.pullOrbButton.enabled = false;
        this.advanceLevelButton.enabled = false;
        this.cashOutButton.enabled = false;
        break;

      case ConnectionStatus.Connected: {
        this.connectButton.text = "Connected";
        this.connectButton.enabled = false;
        this.startGameButton.enabled = true;
        this.giftRocksButton.enabled = true;
        // Game action buttons will be enabled by game state logic

        // Show username or address
        const displayName = engine().wallet.getUserDisplayName();
        if (displayName) {
          this.usernameLabel.text = `User: ${displayName}`;
          this.usernameLabel.visible = true;
        }

        console.log("Wallet connected successfully:", state.address);
        console.log("User display name:", displayName);

        // Fetch Moon Bag data when wallet connects
        if (state.address) {
          this.fetchMoonBagData();
          this.setupMoonBagDataSubscription(state.address);
        }
        break;
      }

      case ConnectionStatus.Error:
        this.connectButton.text = "Connection Failed";
        this.connectButton.enabled = true;
        this.usernameLabel.visible = false;
        this.startGameButton.enabled = false;
        this.pullOrbButton.enabled = false;
        this.advanceLevelButton.enabled = false;
        this.cashOutButton.enabled = false;
        this.giftRocksButton.enabled = false;
        console.error("Wallet connection error:", state.error);
        break;
    }
  }
}

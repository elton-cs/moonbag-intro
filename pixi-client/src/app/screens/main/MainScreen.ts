import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container, Graphics, Sprite } from "pixi.js";

import { engine } from "../../getEngine";
import { CustomButton } from "../../ui/CustomButton";
import { Label } from "../../ui/Label";
import { OrbsDrawnList } from "../../ui/OrbsDrawnList";
import { EventLogList } from "../../ui/EventLogList";
import { ShopScreen } from "../ShopScreen";
import type { ShopScreenData } from "../ShopScreen";
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
    MOON_ROCKS_ROW: {
      WIDTH: 300,
      HEIGHT: 50,
      BORDER_RADIUS: 8,
    },
    RESOURCE_BAR: {
      WIDTH: 500,
      HEIGHT: 50,
      BORDER_RADIUS: 8,
    },
    CENTRAL_ORB_DISPLAY: {
      WIDTH: 500,
      HEIGHT: 180, // Large central display for current orb
      BORDER_RADIUS: 8,
    },
    DRAWN_ORBS_ROW: {
      WIDTH: 500,
      HEIGHT: 160, // New row for drawn orbs list
      BORDER_RADIUS: 8,
    },
    EVENT_LOG_ROW: {
      WIDTH: 500,
      HEIGHT: 100, // New row for event log
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
  private usernameLabel!: Label;
  private titleLabel!: Label;

  // Game UI
  private moonRocksRow!: Container;
  private resourceBar!: Container;
  private centralOrbDisplay!: Container;
  private drawnOrbsRow!: Container;
  private eventLogRow!: Container;
  private controlPanel!: Container;
  private startGameButton!: CustomButton;
  private pullOrbButton!: CustomButton;
  private advanceLevelButton!: CustomButton;
  private cashOutButton!: CustomButton;
  private giftRocksButton!: CustomButton;

  // Resource labels (updateable)
  private healthLabel!: Label;
  private moonRocksLabel!: Label;
  private moonRocksDisplayLabel!: Label;
  private cheddahLabel!: Label;
  private pointsLabel!: Label;
  private multiplierLabel!: Label;
  private tempMultiplierLabel!: Label;

  // Game state labels
  private levelLabel!: Label;
  private currentOrbLabel!: Label;
  private currentOrbEmoji!: Label;
  private orbsDrawnList!: OrbsDrawnList;
  private eventLogList!: EventLogList;

  // Settings UI (inline)
  private settingsContainer!: Container;
  private pauseButton!: CustomButton;

  // Background
  private background!: Graphics;
  private backgroundImage!: Sprite;
  private flashOverlay!: Graphics;
  private confettiContainer!: Container;

  private paused = false;
  private walletUnsubscribe?: () => void;
  private gameDataService: GameDataService;
  private moonBagDataUnsubscribe?: () => void;

  // State tracking for event logging
  private lastGameState: string = "";
  private lastHealth: number = 0;
  private lastPoints: number = 0;
  private lastCheddah: number = 0;
  private lastMoonRocks: number = 0;
  private lastLevel: number = 0;
  private lastOrbsDrawnCount: number = 0;

  constructor() {
    super();

    this.gameDataService = new GameDataService();
    this.createBackground();
    this.createContainers();
    this.createUI();
    this.setupWalletConnection();
  }

  private createBackground(): void {
    // Create solid background first
    this.background = new Graphics();
    this.background.rect(0, 0, 1920, 1080); // Large size, will be resized
    this.background.fill(0x0a0a1a); // Deep space color
    this.addChild(this.background);

    // Try to load background image if available
    try {
      // This will work if you place background.png in raw-assets/preload/
      this.backgroundImage = Sprite.from("preload/background.png");
      this.backgroundImage.anchor.set(0.5);
      this.addChild(this.backgroundImage);
    } catch (error) {
      console.log("Background image not found, using solid color background");
    }

    // Create flash overlay for damage/healing effects
    this.flashOverlay = new Graphics();
    this.flashOverlay.rect(0, 0, 1920, 1080);
    this.flashOverlay.fill(0xff0000); // Red by default
    this.flashOverlay.alpha = 0; // Initially invisible
    this.addChild(this.flashOverlay);
  }

  private createContainers(): void {
    // Main container for all UI
    this.mainContainer = new Container();
    this.addChild(this.mainContainer);

    // UI sub-containers - all visible simultaneously in rows
    this.moonRocksRow = new Container();
    this.resourceBar = new Container();
    this.centralOrbDisplay = new Container();
    this.drawnOrbsRow = new Container();
    this.eventLogRow = new Container();
    this.controlPanel = new Container();
    this.settingsContainer = new Container();
    this.confettiContainer = new Container();

    this.mainContainer.addChild(this.moonRocksRow);
    this.mainContainer.addChild(this.resourceBar);
    this.mainContainer.addChild(this.centralOrbDisplay);
    this.mainContainer.addChild(this.drawnOrbsRow);
    this.mainContainer.addChild(this.eventLogRow);
    this.mainContainer.addChild(this.controlPanel);
    this.mainContainer.addChild(this.settingsContainer);
    
    // Add confetti container on top of everything for visual effects
    this.mainContainer.addChild(this.confettiContainer);
  }

  private createUI(): void {
    this.createTitle();
    this.createUserInfo();
    this.createMoonRocksRow();
    this.createResourceBar();
    this.createCentralOrbDisplay();
    this.createDrawnOrbsRow();
    this.createEventLogRow();
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

  private createUserInfo(): void {
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

  private createMoonRocksRow(): void {
    const layout = MainScreen.LAYOUT;

    // Moon Rocks display row - centered and prominent
    const moonBackground = new Graphics();
    moonBackground.roundRect(
      0,
      0,
      layout.MOON_ROCKS_ROW.WIDTH,
      layout.MOON_ROCKS_ROW.HEIGHT,
      layout.MOON_ROCKS_ROW.BORDER_RADIUS,
    );
    moonBackground.fill(0x1a1a2a);
    moonBackground.stroke({ color: 0xffdd44, width: 2 }); // Gold border for Moon Rocks
    this.moonRocksRow.addChild(moonBackground);

    // Large Moon Rocks label
    this.moonRocksDisplayLabel = new Label({
      text: "🌙 0",
      style: { fill: 0xffdd44, fontSize: 20, fontWeight: "bold", align: "center" },
    });
    this.moonRocksDisplayLabel.anchor.set(0.5);
    this.moonRocksDisplayLabel.position.set(
      layout.MOON_ROCKS_ROW.WIDTH / 2,
      layout.MOON_ROCKS_ROW.HEIGHT / 2,
    );
    this.moonRocksRow.addChild(this.moonRocksDisplayLabel);
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

    // Create updateable resource labels - now 5 items (removed Moon Rocks)
    const spacing = layout.RESOURCE_BAR.WIDTH / 5;

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

    // Cheddah label
    this.cheddahLabel = new Label({
      text: "💰 0",
      style: { fill: 0x44ff88, fontSize: 12, fontWeight: "bold" },
    });
    this.cheddahLabel.anchor.set(0.5);
    this.cheddahLabel.position.set(
      spacing * 1.5,
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
      spacing * 2.5,
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
      spacing * 3.5,
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
      spacing * 4.5,
      layout.RESOURCE_BAR.HEIGHT / 2,
    );
    this.tempMultiplierLabel.visible = false; // Hidden by default
    this.resourceBar.addChild(this.tempMultiplierLabel);
  }


  private createCentralOrbDisplay(): void {
    const layout = MainScreen.LAYOUT;

    // Create background for central orb display - larger than other rows
    const centralBackground = new Graphics();
    centralBackground.roundRect(
      0,
      0,
      layout.CENTRAL_ORB_DISPLAY.WIDTH,
      layout.CENTRAL_ORB_DISPLAY.HEIGHT,
      layout.CENTRAL_ORB_DISPLAY.BORDER_RADIUS,
    );
    centralBackground.fill(0x1a1a2a);
    centralBackground.stroke({ color: 0x8a4fff, width: 2 });
    this.centralOrbDisplay.addChild(centralBackground);

    const centerX = layout.CENTRAL_ORB_DISPLAY.WIDTH / 2;
    const centerY = layout.CENTRAL_ORB_DISPLAY.HEIGHT / 2;

    // Large emoji for the current orb
    this.currentOrbEmoji = new Label({
      text: "🎲",
      style: {
        fill: 0xffffff,
        align: "center",
        fontSize: 72, // Very large emoji
      },
    });
    this.currentOrbEmoji.anchor.set(0.5);
    this.currentOrbEmoji.position.set(centerX, centerY - 30);
    this.centralOrbDisplay.addChild(this.currentOrbEmoji);

    // Current orb name/description
    this.currentOrbLabel = new Label({
      text: "Pull an orb to see result",
      style: {
        fill: 0xc0c0d0,
        align: "center",
        fontSize: 18,
        fontWeight: "bold",
      },
    });
    this.currentOrbLabel.anchor.set(0.5);
    this.currentOrbLabel.position.set(centerX, centerY + 50);
    this.centralOrbDisplay.addChild(this.currentOrbLabel);

    // Level label positioned under the orb description
    this.levelLabel = new Label({
      text: "Level 1",
      style: {
        fill: 0x8a4fff,
        align: "center",
        fontSize: 16,
        fontWeight: "bold",
      },
    });
    this.levelLabel.anchor.set(0.5);
    this.levelLabel.position.set(centerX, centerY + 80);
    this.centralOrbDisplay.addChild(this.levelLabel);
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

  private createEventLogRow(): void {
    const layout = MainScreen.LAYOUT;

    // Create background for event log row
    const logBackground = new Graphics();
    logBackground.roundRect(
      0,
      0,
      layout.EVENT_LOG_ROW.WIDTH,
      layout.EVENT_LOG_ROW.HEIGHT,
      layout.EVENT_LOG_ROW.BORDER_RADIUS,
    );
    logBackground.fill(0x1a1a2a);
    logBackground.stroke({ color: 0x8a4fff, width: 2 });
    this.eventLogRow.addChild(logBackground);

    // Event log list centered in the row
    this.eventLogList = new EventLogList({
      width: layout.EVENT_LOG_ROW.WIDTH - 20, // 10px padding on each side
      height: layout.EVENT_LOG_ROW.HEIGHT - 20, // 10px padding top/bottom
    });
    this.eventLogList.position.set(10, 10); // 10px padding from edges
    this.eventLogRow.addChild(this.eventLogList);
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

    // Advance Level button (now opens shop first)
    this.advanceLevelButton = new CustomButton({
      text: "🛒 ENTER SHOP",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x2a2a3a,
      borderColor: 0x44ff88, // Green for progression
      textColor: 0xffffff,
      fontSize: 9, // Slightly smaller font for longer text
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

    // Scale and center background image if it exists
    if (this.backgroundImage) {
      this.backgroundImage.position.set(centerX, centerY);
      
      // Scale to cover the screen while maintaining aspect ratio
      const scaleX = width / this.backgroundImage.texture.width;
      const scaleY = height / this.backgroundImage.texture.height;
      const scale = Math.max(scaleX, scaleY);
      this.backgroundImage.scale.set(scale);
    }

    // Resize flash overlay to cover full screen
    this.flashOverlay.clear();
    this.flashOverlay.rect(0, 0, width, height);
    this.flashOverlay.fill(0xff0000); // Will be changed based on effect type

    // Center main container
    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;

    // Calculate total height needed for all elements
    const totalHeight =
      60 + // title
      30 + // username
      layout.MOON_ROCKS_ROW.HEIGHT +
      layout.PANEL_SPACING +
      layout.RESOURCE_BAR.HEIGHT +
      layout.PANEL_SPACING +
      layout.CENTRAL_ORB_DISPLAY.HEIGHT +
      layout.PANEL_SPACING +
      layout.DRAWN_ORBS_ROW.HEIGHT +
      layout.PANEL_SPACING +
      layout.EVENT_LOG_ROW.HEIGHT +
      layout.PANEL_SPACING +
      layout.CONTROL_PANEL.HEIGHT;

    let currentY = -totalHeight / 2;

    // Title at the top
    this.titleLabel.anchor.set(0.5);
    this.titleLabel.x = 0;
    this.titleLabel.y = currentY;
    currentY += 60;

    // Username label
    this.usernameLabel.x = 0;
    this.usernameLabel.y = currentY;
    currentY += 30;

    // Moon Rocks row
    this.moonRocksRow.x = -layout.MOON_ROCKS_ROW.WIDTH / 2;
    this.moonRocksRow.y = currentY;
    currentY += layout.MOON_ROCKS_ROW.HEIGHT + layout.PANEL_SPACING;

    // Resource bar
    this.resourceBar.x = -layout.RESOURCE_BAR.WIDTH / 2;
    this.resourceBar.y = currentY;
    currentY += layout.RESOURCE_BAR.HEIGHT + layout.PANEL_SPACING;

    // Central orb display
    this.centralOrbDisplay.x = -layout.CENTRAL_ORB_DISPLAY.WIDTH / 2;
    this.centralOrbDisplay.y = currentY;
    currentY += layout.CENTRAL_ORB_DISPLAY.HEIGHT + layout.PANEL_SPACING;

    // Drawn orbs row
    this.drawnOrbsRow.x = -layout.DRAWN_ORBS_ROW.WIDTH / 2;
    this.drawnOrbsRow.y = currentY;
    currentY += layout.DRAWN_ORBS_ROW.HEIGHT + layout.PANEL_SPACING;

    // Event log row
    this.eventLogRow.x = -layout.EVENT_LOG_ROW.WIDTH / 2;
    this.eventLogRow.y = currentY;
    currentY += layout.EVENT_LOG_ROW.HEIGHT + layout.PANEL_SPACING;

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
      this.moonRocksRow,
      this.resourceBar,
      this.centralOrbDisplay,
      this.drawnOrbsRow,
      this.eventLogRow,
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


  /** Handle start game button press */
  private async handleStartGame(): Promise<void> {
    try {
      console.log("Starting new Moon Bag game...");
      this.startGameButton.enabled = false;
      this.startGameButton.text = "🔄 STARTING...";

      // Clear previous game events and reset state tracking
      this.eventLogList.clearEvents();
      this.eventLogList.addEvent("🎮 Starting new game...", "info");

      // Reset state tracking for new game
      this.lastGameState = "";
      this.lastHealth = 0;
      this.lastPoints = 0;
      this.lastCheddah = 0;
      this.lastLevel = 0;
      this.lastOrbsDrawnCount = 0;

      await engine().wallet.spawnGame();
      console.log("Game started successfully!");

      this.eventLogList.addEvent("✅ New game started!", "success");

      // Refresh blockchain data with polling after successful transaction
      await this.refreshMoonBagDataWithPolling();

      // Button state will be updated by game state logic
      this.startGameButton.enabled = true;
      this.startGameButton.text = "🎮 START";
    } catch (error) {
      console.error("Failed to start game:", error);

      this.eventLogList.addEvent("❌ Failed to start game", "error");

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

      this.eventLogList.addEvent("🎲 Pulling orb from bag...", "info");

      await engine().wallet.pullOrb();
      console.log("Orb pulled successfully!");

      this.eventLogList.addEvent("🎯 Orb pulled! Checking result...", "info");

      // Refresh blockchain data with polling after successful transaction
      await this.refreshMoonBagDataWithPolling();

      // Button state will be updated by game state logic
      this.pullOrbButton.enabled = true;
      this.pullOrbButton.text = "🎲 PULL ORB";
    } catch (error) {
      console.error("Failed to pull orb:", error);

      this.eventLogList.addEvent("❌ Failed to pull orb", "error");

      // Re-enable button and show error state
      this.pullOrbButton.enabled = true;
      this.pullOrbButton.text = "❌ FAILED";

      // Reset button text after showing error
      setTimeout(() => {
        this.pullOrbButton.text = "🎲 PULL ORB";
      }, 2000);
    }
  }

  /** Handle advance level button press - now shows shop first */
  private async handleAdvanceLevel(): Promise<void> {
    try {
      console.log("Opening shop before advancing to next level...");
      this.eventLogList.addEvent("🛒 Opening cosmic orb shop...", "info");

      await this.showShopScreen();
    } catch (error) {
      console.error("Failed to open shop:", error);
      this.eventLogList.addEvent("❌ Failed to open shop", "error");
    }
  }

  /** Show the shop screen with current game data */
  private async showShopScreen(): Promise<void> {
    try {
      const playerAddress = engine().wallet.getState().address;
      if (!playerAddress) {
        throw new Error("No player address available");
      }

      // Get current game data
      const allData = await this.gameDataService.getMoonBagData(playerAddress);
      const activeGame =
        allData.games.find((game) => game.is_active) || allData.games[0];

      if (!activeGame) {
        throw new Error("No active game found");
      }

      // Get shop data for current level
      console.log(
        `🛒 MAIN: Fetching shop data for game ${activeGame.game_id}, level ${activeGame.current_level}`,
      );
      const shopData = await this.gameDataService.getShopData(
        playerAddress,
        activeGame.game_id,
        activeGame.current_level,
      );

      console.log(`🛒 MAIN: Shop data received:`, shopData);
      console.log(
        `🛒 MAIN: Shop inventory count: ${shopData.shopInventory.length}`,
      );
      console.log(
        `🛒 MAIN: Purchase history count: ${shopData.purchaseHistory.length}`,
      );

      if (shopData.shopInventory.length < 6) {
        console.warn(
          `🛒 MAIN WARNING: Only ${shopData.shopInventory.length} shop items found, expected 6`,
        );
        console.warn(
          `🛒 MAIN WARNING: This might be a backend issue with shop generation`,
        );
      }

      // Calculate next level cost (simplified - you may want to import the actual calculation)
      const nextLevelCost = this.calculateNextLevelCost(
        activeGame.current_level + 1,
      );

      // Prepare shop screen data
      const shopScreenData: ShopScreenData = {
        currentGame: activeGame,
        shopInventory: shopData.shopInventory,
        purchaseHistory: shopData.purchaseHistory,
        nextLevelCost: nextLevelCost,
      };

      console.log(`🛒 MAIN: Prepared shop screen data:`, shopScreenData);

      // Show shop screen as popup using constructor
      await engine().navigation.presentPopup(ShopScreen);

      // Access the created popup and initialize it
      const shopScreen = engine().navigation.currentPopup as ShopScreen;
      if (shopScreen) {
        shopScreen.setShopData(shopScreenData);
        shopScreen.setCallbacks({
          onAdvance: () => this.handleShopAdvanceLevel(),
          onCashOut: () => this.handleShopCashOut(),
          onBack: () => this.handleShopBack(),
        });
      }
    } catch (error) {
      console.error("Failed to show shop screen:", error);
      this.eventLogList.addEvent("❌ Failed to load shop", "error");
    }
  }

  /** Handle advance level from shop screen */
  private async handleShopAdvanceLevel(): Promise<void> {
    try {
      console.log("Advancing to next level from shop...");
      this.eventLogList.addEvent("⬆️ Advancing to next level...", "info");

      await engine().wallet.advanceToNextLevel();
      console.log("Advanced to next level successfully!");

      this.eventLogList.addEvent("🎉 Level advanced successfully!", "success");

      // Dismiss shop popup
      await engine().navigation.dismissPopup();

      // Refresh blockchain data with polling after successful transaction
      await this.refreshMoonBagDataWithPolling();
    } catch (error) {
      console.error("Failed to advance level:", error);
      this.eventLogList.addEvent("❌ Failed to advance level", "error");
      throw error; // Let shop screen handle the error
    }
  }

  /** Handle cash out from shop screen */
  private async handleShopCashOut(): Promise<void> {
    try {
      console.log("Cashing out from shop...");
      this.eventLogList.addEvent("💰 Cashing out and ending game...", "info");

      await engine().wallet.cashOut();
      console.log("Cashed out successfully!");

      this.eventLogList.addEvent("✅ Game ended - rewards claimed!", "success");

      // Dismiss shop popup
      await engine().navigation.dismissPopup();

      // Refresh blockchain data with polling after successful transaction
      await this.refreshMoonBagDataWithPolling();
    } catch (error) {
      console.error("Failed to cash out:", error);
      this.eventLogList.addEvent("❌ Failed to cash out", "error");
      throw error; // Let shop screen handle the error
    }
  }

  /** Handle back from shop screen (return without advancing) */
  private async handleShopBack(): Promise<void> {
    console.log("Returning from shop without advancing...");
    this.eventLogList.addEvent("↩️ Returned from shop", "info");

    // Simply dismiss the shop popup
    await engine().navigation.dismissPopup();
  }

  /** Calculate next level cost - simplified version */
  private calculateNextLevelCost(level: number): number {
    // Based on the contract's get_level_cost function
    switch (level) {
      case 1:
        return 5;
      case 2:
        return 6;
      case 3:
        return 8;
      case 4:
        return 10;
      case 5:
        return 12;
      case 6:
        return 16;
      case 7:
        return 20;
      default:
        return 0;
    }
  }

  /** Handle quit game button press */
  private async handleCashOut(): Promise<void> {
    try {
      console.log("Quitting game and cashing out...");
      this.cashOutButton.enabled = false;
      this.cashOutButton.text = "🔄 CASHING...";

      this.eventLogList.addEvent("💰 Cashing out and ending game...", "info");

      await engine().wallet.cashOut();
      console.log("Game quit successfully!");

      this.eventLogList.addEvent("✅ Game ended - rewards claimed!", "success");

      // Refresh blockchain data with polling after successful transaction
      await this.refreshMoonBagDataWithPolling();

      // Button visibility will be updated by game state logic
    } catch (error) {
      console.error("Failed to quit game:", error);

      this.eventLogList.addEvent("❌ Failed to cash out", "error");

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

      this.eventLogList.addEvent("🎁 Requesting moon rocks gift...", "info");

      // Call the gift moon rocks function
      const result = await engine().wallet.giftMoonRocks();

      console.log("Moon rocks gift successful!", result);
      this.giftRocksButton.text = "✅ GIFTED!";
      this.eventLogList.addEvent("🌙 Received moon rocks gift!", "success");

      // Refresh blockchain data with polling after successful transaction
      await this.refreshMoonBagDataWithPolling();

      // Keep button disabled after successful gift
      setTimeout(() => {
        this.giftRocksButton.text = "🎁 GIFT USED";
      }, 2000);
    } catch (error) {
      console.error("Failed to gift moon rocks:", error);

      this.eventLogList.addEvent("❌ Failed to receive gift", "error");

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

    // Track moon rocks changes
    if (data.moonRocks && data.moonRocks.amount !== this.lastMoonRocks) {
      if (this.lastMoonRocks > 0) {
        // Don't log initial state
        const change = data.moonRocks.amount - this.lastMoonRocks;
        if (change > 0) {
          this.eventLogList.addEvent(
            `🌙 +${change} Moon Rocks earned!`,
            "success",
          );
        } else if (change < 0) {
          this.eventLogList.addEvent(
            `🌙 ${change} Moon Rocks spent`,
            "warning",
          );
        }
      }
      this.lastMoonRocks = data.moonRocks.amount;
    }

    // Update Moon Rocks display
    if (data.moonRocks) {
      this.moonRocksDisplayLabel.text = `🌙 ${data.moonRocks.amount}`;
    }

    // Find active game
    const activeGame =
      data.games.find((game) => game.is_active) || data.games[0];

    if (activeGame) {
      // Track health changes
      if (activeGame.health !== this.lastHealth && this.lastHealth > 0) {
        const change = activeGame.health - this.lastHealth;
        if (change > 0) {
          this.eventLogList.addEvent(
            `❤️ +${change} Health restored!`,
            "success",
          );
          this.flashHealing(); // Green flash for healing
        } else if (change < 0) {
          this.eventLogList.addEvent(
            `💔 ${Math.abs(change)} Health lost!`,
            "error",
          );
          this.flashDamage(); // Red flash for damage
        }
      }
      this.lastHealth = activeGame.health;

      // Track points changes
      if (activeGame.points !== this.lastPoints && this.lastPoints > 0) {
        const change = activeGame.points - this.lastPoints;
        if (change > 0) {
          this.eventLogList.addEvent(`⭐ +${change} Points earned!`, "success");
          this.createStarConfetti(change); // Star confetti for points gained
        }
      }
      this.lastPoints = activeGame.points;

      // Track cheddah changes
      if (activeGame.cheddah !== this.lastCheddah && this.lastCheddah > 0) {
        const change = activeGame.cheddah - this.lastCheddah;
        if (change > 0) {
          this.eventLogList.addEvent(
            `💰 +${change} Cheddah earned!`,
            "success",
          );
        }
      }
      this.lastCheddah = activeGame.cheddah;

      // Track level changes
      if (activeGame.current_level !== this.lastLevel && this.lastLevel > 0) {
        if (activeGame.current_level > this.lastLevel) {
          this.eventLogList.addEvent(
            `🎯 Reached Level ${activeGame.current_level}!`,
            "success",
          );
        }
      }
      this.lastLevel = activeGame.current_level;

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

      // Track game state changes
      if (
        activeGame.game_state !== this.lastGameState &&
        this.lastGameState !== ""
      ) {
        switch (activeGame.game_state) {
          case "Active":
            // Don't log transition to active unless from another state
            break;
          case "LevelComplete":
            this.eventLogList.addEvent(
              "🎉 Level completed! Choose your next move",
              "success",
            );
            break;
          case "GameWon":
            this.eventLogList.addEvent(
              "🏆 VICTORY! You've conquered all levels!",
              "success",
            );
            break;
          case "GameLost":
            this.eventLogList.addEvent(
              "💀 Game Over - Better luck next time!",
              "error",
            );
            break;
        }
      }
      this.lastGameState = activeGame.game_state;


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
      this.moonRocksDisplayLabel.text = "🌙 --";
      this.resetCentralOrbDisplay();
      this.updateControlsForGameState("", false);
    }


    // Update drawn orbs list and track new orbs
    if (data.drawnOrbs && activeGame) {
      // Check for new orbs drawn
      const currentGameOrbs = data.drawnOrbs.filter(
        (orb) => orb.game_id === activeGame.game_id,
      );
      const newOrbsCount = currentGameOrbs.length;

      // If we have more orbs than before, find the newest one and log it
      if (
        newOrbsCount > this.lastOrbsDrawnCount &&
        this.lastOrbsDrawnCount >= 0
      ) {
        const newestOrb = currentGameOrbs.sort(
          (a, b) => b.draw_index - a.draw_index,
        )[0];
        const orbEmoji = this.getOrbEmoji(newestOrb.orb_type);
        let effectMessage = "";

        switch (newestOrb.orb_type) {
          case "Health":
            effectMessage = " - Health restored!";
            break;
          case "FivePoints":
            effectMessage = " - Points gained!";
            this.createStarConfetti(5); // Immediate star confetti for 5 points
            break;
          case "SingleBomb":
            effectMessage = " - Bomb exploded!";
            break;
        }

        this.eventLogList.addEvent(
          `🎯 Drew ${orbEmoji} ${newestOrb.orb_type}${effectMessage}`,
          newestOrb.orb_type === "SingleBomb" ? "error" : "info",
        );

        // Update central orb display with the newest orb
        this.updateCentralOrbDisplay(newestOrb.orb_type);
      }
      this.lastOrbsDrawnCount = newOrbsCount;

      this.orbsDrawnList.updateDrawnOrbs(data.drawnOrbs, activeGame.game_id);
      
      // Show most recent orb in central display if any orbs have been drawn
      if (currentGameOrbs.length > 0) {
        const mostRecentOrb = currentGameOrbs.sort(
          (a, b) => b.draw_index - a.draw_index,
        )[0];
        this.updateCentralOrbDisplay(mostRecentOrb.orb_type);
      } else {
        // Reset to default state if no orbs drawn
        this.resetCentralOrbDisplay();
      }
    } else {
      this.orbsDrawnList.updateDrawnOrbs([]);
      this.resetCentralOrbDisplay();
    }
  }

  /** Update the central orb display with the pulled orb */
  private updateCentralOrbDisplay(orbType: string): void {
    const orbEmoji = this.getOrbEmoji(orbType);
    this.currentOrbEmoji.text = orbEmoji;
    this.currentOrbLabel.text = orbType;
    
    // Set color based on orb type
    switch (orbType) {
      case "Health":
        this.currentOrbLabel.style.fill = 0xff4a6a; // Red for health
        break;
      case "FivePoints":
        this.currentOrbLabel.style.fill = 0x8a4fff; // Purple for points
        break;
      case "SingleBomb":
        this.currentOrbLabel.style.fill = 0xff4444; // Red for bomb
        break;
      default:
        this.currentOrbLabel.style.fill = 0xc0c0d0; // Default silver
        break;
    }
  }

  /** Reset central orb display to default state */
  private resetCentralOrbDisplay(): void {
    this.currentOrbEmoji.text = "🎲";
    this.currentOrbLabel.text = "Pull an orb to see result";
    this.currentOrbLabel.style.fill = 0xc0c0d0; // Default silver
  }

  /** Flash screen red for damage */
  private flashDamage(): void {
    this.flashOverlay.clear();
    this.flashOverlay.rect(0, 0, this.flashOverlay.width || 1920, this.flashOverlay.height || 1080);
    this.flashOverlay.fill(0xff0000); // Bright red
    
    // Quick bright flash then fade out
    animate(this.flashOverlay, { alpha: [0, 0.6, 0] }, { 
      duration: 0.4, 
      ease: "easeOut" 
    });
  }

  /** Flash screen green for healing/points */
  private flashHealing(): void {
    this.flashOverlay.clear();
    this.flashOverlay.rect(0, 0, this.flashOverlay.width || 1920, this.flashOverlay.height || 1080);
    this.flashOverlay.fill(0x00ff00); // Bright green
    
    // Quick bright flash then fade out
    animate(this.flashOverlay, { alpha: [0, 0.5, 0] }, { 
      duration: 0.5, 
      ease: "easeOut" 
    });
  }

  /** Create star confetti animation for point increases */
  private createStarConfetti(pointsGained: number): void {
    const starEmojis = ["⭐", "🌟", "✨", "💫"];
    
    // More stars for higher point gains (minimum 6, max 20)
    const numStars = Math.min(20, Math.max(6, pointsGained * 2 + 4));
    
    for (let i = 0; i < numStars; i++) {
      // Create star label
      const star = new Label({
        text: starEmojis[Math.floor(Math.random() * starEmojis.length)],
        style: {
          fontSize: 24 + Math.random() * 16, // Random size between 24-40px
          align: "center",
        },
      });
      
      star.anchor.set(0.5);
      
      // Start from center of screen
      star.position.set(0, 0);
      star.alpha = 0;
      star.scale.set(0);
      
      this.confettiContainer.addChild(star);
      
      // Random direction and distance
      const angle = (Math.PI * 2 * i) / numStars + (Math.random() - 0.5) * 0.8;
      const distance = 200 + Math.random() * 300;
      const finalX = Math.cos(angle) * distance;
      const finalY = Math.sin(angle) * distance;
      
      // Animate star burst
      animate(
        star,
        {
          x: finalX,
          y: finalY,
          alpha: [0, 1, 0],
          scale: [0, 1.2, 0.8, 0],
          rotation: Math.random() * Math.PI * 4, // Multiple rotations
        },
        {
          duration: 1.5 + Math.random() * 0.5, // 1.5-2 seconds
          ease: "easeOut",
        }
      ).then(() => {
        // Clean up after animation
        this.confettiContainer.removeChild(star);
        star.destroy();
      });
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
        // Game is active - show pull orb and cash out buttons, hide start
        this.startGameButton.visible = false;
        this.pullOrbButton.visible = true;
        this.pullOrbButton.enabled = true;
        this.cashOutButton.visible = true;
        this.cashOutButton.enabled = true;
        this.cashOutButton.text = "💰 CASH OUT";
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
        this.usernameLabel.visible = false;
        this.startGameButton.enabled = false;
        this.pullOrbButton.enabled = false;
        this.advanceLevelButton.enabled = false;
        this.cashOutButton.enabled = false;
        this.giftRocksButton.enabled = false;
        this.clearMoonBagDataSubscription();
        break;

      case ConnectionStatus.Connecting:
        this.usernameLabel.visible = false;
        this.giftRocksButton.enabled = false;
        this.pullOrbButton.enabled = false;
        this.advanceLevelButton.enabled = false;
        this.cashOutButton.enabled = false;
        break;

      case ConnectionStatus.Connected: {
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

        this.eventLogList.addEvent(
          "🔗 Welcome back! Wallet already connected",
          "success",
        );

        // Fetch Moon Bag data when wallet connects
        if (state.address) {
          this.fetchMoonBagData();
          this.setupMoonBagDataSubscription(state.address);
        }
        break;
      }

      case ConnectionStatus.Error:
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

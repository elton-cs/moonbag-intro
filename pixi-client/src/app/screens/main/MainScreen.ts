import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container, Graphics } from "pixi.js";

import { engine } from "../../getEngine";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Label";
import type { WalletConnectionState } from "../../../wallet";
import { ConnectionStatus } from "../../../wallet";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  // Layout constants for consistent spacing
  private static readonly LAYOUT = {
    PADDING: 20,
    MARGIN: 40,
    PANEL_SPACING: 30,
    RESOURCE_BAR: {
      WIDTH: 800,
      HEIGHT: 80,
      BORDER_RADIUS: 10,
    },
    GAME_AREA: {
      WIDTH: 600,
      HEIGHT: 400,
      BORDER_RADIUS: 20,
    },
    CONTROL_PANEL: {
      WIDTH: 800,
      HEIGHT: 120,
      BORDER_RADIUS: 10,
    },
    CONNECTION: {
      TITLE_SPACING: 80,
      BUTTON_SPACING: 80,
      USERNAME_SPACING: 60,
    },
  };

  // UI Containers
  public mainContainer!: Container;
  private connectionContainer!: Container;
  private gameContainer!: Container;

  // Connection UI
  private connectButton!: Button;
  private usernameLabel!: Label;
  private titleLabel!: Label;

  // Game UI
  private resourceBar!: Container;
  private gameArea!: Container;
  private controlPanel!: Container;
  private startGameButton!: Button;

  // Background
  private background!: Graphics;

  private paused = false;
  private walletUnsubscribe?: () => void;

  // Helper methods for positioning calculations

  private calculateGameUILayout() {
    const layout = MainScreen.LAYOUT;
    const totalGameHeight =
      layout.RESOURCE_BAR.HEIGHT +
      layout.GAME_AREA.HEIGHT +
      layout.CONTROL_PANEL.HEIGHT +
      layout.PANEL_SPACING * 2;

    return {
      resourceBarY: -(totalGameHeight / 2),
      gameAreaY:
        -(totalGameHeight / 2) +
        layout.RESOURCE_BAR.HEIGHT +
        layout.PANEL_SPACING,
      controlPanelY:
        -(totalGameHeight / 2) +
        layout.RESOURCE_BAR.HEIGHT +
        layout.GAME_AREA.HEIGHT +
        layout.PANEL_SPACING * 2,
    };
  }

  constructor() {
    super();

    this.createBackground();
    this.createContainers();
    this.createConnectionUI();
    this.createGameUI();
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

    // Connection screen container (shown when disconnected)
    this.connectionContainer = new Container();
    this.mainContainer.addChild(this.connectionContainer);

    // Game UI container (shown when connected)
    this.gameContainer = new Container();
    this.gameContainer.visible = false;
    this.mainContainer.addChild(this.gameContainer);

    // Game UI sub-containers
    this.resourceBar = new Container();
    this.gameArea = new Container();
    this.controlPanel = new Container();

    this.gameContainer.addChild(this.resourceBar);
    this.gameContainer.addChild(this.gameArea);
    this.gameContainer.addChild(this.controlPanel);
  }

  private createConnectionUI(): void {
    // Title label
    this.titleLabel = new Label({
      text: "🌙 MOON BAG 🌙",
      style: {
        fill: 0x8a4fff, // Cosmic purple
        align: "center",
        fontSize: 48,
        fontWeight: "bold",
      },
    });
    this.titleLabel.anchor.set(0.5);
    this.connectionContainer.addChild(this.titleLabel);

    // Connect wallet button
    this.connectButton = new Button({
      text: "Connect Wallet",
      width: 301,
      height: 112,
    });
    this.connectButton.anchor.set(0.5);
    this.connectButton.onPress.connect(() => this.handleConnectWallet());
    this.connectionContainer.addChild(this.connectButton);

    // Username display label
    this.usernameLabel = new Label({
      text: "",
      style: {
        fill: 0xc0c0d0, // Moon silver
        align: "center",
        fontSize: 18,
      },
    });
    this.usernameLabel.anchor.set(0.5);
    this.usernameLabel.visible = false;
    this.connectionContainer.addChild(this.usernameLabel);
  }

  private createGameUI(): void {
    this.createResourceBar();
    this.createGameArea();
    this.createControlPanel();
  }

  private createResourceBar(): void {
    const layout = MainScreen.LAYOUT;

    // Resource display bar at top
    const barBackground = new Graphics();
    barBackground.roundRect(
      0,
      0,
      layout.RESOURCE_BAR.WIDTH,
      layout.RESOURCE_BAR.HEIGHT,
      layout.RESOURCE_BAR.BORDER_RADIUS,
    );
    barBackground.fill(0x1a1a2a); // Dark panel
    barBackground.stroke({ color: 0x8a4fff, width: 2 }); // Purple border
    this.resourceBar.addChild(barBackground);

    // Position resource labels with consistent spacing
    const leftColumnX = layout.PADDING;
    const rightColumnX = layout.RESOURCE_BAR.WIDTH / 2 + layout.PADDING;
    const firstRowY = layout.PADDING;
    const secondRowY = layout.RESOURCE_BAR.HEIGHT - layout.PADDING - 20; // Subtract text height estimate

    // Health display
    const healthLabel = new Label({
      text: "❤️ Health: 5",
      style: {
        fill: 0xff4a6a, // Cosmic red
        fontSize: 16,
        fontWeight: "bold",
      },
    });
    healthLabel.position.set(leftColumnX, firstRowY);
    this.resourceBar.addChild(healthLabel);

    // Moon Rocks display
    const moonRocksLabel = new Label({
      text: "🌙 Moon Rocks: 304",
      style: {
        fill: 0xffdd44, // Star gold
        fontSize: 16,
        fontWeight: "bold",
      },
    });
    moonRocksLabel.position.set(leftColumnX, secondRowY);
    this.resourceBar.addChild(moonRocksLabel);

    // Cheddah display
    const cheddahLabel = new Label({
      text: "💰 Cheddah: 0",
      style: {
        fill: 0x44ff88, // Green
        fontSize: 16,
        fontWeight: "bold",
      },
    });
    cheddahLabel.position.set(rightColumnX, firstRowY);
    this.resourceBar.addChild(cheddahLabel);

    // Points display
    const pointsLabel = new Label({
      text: "⭐ Points: 0",
      style: {
        fill: 0x8a4fff, // Cosmic purple
        fontSize: 16,
        fontWeight: "bold",
      },
    });
    pointsLabel.position.set(rightColumnX, secondRowY);
    this.resourceBar.addChild(pointsLabel);
  }

  private createGameArea(): void {
    const layout = MainScreen.LAYOUT;

    // Central game area with bag visualization
    const gameBackground = new Graphics();
    gameBackground.roundRect(
      0,
      0,
      layout.GAME_AREA.WIDTH,
      layout.GAME_AREA.HEIGHT,
      layout.GAME_AREA.BORDER_RADIUS,
    );
    gameBackground.fill(0x1a1a2a);
    gameBackground.stroke({ color: 0x8a4fff, width: 3 });
    this.gameArea.addChild(gameBackground);

    // Calculate center positions within the game area
    const centerX = layout.GAME_AREA.WIDTH / 2;
    const titleY = layout.MARGIN + 10; // Title near top with margin
    const bagY = layout.GAME_AREA.HEIGHT / 2; // Bag in vertical center
    const bagLabelY = bagY + 100 + layout.PADDING; // Label below bag with padding

    // Game title
    const gameTitle = new Label({
      text: "MOON BAG GAME",
      style: {
        fill: 0x8a4fff,
        align: "center",
        fontSize: 24,
        fontWeight: "bold",
      },
    });
    gameTitle.anchor.set(0.5);
    gameTitle.position.set(centerX, titleY);
    this.gameArea.addChild(gameTitle);

    // Bag representation (large circle)
    const bag = new Graphics();
    bag.circle(0, 0, 80);
    bag.fill(0x2a2a3a);
    bag.stroke({ color: 0xc0c0d0, width: 3 });
    bag.position.set(centerX, bagY);
    this.gameArea.addChild(bag);

    // Bag label
    const bagLabel = new Label({
      text: "🎒 Your Bag",
      style: {
        fill: 0xc0c0d0,
        align: "center",
        fontSize: 18,
      },
    });
    bagLabel.anchor.set(0.5);
    bagLabel.position.set(centerX, bagLabelY);
    this.gameArea.addChild(bagLabel);
  }

  private createControlPanel(): void {
    const layout = MainScreen.LAYOUT;

    // Bottom control panel
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

    // Calculate button positions for even spacing
    const buttonY = (layout.CONTROL_PANEL.HEIGHT - 60) / 2; // Center buttons vertically
    const totalButtonWidth = 250 + 150 + 150; // Start + Shop + Stats button widths
    const spacing =
      (layout.CONTROL_PANEL.WIDTH - totalButtonWidth - layout.PADDING * 2) / 2; // Space between buttons

    let currentX = layout.PADDING;

    // Start Game button
    this.startGameButton = new Button({
      text: "🎮 START GAME",
      width: 250,
      height: 60,
    });
    this.startGameButton.position.set(currentX, buttonY);
    this.startGameButton.onPress.connect(() => this.handleStartGame());
    this.controlPanel.addChild(this.startGameButton);

    currentX += 250 + spacing;

    // Shop button (placeholder for future)
    const shopButton = new Button({
      text: "🛒 SHOP",
      width: 150,
      height: 60,
    });
    shopButton.position.set(currentX, buttonY);
    shopButton.enabled = false; // Disabled for now
    this.controlPanel.addChild(shopButton);

    currentX += 150 + spacing;

    // Stats button (placeholder for future)
    const statsButton = new Button({
      text: "📊 STATS",
      width: 150,
      height: 60,
    });
    statsButton.position.set(currentX, buttonY);
    statsButton.enabled = false; // Disabled for now
    this.controlPanel.addChild(statsButton);
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

    // Position connection UI with consistent spacing
    this.titleLabel.x = 0;
    this.titleLabel.y = -layout.CONNECTION.TITLE_SPACING;

    this.connectButton.x = 0; // Now centered due to anchor
    this.connectButton.y = 0;

    this.usernameLabel.x = 0;
    this.usernameLabel.y = layout.CONNECTION.USERNAME_SPACING;

    // Position game UI using calculated layout
    const gameLayout = this.calculateGameUILayout();

    // Center resource bar horizontally
    this.resourceBar.x = -layout.RESOURCE_BAR.WIDTH / 2;
    this.resourceBar.y = gameLayout.resourceBarY;

    // Center game area horizontally
    this.gameArea.x = -layout.GAME_AREA.WIDTH / 2;
    this.gameArea.y = gameLayout.gameAreaY;

    // Center control panel horizontally
    this.controlPanel.x = -layout.CONTROL_PANEL.WIDTH / 2;
    this.controlPanel.y = gameLayout.controlPanelY;
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    // Animate connection UI elements
    const connectionElements = [this.titleLabel, this.connectButton];

    // Animate game UI elements (if visible)
    const gameElements = [this.resourceBar, this.gameArea, this.controlPanel];

    let finalPromise!: AnimationPlaybackControls;

    // Animate visible elements
    const elementsToAnimate = this.gameContainer.visible
      ? gameElements
      : connectionElements;

    for (const element of elementsToAnimate) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.5, delay: 0.2, ease: "backOut" },
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
      await engine().wallet.spawnGame();
      console.log("Game started successfully!");
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  }

  /** Handle wallet state changes and update UI accordingly */
  private onWalletStateChange(state: WalletConnectionState): void {
    switch (state.status) {
      case ConnectionStatus.Disconnected:
        this.connectButton.text = "Connect Wallet";
        this.connectButton.enabled = true;
        this.usernameLabel.visible = false;
        this.showConnectionUI();
        break;

      case ConnectionStatus.Connecting:
        this.connectButton.text = "Connecting...";
        this.connectButton.enabled = false;
        this.usernameLabel.visible = false;
        break;

      case ConnectionStatus.Connected: {
        this.connectButton.text = "Connected";
        this.connectButton.enabled = false;

        // Show username or address
        const displayName = engine().wallet.getUserDisplayName();
        if (displayName) {
          this.usernameLabel.text = `User: ${displayName}`;
          this.usernameLabel.visible = true;
        }

        console.log("Wallet connected successfully:", state.address);
        console.log("User display name:", displayName);

        // Transition to game UI
        this.showGameUI();
        break;
      }

      case ConnectionStatus.Error:
        this.connectButton.text = "Connection Failed";
        this.connectButton.enabled = true;
        this.usernameLabel.visible = false;
        console.error("Wallet connection error:", state.error);
        break;
    }
  }

  /** Show connection UI and hide game UI */
  private showConnectionUI(): void {
    this.connectionContainer.visible = true;
    this.gameContainer.visible = false;
  }

  /** Show game UI and hide connection UI */
  private async showGameUI(): Promise<void> {
    this.connectionContainer.visible = false;
    this.gameContainer.visible = true;

    // Animate in the game UI
    const gameElements = [this.resourceBar, this.gameArea, this.controlPanel];

    for (const element of gameElements) {
      element.alpha = 0;
      animate(
        element,
        { alpha: 1 },
        { duration: 0.6, delay: 0.1, ease: "backOut" },
      );
    }
  }
}

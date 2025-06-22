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
    // Resource display bar at top
    const barBackground = new Graphics();
    barBackground.roundRect(0, 0, 800, 80, 10);
    barBackground.fill(0x1a1a2a); // Dark panel
    barBackground.stroke({ color: 0x8a4fff, width: 2 }); // Purple border
    this.resourceBar.addChild(barBackground);

    // Health display
    const healthLabel = new Label({
      text: "❤️ Health: 5",
      style: {
        fill: 0xff4a6a, // Cosmic red
        fontSize: 16,
        fontWeight: "bold",
      },
    });
    healthLabel.position.set(20, 15);
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
    moonRocksLabel.position.set(20, 40);
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
    cheddahLabel.position.set(400, 15);
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
    pointsLabel.position.set(400, 40);
    this.resourceBar.addChild(pointsLabel);
  }

  private createGameArea(): void {
    // Central game area with bag visualization
    const gameBackground = new Graphics();
    gameBackground.roundRect(0, 0, 600, 400, 20);
    gameBackground.fill(0x1a1a2a);
    gameBackground.stroke({ color: 0x8a4fff, width: 3 });
    this.gameArea.addChild(gameBackground);

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
    gameTitle.position.set(300, 50);
    this.gameArea.addChild(gameTitle);

    // Bag representation (large circle)
    const bag = new Graphics();
    bag.circle(0, 0, 80);
    bag.fill(0x2a2a3a);
    bag.stroke({ color: 0xc0c0d0, width: 3 });
    bag.position.set(300, 200);
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
    bagLabel.position.set(300, 320);
    this.gameArea.addChild(bagLabel);
  }

  private createControlPanel(): void {
    // Bottom control panel
    const panelBackground = new Graphics();
    panelBackground.roundRect(0, 0, 800, 120, 10);
    panelBackground.fill(0x1a1a2a);
    panelBackground.stroke({ color: 0x8a4fff, width: 2 });
    this.controlPanel.addChild(panelBackground);

    // Start Game button
    this.startGameButton = new Button({
      text: "🎮 START GAME",
      width: 250,
      height: 60,
    });
    this.startGameButton.position.set(50, 30);
    this.startGameButton.onPress.connect(() => this.handleStartGame());
    this.controlPanel.addChild(this.startGameButton);

    // Shop button (placeholder for future)
    const shopButton = new Button({
      text: "🛒 SHOP",
      width: 150,
      height: 60,
    });
    shopButton.position.set(320, 30);
    shopButton.enabled = false; // Disabled for now
    this.controlPanel.addChild(shopButton);

    // Stats button (placeholder for future)
    const statsButton = new Button({
      text: "📊 STATS",
      width: 150,
      height: 60,
    });
    statsButton.position.set(490, 30);
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
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    // Resize background to cover full screen
    this.background.clear();
    this.background.rect(0, 0, width, height);
    this.background.fill(0x0a0a1a);

    // Center main container
    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;

    // Position connection UI (centered)
    this.titleLabel.x = 0;
    this.titleLabel.y = -150;

    this.connectButton.x = -this.connectButton.width / 2;
    this.connectButton.y = -50;

    this.usernameLabel.x = 0;
    this.usernameLabel.y = 100;

    // Position game UI
    this.resourceBar.x = -400;
    this.resourceBar.y = -300;

    this.gameArea.x = -300;
    this.gameArea.y = -150;

    this.controlPanel.x = -400;
    this.controlPanel.y = 250;
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

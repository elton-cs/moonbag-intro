import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container, Graphics } from "pixi.js";

import { engine } from "../../getEngine";
import { CustomButton } from "../../ui/CustomButton";
import { Label } from "../../ui/Label";
import type { WalletConnectionState } from "../../../wallet";
import { ConnectionStatus } from "../../../wallet";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  // Layout constants for consistent spacing
  private static readonly LAYOUT = {
    PADDING: 15,
    MARGIN: 25,
    PANEL_SPACING: 20,
    RESOURCE_BAR: {
      WIDTH: 500,
      HEIGHT: 50,
      BORDER_RADIUS: 8,
    },
    GAME_AREA: {
      WIDTH: 500,
      HEIGHT: 300,
      BORDER_RADIUS: 15,
    },
    CONTROL_PANEL: {
      WIDTH: 500,
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
  private gameArea!: Container;
  private controlPanel!: Container;
  private startGameButton!: CustomButton;
  private giftRocksButton!: CustomButton;

  // Settings UI (inline)
  private settingsContainer!: Container;
  private pauseButton!: CustomButton;

  // Background
  private background!: Graphics;

  private paused = false;
  private walletUnsubscribe?: () => void;


  constructor() {
    super();

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

    // UI sub-containers - all visible simultaneously
    this.resourceBar = new Container();
    this.gameArea = new Container();
    this.controlPanel = new Container();
    this.settingsContainer = new Container();

    this.mainContainer.addChild(this.resourceBar);
    this.mainContainer.addChild(this.gameArea);
    this.mainContainer.addChild(this.controlPanel);
    this.mainContainer.addChild(this.settingsContainer);
  }

  private createUI(): void {
    this.createTitle();
    this.createConnectionSection();
    this.createResourceBar();
    this.createGameArea();
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

    // Evenly spaced resource display
    const resources = [
      { text: "❤️ 5", color: 0xff4a6a },
      { text: "🌙 304", color: 0xffdd44 },
      { text: "💰 0", color: 0x44ff88 },
      { text: "⭐ 0", color: 0x8a4fff },
    ];

    const spacing = layout.RESOURCE_BAR.WIDTH / resources.length;
    resources.forEach(({ text, color }, index) => {
      const label = new Label({ 
        text, 
        style: { fill: color, fontSize: 14, fontWeight: "bold" } 
      });
      label.anchor.set(0.5); // Center the text
      label.position.set(spacing * (index + 0.5), layout.RESOURCE_BAR.HEIGHT / 2);
      this.resourceBar.addChild(label);
    });
  }

  private createGameArea(): void {
    const layout = MainScreen.LAYOUT;

    // Game area background
    const gameBackground = new Graphics();
    gameBackground.roundRect(
      0,
      0,
      layout.GAME_AREA.WIDTH,
      layout.GAME_AREA.HEIGHT,
      layout.GAME_AREA.BORDER_RADIUS,
    );
    gameBackground.fill(0x1a1a2a);
    gameBackground.stroke({ color: 0x8a4fff, width: 2 });
    this.gameArea.addChild(gameBackground);

    const centerX = layout.GAME_AREA.WIDTH / 2;
    const centerY = layout.GAME_AREA.HEIGHT / 2;

    // Moon bag representation
    const bag = new Graphics();
    bag.circle(0, 0, 80);
    bag.fill(0x2a2a3a);
    bag.stroke({ color: 0xc0c0d0, width: 3 });
    bag.position.set(centerX, centerY - 30);
    this.gameArea.addChild(bag);

    // Bag label
    const bagLabel = new Label({
      text: "🎒 Moon Bag",
      style: { fill: 0xc0c0d0, align: "center", fontSize: 18 },
    });
    bagLabel.anchor.set(0.5);
    bagLabel.position.set(centerX, centerY + 80);
    this.gameArea.addChild(bagLabel);
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
    const buttonWidth = 115; // Smaller to fit 4 buttons
    const buttonHeight = 50;
    const totalButtonsWidth = buttonWidth * 4; // Now 4 buttons
    const spacing = (layout.CONTROL_PANEL.WIDTH - totalButtonsWidth) / 5; // 5 spaces for 4 buttons
    
    let currentX = spacing;

    // Start Game button
    this.startGameButton = new CustomButton({
      text: "🎮 START",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x2a2a3a,
      borderColor: 0x8a4fff,
      textColor: 0xffffff,
    });
    this.startGameButton.position.set(currentX, buttonY - buttonHeight/2);
    this.startGameButton.onPress.on(() => this.handleStartGame());
    this.controlPanel.addChild(this.startGameButton);

    currentX += buttonWidth + spacing;

    // Shop button
    const shopButton = new CustomButton({
      text: "🛒 SHOP",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x1a1a2a,
      borderColor: 0x555555,
      textColor: 0x888888,
      enabled: false,
    });
    shopButton.position.set(currentX, buttonY - buttonHeight/2);
    this.controlPanel.addChild(shopButton);

    currentX += buttonWidth + spacing;

    // Gift Rocks button
    this.giftRocksButton = new CustomButton({
      text: "🎁 GIFT ROCKS",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x2a2a3a,
      borderColor: 0xffaa00, // Golden color for gift
      textColor: 0xffffff,
      fontSize: 12, // Smaller font for longer text
    });
    this.giftRocksButton.position.set(currentX, buttonY - buttonHeight/2);
    this.giftRocksButton.onPress.on(() => this.handleGiftMoonRocks());
    this.controlPanel.addChild(this.giftRocksButton);

    currentX += buttonWidth + spacing;

    // Stats button
    const statsButton = new CustomButton({
      text: "📊 STATS",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x1a1a2a,
      borderColor: 0x555555,
      textColor: 0x888888,
      enabled: false,
    });
    statsButton.position.set(currentX, buttonY - buttonHeight/2);
    this.controlPanel.addChild(statsButton);
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
    const totalHeight = 60 + 40 + 30 + layout.RESOURCE_BAR.HEIGHT + 
                       layout.PANEL_SPACING + layout.GAME_AREA.HEIGHT + 
                       layout.PANEL_SPACING + layout.CONTROL_PANEL.HEIGHT;
    
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

    // Game area
    this.gameArea.x = -layout.GAME_AREA.WIDTH / 2;
    this.gameArea.y = currentY;
    currentY += layout.GAME_AREA.HEIGHT + layout.PANEL_SPACING;

    // Control panel
    this.controlPanel.x = -layout.CONTROL_PANEL.WIDTH / 2;
    this.controlPanel.y = currentY;

    // Settings in top-right corner
    this.settingsContainer.x = (width / 2) - 60;
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
      this.gameArea,
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
        this.giftRocksButton.text = "🎁 GIFT ROCKS";
      }, 2000);
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
        this.giftRocksButton.enabled = false;
        break;

      case ConnectionStatus.Connecting:
        this.connectButton.text = "Connecting...";
        this.connectButton.enabled = false;
        this.usernameLabel.visible = false;
        this.giftRocksButton.enabled = false;
        break;

      case ConnectionStatus.Connected: {
        this.connectButton.text = "Connected";
        this.connectButton.enabled = false;
        this.startGameButton.enabled = true;
        this.giftRocksButton.enabled = true;

        // Show username or address
        const displayName = engine().wallet.getUserDisplayName();
        if (displayName) {
          this.usernameLabel.text = `User: ${displayName}`;
          this.usernameLabel.visible = true;
        }

        console.log("Wallet connected successfully:", state.address);
        console.log("User display name:", displayName);
        break;
      }

      case ConnectionStatus.Error:
        this.connectButton.text = "Connection Failed";
        this.connectButton.enabled = true;
        this.usernameLabel.visible = false;
        this.startGameButton.enabled = false;
        this.giftRocksButton.enabled = false;
        console.error("Wallet connection error:", state.error);
        break;
    }
  }
}

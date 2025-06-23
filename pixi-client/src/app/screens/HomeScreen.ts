import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container, Graphics, Sprite } from "pixi.js";

import { engine } from "../getEngine";
import { CustomButton } from "../ui/CustomButton";
import { Label } from "../ui/Label";
import { MainScreen } from "./main/MainScreen";
import type { WalletConnectionState } from "../../wallet";
import { ConnectionStatus } from "../../wallet";

/** The home screen that shows before the main game */
export class HomeScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["preload", "main"];

  // UI Components
  private background!: Graphics;
  private backgroundImage!: Sprite;
  private connectButton!: CustomButton;
  private statusLabel!: Label;

  // State
  private paused = false;
  private walletUnsubscribe?: () => void;

  constructor() {
    super();
    this.createBackground();
    this.createUI();
    this.setupWalletConnection();
  }

  private createBackground(): void {
    // Create solid background first
    this.background = new Graphics();
    this.background.rect(0, 0, 1920, 1080);
    this.background.fill(0x0a0a1a); // Deep space color
    this.addChild(this.background);

    // Try to load background image if available
    try {
      // This will work if you place background.png in public/assets/preload/
      this.backgroundImage = Sprite.from("preload/background.png");
      this.backgroundImage.anchor.set(0.5);
      this.addChild(this.backgroundImage);
    } catch {
      console.log("Background image not found, using solid color background");
    }
  }

  private createUI(): void {
    // Connect wallet button
    this.connectButton = new CustomButton({
      text: "Connect Wallet",
      width: 300,
      height: 80,
      backgroundColor: 0x2a2a3a,
      borderColor: 0x8a4fff,
      textColor: 0xffffff,
      fontSize: 18,
    });
    this.connectButton.pivot.set(150, 40);
    this.connectButton.onPress.on(() => this.handleConnectWallet());
    this.addChild(this.connectButton);

    // Status label (initially hidden)
    this.statusLabel = new Label({
      text: "",
      style: {
        fill: 0xc0c0d0,
        align: "center",
        fontSize: 16,
      },
    });
    this.statusLabel.anchor.set(0.5);
    this.statusLabel.visible = false;
    this.addChild(this.statusLabel);
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
  }

  /** Pause screen */
  public async pause() {
    this.paused = true;
  }

  /** Resume screen */
  public async resume() {
    this.paused = false;
  }

  /** Reset screen */
  public reset() {}

  /** Resize the screen */
  public resize(width: number, height: number) {
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

    // Position UI elements - button much higher up since logo is in background
    this.connectButton.position.set(centerX, centerY - 200);
    this.statusLabel.position.set(centerX, centerY - 120);
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    // Play background music
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.3 });

    // Animate UI elements
    const elements = [this.connectButton, this.statusLabel];

    let finalPromise!: AnimationPlaybackControls;

    for (const element of elements) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.8, delay: 0.2, ease: "backOut" },
      );
    }

    await finalPromise;
  }

  /** Hide screen */
  public async hide() {
    // Clean up wallet subscription
    if (this.walletUnsubscribe) {
      this.walletUnsubscribe();
    }
  }

  /** Handle wallet connection */
  private async handleConnectWallet(): Promise<void> {
    try {
      await engine().wallet.connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      this.statusLabel.text = "Failed to connect wallet";
      this.statusLabel.style.fill = 0xff4444;
    }
  }

  /** Handle wallet state changes */
  private onWalletStateChange(state: WalletConnectionState): void {
    switch (state.status) {
      case ConnectionStatus.Disconnected:
        this.connectButton.text = "Connect Wallet";
        this.connectButton.enabled = true;
        this.statusLabel.visible = false;
        break;

      case ConnectionStatus.Connecting:
        this.connectButton.text = "Connecting...";
        this.connectButton.enabled = false;
        this.statusLabel.text = "Connecting to wallet...";
        this.statusLabel.style.fill = 0xffaa00;
        this.statusLabel.visible = true;
        break;

      case ConnectionStatus.Connected:
        this.connectButton.text = "Connected!";
        this.connectButton.enabled = false;
        this.statusLabel.text = "Wallet connected! Loading game...";
        this.statusLabel.style.fill = 0x44ff88;
        this.statusLabel.visible = true;

        // Navigate to main screen after a brief delay
        setTimeout(async () => {
          await engine().navigation.showScreen(MainScreen);
        }, 1000);
        break;

      case ConnectionStatus.Error:
        this.connectButton.text = "Connection Failed";
        this.connectButton.enabled = true;
        this.statusLabel.text = "Failed to connect wallet. Please try again.";
        this.statusLabel.style.fill = 0xff4444;
        this.statusLabel.visible = true;
        break;
    }
  }
}

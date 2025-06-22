import { FancyButton } from "@pixi/ui";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";

import { engine } from "../../getEngine";
import { PausePopup } from "../../popups/PausePopup";
import { SettingsPopup } from "../../popups/SettingsPopup";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Label";
import type { WalletConnectionState } from "../../../wallet";
import { ConnectionStatus } from "../../../wallet";

import { Bouncer } from "./Bouncer";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container;
  private pauseButton: FancyButton;
  private settingsButton: FancyButton;
  private addButton: FancyButton;
  private removeButton: FancyButton;
  private connectButton: Button;
  private usernameLabel: Label;
  private bouncer: Bouncer;
  private paused = false;
  private walletUnsubscribe?: () => void;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);
    this.bouncer = new Bouncer();

    const buttonAnimations = {
      hover: {
        props: {
          scale: { x: 1.1, y: 1.1 },
        },
        duration: 100,
      },
      pressed: {
        props: {
          scale: { x: 0.9, y: 0.9 },
        },
        duration: 100,
      },
    };
    this.pauseButton = new FancyButton({
      defaultView: "icon-pause.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.pauseButton.onPress.connect(() =>
      engine().navigation.presentPopup(PausePopup),
    );
    this.addChild(this.pauseButton);

    this.settingsButton = new FancyButton({
      defaultView: "icon-settings.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.settingsButton.onPress.connect(() =>
      engine().navigation.presentPopup(SettingsPopup),
    );
    this.addChild(this.settingsButton);

    this.addButton = new Button({
      text: "Add",
      width: 175,
      height: 110,
    });
    this.addButton.onPress.connect(() => this.bouncer.add());
    this.addChild(this.addButton);

    this.removeButton = new Button({
      text: "Remove",
      width: 175,
      height: 110,
    });
    this.removeButton.onPress.connect(() => this.bouncer.remove());
    this.addChild(this.removeButton);

    // Create connect wallet button (use default size for proper text fit)
    this.connectButton = new Button({
      text: "Connect Wallet",
      width: 301, // Use default button width for better text accommodation
      height: 112, // Use default button height
    });
    this.connectButton.onPress.connect(() => this.handleConnectWallet());
    this.addChild(this.connectButton);

    // Create username display label (initially hidden)
    this.usernameLabel = new Label({
      text: "",
      style: {
        fill: 0xffffff,
        align: "center",
        fontSize: 18,
      },
    });
    this.usernameLabel.anchor.set(0.5);
    this.usernameLabel.visible = false;
    this.addChild(this.usernameLabel);

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
    this.bouncer.update();
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

    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;
    this.pauseButton.x = 30;
    this.pauseButton.y = 30;
    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;

    // Position buttons in a row at the bottom (adjusted for larger connect button)
    this.connectButton.x = width / 2 - 250; // Moved further left for larger button
    this.connectButton.y = height - 75;
    this.removeButton.x = width / 2 + 50; // Moved right to accommodate larger connect button
    this.removeButton.y = height - 75;
    this.addButton.x = width / 2 + 200; // Moved further right
    this.addButton.y = height - 75;

    // Position username label below connect button
    this.usernameLabel.x = this.connectButton.x;
    this.usernameLabel.y = this.connectButton.y + 70; // 70px below button

    this.bouncer.resize(width, height);
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    const elementsToAnimate = [
      this.pauseButton,
      this.settingsButton,
      this.addButton,
      this.removeButton,
      this.connectButton,
      this.usernameLabel,
    ];

    let finalPromise!: AnimationPlaybackControls;
    for (const element of elementsToAnimate) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.3, delay: 0.75, ease: "backOut" },
      );
    }

    await finalPromise;
    this.bouncer.show(this);
  }

  /** Hide screen with animations */
  public async hide() {
    // Clean up wallet subscription
    if (this.walletUnsubscribe) {
      this.walletUnsubscribe();
    }
  }

  /** Auto pause the app when window go out of focus */
  public blur() {
    if (!engine().navigation.currentPopup) {
      engine().navigation.presentPopup(PausePopup);
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

  /** Handle wallet state changes and update UI accordingly */
  private onWalletStateChange(state: WalletConnectionState): void {
    switch (state.status) {
      case ConnectionStatus.Disconnected:
        this.connectButton.text = "Connect Wallet";
        this.connectButton.enabled = true;
        this.usernameLabel.visible = false;
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
}

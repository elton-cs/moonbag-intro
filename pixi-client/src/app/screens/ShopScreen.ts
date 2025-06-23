import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion/react";
import { Container, Graphics } from "pixi.js";

import { engine } from "../getEngine";
import { CustomButton } from "../ui/CustomButton";
import { Label } from "../ui/Label";
import { ShopHeader } from "../ui/ShopHeader";
import { ShopGrid } from "../ui/ShopGrid";
import type {
  ShopInventoryModel,
  PurchaseHistoryModel,
  GameModel,
} from "../../graphql/types";
import { GameDataService } from "../../graphql/services/GameDataService";

export interface ShopScreenData {
  currentGame: GameModel;
  shopInventory: ShopInventoryModel[];
  purchaseHistory: PurchaseHistoryModel[];
  nextLevelCost: number;
}

export class ShopScreen extends Container {
  public static assetBundles = ["main"];

  // Layout constants
  private static readonly LAYOUT = {
    WIDTH: 600,
    HEADER_HEIGHT: 120,
    SHOP_GRID_HEIGHT: 380,
    CONTROLS_HEIGHT: 80,
    PADDING: 20,
    SPACING: 15,
  };

  // UI Components
  private background!: Graphics;
  private mainContainer!: Container;
  private shopHeader!: ShopHeader;
  private shopGrid!: ShopGrid;
  private controlsContainer!: Container;
  private advanceLevelButton!: CustomButton;
  private cashOutButton!: CustomButton;
  private backButton!: CustomButton;
  private statusLabel!: Label;

  // Data and state
  private shopData!: ShopScreenData;
  private gameDataService: GameDataService;
  private isProcessingPurchase = false;
  private onAdvanceCallback?: () => void;
  private onCashOutCallback?: () => void;
  private onBackCallback?: () => void;

  constructor() {
    super();

    this.gameDataService = new GameDataService();
    this.createBackground();
    this.createContainers();
    this.createUI();
  }

  private createBackground(): void {
    // Create cosmic background
    this.background = new Graphics();
    this.background.rect(0, 0, 1920, 1080);
    this.background.fill(0x0a0a1a);
    this.addChild(this.background);
  }

  private createContainers(): void {
    this.mainContainer = new Container();
    this.addChild(this.mainContainer);

    this.controlsContainer = new Container();
    this.mainContainer.addChild(this.controlsContainer);
  }

  private createUI(): void {
    this.createShopHeader();
    this.createShopGrid();
    this.createControls();
    this.createStatusLabel();
  }

  private createShopHeader(): void {
    this.shopHeader = new ShopHeader({
      width: ShopScreen.LAYOUT.WIDTH,
      height: ShopScreen.LAYOUT.HEADER_HEIGHT,
      currentLevel: 1,
      playerCheddah: 0,
      pointsEarned: 0,
      nextLevelCost: 0,
    });
    this.mainContainer.addChild(this.shopHeader);
  }

  private createShopGrid(): void {
    this.shopGrid = new ShopGrid({
      shopItems: [],
      purchaseHistory: [],
      playerCheddah: 0,
      onPurchase: (slotIndex: number) => this.handlePurchase(slotIndex),
    });
    this.mainContainer.addChild(this.shopGrid);
  }

  private createControls(): void {
    const layout = ShopScreen.LAYOUT;

    // Controls background
    const controlsBackground = new Graphics();
    controlsBackground.roundRect(0, 0, layout.WIDTH, layout.CONTROLS_HEIGHT, 8);
    controlsBackground.fill(0x1a1a2a);
    controlsBackground.stroke({ color: 0x8a4fff, width: 2 });
    this.controlsContainer.addChild(controlsBackground);

    const buttonY = layout.CONTROLS_HEIGHT / 2;
    const buttonWidth = 140;
    const buttonHeight = 50;
    const buttonSpacing = (layout.WIDTH - buttonWidth * 3) / 4;

    let currentX = buttonSpacing;

    // Back button (return to main screen without advancing)
    this.backButton = new CustomButton({
      text: "⬅️ BACK",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x2a2a3a,
      borderColor: 0x666666,
      textColor: 0xffffff,
      fontSize: 12,
    });
    this.backButton.position.set(currentX, buttonY - buttonHeight / 2);
    this.backButton.onPress.on(() => this.handleBack());
    this.controlsContainer.addChild(this.backButton);

    currentX += buttonWidth + buttonSpacing;

    // Cash Out button
    this.cashOutButton = new CustomButton({
      text: "💰 CASH OUT",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x2a2a3a,
      borderColor: 0xff6644,
      textColor: 0xffffff,
      fontSize: 11,
    });
    this.cashOutButton.position.set(currentX, buttonY - buttonHeight / 2);
    this.cashOutButton.onPress.on(() => this.handleCashOut());
    this.controlsContainer.addChild(this.cashOutButton);

    currentX += buttonWidth + buttonSpacing;

    // Advance Level button
    this.advanceLevelButton = new CustomButton({
      text: "⬆️ ADVANCE LEVEL",
      width: buttonWidth,
      height: buttonHeight,
      backgroundColor: 0x2a2a3a,
      borderColor: 0x44ff88,
      textColor: 0xffffff,
      fontSize: 11,
    });
    this.advanceLevelButton.position.set(currentX, buttonY - buttonHeight / 2);
    this.advanceLevelButton.onPress.on(() => this.handleAdvanceLevel());
    this.controlsContainer.addChild(this.advanceLevelButton);
  }

  private createStatusLabel(): void {
    this.statusLabel = new Label({
      text: "",
      style: {
        fill: 0xc0c0d0,
        align: "center",
        fontSize: 12,
      },
    });
    this.statusLabel.anchor.set(0.5);
    this.statusLabel.visible = false;
    this.mainContainer.addChild(this.statusLabel);
  }

  private async handlePurchase(slotIndex: number): Promise<void> {
    if (this.isProcessingPurchase) return;

    try {
      this.isProcessingPurchase = true;
      this.showStatus("🔄 Purchasing orb...", "info");

      console.log(`Purchasing orb from slot: ${slotIndex}`);

      // Call wallet service to purchase orb
      await engine().wallet.purchaseOrb(slotIndex);

      this.showStatus("✅ Orb purchased successfully!", "success");

      // Refresh shop data after purchase
      await this.refreshShopData();
    } catch (error) {
      console.error("Failed to purchase orb:", error);
      this.showStatus("❌ Purchase failed", "error");
    } finally {
      this.isProcessingPurchase = false;
      // Hide status after 3 seconds
      setTimeout(() => this.hideStatus(), 3000);
    }
  }

  private async handleAdvanceLevel(): Promise<void> {
    try {
      this.advanceLevelButton.enabled = false;
      this.advanceLevelButton.text = "🔄 ADVANCING...";
      this.showStatus("⬆️ Advancing to next level...", "info");

      if (this.onAdvanceCallback) {
        await this.onAdvanceCallback();
      }
    } catch (error) {
      console.error("Failed to advance level:", error);
      this.showStatus("❌ Failed to advance level", "error");
      this.advanceLevelButton.enabled = true;
      this.advanceLevelButton.text = "⬆️ ADVANCE LEVEL";
    }
  }

  private async handleCashOut(): Promise<void> {
    try {
      this.cashOutButton.enabled = false;
      this.cashOutButton.text = "🔄 CASHING OUT...";
      this.showStatus("💰 Cashing out and ending game...", "info");

      if (this.onCashOutCallback) {
        await this.onCashOutCallback();
      }
    } catch (error) {
      console.error("Failed to cash out:", error);
      this.showStatus("❌ Failed to cash out", "error");
      this.cashOutButton.enabled = true;
      this.cashOutButton.text = "💰 CASH OUT";
    }
  }

  private handleBack(): void {
    if (this.onBackCallback) {
      this.onBackCallback();
    }
  }

  private showStatus(
    message: string,
    type: "info" | "success" | "error",
  ): void {
    this.statusLabel.text = message;

    switch (type) {
      case "success":
        this.statusLabel.style.fill = 0x44ff88;
        break;
      case "error":
        this.statusLabel.style.fill = 0xff6644;
        break;
      default:
        this.statusLabel.style.fill = 0xc0c0d0;
        break;
    }

    this.statusLabel.visible = true;
  }

  private hideStatus(): void {
    this.statusLabel.visible = false;
  }

  private async refreshShopData(): Promise<void> {
    try {
      const playerAddress = engine().wallet.getState().address;
      if (!playerAddress) return;

      const allData = await this.gameDataService.getMoonBagData(playerAddress);

      // Find the active game
      const activeGame =
        allData.games.find((game) => game.is_active) || allData.games[0];
      if (!activeGame) return;

      // Update shop data
      if (allData.shopInventory && allData.purchaseHistory) {
        this.shopData.shopInventory = allData.shopInventory.filter(
          (item) =>
            item.game_id === activeGame.game_id &&
            item.level === activeGame.current_level,
        );
        this.shopData.purchaseHistory = allData.purchaseHistory.filter(
          (history) => history.game_id === activeGame.game_id,
        );
        this.shopData.currentGame = activeGame;

        this.updateShopDisplay();
      }
    } catch (error) {
      console.error("Failed to refresh shop data:", error);
    }
  }

  private updateShopDisplay(): void {
    const { currentGame, shopInventory, purchaseHistory } = this.shopData;

    // Update header
    this.shopHeader.updateData({
      currentLevel: currentGame.current_level,
      playerCheddah: currentGame.cheddah,
      pointsEarned: currentGame.points,
      nextLevelCost: this.shopData.nextLevelCost,
    });

    // Update shop grid
    this.shopGrid.updateShopData(
      shopInventory,
      purchaseHistory,
      currentGame.cheddah,
    );
  }

  // Public methods for setting up the shop
  public setShopData(data: ShopScreenData): void {
    this.shopData = data;
    this.updateShopDisplay();
  }

  public setCallbacks(callbacks: {
    onAdvance?: () => void;
    onCashOut?: () => void;
    onBack?: () => void;
  }): void {
    this.onAdvanceCallback = callbacks.onAdvance;
    this.onCashOutCallback = callbacks.onCashOut;
    this.onBackCallback = callbacks.onBack;
  }

  // Screen lifecycle methods
  public prepare(): void {}

  public update(): void {
    // No update logic needed for shop screen
  }

  public resize(width: number, height: number): void {
    const layout = ShopScreen.LAYOUT;
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    // Resize background
    this.background.clear();
    this.background.rect(0, 0, width, height);
    this.background.fill(0x0a0a1a);

    // Center main container
    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;

    // Calculate total height and layout vertically
    const totalHeight =
      layout.HEADER_HEIGHT +
      layout.SPACING +
      layout.SHOP_GRID_HEIGHT +
      layout.SPACING +
      layout.CONTROLS_HEIGHT;

    let currentY = -totalHeight / 2;

    // Position header
    this.shopHeader.x = -layout.WIDTH / 2;
    this.shopHeader.y = currentY;
    currentY += layout.HEADER_HEIGHT + layout.SPACING;

    // Position shop grid
    const gridDimensions = this.shopGrid.getGridDimensions();
    this.shopGrid.x = -gridDimensions.width / 2;
    this.shopGrid.y = currentY;
    currentY += layout.SHOP_GRID_HEIGHT + layout.SPACING;

    // Position controls
    this.controlsContainer.x = -layout.WIDTH / 2;
    this.controlsContainer.y = currentY;

    // Position status label
    this.statusLabel.x = 0;
    this.statusLabel.y = currentY + layout.CONTROLS_HEIGHT + 20;
  }

  public async show(): Promise<void> {
    // Animate shop elements
    const elements = [this.shopHeader, this.shopGrid, this.controlsContainer];

    let finalPromise!: AnimationPlaybackControls;

    for (const element of elements) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.5, delay: 0.1, ease: "backOut" },
      );
    }

    await finalPromise;
  }

  public async hide(): Promise<void> {
    // Clean up any subscriptions or timers
    this.gameDataService.clearSubscriptions();
  }

  public reset(): void {
    this.isProcessingPurchase = false;
    this.hideStatus();

    // Reset button states
    this.advanceLevelButton.enabled = true;
    this.advanceLevelButton.text = "⬆️ ADVANCE LEVEL";
    this.cashOutButton.enabled = true;
    this.cashOutButton.text = "💰 CASH OUT";
  }
}

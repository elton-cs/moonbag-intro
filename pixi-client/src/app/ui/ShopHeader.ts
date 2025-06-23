import { Container, Graphics } from "pixi.js";
import { Label } from "./Label";

export interface ShopHeaderOptions {
  width?: number;
  height?: number;
  currentLevel: number;
  playerCheddah: number;
  pointsEarned: number;
  nextLevelCost: number;
}

export class ShopHeader extends Container {
  private options: Required<ShopHeaderOptions>;
  private background!: Graphics;
  private titleLabel!: Label;
  private levelCompleteLabel!: Label;
  private cheddahLabel!: Label;
  private pointsLabel!: Label;
  private instructionLabel!: Label;
  private nextLevelCostLabel!: Label;

  constructor(options: ShopHeaderOptions) {
    super();

    this.options = {
      width: 500,
      height: 120,
      ...options,
    };

    this.createBackground();
    this.createLabels();
    this.updateDisplay();
  }

  private createBackground(): void {
    const { width, height } = this.options;

    this.background = new Graphics();
    this.background.roundRect(0, 0, width, height, 15);
    this.background.fill(0x1a1a2a);
    this.background.stroke({ color: 0x8a4fff, width: 2 });
    this.addChild(this.background);
  }

  private createLabels(): void {
    const { width } = this.options;
    const centerX = width / 2;

    // Shop title
    this.titleLabel = new Label({
      text: "🛒 COSMIC ORB SHOP 🛒",
      style: {
        fill: 0x8a4fff,
        align: "center",
        fontSize: 18,
        fontWeight: "bold",
      },
    });
    this.titleLabel.anchor.set(0.5);
    this.titleLabel.position.set(centerX, 20);
    this.addChild(this.titleLabel);

    // Level completion status
    this.levelCompleteLabel = new Label({
      text: "",
      style: {
        fill: 0x44ff88,
        align: "center",
        fontSize: 14,
        fontWeight: "bold",
      },
    });
    this.levelCompleteLabel.anchor.set(0.5);
    this.levelCompleteLabel.position.set(centerX, 40);
    this.addChild(this.levelCompleteLabel);

    // Currency display row
    const currencyY = 60;
    const spacing = width / 4;

    // Player's Cheddah
    this.cheddahLabel = new Label({
      text: "",
      style: {
        fill: 0x44ff88,
        align: "center",
        fontSize: 12,
        fontWeight: "bold",
      },
    });
    this.cheddahLabel.anchor.set(0.5);
    this.cheddahLabel.position.set(spacing * 1, currencyY);
    this.addChild(this.cheddahLabel);

    // Points earned this level
    this.pointsLabel = new Label({
      text: "",
      style: {
        fill: 0x8a4fff,
        align: "center",
        fontSize: 12,
        fontWeight: "bold",
      },
    });
    this.pointsLabel.anchor.set(0.5);
    this.pointsLabel.position.set(spacing * 2, currencyY);
    this.addChild(this.pointsLabel);

    // Next level cost
    this.nextLevelCostLabel = new Label({
      text: "",
      style: {
        fill: 0xffaa44,
        align: "center",
        fontSize: 12,
        fontWeight: "bold",
      },
    });
    this.nextLevelCostLabel.anchor.set(0.5);
    this.nextLevelCostLabel.position.set(spacing * 3, currencyY);
    this.addChild(this.nextLevelCostLabel);

    // Instruction text
    this.instructionLabel = new Label({
      text: "Purchase orbs to enhance your bag for the next level!",
      style: {
        fill: 0xc0c0d0,
        align: "center",
        fontSize: 11,
      },
    });
    this.instructionLabel.anchor.set(0.5);
    this.instructionLabel.position.set(centerX, 85);
    this.addChild(this.instructionLabel);
  }

  private updateDisplay(): void {
    const { currentLevel, playerCheddah, pointsEarned, nextLevelCost } =
      this.options;

    // Update level completion text
    this.levelCompleteLabel.text = `🎉 Level ${currentLevel} Complete! 🎉`;

    // Update currency displays
    this.cheddahLabel.text = `💰 ${playerCheddah} Cheddah`;
    this.pointsLabel.text = `⭐ ${pointsEarned} Points Earned`;
    this.nextLevelCostLabel.text = `🌙 ${nextLevelCost} Next Level Cost`;

    // Update instruction based on available Cheddah
    if (playerCheddah === 0) {
      this.instructionLabel.text =
        "No Cheddah available - continue to next level or cash out!";
      this.instructionLabel.style.fill = 0xff6644; // Red for no currency
    } else {
      this.instructionLabel.text =
        "Purchase orbs to enhance your bag for the next level!";
      this.instructionLabel.style.fill = 0xc0c0d0; // Normal color
    }
  }

  public updateData(options: Partial<ShopHeaderOptions>): void {
    Object.assign(this.options, options);
    this.updateDisplay();
  }

  public getHeaderHeight(): number {
    return this.options.height;
  }

  // Helper method to check if player can afford next level
  public canAffordNextLevel(): boolean {
    return this.options.nextLevelCost <= this.options.playerCheddah;
  }

  // Method to highlight when player has significant Cheddah to spend
  public hasSignificantCheddah(): boolean {
    return this.options.playerCheddah >= 20; // Arbitrary threshold for "significant"
  }

  // Method to create a warning if player has no Cheddah
  public isEmpty(): boolean {
    return this.options.playerCheddah === 0;
  }

  // Get a summary of the current state for accessibility
  public getStatusSummary(): string {
    const { currentLevel, playerCheddah, pointsEarned, nextLevelCost } =
      this.options;

    return (
      `Level ${currentLevel} completed with ${pointsEarned} points earned. ` +
      `You have ${playerCheddah} Cheddah to spend. ` +
      `Next level costs ${nextLevelCost} Moon Rocks.`
    );
  }
}

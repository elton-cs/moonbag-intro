import { Container, Graphics } from "pixi.js";
import { CustomButton } from "./CustomButton";
import { Label } from "./Label";
import type { ShopInventoryModel } from "../../graphql/types";

export interface OrbCardOptions {
  width?: number;
  height?: number;
  shopItem: ShopInventoryModel;
  currentPrice: number;
  purchaseCount: number;
  playerCheddah: number;
  onPurchase?: (orbType: string) => void;
}

export class OrbCard extends Container {
  private options: Required<OrbCardOptions>;
  private background!: Graphics;
  private orbLabel!: Label;
  private nameLabel!: Label;
  private rarityLabel!: Label;
  private priceLabel!: Label;
  private purchaseButton!: CustomButton;
  private purchaseCountLabel!: Label;

  constructor(options: OrbCardOptions) {
    super();

    this.options = {
      width: 140,
      height: 180,
      onPurchase: () => {},
      ...options,
    };

    this.createBackground();
    this.createLabels();
    this.createPurchaseButton();
    this.updateDisplay();
  }

  private createBackground(): void {
    this.background = new Graphics();
    this.updateBackgroundColor();
    this.addChild(this.background);
  }

  private updateBackgroundColor(): void {
    const { width, height, shopItem } = this.options;

    this.background.clear();
    this.background.roundRect(0, 0, width, height, 12);
    this.background.fill(0x1a1a2a);

    // Rarity-based border colors
    let borderColor = 0x8a4fff; // Default purple
    switch (shopItem.rarity) {
      case "Common":
        borderColor = 0x4a9eff; // Blue
        break;
      case "Rare":
        borderColor = 0x8a4fff; // Purple
        break;
      case "Cosmic":
        borderColor = 0xff4a9e; // Pink/Cosmic
        break;
    }

    this.background.stroke({ color: borderColor, width: 2 });
  }

  private createLabels(): void {
    const { width, shopItem } = this.options;

    // Orb emoji (large display)
    this.orbLabel = new Label({
      text: this.getOrbEmoji(shopItem.orb_type),
      style: {
        fill: 0xffffff,
        align: "center",
        fontSize: 32,
      },
    });
    this.orbLabel.anchor.set(0.5);
    this.orbLabel.position.set(width / 2, 30);
    this.addChild(this.orbLabel);

    // Orb name
    this.nameLabel = new Label({
      text: this.getOrbDisplayName(shopItem.orb_type),
      style: {
        fill: 0xffffff,
        align: "center",
        fontSize: 12,
        fontWeight: "bold",
        wordWrap: true,
        wordWrapWidth: width - 10,
      },
    });
    this.nameLabel.anchor.set(0.5);
    this.nameLabel.position.set(width / 2, 60);
    this.addChild(this.nameLabel);

    // Rarity indicator
    this.rarityLabel = new Label({
      text: shopItem.rarity.toUpperCase(),
      style: {
        fill: this.getRarityColor(shopItem.rarity),
        align: "center",
        fontSize: 10,
        fontWeight: "bold",
      },
    });
    this.rarityLabel.anchor.set(0.5);
    this.rarityLabel.position.set(width / 2, 80);
    this.addChild(this.rarityLabel);

    // Price display
    this.priceLabel = new Label({
      text: "",
      style: {
        fill: 0xffffff,
        align: "center",
        fontSize: 11,
        fontWeight: "bold",
      },
    });
    this.priceLabel.anchor.set(0.5);
    this.priceLabel.position.set(width / 2, 100);
    this.addChild(this.priceLabel);

    // Purchase count display
    this.purchaseCountLabel = new Label({
      text: "",
      style: {
        fill: 0x999999,
        align: "center",
        fontSize: 9,
      },
    });
    this.purchaseCountLabel.anchor.set(0.5);
    this.purchaseCountLabel.position.set(width / 2, 115);
    this.addChild(this.purchaseCountLabel);
  }

  private createPurchaseButton(): void {
    const { width } = this.options;

    this.purchaseButton = new CustomButton({
      text: "BUY",
      width: width - 20,
      height: 35,
      backgroundColor: 0x2a2a3a,
      borderColor: 0x44ff88,
      textColor: 0xffffff,
      fontSize: 11,
    });
    this.purchaseButton.position.set(10, 135);
    this.purchaseButton.onPress.on(() => {
      if (this.options.onPurchase) {
        this.options.onPurchase(this.options.shopItem.orb_type);
      }
    });
    this.addChild(this.purchaseButton);
  }

  private updateDisplay(): void {
    const { shopItem, currentPrice, purchaseCount, playerCheddah } =
      this.options;

    // Update price display
    if (currentPrice > shopItem.base_price) {
      this.priceLabel.text = `💰 ${currentPrice} (was ${shopItem.base_price})`;
      this.priceLabel.style.fill = 0xffaa44; // Orange for increased price
    } else {
      this.priceLabel.text = `💰 ${currentPrice}`;
      this.priceLabel.style.fill = 0x44ff88; // Green for base price
    }

    // Update purchase count display
    if (purchaseCount > 0) {
      this.purchaseCountLabel.text = `Purchased: ${purchaseCount}x`;
      this.purchaseCountLabel.visible = true;
    } else {
      this.purchaseCountLabel.visible = false;
    }

    // Update button state based on affordability
    const canAfford = playerCheddah >= currentPrice;
    this.purchaseButton.enabled = canAfford;
    this.purchaseButton.text = canAfford ? "BUY" : "TOO EXPENSIVE";
    this.purchaseButton.borderColor = canAfford ? 0x44ff88 : 0xff6644;
  }

  private getOrbEmoji(orbType: string): string {
    switch (orbType) {
      case "FivePoints":
        return "⭐";
      case "SevenPoints":
        return "✨";
      case "EightPoints":
        return "🌟";
      case "NinePoints":
        return "💫";
      case "Health":
        return "❤️";
      case "BigHealth":
        return "💖";
      case "MoonRock":
        return "🌙";
      case "BigMoonRock":
        return "🌕";
      case "CheddahBomb":
        return "💰";
      case "BombCounter":
        return "🔢";
      case "HalfMultiplier":
        return "⚡";
      case "Multiplier1_5x":
        return "🔥";
      case "NextPoints2x":
        return "💥";
      case "DoubleMultiplier":
        return "🚀";
      default:
        return "🔮";
    }
  }

  private getOrbDisplayName(orbType: string): string {
    switch (orbType) {
      case "FivePoints":
        return "Five Points";
      case "SevenPoints":
        return "Seven Points";
      case "EightPoints":
        return "Eight Points";
      case "NinePoints":
        return "Nine Points";
      case "Health":
        return "Health Orb";
      case "BigHealth":
        return "Big Health";
      case "MoonRock":
        return "Moon Rock";
      case "BigMoonRock":
        return "Big Moon Rock";
      case "CheddahBomb":
        return "Cheddah Bomb";
      case "BombCounter":
        return "Bomb Counter";
      case "HalfMultiplier":
        return "Half Multiplier";
      case "Multiplier1_5x":
        return "1.5x Multiplier";
      case "NextPoints2x":
        return "Next Points 2x";
      case "DoubleMultiplier":
        return "Double Multiplier";
      default:
        return orbType;
    }
  }

  private getRarityColor(rarity: string): number {
    switch (rarity) {
      case "Common":
        return 0x4a9eff; // Blue
      case "Rare":
        return 0x8a4fff; // Purple
      case "Cosmic":
        return 0xff4a9e; // Pink
      default:
        return 0xffffff; // White
    }
  }

  public updateData(options: Partial<OrbCardOptions>): void {
    Object.assign(this.options, options);
    this.updateDisplay();
    this.updateBackgroundColor();
  }

  public getOrbType(): string {
    return this.options.shopItem.orb_type;
  }
}

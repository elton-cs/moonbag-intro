import { Container } from "pixi.js";
import { OrbCard } from "./OrbCard";
import type {
  ShopInventoryModel,
  PurchaseHistoryModel,
} from "../../graphql/types";

export interface ShopGridOptions {
  width?: number;
  height?: number;
  shopItems: ShopInventoryModel[];
  purchaseHistory: PurchaseHistoryModel[];
  playerCheddah: number;
  onPurchase?: (orbType: string) => void;
}

export class ShopGrid extends Container {
  private options: Required<ShopGridOptions>;
  private orbCards: Map<string, OrbCard> = new Map();

  // Grid layout constants
  private static readonly COLS = 3;
  private static readonly ROWS = 2;
  private static readonly CARD_WIDTH = 140;
  private static readonly CARD_HEIGHT = 180;
  private static readonly CARD_SPACING = 20;

  constructor(options: ShopGridOptions) {
    super();

    this.options = {
      width:
        ShopGrid.COLS * ShopGrid.CARD_WIDTH +
        (ShopGrid.COLS - 1) * ShopGrid.CARD_SPACING,
      height:
        ShopGrid.ROWS * ShopGrid.CARD_HEIGHT +
        (ShopGrid.ROWS - 1) * ShopGrid.CARD_SPACING,
      onPurchase: () => {},
      ...options,
    };

    this.createOrbCards();
    this.layoutCards();
  }

  private createOrbCards(): void {
    const { shopItems, purchaseHistory, playerCheddah, onPurchase } =
      this.options;

    // Clear existing cards
    this.orbCards.forEach((card) => {
      this.removeChild(card);
    });
    this.orbCards.clear();

    // Create cards for each shop item
    shopItems.forEach((shopItem, index) => {
      if (index >= 6) return; // Only show first 6 items (2x3 grid)

      // Find purchase history for this orb type
      const purchaseRecord = purchaseHistory.find(
        (record) => record.orb_type === shopItem.orb_type,
      );
      const purchaseCount = purchaseRecord?.purchase_count || 0;

      // Calculate current price with scaling
      const currentPrice = this.calculateCurrentPrice(
        shopItem.base_price,
        purchaseCount,
      );

      // Create orb card
      const orbCard = new OrbCard({
        shopItem,
        currentPrice,
        purchaseCount,
        playerCheddah,
        onPurchase,
      });

      this.orbCards.set(shopItem.orb_type, orbCard);
      this.addChild(orbCard);
    });
  }

  private layoutCards(): void {
    const { shopItems } = this.options;

    shopItems.forEach((shopItem, index) => {
      if (index >= 6) return; // Only layout first 6 items

      const orbCard = this.orbCards.get(shopItem.orb_type);
      if (!orbCard) return;

      // Calculate grid position
      const col = index % ShopGrid.COLS;
      const row = Math.floor(index / ShopGrid.COLS);

      // Position card
      const x = col * (ShopGrid.CARD_WIDTH + ShopGrid.CARD_SPACING);
      const y = row * (ShopGrid.CARD_HEIGHT + ShopGrid.CARD_SPACING);

      orbCard.position.set(x, y);
    });
  }

  private calculateCurrentPrice(
    basePrice: number,
    purchaseCount: number,
  ): number {
    if (purchaseCount === 0) {
      return basePrice;
    }

    // Calculate price with 20% scaling: base_price * (1.2^purchase_count)
    let currentPrice = basePrice;
    for (let i = 0; i < purchaseCount; i++) {
      currentPrice = Math.floor((currentPrice * 120) / 100);
    }

    return currentPrice;
  }

  public updateShopData(
    shopItems: ShopInventoryModel[],
    purchaseHistory: PurchaseHistoryModel[],
    playerCheddah: number,
  ): void {
    this.options.shopItems = shopItems;
    this.options.purchaseHistory = purchaseHistory;
    this.options.playerCheddah = playerCheddah;

    // Update existing cards or recreate if needed
    shopItems.forEach((shopItem) => {
      const orbCard = this.orbCards.get(shopItem.orb_type);
      if (orbCard) {
        // Find purchase history for this orb type
        const purchaseRecord = purchaseHistory.find(
          (record) => record.orb_type === shopItem.orb_type,
        );
        const purchaseCount = purchaseRecord?.purchase_count || 0;
        const currentPrice = this.calculateCurrentPrice(
          shopItem.base_price,
          purchaseCount,
        );

        // Update existing card
        orbCard.updateData({
          shopItem,
          currentPrice,
          purchaseCount,
          playerCheddah,
        });
      }
    });

    // If shop items changed significantly, recreate all cards
    if (shopItems.length !== this.orbCards.size) {
      this.createOrbCards();
      this.layoutCards();
    }
  }

  public getGridDimensions(): { width: number; height: number } {
    return {
      width: this.options.width,
      height: this.options.height,
    };
  }

  public hasItems(): boolean {
    return this.options.shopItems.length > 0;
  }

  public getItemCount(): number {
    return Math.min(this.options.shopItems.length, 6);
  }

  // Group items by rarity for display organization
  public getItemsByRarity(): {
    common: ShopInventoryModel[];
    rare: ShopInventoryModel[];
    cosmic: ShopInventoryModel[];
  } {
    const { shopItems } = this.options;

    return {
      common: shopItems.filter((item) => item.rarity === "Common"),
      rare: shopItems.filter((item) => item.rarity === "Rare"),
      cosmic: shopItems.filter((item) => item.rarity === "Cosmic"),
    };
  }

  // Calculate total cost of all items (useful for "buy all" functionality)
  public getTotalShopValue(): number {
    const { shopItems, purchaseHistory } = this.options;

    return shopItems.reduce((total, shopItem) => {
      const purchaseRecord = purchaseHistory.find(
        (record) => record.orb_type === shopItem.orb_type,
      );
      const purchaseCount = purchaseRecord?.purchase_count || 0;
      const currentPrice = this.calculateCurrentPrice(
        shopItem.base_price,
        purchaseCount,
      );
      return total + currentPrice;
    }, 0);
  }
}

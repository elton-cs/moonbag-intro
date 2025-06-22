import { Container, Graphics } from "pixi.js";
import { Label } from "./Label";
import type { DrawnOrbModel } from "../../graphql/types";

export interface OrbsDrawnListOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  borderColor?: number;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
}

const defaultOptions: Required<OrbsDrawnListOptions> = {
  width: 200,
  height: 150,
  backgroundColor: 0x1a1a2a,
  borderColor: 0x8a4fff,
  borderWidth: 2,
  borderRadius: 8,
  padding: 10,
};

/**
 * A scrollable list component showing orbs that have been drawn from the bag
 * in the order they were pulled, using the same emojis as the bag display
 */
export class OrbsDrawnList extends Container {
  private background!: Graphics;
  private titleLabel!: Label;
  private contentContainer!: Container;
  private orbLabels: Label[] = [];
  private options: Required<OrbsDrawnListOptions>;

  constructor(options: Partial<OrbsDrawnListOptions> = {}) {
    super();

    this.options = { ...defaultOptions, ...options };

    this.createBackground();
    this.createTitle();
    this.createContentContainer();
  }

  private createBackground(): void {
    this.background = new Graphics();
    this.background.roundRect(
      0,
      0,
      this.options.width,
      this.options.height,
      this.options.borderRadius,
    );
    this.background.fill(this.options.backgroundColor);
    this.background.stroke({
      color: this.options.borderColor,
      width: this.options.borderWidth,
    });
    this.addChild(this.background);
  }

  private createTitle(): void {
    this.titleLabel = new Label({
      text: "🎯 Orbs Drawn",
      style: {
        fill: 0x8a4fff,
        fontSize: 14,
        fontWeight: "bold",
        align: "center",
      },
    });
    this.titleLabel.anchor.set(0.5, 0);
    this.titleLabel.position.set(this.options.width / 2, this.options.padding);
    this.addChild(this.titleLabel);
  }

  private createContentContainer(): void {
    this.contentContainer = new Container();
    this.contentContainer.position.set(
      this.options.padding,
      this.options.padding + 25, // Account for title height
    );
    this.addChild(this.contentContainer);
  }

  /**
   * Update the list with new drawn orbs data
   */
  public updateDrawnOrbs(
    drawnOrbs: DrawnOrbModel[],
    currentGameId?: number,
  ): void {
    // Clear existing labels
    this.orbLabels.forEach((label) => this.contentContainer.removeChild(label));
    this.orbLabels = [];

    if (!drawnOrbs || drawnOrbs.length === 0) {
      // Show empty state
      const emptyLabel = new Label({
        text: "No orbs drawn yet",
        style: {
          fill: 0x999999,
          fontSize: 12,
          align: "center",
        },
      });
      emptyLabel.anchor.set(0.5, 0.5);
      emptyLabel.position.set(
        (this.options.width - 2 * this.options.padding) / 2,
        40, // Center vertically in content area
      );
      this.contentContainer.addChild(emptyLabel);
      this.orbLabels.push(emptyLabel);
      return;
    }

    // Filter orbs for current game if specified
    const relevantOrbs = currentGameId
      ? drawnOrbs.filter((orb) => orb.game_id === currentGameId)
      : drawnOrbs;

    // Sort by draw_index to maintain order
    const sortedOrbs = relevantOrbs.sort((a, b) => a.draw_index - b.draw_index);

    // Create labels for each orb in draw order (horizontal layout)
    const availableWidth = this.options.width - 2 * this.options.padding;
    const orbWidth = 40; // Width allocated per orb (number + emoji)
    const maxOrbs = Math.floor(availableWidth / orbWidth); // Max orbs that fit horizontally
    const orbsToShow = sortedOrbs.slice(0, maxOrbs); // Limit to available space

    orbsToShow.forEach((orb, index) => {
      const emoji = this.getOrbEmoji(orb.orb_type);
      const drawNumber = orb.draw_index + 1; // Make it 1-indexed for display

      const orbLabel = new Label({
        text: `${drawNumber}.${emoji}`,
        style: {
          fill: 0xffffff,
          fontSize: 12,
          align: "center",
        },
      });
      orbLabel.anchor.set(0.5, 0.5);
      orbLabel.position.set(index * orbWidth + orbWidth / 2, 40); // Center vertically in content area

      this.contentContainer.addChild(orbLabel);
      this.orbLabels.push(orbLabel);
    });

    // If there are more orbs than we can show, add an indicator
    if (sortedOrbs.length > maxOrbs) {
      const moreLabel = new Label({
        text: `+${sortedOrbs.length - maxOrbs}`,
        style: {
          fill: 0x999999,
          fontSize: 10,
          align: "center",
          fontStyle: "italic",
        },
      });
      moreLabel.anchor.set(0.5, 0.5);
      moreLabel.position.set(maxOrbs * orbWidth + 15, 40); // Position after the last orb

      this.contentContainer.addChild(moreLabel);
      this.orbLabels.push(moreLabel);
    }
  }

  /**
   * Get emoji for orb type - same mapping as MainScreen
   */
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

  /**
   * Get the component width
   */
  public get componentWidth(): number {
    return this.options.width;
  }

  /**
   * Get the component height
   */
  public get componentHeight(): number {
    return this.options.height;
  }
}

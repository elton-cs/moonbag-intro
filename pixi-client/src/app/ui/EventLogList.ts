import { Container, Graphics } from "pixi.js";
import { Label } from "./Label";

export interface EventLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export interface EventLogListOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  borderColor?: number;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  maxEvents?: number;
}

const defaultOptions: Required<EventLogListOptions> = {
  width: 500,
  height: 100,
  backgroundColor: 0x1a1a2a,
  borderColor: 0x8a4fff,
  borderWidth: 2,
  borderRadius: 8,
  padding: 10,
  maxEvents: 10,
};

/**
 * A scrollable list component showing recent game events
 * with one-line descriptions and timestamps
 */
export class EventLogList extends Container {
  private background!: Graphics;
  private titleLabel!: Label;
  private contentContainer!: Container;
  private eventLabels: Label[] = [];
  private options: Required<EventLogListOptions>;
  private events: EventLogEntry[] = [];

  constructor(options: Partial<EventLogListOptions> = {}) {
    super();

    this.options = { ...defaultOptions, ...options };

    this.createBackground();
    this.createTitle();
    this.createContentContainer();
    this.showEmptyState();
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
      text: "📋 Game Log",
      style: {
        fill: 0x8a4fff,
        fontSize: 12,
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
      this.options.padding + 20, // Account for title height
    );
    this.addChild(this.contentContainer);
  }

  private showEmptyState(): void {
    this.clearEventLabels();

    const emptyLabel = new Label({
      text: "No events yet - start playing!",
      style: {
        fill: 0x999999,
        fontSize: 11,
        align: "center",
      },
    });
    emptyLabel.anchor.set(0.5, 0.5);
    emptyLabel.position.set(
      (this.options.width - 2 * this.options.padding) / 2,
      (this.options.height - this.options.padding - 20) / 2,
    );
    this.contentContainer.addChild(emptyLabel);
    this.eventLabels.push(emptyLabel);
  }

  private clearEventLabels(): void {
    this.eventLabels.forEach((label) =>
      this.contentContainer.removeChild(label),
    );
    this.eventLabels = [];
  }

  private getEventColor(type: EventLogEntry["type"]): number {
    switch (type) {
      case "success":
        return 0x44ff88; // Green
      case "warning":
        return 0xffaa44; // Orange
      case "error":
        return 0xff4a6a; // Red
      case "info":
      default:
        return 0xc0c0d0; // Light gray
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  private renderEvents(): void {
    this.clearEventLabels();

    if (this.events.length === 0) {
      this.showEmptyState();
      return;
    }

    const availableHeight = this.options.height - this.options.padding - 20; // Account for title
    const lineHeight = 12;
    const maxVisibleEvents = Math.floor(availableHeight / lineHeight);

    // Show most recent events first
    const eventsToShow = this.events.slice(-maxVisibleEvents).reverse();

    eventsToShow.forEach((event, index) => {
      const timeStr = this.formatTime(event.timestamp);
      const displayText = `${timeStr} ${event.message}`;

      const eventLabel = new Label({
        text: displayText,
        style: {
          fill: this.getEventColor(event.type),
          fontSize: 10,
          align: "left",
        },
      });
      eventLabel.anchor.set(0, 0);
      eventLabel.position.set(0, index * lineHeight);

      // Truncate long messages to fit the width
      const maxWidth = this.options.width - 2 * this.options.padding;
      if (eventLabel.width > maxWidth) {
        let truncated = displayText;
        while (eventLabel.width > maxWidth && truncated.length > 10) {
          truncated = truncated.slice(0, -4) + "...";
          eventLabel.text = truncated;
        }
      }

      this.contentContainer.addChild(eventLabel);
      this.eventLabels.push(eventLabel);
    });
  }

  /**
   * Add a new event to the log
   */
  public addEvent(message: string, type: EventLogEntry["type"] = "info"): void {
    const event: EventLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      message,
      type,
    };

    this.events.push(event);

    // Keep only the most recent events
    if (this.events.length > this.options.maxEvents) {
      this.events = this.events.slice(-this.options.maxEvents);
    }

    this.renderEvents();
  }

  /**
   * Clear all events (e.g., when starting a new game)
   */
  public clearEvents(): void {
    this.events = [];
    this.showEmptyState();
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

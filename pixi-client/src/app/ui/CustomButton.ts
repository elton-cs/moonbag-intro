import { Container, Graphics } from "pixi.js";
import { engine } from "../getEngine";
import { Label } from "./Label";

export interface CustomButtonOptions {
  text?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  backgroundColor?: number;
  borderColor?: number;
  textColor?: number;
  borderRadius?: number;
  borderWidth?: number;
  enabled?: boolean;
}

const defaultButtonOptions: Required<CustomButtonOptions> = {
  text: "",
  width: 140,
  height: 50,
  fontSize: 16,
  backgroundColor: 0x2a2a3a,
  borderColor: 0x8a4fff,
  textColor: 0xffffff,
  borderRadius: 8,
  borderWidth: 2,
  enabled: true,
};

// Simple event emitter for button press events
class SimpleEventEmitter {
  private listeners: Array<() => void> = [];

  on(callback: () => void): void {
    this.listeners.push(callback);
  }

  emit(): void {
    this.listeners.forEach((callback) => callback());
  }

  removeAll(): void {
    this.listeners = [];
  }
}

/**
 * Custom button implementation using PixiJS Graphics
 * Ensures text stays within button boundaries and provides consistent styling
 */
export class CustomButton extends Container {
  public onPress = new SimpleEventEmitter();

  private options: Required<CustomButtonOptions>;
  private background!: Graphics;
  private labelText!: Label;
  private isPressed = false;
  private isHovered = false;
  private _enabled = true;

  constructor(options: CustomButtonOptions = {}) {
    super();

    this.options = { ...defaultButtonOptions, ...options };
    this._enabled = this.options.enabled;

    this.createBackground();
    this.createLabel();
    this.setupInteractivity();
    this.updateVisualState();
  }

  private createBackground(): void {
    this.background = new Graphics();
    this.addChild(this.background);
    this.drawBackground();
  }

  private drawBackground(): void {
    const {
      width,
      height,
      borderRadius,
      backgroundColor,
      borderColor,
      borderWidth,
    } = this.options;

    this.background.clear();
    this.background
      .roundRect(0, 0, width, height, borderRadius)
      .fill(backgroundColor);

    if (borderWidth > 0) {
      this.background
        .roundRect(0, 0, width, height, borderRadius)
        .stroke({ color: borderColor, width: borderWidth });
    }
  }

  private createLabel(): void {
    const { textColor } = this.options;

    this.labelText = new Label({
      text: this.options.text,
      style: {
        fill: textColor,
        fontSize: this.options.fontSize,
        fontWeight: "bold",
        align: "center",
      },
    });

    this.addChild(this.labelText);
    this.updateTextSize();
    this.centerText();
  }

  private updateTextSize(): void {
    const { width, height, fontSize } = this.options;
    const maxWidth = width - 20; // 10px padding on each side
    const maxHeight = height - 10; // 5px padding top/bottom

    // Start with the desired font size
    let currentFontSize = fontSize;
    this.labelText.style.fontSize = currentFontSize;

    // Reduce font size until text fits within bounds
    while (
      (this.labelText.width > maxWidth || this.labelText.height > maxHeight) &&
      currentFontSize > 8
    ) {
      currentFontSize -= 1;
      this.labelText.style.fontSize = currentFontSize;
    }
  }

  private centerText(): void {
    const { width, height } = this.options;
    this.labelText.x = width / 2;
    this.labelText.y = height / 2;
  }

  private setupInteractivity(): void {
    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerdown", this.onPointerDown.bind(this));
    this.on("pointerup", this.onPointerUp.bind(this));
    this.on("pointerover", this.onPointerOver.bind(this));
    this.on("pointerout", this.onPointerOut.bind(this));
    this.on("pointerupoutside", this.onPointerUpOutside.bind(this));
  }

  private onPointerDown(): void {
    if (!this._enabled) return;

    this.isPressed = true;
    this.updateVisualState();
    engine().audio.sfx.play("main/sounds/sfx-press.wav");
  }

  private onPointerUp(): void {
    if (!this._enabled) return;

    if (this.isPressed) {
      this.isPressed = false;
      this.updateVisualState();
      this.onPress.emit();
    }
  }

  private onPointerOver(): void {
    if (!this._enabled) return;

    this.isHovered = true;
    this.updateVisualState();
    engine().audio.sfx.play("main/sounds/sfx-hover.wav");
  }

  private onPointerOut(): void {
    this.isHovered = false;
    this.updateVisualState();
  }

  private onPointerUpOutside(): void {
    this.isPressed = false;
    this.updateVisualState();
  }

  private updateVisualState(): void {
    let scaleValue = 1.0;
    const alpha = this._enabled ? 1.0 : 0.5;

    if (!this._enabled) {
      this.cursor = "default";
    } else {
      this.cursor = "pointer";

      if (this.isPressed) {
        scaleValue = 0.95;
      } else if (this.isHovered) {
        scaleValue = 1.05;
      }
    }

    this.scale.set(scaleValue);
    this.alpha = alpha;
  }

  // Public getters and setters
  get text(): string {
    return this.options.text;
  }

  set text(value: string) {
    this.options.text = value;
    this.labelText.text = value;
    this.updateTextSize();
    this.centerText();
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    this.updateVisualState();
  }

  get width(): number {
    return this.options.width;
  }

  set width(value: number) {
    this.options.width = value;
    this.drawBackground();
    this.updateTextSize();
    this.centerText();
  }

  get height(): number {
    return this.options.height;
  }

  set height(value: number) {
    this.options.height = value;
    this.drawBackground();
    this.updateTextSize();
    this.centerText();
  }

  get borderColor(): number {
    return this.options.borderColor;
  }

  set borderColor(value: number) {
    this.options.borderColor = value;
    this.drawBackground();
  }
}

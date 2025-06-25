import { animate } from "motion";
import { Container, Graphics } from "pixi.js";
import { Label } from "./Label";

export interface MilestoneProgressOptions {
  width?: number;
  height?: number;
  currentPoints?: number;
  targetPoints?: number;
  currentLevel?: number;
}

/** Milestone progress display component showing current level and points progress */
export class MilestoneProgress extends Container {
  private readonly componentWidth: number;
  private readonly componentHeight: number;
  private background!: Graphics;
  private progressBar!: Graphics;
  private progressFill!: Graphics;
  private levelLabel!: Label;
  private pointsLabel!: Label;
  private progressLabel!: Label;

  private currentPoints: number = 0;
  private targetPoints: number = 12;
  private currentLevel: number = 1;

  // Milestone data mapping levels to point requirements (from PRD)
  private static readonly MILESTONES: Record<number, number> = {
    1: 12,
    2: 18,
    3: 28,
    4: 44,
    5: 66,
    6: 94,
    7: 130,
  };

  constructor(options: MilestoneProgressOptions = {}) {
    super();

    this.componentWidth = options.width || 500;
    this.componentHeight = options.height || 60;
    this.currentPoints = options.currentPoints || 0;
    this.currentLevel = options.currentLevel || 1;
    this.targetPoints =
      options.targetPoints ||
      MilestoneProgress.MILESTONES[this.currentLevel] ||
      12;

    this.createBackground();
    this.createProgressBar();
    this.createLabels();
    this.update();
  }

  private createBackground(): void {
    this.background = new Graphics();
    this.background.roundRect(
      0,
      0,
      this.componentWidth,
      this.componentHeight,
      8,
    );
    this.background.fill(0x1a1a2a);
    this.background.stroke({ color: 0x8a4fff, width: 2 });
    this.addChild(this.background);
  }

  private createProgressBar(): void {
    // Progress bar background
    this.progressBar = new Graphics();
    this.progressBar.roundRect(0, 0, this.componentWidth - 20, 16, 8);
    this.progressBar.fill(0x2a2a3a);
    this.progressBar.stroke({ color: 0x4a4a5a, width: 1 });
    this.progressBar.position.set(10, this.componentHeight - 26);
    this.addChild(this.progressBar);

    // Progress bar fill
    this.progressFill = new Graphics();
    this.progressFill.position.set(10, this.componentHeight - 26);
    this.addChild(this.progressFill);
  }

  private createLabels(): void {
    // Level label (top left)
    this.levelLabel = new Label({
      text: "Level 1",
      style: {
        fill: 0x8a4fff,
        fontSize: 16,
        fontWeight: "bold",
        align: "left",
      },
    });
    this.levelLabel.position.set(10, 8);
    this.addChild(this.levelLabel);

    // Points label (top right)
    this.pointsLabel = new Label({
      text: "0 / 12 Points",
      style: {
        fill: 0xffdd44,
        fontSize: 16,
        fontWeight: "bold",
        align: "right",
      },
    });
    this.pointsLabel.anchor.set(1, 0);
    this.pointsLabel.position.set(this.componentWidth - 10, 8);
    this.addChild(this.pointsLabel);

    // Progress percentage label (center of progress bar)
    this.progressLabel = new Label({
      text: "0%",
      style: {
        fill: 0xffffff,
        fontSize: 12,
        fontWeight: "bold",
        align: "center",
      },
    });
    this.progressLabel.anchor.set(0.5);
    this.progressLabel.position.set(
      this.componentWidth / 2,
      this.componentHeight - 18,
    );
    this.addChild(this.progressLabel);
  }

  /** Update milestone progress display */
  public updateProgress(currentPoints: number, currentLevel: number): void {
    const previousPoints = this.currentPoints;
    const previousLevel = this.currentLevel;

    this.currentPoints = currentPoints;
    this.currentLevel = currentLevel;
    this.targetPoints = MilestoneProgress.MILESTONES[currentLevel] || 12;

    // Update labels
    this.levelLabel.text = `Level ${currentLevel}`;
    this.pointsLabel.text = `${currentPoints} / ${this.targetPoints} Points`;

    // Calculate progress percentage
    const progressPercent = Math.min(
      100,
      (currentPoints / this.targetPoints) * 100,
    );
    this.progressLabel.text = `${Math.round(progressPercent)}%`;

    // Update progress bar with animation
    this.updateProgressBar(progressPercent, previousPoints !== currentPoints);

    // Special celebration for level completion
    if (currentLevel > previousLevel) {
      this.celebrateLevelCompletion();
    }
  }

  private updateProgressBar(
    progressPercent: number,
    animateProgress: boolean,
  ): void {
    const maxWidth = this.componentWidth - 20;
    const fillWidth = (progressPercent / 100) * maxWidth;

    // Determine progress bar color based on completion
    let fillColor = 0x8a4fff; // Default purple
    if (progressPercent >= 100) {
      fillColor = 0x44ff88; // Green for completion
    } else if (progressPercent >= 80) {
      fillColor = 0xffdd44; // Gold for near completion
    }

    // Clear and redraw progress fill
    this.progressFill.clear();
    if (fillWidth > 0) {
      this.progressFill.roundRect(0, 0, fillWidth, 16, 8);
      this.progressFill.fill(fillColor);
    }

    // Animate progress bar if requested
    if (animateProgress) {
      // Start from current width and animate to new width
      const currentWidth = this.progressFill.width;
      this.progressFill.scale.x = currentWidth / fillWidth || 0;

      animate(
        this.progressFill.scale,
        { x: 1 },
        {
          duration: 0.5,
          ease: "easeOut",
        },
      );
    }
  }

  private celebrateLevelCompletion(): void {
    // Flash the entire component briefly
    animate(
      this.background,
      { alpha: [1, 0.3, 1] },
      {
        duration: 0.6,
        ease: "easeInOut",
      },
    );

    // Pulse the level label
    animate(
      this.levelLabel.scale,
      { x: [1, 1.2, 1], y: [1, 1.2, 1] },
      {
        duration: 0.8,
        ease: "backOut",
      },
    );
  }

  /** Get milestone target for a specific level */
  public static getMilestoneTarget(level: number): number {
    return MilestoneProgress.MILESTONES[level] || 12;
  }

  /** Get all milestone data */
  public static getAllMilestones(): Record<number, number> {
    return { ...MilestoneProgress.MILESTONES };
  }

  /** Update method for manual updates */
  private update(): void {
    this.updateProgress(this.currentPoints, this.currentLevel);
  }
}

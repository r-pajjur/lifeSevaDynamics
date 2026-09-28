import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ArrowDirection } from './building.model';

/**
 * The directional arrow, drawn as SVG on top of the photo — never baked
 * into the image file, so one photo can be re-labelled at any time.
 */
@Component({
  selector: 'app-arrow-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="arrow"
      [class]="'at-' + direction"
      viewBox="0 0 120 120"
      role="img"
      [attr.aria-label]="describe()"
    >
      <defs>
        <filter id="arrow-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#0C2430" flood-opacity="0.55" />
        </filter>
      </defs>
      <g [attr.transform]="'rotate(' + rotation() + ' 60 60)'" filter="url(#arrow-shadow)">
        <path
          d="M60 14 L94 58 H76 V104 H44 V58 H26 Z"
          fill="#D9741A"
          stroke="#FDF8EE"
          stroke-width="5"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  `,
  styles: [
    `
      :host {
        position: absolute;
        inset: 0;
        display: block;
        pointer-events: none;
      }

      .arrow {
        position: absolute;
        width: clamp(78px, 24%, 132px);
        height: auto;
        animation: nudge 2.4s ease-in-out infinite;
      }

      /* the arrow sits where the walk continues, not always dead centre */
      .at-straight,
      .at-up {
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }

      .at-down {
        left: 50%;
        bottom: 6%;
        transform: translateX(-50%);
      }

      .at-left {
        left: 7%;
        top: 50%;
        transform: translateY(-50%);
      }

      .at-right {
        right: 7%;
        top: 50%;
        transform: translateY(-50%);
      }

      @keyframes nudge {
        0%,
        100% {
          opacity: 0.94;
        }
        50% {
          opacity: 1;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .arrow {
          animation: none;
        }
      }
    `,
  ],
})
export class ArrowOverlayComponent {
  @Input({ required: true }) direction!: ArrowDirection;

  /** Degrees to rotate the base arrow, which points up. */
  rotation(): number {
    switch (this.direction) {
      case 'left':
        return -90;
      case 'right':
        return 90;
      case 'down':
        return 180;
      default:
        return 0;
    }
  }

  describe(): string {
    switch (this.direction) {
      case 'left':
        return 'Turn left';
      case 'right':
        return 'Turn right';
      case 'up':
        return 'Go up';
      case 'down':
        return 'Go down';
      default:
        return 'Go straight ahead';
    }
  }
}

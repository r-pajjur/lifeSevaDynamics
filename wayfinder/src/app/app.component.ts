import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { GraphService } from './graph.service';
import { BuildingStep, NodeEntry } from './building.model';
import { DestinationPickerComponent } from './destination-picker.component';
import { StepPlayerComponent } from './step-player.component';

interface Trip {
  steps: BuildingStep[];
  label: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DestinationPickerComponent, StepPlayerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly at = signal('');
  readonly trip = signal<Trip | null>(null);
  readonly noRouteTo = signal('');
  readonly error = signal('');

  readonly ready = computed(() => this.graph.loaded());
  readonly here = computed(() => this.graph.label(this.at()));
  readonly knownAnchor = computed(() => this.graph.exists(this.at()));

  /** Everywhere worth offering, minus wherever the visitor already is. */
  readonly choices = computed(() => this.graph.destinations().filter(node => node.id !== this.at()));

  readonly resolveRoom = (room: number): NodeEntry | null => this.graph.anchorForRoom(room);

  constructor(private readonly graph: GraphService) {
    const at = new URLSearchParams(location.search).get('at') ?? '';
    this.at.set(at.trim());
    this.graph
      .load('building.json')
      .catch((err: unknown) => this.error.set(err instanceof Error ? err.message : String(err)));
  }

  /** Anchors that could be used when the QR sent us somewhere unknown. */
  anchors(): NodeEntry[] {
    return this.graph.destinations();
  }

  useAnchor(id: string): void {
    this.at.set(id);
    this.noRouteTo.set('');
  }

  go(choice: { node: NodeEntry; room?: number }): void {
    const steps = this.graph.route(this.at(), choice.node.id);
    if (!steps || !steps.length) {
      this.noRouteTo.set(choice.node.label);
      this.trip.set(null);
      return;
    }
    this.noRouteTo.set('');
    this.trip.set({
      steps,
      label: choice.room ? `room ${choice.room}` : choice.node.label,
    });
  }

  restart(): void {
    this.trip.set(null);
    this.noRouteTo.set('');
  }
}

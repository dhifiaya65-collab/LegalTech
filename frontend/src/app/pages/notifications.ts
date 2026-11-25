import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { Notification } from '../core/models';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe],
  template: `
    <div class="row" style="justify-content:space-between;align-items:center">
      <h1>Notifications</h1>
      <button class="btn" (click)="toutLire()">Tout marquer comme lu</button>
    </div>
    @if (liste().length === 0) { <p class="muted">Aucune notification.</p> }
    @for (n of liste(); track n._id) {
      <div class="card" [style.borderLeft]="n.lu ? '4px solid #e5e7eb' : '4px solid #c9a227'">
        {{ n.message }} <div class="muted">{{ n.dateEnvoi | date: 'dd/MM/yyyy HH:mm' }}</div>
      </div>
    }
  `
})
export class Notifications {
  private api = inject(ApiService);
  liste = signal<Notification[]>([]);
  constructor() { this.charger(); }
  charger() { this.api.notifications().subscribe((l) => this.liste.set(l)); }
  toutLire() { this.api.lireTout().subscribe(() => this.charger()); }
}

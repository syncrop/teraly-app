import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <p>{{ text() }}</p>
    </div>
  `,
  styles: [
    `
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #94a3b8;
      }

      .empty-state p {
        font-size: 16px;
        margin: 0;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  text = input.required<string>();
}

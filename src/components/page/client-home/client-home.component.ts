import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MoodsComponent } from '../../shared/moods/moods.component';

@Component({
  selector: 'app-client-home',
  templateUrl: './client-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MoodsComponent],
})
export class ClientHomeComponent {
  userName = 'Alejandro';
}

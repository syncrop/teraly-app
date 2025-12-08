import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MoodsComponent } from '../../shared/moods/moods.component';

@Component({
  selector: 'app-client-home',
  templateUrl: './client-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoodsComponent]
})
export class ClientHomeComponent {
  userName = 'Alejandro';
}

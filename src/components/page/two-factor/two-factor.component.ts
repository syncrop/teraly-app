import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-two-factor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './two-factor.component.html'
})
export class TwoFactorComponent implements OnInit {
  private location = inject(Location);
  private toastService = inject(ToastService);

  ngOnInit() {
    window.scrollTo(0, 0);
  }

  goBack() {
    this.location.back();
  }

  disableTwoFactor() {
    this.toastService.info($localize`:@@toast.common.featureInDevelopment:Función en desarrollo`);
    // Implementar lógica para desactivar 2FA
  }
}

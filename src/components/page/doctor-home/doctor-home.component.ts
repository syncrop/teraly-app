import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-doctor-home',
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold text-indigo-900" i18n="@@doctorHome.title">Doctor Home</h1>
      <p class="mt-2 text-gray-600" i18n="@@common.underConstruction">
        This page is under construction.
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class DoctorHomeComponent {}

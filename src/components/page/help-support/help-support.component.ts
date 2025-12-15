import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-help-support',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help-support.component.html'
})
export class HelpSupportComponent implements OnInit {
  private router = inject(Router);
  private location = inject(Location);

  ngOnInit() {
    window.scrollTo(0, 0);
  }

  faqs = signal<FAQ[]>([
    {
      question: '¿Cómo cancelo una cita?',
      answer: 'Puedes cancelar una cita desde la sección "Mis Citas" con al menos 24 horas de anticipación. Ve a la cita que deseas cancelar y selecciona la opción "Cancelar cita". Recibirás un reembolso completo si cancelas con la anticipación requerida.',
      isOpen: false
    },
    {
      question: 'No escucho al doctor en la video',
      answer: 'Si tienes problemas de audio durante la videollamada, verifica que: 1) Tu micrófono y altavoces estén habilitados en la configuración del navegador. 2) El volumen de tu dispositivo esté alto. 3) Ninguna otra aplicación esté usando el micrófono. Si el problema persiste, intenta actualizar la página o contacta soporte técnico.',
      isOpen: false
    },
    {
      question: '¿Cómo funcionan los reembolsos?',
      answer: 'Los reembolsos se procesan automáticamente cuando cancelas una cita con al menos 24 horas de anticipación. El dinero se devuelve al método de pago original en un plazo de 5-10 días hábiles. Si cancelas con menos de 24 horas de anticipación, no se realizará reembolso según nuestros términos y condiciones.',
      isOpen: false
    }
  ]);

  toggleFAQ(index: number) {
    this.faqs.update(faqs => 
      faqs.map((faq, i) => ({
        ...faq,
        isOpen: i === index ? !faq.isOpen : faq.isOpen
      }))
    );
  }

  navigateToPayments() {
    this.router.navigate(['/app/payments']);
  }

  sendEmail() {
    window.location.href = 'mailto:soporte@teraly.com?subject=Solicitud de soporte';
  }

  goBack() {
    this.location.back();
  }
}

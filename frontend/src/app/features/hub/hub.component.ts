import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-hub',
  standalone: true,
  imports: [],
  styles: [`
    .bg-farm {
      background-image: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=85&fit=crop&crop=center');
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
    }
    .bg-farm::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(4,47,46,0.85) 0%, rgba(6,78,59,0.80) 50%, rgba(4,120,87,0.75) 100%);
      z-index: 0;
    }
    .card-hover {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card-hover:hover {
      transform: translateY(-4px);
    }
    .float-icon {
      animation: floatAnim 6s ease-in-out infinite;
    }
    .float-icon:nth-child(2) { animation-delay: 1s; }
    .float-icon:nth-child(3) { animation-delay: 2s; }
    .float-icon:nth-child(4) { animation-delay: 3s; }
    .float-icon:nth-child(5) { animation-delay: 0.5s; }
    .float-icon:nth-child(6) { animation-delay: 1.5s; }
    @keyframes floatAnim {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(3deg); }
    }
  `],
  template: `
    <div class="min-h-screen bg-farm flex flex-col relative overflow-hidden">

      <!-- Éléments décoratifs flottants en arrière-plan -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <span class="float-icon absolute text-6xl opacity-10 top-[10%] left-[5%]">🌾</span>
        <span class="float-icon absolute text-5xl opacity-10 top-[20%] right-[8%]">🌱</span>
        <span class="float-icon absolute text-7xl opacity-10 top-[50%] left-[2%]">🌿</span>
        <span class="float-icon absolute text-5xl opacity-10 bottom-[20%] left-[15%]">🍃</span>
        <span class="float-icon absolute text-6xl opacity-10 bottom-[10%] right-[5%]">🌻</span>
        <span class="float-icon absolute text-5xl opacity-10 top-[70%] right-[12%]">🌺</span>
        <span class="float-icon absolute text-4xl opacity-10 top-[35%] left-[88%]">🍅</span>
        <span class="float-icon absolute text-4xl opacity-10 top-[80%] left-[45%]">🧅</span>
        <!-- Cercles lumineux -->
        <div class="absolute w-96 h-96 rounded-full bg-emerald-400 opacity-5 -top-20 -left-20 blur-3xl"></div>
        <div class="absolute w-80 h-80 rounded-full bg-green-300 opacity-5 bottom-0 right-0 blur-3xl"></div>
      </div>

      <!-- Header -->
      <header class="relative z-10 px-8 py-5 flex items-center justify-between border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/30">
            <span class="text-white font-bold text-lg">A</span>
          </div>
          <span class="text-xl font-bold text-white">Agri-ERP</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-white/70">{{ auth.user()?.prenom ?? auth.user()?.nom }}</span>
          <button (click)="logout()"
                  class="text-sm text-white/50 hover:text-white/90 transition-colors border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg">
            Déconnexion
          </button>
        </div>
      </header>

      <!-- Hero -->
      <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10">

        <!-- Titre -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white/80 text-xs font-medium px-4 py-1.5 rounded-full mb-5">
            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            Plan <span class="font-semibold capitalize ml-1">{{ auth.organisation()?.plan }}</span>
            &nbsp;·&nbsp; {{ auth.organisation()?.nom }}
          </div>
          <h1 class="text-4xl font-bold text-white mb-3 drop-shadow-sm">
            Bonjour, {{ auth.user()?.prenom ?? auth.user()?.nom }} 👋
          </h1>
          <p class="text-white/60 text-lg">Que souhaitez-vous faire aujourd'hui ?</p>
        </div>

        <!-- Deux cartes principales -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-10">

          <!-- Mon Exploitation -->
          <button (click)="goTo('/tableau-de-bord')"
                  class="card-hover group bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/40 rounded-3xl p-8 text-left shadow-xl">
            <div class="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
              🌾
            </div>
            <h2 class="text-xl font-bold text-white mb-2">Mon Exploitation</h2>
            <p class="text-white/60 text-sm leading-relaxed mb-5">
              Gérez vos champs, cultures, stocks, employés, finances et toutes vos opérations agricoles.
            </p>
            <div class="flex flex-wrap gap-1.5 mb-5">
              @for (tag of erpTags; track tag) {
                <span class="text-xs bg-white/10 text-white/70 border border-white/15 px-2.5 py-1 rounded-full">{{ tag }}</span>
              }
            </div>
            <div class="flex items-center gap-2 text-amber-300 font-semibold text-sm group-hover:gap-3 transition-all">
              Accéder au dashboard <span>→</span>
            </div>
          </button>

          <!-- Diagnostic IA -->
          <button (click)="goTo('/diagnostic')"
                  class="card-hover group bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/40 rounded-3xl p-8 text-left shadow-xl">
            <div class="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
              🔬
            </div>
            <h2 class="text-xl font-bold text-white mb-2">Diagnostic Phytosanitaire IA</h2>
            <p class="text-white/60 text-sm leading-relaxed mb-5">
              Photographiez votre plante malade et obtenez un diagnostic précis par intelligence artificielle avec traitements adaptés.
            </p>
            <div class="flex flex-wrap gap-1.5 mb-5">
              @for (tag of iaTags; track tag) {
                <span class="text-xs bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-1 rounded-full">{{ tag }}</span>
              }
            </div>
            <div class="flex items-center gap-2 text-emerald-300 font-semibold text-sm group-hover:gap-3 transition-all">
              Analyser une plante <span>→</span>
            </div>
          </button>

        </div>

      </main>

      <!-- Footer -->
      <footer class="relative z-10 text-center py-5 text-xs text-white/25 border-t border-white/10">
        © {{ year }} Agri-ERP · Conçu pour l'agriculture africaine
      </footer>

    </div>
  `,
})
export class HubComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  year = new Date().getFullYear();

  erpTags = ['Champs', 'Cultures', 'Stocks', 'Finances', 'Employés', 'Tâches', 'Médias', 'Import CSV'];
  iaTags = ['Claude Vision', 'Oignon', 'Tomate', 'Riz', 'Piment', 'Courgette', 'Patate'];

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.auth.logout();
  }
}

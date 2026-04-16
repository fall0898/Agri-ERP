import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';
import { RouterLink } from '@angular/router';

interface EvenementCalendrier {
  id: string;
  titre: string;
  date: Date;
  type: 'tache' | 'culture_semis' | 'culture_recolte' | 'autre';
  champ?: string;
  priorite?: string;
  statut?: string;
  couleur: string;
}

@Component({
  selector: 'app-calendrier',
  standalone: true,
  imports: [DateFrPipe, RouterLink],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900">Calendrier agricole</h1>
          <p class="text-neutral-500 text-sm">Planifiez et visualisez toutes vos activités</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Vue toggle -->
          <div class="flex bg-neutral-100 rounded-lg p-1">
            @for (v of vues; track v.key) {
              <button (click)="vue.set(v.key)"
                      class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                      [class.bg-white]="vue() === v.key"
                      [class.text-neutral-900]="vue() === v.key"
                      [class.shadow-sm]="vue() === v.key"
                      [class.text-neutral-500]="vue() !== v.key">
                {{ v.label }}
              </button>
            }
          </div>
          <a routerLink="/taches" class="btn-primary text-sm h-9 px-4">+ Tâche</a>
        </div>
      </div>

      <!-- Navigation mois -->
      <div class="card flex items-center justify-between py-4">
        <button (click)="moisPrecedent()"
                class="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600">
          ← Précédent
        </button>
        <div class="text-center">
          <h2 class="text-lg font-bold text-neutral-900">{{ nomMoisAnnee() }}</h2>
          <p class="text-xs text-neutral-400">{{ evenementsMois().length }} événement(s)</p>
        </div>
        <button (click)="moisSuivant()"
                class="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600">
          Suivant →
        </button>
      </div>

      <!-- Vue Mois (grille calendrier) -->
      @if (vue() === 'mois') {
        <div class="card p-0 overflow-hidden">
          <!-- Jours de la semaine -->
          <div class="grid grid-cols-7 border-b border-neutral-100">
            @for (jour of joursNoms; track jour) {
              <div class="py-3 text-center text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                {{ jour }}
              </div>
            }
          </div>
          <!-- Grille des jours -->
          <div class="grid grid-cols-7">
            @for (cellule of cellulesCalendrier(); track cellule.key) {
              <div class="min-h-24 border-r border-b border-neutral-100 last:border-r-0 p-1.5 relative"
                   [class.bg-neutral-50]="!cellule.estMoisCourant"
                   [class.bg-primary-50]="cellule.estAujourdhui">
                <!-- Numéro du jour -->
                <div class="flex items-center justify-center w-7 h-7 rounded-full text-sm mb-1 font-medium"
                     [class.bg-primary-500]="cellule.estAujourdhui"
                     [class.text-white]="cellule.estAujourdhui"
                     [class.text-neutral-400]="!cellule.estMoisCourant && !cellule.estAujourdhui"
                     [class.text-neutral-700]="cellule.estMoisCourant && !cellule.estAujourdhui">
                  {{ cellule.numero }}
                </div>
                <!-- Événements -->
                <div class="space-y-0.5">
                  @for (ev of cellule.evenements.slice(0, 3); track ev.id) {
                    <div class="text-xs px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-80"
                         [style.background-color]="ev.couleur + '20'"
                         [style.color]="ev.couleur"
                         [title]="ev.titre">
                      {{ ev.titre }}
                    </div>
                  }
                  @if (cellule.evenements.length > 3) {
                    <div class="text-xs text-neutral-400 px-1.5">
                      +{{ cellule.evenements.length - 3 }} autres
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Vue Semaine -->
      @if (vue() === 'semaine') {
        <div class="card p-0 overflow-hidden">
          <div class="grid grid-cols-7 border-b border-neutral-100">
            @for (jour of semaineCourante(); track jour.date) {
              <div class="py-3 px-2 text-center border-r border-neutral-100 last:border-r-0"
                   [class.bg-primary-50]="jour.estAujourdhui">
                <div class="text-xs font-semibold text-neutral-400 uppercase">{{ jour.nomCourt }}</div>
                <div class="text-lg font-bold mt-0.5"
                     [class.text-primary-600]="jour.estAujourdhui"
                     [class.text-neutral-700]="!jour.estAujourdhui">
                  {{ jour.numero }}
                </div>
              </div>
            }
          </div>
          <div class="grid grid-cols-7 min-h-64">
            @for (jour of semaineCourante(); track jour.date) {
              <div class="border-r border-neutral-100 last:border-r-0 p-2 space-y-1"
                   [class.bg-primary-50]="jour.estAujourdhui">
                @for (ev of jour.evenements; track ev.id) {
                  <div class="text-xs px-2 py-1.5 rounded-lg font-medium"
                       [style.background-color]="ev.couleur + '15'"
                       [style.border-left]="'3px solid ' + ev.couleur"
                       [style.color]="ev.couleur">
                    {{ ev.titre }}
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Vue Liste -->
      @if (vue() === 'liste') {
        <div class="space-y-3">
          @if (evenementsMois().length) {
            @for (ev of evenementsMois(); track ev.id) {
              <div class="card flex items-center gap-4 py-4">
                <!-- Bande couleur -->
                <div class="w-1 h-12 rounded-full flex-shrink-0"
                     [style.background-color]="ev.couleur"></div>
                <!-- Icône -->
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                     [style.background-color]="ev.couleur + '20'">
                  {{ typeIcon(ev.type) }}
                </div>
                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-neutral-900">{{ ev.titre }}</p>
                  <p class="text-sm text-neutral-500">
                    {{ ev.date | dateFr }}
                    @if (ev.champ) { · {{ ev.champ }} }
                  </p>
                </div>
                <!-- Badge type -->
                <span class="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                      [style.background-color]="ev.couleur + '15'"
                      [style.color]="ev.couleur">
                  {{ typeLabel(ev.type) }}
                </span>
                <!-- Priorité -->
                @if (ev.priorite) {
                  <span class="text-xs px-2 py-1 rounded-full flex-shrink-0"
                        [class.bg-red-100]="ev.priorite === 'haute'"
                        [class.text-red-700]="ev.priorite === 'haute'"
                        [class.bg-amber-100]="ev.priorite === 'normale'"
                        [class.text-amber-700]="ev.priorite === 'normale'"
                        [class.bg-green-100]="ev.priorite === 'basse'"
                        [class.text-green-700]="ev.priorite === 'basse'">
                    {{ ev.priorite }}
                  </span>
                }
              </div>
            }
          } @else {
            <div class="card text-center py-16">
              <div class="text-5xl mb-4">📅</div>
              <h3 class="font-semibold text-neutral-900 mb-2">Aucun événement ce mois</h3>
              <p class="text-neutral-500 text-sm">Ajoutez des tâches ou des cultures pour les voir ici.</p>
            </div>
          }
        </div>
      }

      <!-- Légende -->
      <div class="card">
        <h3 class="text-sm font-semibold text-neutral-700 mb-3">Légende</h3>
        <div class="flex flex-wrap gap-4">
          @for (leg of legende; track leg.label) {
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" [style.background-color]="leg.couleur"></div>
              <span class="text-xs text-neutral-600">{{ leg.label }}</span>
            </div>
          }
        </div>
      </div>

    </div>
  `,
})
export class CalendrierComponent implements OnInit {
  private api = inject(ApiService);

  vue = signal<'mois' | 'semaine' | 'liste'>('mois');
  loading = signal(true);
  evenements = signal<EvenementCalendrier[]>([]);
  dateCourante = signal(new Date());

  vues = [
    { key: 'mois' as const, label: 'Mois' },
    { key: 'semaine' as const, label: 'Semaine' },
    { key: 'liste' as const, label: 'Liste' },
  ];

  joursNoms = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  legende = [
    { couleur: '#3b82f6', label: 'Tâche' },
    { couleur: '#22c55e', label: 'Semis / Plantation' },
    { couleur: '#f59e0b', label: 'Récolte prévue' },
    { couleur: '#8b5cf6', label: 'Autre événement' },
  ];

  typeIcon = (t: string) => ({ tache: '✅', culture_semis: '🌱', culture_recolte: '🌾', autre: '📌' }[t] ?? '📌');
  typeLabel = (t: string) => ({ tache: 'Tâche', culture_semis: 'Semis', culture_recolte: 'Récolte', autre: 'Événement' }[t] ?? t);

  nomMoisAnnee = computed(() => {
    return this.dateCourante().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  evenementsMois = computed(() => {
    const d = this.dateCourante();
    return this.evenements().filter(ev =>
      ev.date.getMonth() === d.getMonth() && ev.date.getFullYear() === d.getFullYear()
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  cellulesCalendrier = computed(() => {
    const d = this.dateCourante();
    const annee = d.getFullYear();
    const mois = d.getMonth();

    const premierJour = new Date(annee, mois, 1);
    const dernierJour = new Date(annee, mois + 1, 0);
    const aujourd = new Date();

    // Lundi = 0, adapter le premier jour (JS: Dim=0, Lun=1...)
    let debutSemaine = premierJour.getDay() - 1;
    if (debutSemaine < 0) debutSemaine = 6;

    const cellules: any[] = [];

    // Jours du mois précédent
    for (let i = debutSemaine - 1; i >= 0; i--) {
      const date = new Date(annee, mois, -i);
      cellules.push(this.creerCellule(date, false, aujourd));
    }

    // Jours du mois courant
    for (let j = 1; j <= dernierJour.getDate(); j++) {
      const date = new Date(annee, mois, j);
      cellules.push(this.creerCellule(date, true, aujourd));
    }

    // Compléter jusqu'à 42 cellules (6 semaines)
    let jourSuivant = 1;
    while (cellules.length < 42) {
      const date = new Date(annee, mois + 1, jourSuivant++);
      cellules.push(this.creerCellule(date, false, aujourd));
    }

    return cellules;
  });

  semaineCourante = computed(() => {
    const aujourd = new Date();
    const lundi = new Date(aujourd);
    const jourSemaine = lundi.getDay() || 7;
    lundi.setDate(lundi.getDate() - jourSemaine + 1);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(lundi);
      date.setDate(lundi.getDate() + i);
      const estAujourdhui = date.toDateString() === aujourd.toDateString();
      const evs = this.evenements().filter(ev => ev.date.toDateString() === date.toDateString());
      return {
        date: date.toDateString(),
        nomCourt: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        numero: date.getDate(),
        estAujourdhui,
        evenements: evs,
      };
    });
  });

  ngOnInit(): void {
    this.chargerEvenements();
  }

  private creerCellule(date: Date, estMoisCourant: boolean, aujourd: Date) {
    const estAujourdhui = date.toDateString() === aujourd.toDateString();
    const evs = this.evenements().filter(ev => ev.date.toDateString() === date.toDateString());
    return {
      key: date.toISOString(),
      numero: date.getDate(),
      estMoisCourant,
      estAujourdhui,
      evenements: evs,
    };
  }

  moisPrecedent(): void {
    const d = new Date(this.dateCourante());
    d.setMonth(d.getMonth() - 1);
    this.dateCourante.set(d);
  }

  moisSuivant(): void {
    const d = new Date(this.dateCourante());
    d.setMonth(d.getMonth() + 1);
    this.dateCourante.set(d);
  }

  private chargerEvenements(): void {
    const evs: EvenementCalendrier[] = [];

    // Tâches
    this.api.get<any>('/api/taches').subscribe({
      next: res => {
        const taches = res.data?.data ?? res.data ?? [];
        taches.forEach((t: any) => {
          if (t.date_echeance) {
            evs.push({
              id: `tache-${t.id}`,
              titre: t.titre,
              date: new Date(t.date_echeance),
              type: 'tache',
              champ: t.champ?.nom,
              priorite: t.priorite,
              statut: t.statut,
              couleur: t.priorite === 'haute' ? '#ef4444' : '#3b82f6',
            });
          }
        });
        this.evenements.update(e => [...e, ...evs.filter(ev => ev.type === 'tache')]);
      },
    });

    // Cultures (semis & récoltes)
    this.api.get<any>('/api/cultures').subscribe({
      next: res => {
        const cultures = res.data?.data ?? res.data ?? [];
        const cultEvs: EvenementCalendrier[] = [];
        cultures.forEach((c: any) => {
          if (c.date_semis) {
            cultEvs.push({
              id: `semis-${c.id}`,
              titre: `Semis : ${c.nom}`,
              date: new Date(c.date_semis),
              type: 'culture_semis',
              champ: c.champ?.nom,
              couleur: '#22c55e',
            });
          }
          if (c.date_recolte_prevue) {
            cultEvs.push({
              id: `recolte-${c.id}`,
              titre: `Récolte : ${c.nom}`,
              date: new Date(c.date_recolte_prevue),
              type: 'culture_recolte',
              champ: c.champ?.nom,
              couleur: '#f59e0b',
            });
          }
        });
        this.evenements.update(e => [...e, ...cultEvs]);
      },
    });

    this.loading.set(false);
  }
}

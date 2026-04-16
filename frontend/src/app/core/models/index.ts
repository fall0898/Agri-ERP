export interface Organisation {
  id: number;
  nom: string;
  slug: string;
  email_contact: string;
  telephone?: string;
  logo_url?: string;
  devise: string;
  plan: 'gratuit' | 'pro' | 'entreprise';
  plan_actuel?: 'gratuit' | 'pro' | 'entreprise';
  plan_expire_at?: string;
  periode_essai_fin?: string;
  est_active: boolean;
  est_suspendue: boolean;
  campagne_debut_mois: number;
  campagne_debut_jour: number;
  superficie_totale?: number;
  type_agriculture?: string;
  region?: string;
  pays?: string;
  parametres?: Record<string, any>;
  created_at: string;
}

export interface User {
  id: number;
  organisation_id?: number;
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  role: 'super_admin' | 'admin' | 'lecteur';
  est_actif: boolean;
  preferences_notification?: Record<string, boolean>;
  derniere_connexion_at?: string;
  onboarding_complete: boolean;
  organisation?: Organisation;
}

export interface CampagneAgricole {
  id: number;
  organisation_id: number;
  nom: string;
  date_debut: string;
  date_fin: string;
  est_courante: boolean;
  notes?: string;
}

export interface Champ {
  id: number;
  organisation_id: number;
  user_id: number;
  nom: string;
  superficie_ha: number;
  localisation?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  est_actif: boolean;
  user?: Pick<User, 'id' | 'nom'>;
  created_at: string;
}

export interface Culture {
  id: number;
  organisation_id: number;
  champ_id: number;
  campagne_id?: number;
  nom: string;
  variete?: string;
  saison: 'normale' | 'contre_saison';
  annee: number;
  date_semis?: string;
  date_recolte_prevue?: string;
  date_recolte_effective?: string;
  superficie_cultivee_ha?: number;
  quantite_recoltee_kg?: number;
  statut: 'en_cours' | 'recolte' | 'termine' | 'abandonne';
  notes?: string;
  champ?: Pick<Champ, 'id' | 'nom'>;
  campagne?: Pick<CampagneAgricole, 'id' | 'nom'>;
}

export interface Media {
  id: number;
  culture_id?: number;
  champ_id?: number;
  type: 'photo' | 'video';
  fichier_url: string;
  fichier_nom: string;
  taille_octets?: number;
  description?: string;
  date_prise?: string;
  created_at: string;
}

export interface Intrant {
  id: number;
  organisation_id: number;
  nom: string;
  categorie: string;
  unite: string;
  description?: string;
  est_actif: boolean;
}

export interface Stock {
  id: number;
  organisation_id: number;
  intrant_id?: number;
  nom: string;
  categorie: string;
  quantite_actuelle: number;
  unite: string;
  seuil_alerte?: number;
  est_actif: boolean;
  niveau_alerte?: 'ok' | 'attention' | 'critique';
  intrant?: Pick<Intrant, 'id' | 'nom'>;
}

export interface MouvementStock {
  id: number;
  stock_id: number;
  type: 'achat' | 'utilisation' | 'perte' | 'ajustement';
  quantite: number;
  prix_unitaire_fcfa?: number;
  montant_total_fcfa?: number;
  fournisseur?: string;
  depense_id?: number;
  culture_id?: number;
  motif?: string;
  date_mouvement: string;
  created_at: string;
}

export type CategorieDepense =
  | 'intrant' | 'salaire' | 'materiel' | 'autre' | 'carburant'
  | 'main_oeuvre' | 'traitement_phytosanitaire' | 'transport'
  | 'irrigation' | 'entretien_materiel' | 'alimentation_betail' | 'frais_recolte';

export interface Depense {
  id: number;
  organisation_id: number;
  user_id: number;
  champ_id?: number;
  campagne_id?: number;
  categorie: CategorieDepense;
  description: string;
  montant_fcfa: number;
  date_depense: string;
  est_auto_generee: boolean;
  source_type?: string;
  source_id?: number;
  champ?: Pick<Champ, 'id' | 'nom'>;
  campagne?: Pick<CampagneAgricole, 'id' | 'nom'>;
  user?: Pick<User, 'id' | 'nom'>;
}

export interface Vente {
  id: number;
  organisation_id: number;
  user_id: number;
  champ_id?: number;
  culture_id?: number;
  campagne_id?: number;
  acheteur?: string;
  produit: string;
  quantite_kg: number;
  prix_unitaire_fcfa: number;
  montant_total_fcfa: number;
  date_vente: string;
  notes?: string;
  champ?: Pick<Champ, 'id' | 'nom'>;
  culture?: Pick<Culture, 'id' | 'nom'>;
  campagne?: Pick<CampagneAgricole, 'id' | 'nom'>;
}

export interface Employe {
  id: number;
  organisation_id: number;
  nom: string;
  telephone?: string;
  poste?: string;
  date_embauche?: string;
  salaire_mensuel_fcfa?: number;
  est_actif: boolean;
  notes?: string;
}

export interface Tache {
  id: number;
  organisation_id: number;
  employe_id: number;
  champ_id?: number;
  culture_id?: number;
  titre: string;
  description?: string;
  date_debut: string;
  date_fin?: string;
  statut: 'a_faire' | 'en_cours' | 'termine' | 'annule';
  priorite: 'basse' | 'normale' | 'haute' | 'urgente';
  employe?: Pick<Employe, 'id' | 'nom'>;
  champ?: Pick<Champ, 'id' | 'nom'>;
}

export interface PaiementSalaire {
  id: number;
  organisation_id: number;
  employe_id: number;
  montant_fcfa: number;
  mois: string;
  date_paiement: string;
  mode_paiement: 'especes' | 'mobile_money' | 'virement' | 'autre';
  notes?: string;
  depense_id?: number;
  employe?: Pick<Employe, 'id' | 'nom'>;
}

export interface Notification {
  id: number;
  organisation_id: number;
  user_id: number;
  type: string;
  titre: string;
  message: string;
  canal: 'app' | 'email' | 'sms' | 'whatsapp' | 'push';
  action_url?: string;
  est_lue: boolean;
  lue_at?: string;
  envoyee_at?: string;
  created_at: string;
}

export interface DashboardKpis {
  total_ventes: number;
  total_depenses: number;
  solde_net: number;
  nb_champs: number;
  nb_cultures_actives: number;
  nb_employes: number;
  nb_alertes_stock: number;
}

export interface FinanceResume {
  total_ventes: number;
  total_depenses: number;
  solde_net: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

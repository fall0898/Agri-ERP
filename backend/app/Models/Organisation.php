<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organisation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom', 'slug', 'email_contact', 'telephone', 'logo_url', 'devise',
        'plan', 'plan_expire_at', 'periode_essai_fin', 'est_active',
        'est_suspendue', 'campagne_debut_mois', 'campagne_debut_jour', 'parametres',
    ];

    protected $casts = [
        'plan_expire_at' => 'datetime',
        'periode_essai_fin' => 'datetime',
        'est_active' => 'boolean',
        'est_suspendue' => 'boolean',
        'campagne_debut_mois' => 'integer',
        'campagne_debut_jour' => 'integer',
        'parametres' => 'array',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function champs(): HasMany
    {
        return $this->hasMany(Champ::class);
    }

    public function cultures(): HasMany
    {
        return $this->hasMany(Culture::class);
    }

    public function campagnes(): HasMany
    {
        return $this->hasMany(CampagneAgricole::class);
    }

    public function depenses(): HasMany
    {
        return $this->hasMany(Depense::class);
    }

    public function ventes(): HasMany
    {
        return $this->hasMany(Vente::class);
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    public function employes(): HasMany
    {
        return $this->hasMany(Employe::class);
    }

    public function intrants(): HasMany
    {
        return $this->hasMany(Intrant::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function abonnementsHistorique(): HasMany
    {
        return $this->hasMany(AbonnementHistorique::class);
    }

    public function campagneCourante(): ?CampagneAgricole
    {
        return $this->campagnes()->where('est_courante', true)->first();
    }

    public function isEnPeriodeEssai(): bool
    {
        return $this->plan === 'gratuit'
            && $this->periode_essai_fin !== null
            && $this->periode_essai_fin->isFuture();
    }

    public function getPlanEffectif(): string
    {
        if ($this->isEnPeriodeEssai()) {
            return 'pro';
        }
        return $this->plan;
    }

    public function isPlanActif(): bool
    {
        if ($this->plan === 'gratuit' && $this->periode_essai_fin === null) {
            return true;
        }
        if ($this->plan === 'gratuit' && $this->isEnPeriodeEssai()) {
            return true;
        }
        if ($this->plan !== 'gratuit' && $this->plan_expire_at !== null) {
            return $this->plan_expire_at->isFuture();
        }
        return false;
    }
}

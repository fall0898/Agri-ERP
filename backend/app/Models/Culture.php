<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Culture extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organisation_id', 'champ_id', 'campagne_id', 'nom', 'type_culture', 'variete',
        'saison', 'annee', 'date_semis', 'date_recolte_prevue',
        'date_recolte_effective', 'superficie_cultivee_ha',
        'quantite_recoltee_kg', 'statut', 'notes',
    ];

    protected $casts = [
        'date_semis' => 'date',
        'date_recolte_prevue' => 'date',
        'date_recolte_effective' => 'date',
        'superficie_cultivee_ha' => 'decimal:4',
        'quantite_recoltee_kg' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function champ(): BelongsTo
    {
        return $this->belongsTo(Champ::class);
    }

    public function campagne(): BelongsTo
    {
        return $this->belongsTo(CampagneAgricole::class, 'campagne_id');
    }

    public function medias(): HasMany
    {
        return $this->hasMany(Media::class);
    }

    public function utilisationsIntrants(): HasMany
    {
        return $this->hasMany(UtilisationIntrant::class);
    }

    public function ventes(): HasMany
    {
        return $this->hasMany(Vente::class);
    }

    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class);
    }

    public function mouvementsStock(): HasMany
    {
        return $this->hasMany(MouvementStock::class);
    }

    public function traitements(): HasMany
    {
        return $this->hasMany(TraitementApplique::class);
    }
}

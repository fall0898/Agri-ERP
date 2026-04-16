<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stock extends Model
{
    use HasFactory;

    protected $fillable = [
        'organisation_id', 'user_id', 'intrant_id', 'nom', 'categorie',
        'quantite_actuelle', 'unite', 'seuil_alerte', 'est_actif',
    ];

    protected $casts = [
        'quantite_actuelle' => 'decimal:2',
        'seuil_alerte' => 'decimal:2',
        'est_actif' => 'boolean',
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

    public function intrant(): BelongsTo
    {
        return $this->belongsTo(Intrant::class);
    }

    public function mouvements(): HasMany
    {
        return $this->hasMany(MouvementStock::class)->orderByDesc('date_mouvement');
    }

    public function utilisations(): HasMany
    {
        return $this->hasMany(UtilisationIntrant::class);
    }

    public function isEnAlerte(): bool
    {
        if ($this->seuil_alerte === null) {
            return false;
        }
        return $this->quantite_actuelle <= $this->seuil_alerte;
    }

    public function getNiveauAlerte(): string
    {
        if ($this->seuil_alerte === null) {
            return 'ok';
        }
        if ($this->quantite_actuelle <= $this->seuil_alerte) {
            return 'critique';
        }
        if ($this->quantite_actuelle <= $this->seuil_alerte * 2) {
            return 'attention';
        }
        return 'ok';
    }
}

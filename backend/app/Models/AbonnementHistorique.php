<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AbonnementHistorique extends Model
{
    use HasFactory;

    protected $table = 'abonnements_historique';

    protected $fillable = [
        'organisation_id', 'plan_precedent', 'plan_nouveau', 'montant_fcfa',
        'processeur_paiement', 'reference_paiement', 'statut', 'date_debut', 'date_fin',
    ];

    protected $casts = [
        'montant_fcfa' => 'decimal:2',
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }
}

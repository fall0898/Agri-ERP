<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaiementSalaire extends Model
{
    use HasFactory;

    protected $table = 'paiements_salaire';

    protected $fillable = [
        'organisation_id', 'employe_id', 'montant_fcfa', 'mois',
        'date_paiement', 'mode_paiement', 'notes', 'depense_id',
    ];

    protected $casts = [
        'montant_fcfa' => 'decimal:2',
        'date_paiement' => 'date',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    public function depense(): BelongsTo
    {
        return $this->belongsTo(Depense::class);
    }
}

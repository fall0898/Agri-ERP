<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vente extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organisation_id', 'user_id', 'champ_id', 'culture_id', 'campagne_id',
        'acheteur', 'produit', 'quantite_kg', 'unite', 'prix_unitaire_fcfa',
        'montant_total_fcfa', 'date_vente', 'notes',
        'est_auto_generee', 'source_type', 'source_id',
    ];

    protected $casts = [
        'quantite_kg' => 'decimal:2',
        'prix_unitaire_fcfa' => 'decimal:2',
        'montant_total_fcfa' => 'decimal:2',
        'date_vente' => 'date',
        'est_auto_generee' => 'boolean',
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

    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }

    public function campagne(): BelongsTo
    {
        return $this->belongsTo(CampagneAgricole::class, 'campagne_id');
    }
}

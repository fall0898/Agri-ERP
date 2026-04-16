<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinancementIndividuel extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'financements_individuels';

    protected $fillable = [
        'organisation_id', 'employe_id', 'user_id',
        'montant_fcfa', 'motif', 'date_financement', 'mode_paiement',
        'statut', 'montant_rembourse_fcfa', 'notes', 'depense_id',
    ];

    protected $casts = [
        'montant_fcfa' => 'decimal:2',
        'montant_rembourse_fcfa' => 'decimal:2',
        'date_financement' => 'date',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function depense(): BelongsTo
    {
        return $this->belongsTo(Depense::class);
    }

    public function remboursements(): HasMany
    {
        return $this->hasMany(RemboursementFinancement::class, 'financement_id');
    }

    public function estRembourse(): bool
    {
        return $this->statut === 'rembourse';
    }

    public function montantRestant(): float
    {
        return (float) $this->montant_fcfa - (float) $this->montant_rembourse_fcfa;
    }
}

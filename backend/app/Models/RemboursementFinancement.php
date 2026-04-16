<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RemboursementFinancement extends Model
{
    use HasFactory;

    protected $table = 'remboursements_financement';

    protected $fillable = [
        'organisation_id', 'financement_id', 'user_id',
        'montant_fcfa', 'date_remboursement', 'mode_paiement', 'vente_id',
    ];

    protected $casts = [
        'montant_fcfa' => 'decimal:2',
        'date_remboursement' => 'date',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    public function financement(): BelongsTo
    {
        return $this->belongsTo(FinancementIndividuel::class, 'financement_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vente(): BelongsTo
    {
        return $this->belongsTo(Vente::class);
    }
}

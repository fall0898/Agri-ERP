<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UtilisationIntrant extends Model
{
    use HasFactory;

    protected $table = 'utilisations_intrants';

    protected $fillable = [
        'organisation_id', 'culture_id', 'intrant_id', 'stock_id',
        'nom_intrant', 'quantite', 'unite', 'cout_total_fcfa',
        'date_utilisation', 'notes',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'cout_total_fcfa' => 'decimal:2',
        'date_utilisation' => 'date',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }

    public function intrant(): BelongsTo
    {
        return $this->belongsTo(Intrant::class);
    }

    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }
}

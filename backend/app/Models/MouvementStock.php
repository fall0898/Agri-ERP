<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MouvementStock extends Model
{
    use HasFactory;

    protected $table = 'mouvements_stock';

    protected $fillable = [
        'stock_id', 'type', 'quantite', 'prix_unitaire_fcfa',
        'montant_total_fcfa', 'fournisseur', 'depense_id',
        'culture_id', 'motif', 'date_mouvement',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'prix_unitaire_fcfa' => 'decimal:2',
        'montant_total_fcfa' => 'decimal:2',
        'date_mouvement' => 'date',
    ];

    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }

    public function depense(): BelongsTo
    {
        return $this->belongsTo(Depense::class);
    }

    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }
}

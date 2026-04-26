<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TraitementApplique extends Model
{
    protected $fillable = [
        'culture_id', 'organisation_id', 'user_id',
        'produit', 'matiere_active', 'dose', 'date_application', 'source',
    ];

    protected $casts = ['date_application' => 'date'];

    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }
}

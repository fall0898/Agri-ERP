<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Diagnostic extends Model
{
    protected $fillable = [
        'organisation_id',
        'user_id',
        'culture_id',
        'type_culture',
        'image_url',
        'description_symptomes',
        'maladie_detectee',
        'niveau_confiance',
        'symptomes',
        'traitement_immediat',
        'produits_senegal',
        'prevention',
        'conseil',
        'reponse_ia_brute',
    ];

    protected $casts = [
        'symptomes'           => 'array',
        'traitement_immediat' => 'array',
        'produits_senegal'    => 'array',
        'prevention'          => 'array',
    ];

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }
}

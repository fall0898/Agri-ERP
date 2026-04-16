<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Import extends Model
{
    use HasFactory;

    protected $fillable = [
        'organisation_id', 'user_id', 'type', 'fichier_url', 'fichier_nom',
        'statut', 'lignes_total', 'lignes_importees', 'lignes_erreur', 'erreurs_detail',
        'job_id',
    ];

    protected $casts = [
        'erreurs_detail' => 'array',
        'lignes_total' => 'integer',
        'lignes_importees' => 'integer',
        'lignes_erreur' => 'integer',
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
}

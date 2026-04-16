<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CampagneAgricole extends Model
{
    use HasFactory;

    protected $table = 'campagnes_agricoles';

    protected $fillable = [
        'organisation_id', 'nom', 'date_debut', 'date_fin', 'est_courante', 'notes',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'est_courante' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function cultures(): HasMany
    {
        return $this->hasMany(Culture::class, 'campagne_id');
    }

    public function depenses(): HasMany
    {
        return $this->hasMany(Depense::class, 'campagne_id');
    }

    public function ventes(): HasMany
    {
        return $this->hasMany(Vente::class, 'campagne_id');
    }
}

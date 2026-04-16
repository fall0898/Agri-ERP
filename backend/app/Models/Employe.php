<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employe extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organisation_id', 'user_id', 'nom', 'telephone', 'poste',
        'date_embauche', 'salaire_mensuel_fcfa', 'est_actif', 'notes',
    ];

    protected $casts = [
        'date_embauche' => 'date',
        'salaire_mensuel_fcfa' => 'decimal:2',
        'est_actif' => 'boolean',
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

    public function taches(): HasMany
    {
        return $this->hasMany(Tache::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(PaiementSalaire::class);
    }
}

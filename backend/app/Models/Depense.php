<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Depense extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organisation_id', 'user_id', 'champ_id', 'campagne_id',
        'categorie', 'description', 'montant_fcfa', 'date_depense',
        'est_auto_generee', 'source_type', 'source_id',
    ];

    protected $casts = [
        'montant_fcfa' => 'decimal:2',
        'date_depense' => 'date',
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

    public function campagne(): BelongsTo
    {
        return $this->belongsTo(CampagneAgricole::class, 'campagne_id');
    }
}

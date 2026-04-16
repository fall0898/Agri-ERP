<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncQueue extends Model
{
    use HasFactory;

    protected $table = 'sync_queue';

    protected $fillable = [
        'organisation_id', 'user_id', 'model_type', 'action',
        'payload', 'sync_id', 'statut', 'traite_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'traite_at' => 'datetime',
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

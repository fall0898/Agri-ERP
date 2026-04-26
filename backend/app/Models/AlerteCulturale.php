<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlerteCulturale extends Model
{
    public $timestamps = false;

    protected $fillable = ['culture_id', 'user_id', 'type', 'message', 'sent_at'];

    protected $casts = ['sent_at' => 'datetime'];

    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }
}

<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsappUser extends Model {
    protected $fillable = ['user_id', 'organisation_id', 'phone_number', 'est_actif', 'langue', 'systeme_arrosage', 'onboarded_at'];
    protected $casts = ['est_actif' => 'boolean'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function organisation(): BelongsTo { return $this->belongsTo(Organisation::class); }
}

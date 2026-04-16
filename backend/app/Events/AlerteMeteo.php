<?php

namespace App\Events;

use App\Models\Champ;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AlerteMeteo
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Champ $champ,
        public readonly array $alerteData
    ) {}
}

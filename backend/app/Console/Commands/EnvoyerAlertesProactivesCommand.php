<?php
namespace App\Console\Commands;

use App\Models\AlerteCulturale;
use App\Models\Culture;
use App\Services\Meteo\MeteoService;
use App\Services\Whatsapp\CalendrierCulturalService;
use App\Services\Whatsapp\WhatsappSenderService;
use Illuminate\Console\Command;
use Illuminate\Database\UniqueConstraintViolationException;

class EnvoyerAlertesProactivesCommand extends Command
{
    protected $signature   = 'whatsapp:alertes-proactives';
    protected $description = 'Envoie les alertes phénologiques quotidiennes via WhatsApp';

    public function handle(
        CalendrierCulturalService $calendrier,
        MeteoService              $meteo,
        WhatsappSenderService     $sender,
    ): void {
        $this->info('Envoi alertes proactives ' . now()->toDateString());

        $cultures = Culture::query()
            ->where('statut', 'en_cours')
            ->whereNotNull('type_culture')
            ->whereNotNull('date_semis')
            ->with(['champ', 'user.whatsappUser'])
            ->get();

        $envoyes = 0;
        $ignores = 0;

        foreach ($cultures as $culture) {
            $user   = $culture->user;
            $waUser = $user?->whatsappUser;

            if (! $waUser?->est_actif || ! $waUser?->phone_number) {
                continue;
            }
            if (! ($user->alertes_whatsapp_actives ?? true)) {
                continue;
            }

            $alerteType = $calendrier->getAlerteType($culture);
            if (! $alerteType) {
                continue;
            }

            $dejaEnvoyee = AlerteCulturale::where('culture_id', $culture->id)
                ->where('type', $alerteType)
                ->exists();

            if ($dejaEnvoyee) {
                $ignores++;
                continue;
            }

            $champ     = $culture->champ;
            $meteoData = $meteo->getMeteo($champ?->zone_meteo, $champ?->latitude, $champ?->longitude);
            $langue    = $waUser->langue ?? 'fr';
            $systeme   = $waUser->systeme_arrosage ?? 'aspersion';

            $message = "🌅 *Alerte phénologique*\n\n"
                . $calendrier->getConseils($culture, $meteoData, $systeme, $langue);

            try {
                $sender->send($waUser->phone_number, $message);

                AlerteCulturale::create([
                    'culture_id' => $culture->id,
                    'user_id'    => $user->id,
                    'type'       => $alerteType,
                    'message'    => $message,
                    'sent_at'    => now(),
                ]);

                $envoyes++;
                $this->line("✅ Alerte {$alerteType} → {$waUser->phone_number}");
            } catch (UniqueConstraintViolationException) {
                $ignores++;
            } catch (\Throwable $e) {
                $this->error("Erreur envoi {$waUser->phone_number}: " . $e->getMessage());
            }
        }

        $this->info("Envoyés: {$envoyes} | Ignorés (déjà envoyés): {$ignores}");
    }
}

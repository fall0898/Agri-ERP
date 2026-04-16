<?php

namespace App\Services\Abonnement\PlanStrategies;

class PlanGratuitStrategy implements PlanStrategyInterface
{
    public function canCreateChamp(int $currentCount): bool { return $currentCount < 1; }
    public function canCreateCulture(int $currentCount): bool { return $currentCount < 1; }
    public function canAddUser(int $currentCount): bool { return $currentCount < 1; }
    public function canExportExcel(): bool { return false; }
    public function canImportCsv(): bool { return false; }
    public function canAccessMeteo(): bool { return false; }
    public function canSendSmsWhatsapp(): bool { return false; }
    public function canCompareN1(): bool { return false; }
    public function canViewRentabiliteCulture(): bool { return false; }
    public function canAccessAccompagnement(): bool { return false; }
    public function getMaxChamps(): int|string { return 1; }
    public function getMaxUsers(): int|string { return 1; }
    public function getMaxCultures(): int|string { return 1; }
    public function getMaxStorageMb(): int { return 100; }
    public function getPlanName(): string { return 'gratuit'; }
}

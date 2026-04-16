<?php

namespace App\Services\Abonnement\PlanStrategies;

class PlanEntrepriseStrategy implements PlanStrategyInterface
{
    public function canCreateChamp(int $currentCount): bool { return true; }
    public function canCreateCulture(int $currentCount): bool { return true; }
    public function canAddUser(int $currentCount): bool { return true; }
    public function canExportExcel(): bool { return true; }
    public function canImportCsv(): bool { return true; }
    public function canAccessMeteo(): bool { return true; }
    public function canSendSmsWhatsapp(): bool { return true; }
    public function canCompareN1(): bool { return true; }
    public function canViewRentabiliteCulture(): bool { return true; }
    public function canAccessAccompagnement(): bool { return true; }
    public function getMaxChamps(): int|string { return 'illimité'; }
    public function getMaxUsers(): int|string { return 'illimité'; }
    public function getMaxCultures(): int|string { return 'illimité'; }
    public function getMaxStorageMb(): int { return 20480; }
    public function getPlanName(): string { return 'entreprise'; }
}

<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bienvenue sur Agri-ERP</title></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr><td style="background:#16a34a;padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🌾 Agri-ERP</h1>
        <p style="margin:8px 0 0;color:#bbf7d0;font-size:14px;">Gestion agricole pour l'Afrique</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:40px;">
        <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Bienvenue, {{ $nomAdmin }} ! 👋</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
          Votre espace <strong>{{ $nomOrg }}</strong> est prêt. Vous êtes sur le plan <strong>{{ $plan }}</strong>.
        </p>
        @if($essaiFinLe)
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:0 0 24px;">
          <p style="margin:0;color:#166534;font-size:14px;">
            🎁 <strong>Essai gratuit actif jusqu'au {{ $essaiFinLe }}</strong> — profitez-en pour explorer toutes les fonctionnalités.
          </p>
        </div>
        @endif
        <p style="margin:0 0 8px;color:#374151;font-size:15px;">Avec Agri-ERP vous pouvez :</p>
        <ul style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
          <li>Gérer vos champs, cultures et stocks</li>
          <li>Suivre vos dépenses et ventes</li>
          <li>Planifier les tâches de vos employés</li>
          <li>Consulter vos rapports financiers</li>
        </ul>
        <table cellpadding="0" cellspacing="0"><tr><td>
          <a href="{{ $urlTableauBord }}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;">
            Accéder à mon espace →
          </a>
        </td></tr></table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">© {{ date('Y') }} Agri-ERP · Conçu pour l'agriculture africaine</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>

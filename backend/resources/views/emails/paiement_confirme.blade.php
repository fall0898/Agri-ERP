<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Paiement confirmé</title></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr><td style="background:#16a34a;padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🌾 Agri-ERP</h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:40px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:48px;">✅</div>
          <h2 style="margin:12px 0 4px;color:#111827;font-size:22px;">Paiement confirmé !</h2>
          <p style="margin:0;color:#6b7280;font-size:14px;">Merci pour votre confiance, {{ $nomUser }}.</p>
        </div>

        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#374151;font-size:14px;padding:6px 0;"><strong>Plan</strong></td>
              <td style="color:#374151;font-size:14px;padding:6px 0;text-align:right;">{{ $plan }}</td>
            </tr>
            <tr>
              <td style="color:#374151;font-size:14px;padding:6px 0;"><strong>Montant</strong></td>
              <td style="color:#374151;font-size:14px;padding:6px 0;text-align:right;">{{ $montant }}</td>
            </tr>
            <tr>
              <td style="color:#374151;font-size:14px;padding:6px 0;"><strong>Référence</strong></td>
              <td style="color:#374151;font-size:14px;padding:6px 0;text-align:right;font-family:monospace;">{{ $reference }}</td>
            </tr>
            <tr>
              <td style="color:#374151;font-size:14px;padding:6px 0;"><strong>Valide du</strong></td>
              <td style="color:#374151;font-size:14px;padding:6px 0;text-align:right;">{{ $dateDebut }} au {{ $dateFin }}</td>
            </tr>
          </table>
        </div>

        <table cellpadding="0" cellspacing="0"><tr><td>
          <a href="{{ $urlAbonnement }}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;">
            Voir mon abonnement →
          </a>
        </td></tr></table>
      </td></tr>

      <tr><td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">© {{ date('Y') }} Agri-ERP · Conservez cet email comme reçu de paiement.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>

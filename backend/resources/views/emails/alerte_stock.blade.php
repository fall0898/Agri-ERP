<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alerte stock bas</title></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr><td style="background:#d97706;padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">⚠️ Alerte Stock — Agri-ERP</h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:40px;">
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Bonjour <strong>{{ $nomUser }}</strong>,</p>
        <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
          Le stock suivant est passé en dessous du seuil d'alerte et nécessite votre attention :
        </p>

        <div style="background:#fffbeb;border:2px solid #fcd34d;border-radius:12px;padding:20px;margin-bottom:24px;">
          <h3 style="margin:0 0 12px;color:#92400e;font-size:18px;">📦 {{ $nomStock }}</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#78350f;font-size:14px;padding:4px 0;"><strong>Quantité actuelle</strong></td>
              <td style="color:#dc2626;font-size:14px;padding:4px 0;text-align:right;font-weight:700;">{{ $quantite }}</td>
            </tr>
            <tr>
              <td style="color:#78350f;font-size:14px;padding:4px 0;"><strong>Seuil d'alerte</strong></td>
              <td style="color:#78350f;font-size:14px;padding:4px 0;text-align:right;">{{ $seuil }}</td>
            </tr>
          </table>
        </div>

        <table cellpadding="0" cellspacing="0"><tr><td>
          <a href="{{ $urlStocks }}" style="display:inline-block;background:#d97706;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;">
            Gérer mes stocks →
          </a>
        </td></tr></table>
      </td></tr>

      <tr><td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">© {{ date('Y') }} Agri-ERP · Vous recevez cet email car vous êtes administrateur.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>

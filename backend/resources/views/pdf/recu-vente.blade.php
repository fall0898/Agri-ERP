<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }
        .header { background: #22C55E; color: white; padding: 20px; text-align: center; }
        .header h1 { font-size: 22px; font-weight: bold; }
        .header p { font-size: 12px; opacity: 0.9; margin-top: 4px; }
        .numero { text-align: right; padding: 12px 20px; border-bottom: 2px solid #22C55E; }
        .numero strong { font-size: 14px; color: #22C55E; }
        .infos { display: table; width: 100%; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
        .infos-col { display: table-cell; width: 50%; vertical-align: top; }
        .infos-col h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
        .infos-col p { margin-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        thead th { background: #22C55E; color: white; padding: 10px 20px; text-align: left; font-size: 11px; text-transform: uppercase; }
        tbody td { padding: 12px 20px; border-bottom: 1px solid #e5e7eb; }
        .total-row td { font-weight: bold; font-size: 14px; background: #f0fdf4; border-top: 2px solid #22C55E; }
        .total-montant { color: #22C55E; font-size: 16px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
        .section { padding: 0 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Agri-ERP</h1>
        <p>Plateforme de gestion agricole</p>
    </div>

    <div class="numero">
        <strong>REÇU DE VENTE N° VNT-{{ str_pad($vente->id, 5, '0', STR_PAD_LEFT) }}</strong>
    </div>

    <div class="infos">
        <div class="infos-col">
            <h3>Vendeur</h3>
            <p><strong>{{ $vente->organisation->nom }}</strong></p>
            <p>{{ $vente->organisation->email_contact }}</p>
            @if($vente->organisation->telephone)
            <p>{{ $vente->organisation->telephone }}</p>
            @endif
        </div>
        <div class="infos-col">
            <h3>Détails</h3>
            <p><strong>Date :</strong> {{ $vente->date_vente->format('d/m/Y') }}</p>
            @if($vente->acheteur)
            <p><strong>Acheteur :</strong> {{ $vente->acheteur }}</p>
            @endif
            @if($vente->champ)
            <p><strong>Exploitation :</strong> {{ $vente->champ->nom }}</p>
            @endif
        </div>
    </div>

    <div class="section">
        <table>
            <thead>
                <tr>
                    <th>Produit</th>
                    <th>Quantité (kg)</th>
                    <th>Prix unitaire (FCFA/kg)</th>
                    <th>Montant total (FCFA)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ $vente->produit }}</td>
                    <td>{{ number_format($vente->quantite_kg, 2, ',', ' ') }}</td>
                    <td>{{ number_format($vente->prix_unitaire_fcfa, 0, ',', ' ') }}</td>
                    <td>{{ number_format($vente->montant_total_fcfa, 0, ',', ' ') }}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="3">TOTAL</td>
                    <td class="total-montant">{{ number_format($vente->montant_total_fcfa, 0, ',', ' ') }} FCFA</td>
                </tr>
            </tbody>
        </table>
    </div>

    @if($vente->notes)
    <div class="section" style="margin-bottom: 16px;">
        <p><strong>Notes :</strong> {{ $vente->notes }}</p>
    </div>
    @endif

    <div class="footer">
        <p>Merci pour votre confiance — Agri-ERP</p>
        <p>Document généré le {{ now()->format('d/m/Y à H:i') }}</p>
    </div>
</body>
</html>

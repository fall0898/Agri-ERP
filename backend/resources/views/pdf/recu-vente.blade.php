<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #111827; background: #fff; }

        /* ── EN-TÊTE ── */
        .header { background: #15803D; color: #fff; padding: 18px 24px; display: table; width: 100%; }
        .header-left  { display: table-cell; vertical-align: middle; }
        .header-right { display: table-cell; text-align: right; vertical-align: middle; }
        .header-app   { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
        .header-sub   { font-size: 10px; opacity: .85; margin-top: 2px; }
        .header-org   { font-size: 14px; font-weight: bold; }
        .header-contact { font-size: 9px; opacity: .85; margin-top: 4px; line-height: 1.6; }

        /* ── NUMÉRO REÇU ── */
        .recu-num { background: #F0FDF4; border: 2px solid #15803D; padding: 10px 24px;
                    display: table; width: 100%; }
        .recu-num-left  { display: table-cell; vertical-align: middle; }
        .recu-num-right { display: table-cell; text-align: right; vertical-align: middle; }
        .recu-num strong { font-size: 15px; color: #15803D; }
        .recu-badge { display: inline-block; background: #15803D; color: #fff;
                      font-size: 9px; padding: 2px 8px; border-radius: 10px; letter-spacing: .5px; }

        /* ── INFOS VENTE ── */
        .infos { display: table; width: 100%; border-bottom: 1px solid #E5E7EB; padding: 14px 24px; }
        .infos-col { display: table-cell; width: 50%; vertical-align: top; }
        .infos-col + .infos-col { padding-left: 24px; border-left: 1px solid #E5E7EB; }
        .infos-col h3 { font-size: 9px; text-transform: uppercase; letter-spacing: .5px;
                        color: #15803D; margin-bottom: 6px; font-weight: bold; }
        .infos-col p  { margin-bottom: 3px; color: #374151; line-height: 1.6; }
        .infos-col p strong { color: #111827; }

        /* ── TABLEAU ── */
        .section { padding: 16px 24px; }
        table { width: 100%; border-collapse: collapse; }
        thead th { background: #15803D; color: #fff; padding: 9px 12px; text-align: left;
                   font-size: 10px; text-transform: uppercase; letter-spacing: .4px; }
        thead th.right { text-align: right; }
        tbody td { padding: 11px 12px; border-bottom: 1px solid #F3F4F6; }
        tbody td.right { text-align: right; font-variant-numeric: tabular-nums; }
        .total-row td { background: #F0FDF4; font-weight: bold; font-size: 12px;
                        border-top: 2px solid #15803D; padding: 12px; }
        .total-montant { color: #15803D; font-size: 15px; text-align: right; }

        /* ── NOTES ── */
        .notes { padding: 0 24px 14px; }
        .notes p { background: #F9FAFB; border-left: 3px solid #BBF7D0;
                   padding: 8px 12px; color: #374151; line-height: 1.6; }

        /* ── FOOTER ── */
        .footer { text-align: center; padding: 14px 24px;
                  border-top: 1px solid #E5E7EB; color: #9CA3AF; font-size: 9px; line-height: 1.8; }
    </style>
</head>
<body>

{{-- EN-TÊTE --}}
<div class="header">
    <div class="header-left">
        <div class="header-app">Agri-ERP</div>
        <div class="header-sub">Plateforme de gestion agricole</div>
    </div>
    <div class="header-right">
        <div class="header-org">{{ $vente->organisation->nom }}</div>
        <div class="header-contact">
            @if($vente->organisation->email_contact)
                {{ $vente->organisation->email_contact }}<br>
            @endif
            @if($vente->organisation->telephone)
                {{ $vente->organisation->telephone }}
            @endif
        </div>
    </div>
</div>

{{-- NUMÉRO REÇU --}}
<div class="recu-num">
    <div class="recu-num-left">
        <strong>REÇU DE VENTE N° VNT-{{ str_pad($vente->id, 5, '0', STR_PAD_LEFT) }}</strong>
    </div>
    <div class="recu-num-right">
        <span class="recu-badge">VENDU</span>
    </div>
</div>

{{-- INFOS --}}
<div class="infos">
    <div class="infos-col">
        <h3>Vendeur</h3>
        <p><strong>{{ $vente->organisation->nom }}</strong></p>
        @if($vente->organisation->email_contact)
            <p>{{ $vente->organisation->email_contact }}</p>
        @endif
        @if($vente->organisation->telephone)
            <p>{{ $vente->organisation->telephone }}</p>
        @endif
    </div>
    <div class="infos-col">
        <h3>Détails de la transaction</h3>
        <p><strong>Date :</strong> {{ $vente->date_vente->format('d/m/Y') }}</p>
        @if($vente->acheteur)
            <p><strong>Acheteur :</strong> {{ $vente->acheteur }}</p>
        @endif
        @if($vente->champ)
            <p><strong>Exploitation :</strong> {{ $vente->champ->nom }}</p>
        @endif
        @if($vente->culture)
            <p><strong>Culture :</strong> {{ $vente->culture->nom }}</p>
        @endif
        @if($vente->user)
            <p><strong>Enregistré par :</strong> {{ $vente->user->nom }}</p>
        @endif
    </div>
</div>

{{-- TABLEAU PRODUIT --}}
<div class="section">
    <table>
        <thead>
            <tr>
                <th>Produit</th>
                <th class="right">Quantité (kg)</th>
                <th class="right">Prix unitaire (FCFA/kg)</th>
                <th class="right">Montant total (FCFA)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $vente->produit }}</td>
                <td class="right">{{ number_format($vente->quantite_kg, 2, ',', ' ') }}</td>
                <td class="right">{{ number_format($vente->prix_unitaire_fcfa, 0, ',', ' ') }}</td>
                <td class="right">{{ number_format($vente->montant_total_fcfa, 0, ',', ' ') }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="3" style="color:#374151;">MONTANT TOTAL</td>
                <td class="total-montant">{{ number_format($vente->montant_total_fcfa, 0, ',', ' ') }} FCFA</td>
            </tr>
        </tbody>
    </table>
</div>

@if($vente->notes)
<div class="notes">
    <p><strong>Notes :</strong> {{ $vente->notes }}</p>
</div>
@endif

<div class="footer">
    <p>Merci pour votre confiance &mdash; {{ $vente->organisation->nom }}</p>
    <p>Document généré le {{ now()->format('d/m/Y à H:i') }} via Agri-ERP</p>
</div>

</body>
</html>

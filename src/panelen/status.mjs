/**
 * Hoe de vier uitkomsten per stelling eruitzien.
 *
 * Twee kanalen, twee betekenissen:
 *   kleur    zijn we het eens (groen) of niet (terra)
 *   vulling  is de meerderheid voor (dicht) of niet (open)
 *
 * Kleur staat er dus nooit alleen voor: er is altijd een legenda, een label in de
 * tooltip en de staafjes van de antwoorden zelf. Dat is nodig omdat groen en terra bij
 * kleurenblindheid dicht bij elkaar liggen.
 */
export const STATUS = {
  'samen-voor': { kleur: 'var(--groen)', dicht: true, sleutel: 'label-samen-voor' },
  'samen-tegen': { kleur: 'var(--groen)', dicht: false, sleutel: 'label-samen-tegen' },
  sloot: { kleur: 'var(--terra)', dicht: true, sleutel: 'label-sloot' },
  verdeeld: { kleur: 'var(--terra)', dicht: false, sleutel: 'label-verdeeld' },
};

/** De legenda als html, met de labels uit `inhoud/02-teksten.md`. */
export function statusLegenda(teksten, extra = '') {
  const items = Object.values(STATUS).map(({ kleur, dicht, sleutel }) =>
    `<span class="sleutel"><i style="background:${dicht ? kleur : 'transparent'};` +
    `box-shadow:inset 0 0 0 2px ${kleur}"></i>${teksten[sleutel]}</span>`).join('');
  return `<div class="legenda">${items}` +
    (extra ? `<span class="sleutel" style="color:var(--flauw)">${extra}</span>` : '') +
    '</div>';
}

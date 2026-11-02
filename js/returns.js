// RETURNS & DELIVERY POLICY page
function renderPolicy() {
  document.getElementById('pol-delivery').textContent = tr(POLICY.deliveryVi, POLICY.deliveryEn);
  document.getElementById('pol-returns').textContent = tr(POLICY.returnsVi, POLICY.returnsEn);
  document.getElementById('ship-table').innerHTML =
    '<thead><tr><th>' + tr('Cách giao', 'Method') + '</th><th>' + tr('Thời gian', 'Time') + '</th><th>' + tr('Phí', 'Fee') + '</th></tr></thead><tbody>' +
    SHIPPING_METHODS.map(m => '<tr><th>' + escHtml(m[state.lang]) + '</th><td>' + escHtml(tr(m.etaVi, m.etaEn)) + '</td><td>' +
      (m.fee === 0 ? t('free') : money(m.fee, tr('[Phí ship]', '[Fee]'))) + '</td></tr>').join('') + '</tbody>';
}
document.addEventListener('langchange', renderPolicy);
renderPolicy();

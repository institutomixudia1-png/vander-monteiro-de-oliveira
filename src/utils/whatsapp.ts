export const openWhatsApp = (phone?: string, companyName?: string) => {
  if (!phone || phone.trim() === '' || phone === '—') {
    alert('Telefone não cadastrado para esta empresa.');
    return;
  }
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 8) {
    alert('Número de telefone inválido para o WhatsApp.');
    return;
  }
  let formattedPhone = cleanPhone;
  // Se for número brasileiro de 10 ou 11 dígitos sem o DDI 55, inclui 55
  if ((formattedPhone.length === 10 || formattedPhone.length === 11) && !formattedPhone.startsWith('55')) {
    formattedPhone = '55' + formattedPhone;
  }

  const text = companyName
    ? encodeURIComponent(`Olá! Contato referente à empresa ${companyName}.`)
    : encodeURIComponent('Olá!');

  const whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${text}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

const siteConfig = window.SITE_CONFIG ?? {};

const isAllowedLink = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;

  try {
    const url = new URL(value);
    return ['https:', 'mailto:', 'tel:'].includes(url.protocol);
  } catch {
    return false;
  }
};

document.querySelectorAll('[data-config-link]').forEach((link) => {
  const key = link.dataset.configLink;
  const value = siteConfig.links?.[key];

  if (!isAllowedLink(value)) return;

  link.href = value;
  link.removeAttribute('aria-disabled');
  link.removeAttribute('tabindex');
  link.querySelector('.action-detail').textContent = 'Abrir link';

  if (value.startsWith('https://')) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
});

const tabs = [...document.querySelectorAll('[role="tab"]')];

const selectTab = (selectedTab) => {
  tabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    tab.setAttribute('aria-selected', String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    document.getElementById(tab.dataset.tab).hidden = !isSelected;
  });
};

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex;

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    tabs[nextIndex].focus();
    selectTab(tabs[nextIndex]);
  });
});

const favoriteButton = document.getElementById('favorite-button');

if (favoriteButton) {
  const favoriteKey = 'floresca-reflection-saved';
  const updateFavorite = (isSaved) => {
    favoriteButton.setAttribute('aria-pressed', String(isSaved));
    favoriteButton.textContent = isSaved ? 'Reflexão salva' : 'Salvar reflexão';
  };

  updateFavorite(localStorage.getItem(favoriteKey) === 'true');
  favoriteButton.addEventListener('click', () => {
    const isSaved = favoriteButton.getAttribute('aria-pressed') !== 'true';
    localStorage.setItem(favoriteKey, String(isSaved));
    updateFavorite(isSaved);
  });
}

const verseButton = document.getElementById('next-verse');
const verseText = document.getElementById('verse-text');
const verseReference = document.getElementById('verse-reference');
const verses = [
  { text: 'A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.', reference: '2 Coríntios 12:9' },
  { text: 'Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.', reference: 'Salmo 37:5' },
  { text: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.', reference: 'Isaías 41:10' }
];
let verseIndex = 0;

verseButton?.addEventListener('click', () => {
  verseIndex = (verseIndex + 1) % verses.length;
  verseText.textContent = `“${verses[verseIndex].text}”`;
  verseReference.textContent = verses[verseIndex].reference;
});

const prayerForm = document.getElementById('prayer-form');
const prayerSubmit = document.getElementById('prayer-submit');
const prayerStatus = document.getElementById('prayer-status');
const supabase = siteConfig.supabase ?? {};
const databaseIsConfigured = isAllowedLink(supabase.url) && Boolean(supabase.anonKey);

if (databaseIsConfigured) {
  prayerSubmit.disabled = false;
  prayerStatus.textContent = 'Seu pedido será enviado de forma privada.';
}

prayerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!databaseIsConfigured) return;

  const request = document.getElementById('prayer-message').value.trim();
  const consent = document.getElementById('prayer-consent').checked;

  if (!request || !consent) return;

  prayerSubmit.disabled = true;
  prayerStatus.textContent = 'Enviando seu pedido...';

  try {
    const response = await fetch(`${supabase.url.replace(/\/$/, '')}/rest/v1/prayer_requests`, {
      method: 'POST',
      headers: {
        apikey: supabase.anonKey,
        Authorization: `Bearer ${supabase.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ request, consent })
    });

    if (!response.ok) throw new Error('Não foi possível enviar o pedido.');

    prayerForm.reset();
    prayerStatus.textContent = 'Pedido enviado. Que você se sinta acolhida.';
  } catch {
    prayerStatus.textContent = 'Não foi possível enviar agora. Tente novamente mais tarde.';
  } finally {
    prayerSubmit.disabled = false;
  }
});

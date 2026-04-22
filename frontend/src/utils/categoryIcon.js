const iconKeyToEmoji = {
  fastfood: '🍔',
  car: '🚗',
  shopping: '🛒',
  movie: '🎬',
  document: '📄',
  hospital: '🏥',
  book: '📚',
  store: '🏬',
  flight: '✈️',
  money: '💰',
  pin: '📌',
  home: '🏠',
  cafe: '☕',
  pizza: '🍕',
  game: '🎮',
  lightbulb: '💡',
  phone: '📱',
  clothes: '👕',
  music: '🎵',
  run: '🏃',
  work: '💼',
  school: '🎓',
  ambulance: '🚚',
  tools: '🛠️',
  handyman: '🔧',
  inventory: '📦',
  gift: '🎁',
  card: '💳',
  bank: '🏦'
};

const categoryNameToEmoji = {
  salary: '💼',
  income: '💰',
  freelance: '💻',
  business: '🏢',
  investment: '📈',
  rent: '🏠',
  grocery: '🛒',
  food: '🍔',
  travel: '✈️',
  transport: '🚗',
  entertainment: '🎬',
  health: '🏥',
  medical: '🏥',
  education: '📚',
  shopping: '🛍️',
  bill: '📄',
  utility: '💡',
  gift: '🎁',
  home: '🏠',
  other: '📌'
};

export const getIconFromCategoryName = (name = '') => {
  const normalizedName = String(name).toLowerCase();
  const match = Object.keys(categoryNameToEmoji).find((key) => normalizedName.includes(key));
  return match ? categoryNameToEmoji[match] : '📌';
};

export const normalizeCategoryIcon = (icon, categoryName = '') => {
  const normalizedIcon = String(icon || '').trim();

  // Some records contain broken icon values like "??" from encoding/data issues.
  if (!normalizedIcon || normalizedIcon.includes('?')) {
    return getIconFromCategoryName(categoryName);
  }

  return iconKeyToEmoji[normalizedIcon] || normalizedIcon;
};

export const resolveExpenseCategoryIcon = (expense) => {
  const rawIcon = expense?.category_icon || expense?.icon || expense?.category_icons?.split(', ')[0] || '';
  return normalizeCategoryIcon(rawIcon, expense?.category_name || '');
};

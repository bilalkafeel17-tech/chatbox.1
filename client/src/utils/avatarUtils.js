export const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=131E30',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Aria&backgroundColor=131E30',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow&backgroundColor=131E30',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nova&backgroundColor=131E30',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Atlas&backgroundColor=131E30',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Vortex&backgroundColor=131E30',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Titan&backgroundColor=131E30',
  'https://api.dicebear.com/7.x/shapes/svg?seed=Orion&backgroundColor=131E30'
];

export const getDefaultAvatar = (username) => {
  const seed = encodeURIComponent(username || 'User');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=131E30&textColor=F1F5F9`;
};


// File: /styles/profileStyles.ts

import buttonStyles from '../components/buttons.module.css'; // 💡 ez az új sor

export const profileStyles: Record<string, React.CSSProperties & Record<string, string>> = {
  Reflecta: {
    '--bg-color': '#ffffff',
    '--user-color': '#7D9EDF',
    '--ai-color': '#A9BEE9',
  },
  Akasza: {
    '--bg-color': '#ffffff',
    '--user-color': '#E75735',
    '--ai-color': '#FAD6CE',
  },
  Éana: {
    '--bg-color': '#ffffff',
    '--user-color': '#F08230',
    '--ai-color': '#FAD7BC',
  },
  Luma: {
    '--bg-color': '#ffffff',
    '--user-color': '#EFC177',
    '--ai-color': '#F7E2A7',
  },
  luma: {
    '--bg-color': '#ffffff',
    '--user-color': '#EFC177',
    '--ai-color': '#F7E2A7',
  },
  Sylva: {
    '--bg-color': '#ffffff',
    '--user-color': '#84BD78',
    '--ai-color': '#BFDDB9',
  },
  Zentó: {
    '--bg-color': '#ffffff',
    '--user-color': '#63B5D2',
    '--ai-color': '#B4DCEA',
  },
  Kairos: {
    '--bg-color': '#ffffff',
    '--user-color': '#7E80AE',
    '--ai-color': '#BFC0D7',
  },
  Noe: {
    '--bg-color': '#ffffff',
    '--user-color': '#9A5C9A',
    '--ai-color': '#C9A3C9',
  },
  Solun: {
    '--bg-color': '#ffffff',
    '--user-color': '#424E76',
    '--ai-color': '#BFC6DB',
  },
  Oneiros: {
    '--bg-color': '#ffffff',
    '--user-color': '#4D73BF',
    '--ai-color': '#BECCE8',
  },
  oneiros: {
    '--bg-color': '#ffffff',
    '--user-color': '#4D73BF',
    '--ai-color': '#BECCE8',
  },
  Preceptor: {
    '--bg-color': '#ffffff',
    '--user-color': '#234F8C',
    '--ai-color': '#CADBF2',
  },
};

// 💡 CSS modul exportálva, hogy máshonnan is elérhető legyen
export { buttonStyles };

// CONFIGURAÇÃO E DADOS ESTÁTICOS

export const CONFIG = {
  fdtRate: 100, // $1 = 100 FDT
  gameCost: 50, // Custo em FDT para jogar
  dailyFreeCredits: 200, // Créditos diários
  minTransaction: 10, // Valor mínimo em Dólares
};

// PLANO DE REDE (CONSTANTES)
export const NETWORK_PLAN = [
  { level: 1, percent: 5.0 },
  { level: 2, percent: 2.0 },
  { level: 3, percent: 1.0 },
  { level: 4, percent: 1.0 },
  { level: 5, percent: 0.5 },
  { level: 6, percent: 0.5 },
  { level: 7, percent: 0.5 },
  { level: 8, percent: 0.5 },
  { level: 9, percent: 0.5 },
  { level: 10, percent: 0.5 },
];

export const PLANS = [
  { 
    id: 'quantum_pulse', 
    name: 'Quantum Pulse AI', 
    flag: '🇺🇸', 
    profile: 'Estratégia Dinâmica',
    note: '📉 3% de taxa performance',
    min: 10,
    max: 1000, 
    roiTotal: 50, 
    duration: 30, 
    color: 'border-green-500',
    highlight: true
  },
  { 
    id: 'alpha_trend', 
    name: 'Alpha Trend Pro', 
    flag: '🇺🇸',
    profile: 'Estratégia Arrojada',
    desc: '150% Lucro, Capital + Lucro Disponível.',
    note: '📉 3% de taxa performance',
    min: 10,
    max: 5000, 
    roiTotal: 150, 
    duration: 60, 
    color: 'border-purple-500'
  },
  { 
    id: 'binary_storm', 
    name: 'Binary Storm X', 
    flag: '🇺🇸',
    profile: 'Estratégia Moderada',
    note: '📉 3% de taxa performance',
    min: 10,
    max: 10000, 
    roiTotal: 300, 
    duration: 90, 
    color: 'border-yellow-400'
  }
];

// CONFIGURAÇÃO E DADOS ESTÁTICOS

export const CONFIG = {
  vdtRate: 100, // $1 = 100 VDT
  gameCost: 50, // Custo em VDT para jogar
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
    desc: '�40% em 30 dias🗓️\n💸30% do lucro gerado pela IA encima do capital é distribuido para o investidor.\n💸10% do lucro gerado pela IA encima do capital é distribuido para o sistema.\n✔️Lucro e capital Disponível',
    roiBot: 10, // 10%
    roiUser: 30, // 30%
    min: 10,
    max: 1000, 
    roiTotal: 40, 
    duration: 30, 
    color: 'border-green-500',
    highlight: true
  },
  { 
    id: 'alpha_trend', 
    name: 'Alpha Trend Pro', 
    flag: '🇺🇸', 
    profile: 'Estratégia Arrojada',
    desc: '💰120% em 60 dias🗓️\n💸100% do lucro gerado pela IA encima do capital é distribuido para o investidor.\n💸20% do lucro gerado pela IA encima do capital é distribuido para o sistema.\n✔️Lucro e capital Disponível',
    roiBot: 20, // 20%
    roiUser: 100, // 100%
    min: 10,
    max: 5000, 
    roiTotal: 120, 
    duration: 60, 
    color: 'border-purple-500'
  },
  { 
    id: 'binary_storm', 
    name: 'Binary Storm X', 
    flag: '🇺🇸',
    profile: 'Estratégia Moderada',
    desc: '�210% em 90 dias🗓️\n💸180% do lucro gerado pela IA encima do capital é distribuido para o investidor.\n💸30% do lucro gerado pela IA encima do capital é distribuido para o sistema.\n✔️Lucro e capital Disponível',
    roiBot: 30, // 30%
    roiUser: 180, // 180%
    min: 10,
    max: 10000, 
    roiTotal: 210, 
    duration: 90, 
    color: 'border-yellow-400'
  }
];

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
    id: 'fulldex', 
    name: 'Bot Fulldextrading', 
    flag: '🇺🇸',
    profile: 'Exclusivo da Empresa',
    desc: 'Lucro e Capital Disponível. Zero taxa no 1º uso.',
    note: '⚠️ 1º Investimento: Taxa Zero. Depois: 5% Perf + 3% Saque',
    min: 50, 
    roiTotal: 49, 
    duration: 15, 
    color: 'border-green-500',
    highlight: true
  },
  { 
    id: 'aion', 
    name: 'Bot Aion Quantum', 
    flag: '🇺🇸', 
    profile: 'Estratégia Dinâmica',
    desc: 'Foco em curto prazo c/ gestão ativa de risco.',
    note: '📉 3% de taxa performance',
    min: 100, 
    roiTotal: 109, 
    duration: 30, 
    color: 'border-cyan-400'
  },
  { 
    id: 'neutrion', 
    name: 'Bot Neutrion-X', 
    flag: '🇺🇸',
    profile: 'Estratégia Arrojada',
    desc: 'Modelo quantitativo c/ maior exposição.',
    note: '📉 3% de taxa performance',
    min: 300, 
    roiTotal: 249, 
    duration: 60, 
    color: 'border-purple-500'
  },
  { 
    id: 'zenthra', 
    name: 'Bot Zenthra QI', 
    flag: '🇺🇸',
    profile: 'Estratégia Moderada',
    desc: 'Foco em consistência e controle de volatilidade.',
    note: '📉 3% de taxa performance',
    min: 500, 
    roiTotal: 389, 
    duration: 90, 
    color: 'border-yellow-400'
  }
];

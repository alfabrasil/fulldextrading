import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, 
  Gamepad2, 
  Settings, 
  TrendingUp, 
  User, 
  Bell, 
  ArrowRightLeft, 
  ShieldCheck, 
  LogOut, 
  Zap, 
  ChevronRight, 
  Menu as MenuIcon, 
  Users, 
  FileText, 
  Activity, 
  Lock, 
  Camera, 
  Save, 
  CreditCard, 
  Plus, 
  Minus,
  Cpu,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

// Importações Refatoradas
import { CONFIG, NETWORK_PLAN, PLANS } from './data/config';
import { TRANSLATIONS } from './data/translations';
import { GameView } from './components/GameView';
import { PlansView } from './components/PlansView';
import { WalletView } from './components/WalletView';
import { TradingTerminal } from './components/TradingTerminal';
import { LandingPage } from './components/LandingPage';
import { AuthView } from './components/AuthView';

// Estado padrão de segurança para evitar crashes com dados antigos/incompletos
const SAFE_USER_DEFAULTS = {
    balances: { usdt: 0, usdc: 0, vdt: 0 },
    activePlan: null,
    activePlans: [],
    botMode: 'trade',
    history: [],
    notifications: [],
    wallets: {},
    gameCredits: { daily: 3 },
    quantumStats: { highScore: 0, totalSparks: 0 }
};

/**
 * COMPONENTE DASHBOARD (ANTIGO APP)
 * Agora recebe o usuário autenticado e a função de logout
 */
function Dashboard({ currentUser, onLogout }) {
  // --- ESTADO GERAL ---
  const [view, setView] = useState('home'); 
  const [lang, setLang] = useState(currentUser.lang || 'pt');
  const [loading, setLoading] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [toast, setToast] = useState(null);
  const [reportsTab, setReportsTab] = useState('all');
  const botModeRef = useRef('trade');
  const fastForwardClickRef = useRef(0);

  // --- DADOS DO USUÁRIO (Persistidos) ---
  // Merge inicial com defaults para garantir que campos como notifications existam
  const [user, setUser] = useState(() => {
     // Inicializa com segurança, garantindo que balances.vdt seja um número
     const initialUser = { ...SAFE_USER_DEFAULTS, ...currentUser };
     if (typeof initialUser.balances.vdt !== 'number' || isNaN(initialUser.balances.vdt)) {
         initialUser.balances.vdt = initialUser.balances.fdt || 0; // Tenta migrar FDT antigo ou zera
     }
     if (!Array.isArray(initialUser.activePlans)) initialUser.activePlans = [];
     if (initialUser.activePlan && initialUser.activePlans.length === 0) {
       initialUser.activePlans = [{
         id: `legacy_${initialUser.activePlan.startAt || Date.now()}`,
         planId: initialUser.activePlan.planId,
         amount: initialUser.activePlan.amount,
         startAt: initialUser.activePlan.startAt || Date.now(),
         accumulated: initialUser.activePlan.accumulated || 0,
         dailyState: initialUser.activePlan.dailyState || null,
         businessDaysCompleted: 0,
         lastPayoutDayCount: 0,
         lockedProfit: 0,
         withdrawableProfit: 0
       }];
     }
     initialUser.activePlan = null;
     return initialUser;
  });

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (view === 'reports') setReportsTab('all');
  }, [view]);

  useEffect(() => {
    botModeRef.current = user.botMode || 'trade';
  }, [user.botMode]);

  // --- EFEITOS DE LOOP ---
  // Atualiza user no Dashboard -> Atualiza no App pai -> Persiste
  useEffect(() => {
     // Sincroniza estado local com props se mudar (opcional, mas bom pra garantir)
     // Na prática, vamos gerenciar o user aqui e salvar no localStorage diretamente ou via callback
     // Para simplificar MVP: Dashboard gerencia seu user e salva no localStorage global 'vdex_users' ou sessão atual.
     
     // ATENÇÃO: O App pai gerencia a sessão. Mas as alterações de saldo ocorrem aqui.
     // Vamos salvar as alterações do usuário específico no localStorage
     
     const saveUser = () => {
         const storedUsers = JSON.parse(localStorage.getItem('vdex_users') || '[]');
         const updatedUsers = storedUsers.map(u => u.email === user.email ? user : u);
         localStorage.setItem('vdex_users', JSON.stringify(updatedUsers));
         
         // Também atualiza a sessão atual se necessário
         localStorage.setItem('vdex_current_session', JSON.stringify(user));
     };
     
     saveUser();
  }, [user]);

  // Main Background Ticker (Financial Logic) - NETWORK ONLY (disabled)
  useEffect(() => {
    return; 
  }, [user.activePlans?.length]);

  // --- FUNÇÕES AUXILIARES ---

  const makeId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  const triggerNotification = (title, msg, type = 'info') => {
    const newNotif = { id: makeId(), title, msg, read: false, time: new Date().toLocaleTimeString(), type };
    setUser(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications]
    }));
    setToast({ title, msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatVDT = (val) => {
    const num = Number(val);
    if (isNaN(num)) return '0 VDT';
    return `${Math.floor(num).toLocaleString()} VDT`;
  };

  const getDayKey = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isBusinessDay = (d) => {
    const day = d.getDay();
    return day >= 1 && day <= 5;
  };

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const randN = () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const generateDailyPnls = (target, minutes) => {
    const mean = target / minutes;
    const std = Math.abs(mean) * 2.2;
    const minPnl = -Math.abs(mean) * 6;
    const maxPnl = Math.abs(mean) * 10;

    for (let attempt = 0; attempt < 30; attempt++) {
      let values = Array.from({ length: minutes }, () => {
        const v = mean + randN() * std;
        return Math.max(minPnl, Math.min(maxPnl, v));
      });

      let sum = values.reduce((a, b) => a + b, 0);
      const diff = target - sum;
      const adj = diff / minutes;
      values = values.map(v => v + adj);
      sum = values.reduce((a, b) => a + b, 0);
      values[values.length - 1] += (target - sum);

      const negs = values.filter(v => v < 0).length;
      if (negs >= Math.floor(minutes * 0.18) && Number.isFinite(values[0])) return values;
    }

    const values = Array.from({ length: minutes }, () => mean);
    values[values.length - 1] += (target - values.reduce((a, b) => a + b, 0));
    return values;
  };

  const generateCyclePnls = (target, cycles) => {
    const mean = target / cycles;
    const std = Math.abs(mean) * 2.6;
    const minPnl = -Math.abs(mean) * 4.5;
    const maxPnl = Math.abs(mean) * 7.5;

    for (let attempt = 0; attempt < 30; attempt++) {
      let values = Array.from({ length: cycles }, () => {
        const v = mean + randN() * std;
        return Math.max(minPnl, Math.min(maxPnl, v));
      });

      let sum = values.reduce((a, b) => a + b, 0);
      const diff = target - sum;
      const adj = diff / cycles;
      values = values.map(v => v + adj);
      sum = values.reduce((a, b) => a + b, 0);
      values[values.length - 1] += (target - sum);

      const negs = values.filter(v => v < 0).length;
      if (negs >= Math.max(1, Math.floor(cycles * 0.2)) && Number.isFinite(values[0])) return values;
    }

    const values = Array.from({ length: cycles }, () => mean);
    values[values.length - 1] += (target - values.reduce((a, b) => a + b, 0));
    return values;
  };

  const buildDailyCycleSequence = ({ dailyTargetPct, dailyTargetProfit, principal }) => {
    const roundsPlanned = randomInt(3, 4);
    const roundPcts = roundsPlanned === 4
      ? [1, 1, 1, Math.max(0.01, dailyTargetPct - 3)]
      : [1, 1, Math.max(0.01, dailyTargetPct - 2)];

    const seq = [];
    for (let roundIndex = 0; roundIndex < roundPcts.length; roundIndex++) {
      const isLastRound = roundIndex === roundPcts.length - 1;
      const isSmallLastRound = isLastRound && roundPcts[roundIndex] < 1;
      const cyclesInRound = isSmallLastRound ? randomInt(2, 3) : randomInt(4, 6);
      const roundProfit = principal * (roundPcts[roundIndex] / 100);
      const pnls = generateCyclePnls(roundProfit, cyclesInRound);
      for (let i = 0; i < pnls.length; i++) {
        seq.push({ mode: 'trade', targetProfit: pnls[i], roundIndex });
      }
      if (roundIndex < roundPcts.length - 1) {
        const pauseCycles = randomInt(1, 3);
        for (let j = 0; j < pauseCycles; j++) {
          seq.push({ mode: 'analysis', targetProfit: 0, roundIndex });
        }
      }
    }

    const sum = seq.reduce((acc, item) => acc + (item.mode === 'trade' ? item.targetProfit : 0), 0);
    const diff = dailyTargetProfit - sum;
    for (let i = seq.length - 1; i >= 0; i--) {
      if (seq[i].mode === 'trade') {
        seq[i] = { ...seq[i], targetProfit: seq[i].targetProfit + diff };
        break;
      }
    }

    return { roundsPlanned, sequence: seq };
  };

  const [simOffsetDays, setSimOffsetDays] = useState(0);
  const [fastForwardNonce, setFastForwardNonce] = useState(0);

  const getNow = () => new Date(Date.now() + simOffsetDays * 86400000);

  const [dayTick, setDayTick] = useState(() => Date.now());

  useEffect(() => {
    if (!user.activePlans?.length) return;
    const interval = setInterval(() => setDayTick(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, [user.activePlans?.length, simOffsetDays]);

  useEffect(() => {
    if (!user.activePlans?.length) return;

    const now = getNow();
    const dayKey = getDayKey(now);
    const biz = isBusinessDay(now);

    setUser(prev => {
      const nextActivePlans = (prev.activePlans || []).map(contract => {
        const planMeta = PLANS.find(p => p.id === contract.planId);
        if (!planMeta) return contract;

        const current = contract.dailyState;
        if (!biz) {
          if (current?.dayKey === dayKey && current?.status === 'weekend') return contract;
          return {
            ...contract,
            dailyState: {
              dayKey,
              status: 'weekend',
              cycleSeconds: 600
            }
          };
        }

        if (current?.dayKey === dayKey && (current.status === 'running' || current.status === 'done')) {
          return contract;
        }

        const dailyTargetPct = planMeta.roiTotal / planMeta.duration;
        const principal = Number(contract.amount) || 0;
        const dailyTargetProfit = principal * (dailyTargetPct / 100);
        const { roundsPlanned, sequence } = buildDailyCycleSequence({ dailyTargetPct, dailyTargetProfit, principal });

        return {
          ...contract,
          dailyState: {
            dayKey,
            status: 'running',
            cycleSeconds: 600,
            dailyTargetPct,
            dailyTargetProfit,
            roundsPlanned,
            cycleIndex: 0,
            profitToday: 0,
            sequence
          }
        };
      });

      return { ...prev, activePlans: nextActivePlans };
    });
  }, [user.activePlans?.length, dayTick, simOffsetDays]);

  const handleHftSync = (profit, opsCount, breakdown = []) => {
     if (profit === 0 && opsCount === 0 && (!Array.isArray(breakdown) || breakdown.length === 0)) return;

     const now = getNow();
     const timeString = now.toLocaleTimeString();

     let completedDailyTargets = 0;
     const totalFromBreakdown = Array.isArray(breakdown) && breakdown.length
       ? breakdown.reduce((acc, b) => acc + (Number(b.profit) || 0), 0)
       : Number(profit) || 0;

     setUser(prev => {
         // Evitar duplicidade de registros no mesmo segundo (React StrictMode ou Timer Glitch)
         const lastEntry = prev.history[0];
         if (lastEntry && 
             lastEntry.type === 'hft_profit' && 
             lastEntry.date === timeString &&
             lastEntry.amount === totalFromBreakdown.toFixed(4)) {
             return prev;
         }

         const byContract = new Map();
         if (Array.isArray(breakdown) && breakdown.length) {
           breakdown.forEach(b => byContract.set(b.contractId, Number(b.profit) || 0));
         }

         const nextActivePlans = (prev.activePlans || []).map(contract => {
           const ds = contract.dailyState;
           if (!ds || ds.status !== 'running' || ds.dayKey !== getDayKey(now)) return contract;

           const currentItem = ds.sequence?.[ds.cycleIndex];
           if (!currentItem) return { ...contract, dailyState: { ...ds, status: 'done' } };

           const appliedProfit = byContract.has(contract.id) ? byContract.get(contract.id) : 0;
           const nextIndex = (ds.cycleIndex || 0) + 1;
           const nextProfitToday = (ds.profitToday || 0) + appliedProfit;
           const reachedEnd = nextIndex >= (ds.sequence?.length || 0);

           if (reachedEnd) {
             completedDailyTargets += 1;
             const nextBusinessDaysCompleted = (contract.businessDaysCompleted || 0) + 1;
             const planMeta = PLANS.find(p => p.id === contract.planId);
             const withdrawEvery = planMeta?.withdrawEveryDays || 1;
             const lockedProfit = (contract.lockedProfit || 0) + ds.dailyTargetProfit;
             let withdrawableProfit = contract.withdrawableProfit || 0;
             let lastPayoutDayCount = contract.lastPayoutDayCount || 0;
             let nextLocked = lockedProfit;

             if ((nextBusinessDaysCompleted - lastPayoutDayCount) >= withdrawEvery) {
               withdrawableProfit += nextLocked;
               nextLocked = 0;
               lastPayoutDayCount = nextBusinessDaysCompleted;
             }

             const diffToTarget = ds.dailyTargetProfit - nextProfitToday;
             return {
               ...contract,
               accumulated: (contract.accumulated || 0) + appliedProfit + diffToTarget,
               businessDaysCompleted: nextBusinessDaysCompleted,
               lastPayoutDayCount,
               lockedProfit: nextLocked,
               withdrawableProfit,
               dailyState: {
                 ...ds,
                 status: 'done',
                 cycleIndex: nextIndex,
                 profitToday: ds.dailyTargetProfit
               }
             };
           }

           return {
             ...contract,
             accumulated: (contract.accumulated || 0) + appliedProfit,
             dailyState: {
               ...ds,
               cycleIndex: nextIndex,
               profitToday: nextProfitToday,
               status: 'running'
             }
           };
         });

        if (totalFromBreakdown === 0 && opsCount === 0) {
          const nextMode = 'analysis';
          const shouldLogPause = prev.botMode !== nextMode;
          return {
            ...prev,
            botMode: nextMode,
            activePlans: nextActivePlans,
            history: shouldLogPause
              ? [
                  {
                    id: makeId(),
                    type: 'bot_pause',
                    amount: '0.0000',
                    date: timeString,
                    desc: 'Analisando próxima entrada (10min)'
                  },
                  ...prev.history
                ]
              : prev.history
          };
        }

        const nextMode = 'trade';
        const shouldLogResume = prev.botMode !== nextMode;

        return {
            ...prev,
            botMode: nextMode,
            activePlans: nextActivePlans,
            history: [
                ...(shouldLogResume ? [{
                    id: makeId(),
                    type: 'bot_resume',
                    amount: '0.0000',
                    date: timeString,
                    desc: 'Retomando operações'
                }] : []),
                { 
                    id: makeId(),
                    type: 'hft_profit', 
                    amount: totalFromBreakdown.toFixed(4), 
                    date: timeString, 
                    desc: `Ciclo 10min (${opsCount} ops)` 
                }, 
                ...prev.history
            ]
         };
     });

     if (totalFromBreakdown === 0 && opsCount === 0) {
       if (botModeRef.current !== 'analysis') {
         triggerNotification('BOT', 'Analisando a melhor entrada (10min).', 'info');
       }
       return;
     }

     if (botModeRef.current === 'analysis') {
       triggerNotification('BOT', 'Retomando operações.', 'info');
     }

     const sign = totalFromBreakdown >= 0 ? '+' : '';
     triggerNotification(
         'HFT Report', 
         `Ciclo finalizado: ${opsCount} operações. Lucro: ${sign}$${totalFromBreakdown.toFixed(4)}`,
         totalFromBreakdown >= 0 ? 'success' : 'error'
     );

     if (completedDailyTargets > 0) {
       triggerNotification(
         'Meta Diária',
         `Meta diária atingida. Robô pausado até o próximo dia útil.`,
         'success'
       );
     }
  };

  // --- AÇÕES DO USUÁRIO ---

  const handleActivatePlan = (plan, customAmount) => {
    const amount = customAmount || plan.min;
    
    if (user.balances.usdt < amount) {
      triggerNotification('Erro', 'Saldo USDT insuficiente.', 'error');
      return;
    }

    const contractId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setUser(prev => ({
        ...prev,
        balances: { ...prev.balances, usdt: prev.balances.usdt - amount },
        activePlans: [
          {
            id: contractId,
            planId: plan.id,
            amount: amount,
            startAt: Date.now(),
            accumulated: 0,
            dailyState: null,
            businessDaysCompleted: 0,
            lastPayoutDayCount: 0,
            lockedProfit: 0,
            withdrawableProfit: 0
          },
          ...(prev.activePlans || [])
        ],
        history: [{ type: 'plan_activation', amount: amount, date: new Date().toLocaleTimeString(), desc: plan.name }, ...prev.history]
    }));
    triggerNotification('Sucesso', `${plan.name} ativado com $${amount}!`, 'success');
    setView('home');
  };

  const handleGamePlay = () => {
    if (user.balances.vdt < CONFIG.gameCost) {
      triggerNotification('Game', 'VDT Insuficiente.', 'error');
      return;
    }

    const win = Math.random() > 0.5;
    const reward = win ? CONFIG.gameCost * 2 : 0;

    setUser(prev => ({
      ...prev,
      balances: { ...prev.balances, vdt: prev.balances.vdt - CONFIG.gameCost + reward }
    }));

    if (win) triggerNotification('Game', `${t.win} ${CONFIG.gameCost * 2} VDT!`, 'success');
    else triggerNotification('Game', t.lose, 'error');
  };

  const handleVaultResult = (win, amount) => {
    setUser(prev => {
      let newBalance = prev.balances.vdt;
      let historyItem = null;

      if (win) {
         newBalance += amount;
         historyItem = { 
             type: 'game_win', 
             amount: amount, 
             date: new Date().toLocaleTimeString(), 
             desc: 'Vault Hacker Win' 
         };
      } else {
         newBalance -= amount;
         historyItem = { 
             type: 'game_loss', 
             amount: amount, 
             date: new Date().toLocaleTimeString(), 
             desc: 'Vault Hacker Loss' 
         };
      }

      return {
        ...prev,
        balances: { ...prev.balances, vdt: newBalance },
        history: [historyItem, ...prev.history]
      };
    });

    if (win) triggerNotification('Vault Hacker', `SYSTEM HACKED! +${amount} VDT`, 'success');
    else triggerNotification('Vault Hacker', `ACCESS DENIED! -${amount} VDT`, 'error');
  };

  const handleQuantumGameOver = (score, sparks) => {
    setUser(prev => {
      const newHighScore = Math.max(prev.quantumStats?.highScore || 0, score);
      const newTotalSparks = (prev.quantumStats?.totalSparks || 0) + sparks;
      const newCredits = Math.max(0, (prev.gameCredits?.daily || 0) - 1);

      return {
        ...prev,
        gameCredits: { ...prev.gameCredits, daily: newCredits },
        quantumStats: { highScore: newHighScore, totalSparks: newTotalSparks }
      };
    });
    
    if (sparks > 0) triggerNotification('Quantum Dash', `Coletou ${sparks} Sparks!`, 'success');
  };

  const handleBuyCredits = () => {
    const COST = 50; // 50 VDT por recarga
    if (user.balances.vdt < COST) {
       triggerNotification('Loja', 'Saldo VDT insuficiente (Req: 50 VDT)', 'error');
       return;
    }
    
    setUser(prev => ({
       ...prev,
       balances: { ...prev.balances, vdt: prev.balances.vdt - COST },
       gameCredits: { ...prev.gameCredits, daily: 3 } // Recarga full
    }));
    triggerNotification('Loja', 'Energia recarregada com sucesso!', 'success');
  };

  const handleSaveSettings = (formData) => {
    setUser(prev => ({
      ...prev,
      financialPassword: formData.financialPassword || prev.financialPassword,
      wallets: { ...prev.wallets, ...formData.wallets },
      photoUrl: formData.photoUrl || prev.photoUrl
    }));
    triggerNotification('Configurações', 'Dados atualizados com sucesso!', 'success');
  };

  // --- FUNÇÕES DA CARTEIRA ---
  const handleDepositAction = (asset, network, amount) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount < CONFIG.minTransaction) {
      triggerNotification('Erro', `Depósito mínimo de $${CONFIG.minTransaction}`, 'error');
      return;
    }
    
    // Simula depósito
    setUser(prev => ({
      ...prev,
      balances: { ...prev.balances, [asset]: prev.balances[asset] + numAmount },
      history: [{ type: 'deposit', amount: numAmount, date: new Date().toLocaleTimeString(), desc: `${asset.toUpperCase()} (${network})` }, ...prev.history]
    }));
    triggerNotification('Sucesso', `Depósito de ${numAmount} ${asset.toUpperCase()} recebido!`, 'success');
  };

  const handleWithdrawAction = (asset, amount) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount < CONFIG.minTransaction) {
      triggerNotification('Erro', `Saque mínimo de $${CONFIG.minTransaction}`, 'error');
      return;
    }
    if (numAmount > 10000) {
      triggerNotification('Erro', `Saque máximo diário é de $10000`, 'error');
      return;
    }
    if (user.balances[asset] < numAmount) {
      triggerNotification('Erro', `Saldo insuficiente.`, 'error');
      return;
    }

    setUser(prev => ({
      ...prev,
      balances: { ...prev.balances, [asset]: prev.balances[asset] - numAmount },
      history: [{ type: 'withdraw', amount: numAmount, date: new Date().toLocaleTimeString(), desc: `${asset.toUpperCase()} Pending` }, ...prev.history]
    }));
    triggerNotification('Sucesso', 'Solicitação de saque enviada!', 'success');
  };

  const handleSwapAction = (amount, direction = 'vdtToUsd') => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;
    
    const rate = CONFIG.vdtRate;

    if (direction === 'vdtToUsd') {
      if (user.balances.vdt < numAmount) {
        triggerNotification('Erro', 'Saldo VDT insuficiente.', 'error');
        return;
      }

      const usdAmount = numAmount / rate;

      setUser(prev => ({
        ...prev,
        balances: { 
          ...prev.balances, 
          vdt: prev.balances.vdt - numAmount,
          usdt: prev.balances.usdt + usdAmount
        },
        history: [{ type: 'swap', amount: usdAmount, date: new Date().toLocaleTimeString(), desc: `${numAmount} VDT -> USD` }, ...prev.history]
      }));
      triggerNotification('Sucesso', `Troca realizada: +$${usdAmount.toFixed(2)}`, 'success');
      return;
    }

    if (user.balances.usdt < numAmount) {
      triggerNotification('Erro', 'Saldo USDT insuficiente.', 'error');
      return;
    }

    const vdtAmount = numAmount * rate;

    setUser(prev => ({
      ...prev,
      balances: { 
        ...prev.balances, 
        usdt: prev.balances.usdt - numAmount,
        vdt: prev.balances.vdt + vdtAmount
      },
      history: [{ type: 'swap', amount: vdtAmount, date: new Date().toLocaleTimeString(), desc: `$${numAmount.toFixed(2)} USD -> ${vdtAmount} VDT` }, ...prev.history]
    }));
    triggerNotification('Sucesso', `Troca realizada: +${vdtAmount} VDT`, 'success');
  };


  // --- SUB-COMPONENTES (Renderização) ---

  const Header = () => (
    <div className="flex justify-between items-center p-4 bg-gray-950/40 backdrop-blur-md border-b border-gray-800/50 shrink-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-green-400 flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.5)] overflow-hidden">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={16} className="text-white" />
          )}
        </div>
        <div>
          <p className="text-xs text-gray-400">{t.welcome}</p>
          <p className="text-sm font-bold text-white">{user.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => {
           const next = lang === 'pt' ? 'en' : lang === 'en' ? 'es' : 'pt';
           setLang(next);
        }} className="text-xs text-gray-400 border border-gray-700 px-2 py-1 rounded hover:bg-gray-800 transition">
          {lang.toUpperCase()}
        </button>
        <div className="relative" onClick={() => setShowNotif(!showNotif)}>
          <Bell size={20} className="text-gray-300 hover:text-yellow-400 cursor-pointer" />
          {user.notifications.some(n => !n.read) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
          )}
        </div>
        <button onClick={onLogout} className="text-red-500 hover:text-red-400 ml-1">
             <LogOut size={20} />
        </button>
      </div>
    </div>
  );

  const RobotVisual = () => (
    <div className="relative w-48 h-48 mx-auto my-6 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-[spin_10s_linear_infinite]"></div>
      <div className="absolute inset-4 rounded-full border-2 border-yellow-400/30 animate-[spin_7s_linear_infinite_reverse]"></div>
      <div className="absolute inset-8 rounded-full border border-blue-400/50 animate-pulse"></div>
      
      <div className="relative z-10 w-24 h-24 bg-gray-900 rounded-full border-4 border-blue-500 shadow-[0_0_30px_#3b82f6] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-scan"></div>
        <Zap size={40} className={`text-yellow-400 opacity-50`} />
      </div>

      <div className="absolute -bottom-4 bg-gray-900 border border-yellow-400 px-3 py-1 rounded-full text-xs font-bold text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]">
        STANDBY
      </div>
    </div>
  );

  const buildBotSchedule = (activePlans) => {
    const now = getNow();
    const dayKey = getDayKey(now);

    const cycleBreakdown = [];
    let hasRunning = false;
    let hasAnalysisOnly = true;
    let allWeekend = activePlans.length > 0;
    let allDone = activePlans.length > 0;
    let roundIndexMax = null;
    let roundsPlannedMax = null;

    for (const c of activePlans) {
      const ds = c.dailyState;
      if (!ds) {
        allWeekend = false;
        allDone = false;
        continue;
      }
      if (ds.status !== 'weekend') allWeekend = false;
      if (ds.status !== 'done') allDone = false;

      if (ds.status === 'running' && ds.dayKey === dayKey) {
        hasRunning = true;
        const item = ds.sequence?.[ds.cycleIndex];
        if (item?.mode === 'trade') {
          hasAnalysisOnly = false;
          cycleBreakdown.push({ contractId: c.id, profit: Number(item.targetProfit) || 0, planId: c.planId });
        } else if (item) {
          cycleBreakdown.push({ contractId: c.id, profit: 0, planId: c.planId });
        }
        if (typeof item?.roundIndex === 'number') {
          roundIndexMax = roundIndexMax === null ? item.roundIndex : Math.max(roundIndexMax, item.roundIndex);
        }
        if (typeof ds.roundsPlanned === 'number') {
          roundsPlannedMax = roundsPlannedMax === null ? ds.roundsPlanned : Math.max(roundsPlannedMax, ds.roundsPlanned);
        }
      }
    }

    return {
      status: allWeekend ? 'weekend' : allDone ? 'done' : hasRunning ? 'running' : 'idle',
      mode: hasAnalysisOnly ? 'analysis' : 'trade',
      cycleSeconds: 600,
      cycleTargetProfit: cycleBreakdown.reduce((acc, b) => acc + (Number(b.profit) || 0), 0),
      breakdown: cycleBreakdown,
      round: roundIndexMax === null ? null : roundIndexMax + 1,
      rounds: roundsPlannedMax
    };
  };

  const handleAdvanceTenMinutes = () => {
    const now = Date.now();
    if (now - fastForwardClickRef.current < 800) return;
    fastForwardClickRef.current = now;

    const activePlans = user.activePlans || [];
    if (!activePlans.length) return;
    const schedule = buildBotSchedule(activePlans);
    if (!(schedule.status === 'running')) return;

    const opsCount = schedule.mode === 'trade' ? randomInt(120, 260) : 0;
    handleHftSync(schedule.cycleTargetProfit, opsCount, schedule.breakdown);
    setFastForwardNonce(n => n + 1);
  };

  const HomeView = () => {
    const activePlans = user.activePlans || [];
    const totalCapital = activePlans.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const totalAccumulated = activePlans.reduce((acc, c) => acc + (Number(c.accumulated) || 0), 0);
    const totalBalance = user.balances.usdt + user.balances.usdc + totalAccumulated;
    const schedule = buildBotSchedule(activePlans);

    const yieldTodayPct = (() => {
      const profitToday = activePlans.reduce((acc, c) => acc + (Number(c.dailyState?.profitToday) || 0), 0);
      if (!totalCapital) return 0;
      return (profitToday / totalCapital) * 100;
    })();

    const botPlan = { planId: `bot_${user.email || 'local'}`, amount: totalCapital };

    return (
      <div className="space-y-6 animate-fadeIn pb-24">
        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">{t.balance}</p>
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
            {formatCurrency(totalBalance)}
          </h1>
          {activePlans.length > 0 && (
            <div className="text-green-400 text-sm mt-1 animate-pulse">
              +{formatCurrency(totalAccumulated)} {t.profit}
            </div>
          )}
        </div>

        {activePlans.length > 0 ? (
          <TradingTerminal activePlan={botPlan} schedule={schedule} onSync={handleHftSync} fastForwardNonce={fastForwardNonce} />
        ) : (
          <RobotVisual />
        )}

        <div className="flex flex-col items-center gap-3">
          <button 
            onClick={() => setView('plans')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.6)] transform hover:scale-105 transition active:scale-95 border-b-4 border-blue-800"
          >
            {activePlans.length > 0 ? 'ADICIONAR PLANO' : t.choosePlan}
          </button>

          {activePlans.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setSimOffsetDays(d => d + 1)}
                className="text-xs px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700 text-gray-200 hover:bg-gray-800 transition"
              >
                Simular Próximo Dia
              </button>
              <button
                onClick={handleAdvanceTenMinutes}
                className="text-xs px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700 text-gray-200 hover:bg-gray-800 transition"
              >
                Avançar 10min
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 px-4 mb-6">
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center">
             <Activity className="text-blue-400 mb-2" size={24} />
             <span className="text-xs text-gray-400">Yield Today</span>
             <span className="text-white font-bold text-lg">
               {`${yieldTodayPct >= 0 ? '+' : ''}${yieldTodayPct.toFixed(2)}%`}
             </span>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center">
             <Users className="text-purple-400 mb-2" size={24} />
             <span className="text-xs text-gray-400">Active Directs</span>
             <span className="text-white font-bold text-lg">12</span>
          </div>
        </div>

        <div className="px-4 pb-6">
          <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-bold text-sm">Latest Activity</h3>
              <button onClick={() => setView('reports')} className="text-xs text-blue-400 hover:text-blue-300">View All</button>
          </div>
          <div className="space-y-2">
              {user.history.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="bg-gray-800/40 p-3 rounded-lg flex justify-between items-center border border-gray-700/30">
                      <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type.includes('profit') ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {item.type.includes('profit') ? <TrendingUp size={14} /> : <Activity size={14} />}
                          </div>
                          <div>
                              <p className="text-white text-xs font-bold capitalize">{item.desc || item.type}</p>
                              <p className="text-gray-500 text-[10px]">{item.date}</p>
                          </div>
                      </div>
                      <span className={`text-xs font-mono font-bold ${item.type.includes('withdraw') || item.type.includes('activation') ? 'text-red-400' : 'text-green-400'}`}>
                          {item.type.includes('withdraw') || item.type.includes('activation') ? '-' : '+'}${Number(item.amount).toFixed(2)}
                      </span>
                  </div>
              ))}
              {user.history.length === 0 && (
                  <p className="text-gray-500 text-xs text-center py-2">No recent activity.</p>
              )}
          </div>
        </div>
      </div>
    );
  };

  const SupportView = () => (
    <div className="px-4 pt-6 pb-24 animate-fadeIn space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setView('menu')} className="text-gray-400 hover:text-white"><ChevronRight className="rotate-180" /></button>
        <h2 className="text-2xl font-bold text-white">{t.support}</h2>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center gap-3 mb-4 border-b border-gray-700 pb-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <ShieldCheck className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">AI Assistant</h3>
            <p className="text-green-400 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Online</p>
          </div>
        </div>
        
        <div className="space-y-4 mb-4 h-48 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-gray-700/50 p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg max-w-[85%]">
            <p className="text-gray-300 text-sm">Olá, {user.name}. Sou sua IA de suporte. Como posso ajudar?</p>
          </div>
          <div className="bg-blue-600/20 p-3 rounded-tl-lg rounded-bl-lg rounded-br-lg max-w-[85%] ml-auto border border-blue-500/30">
            <p className="text-blue-100 text-sm">Quero falar com um humano.</p>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg max-w-[85%]">
            <p className="text-gray-300 text-sm">Entendido. Para atendimento complexo, recomendamos nosso canal oficial.</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 shadow-lg text-center relative overflow-hidden group cursor-pointer" onClick={() => window.open('https://telegram.org', '_blank')}>
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition"></div>
        <LogOut size={48} className="mx-auto text-white/20 absolute -right-4 -bottom-4 transform rotate-12" />
        
        <h3 className="text-white font-bold text-xl mb-2">Telegram Oficial</h3>
        <p className="text-blue-100 text-sm mb-4 leading-relaxed">
          {t.supportText}
        </p>
        
        <button className="bg-white text-blue-600 font-bold py-2 px-6 rounded-full text-sm shadow-md hover:bg-gray-100 transition flex items-center gap-2 mx-auto">
          {t.supportBtn} <LogOut size={14} className="rotate-[-45deg]" />
        </button>
      </div>
    </div>
  );

  const NotificationsPanel = () => (
    <>
      {/* Overlay Backdrop */}
      {showNotif && (
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[55] animate-fadeIn"
          onClick={() => setShowNotif(false)}
        ></div>
      )}
      
      {/* Panel */}
      <div className={`absolute inset-y-0 right-0 w-full bg-gray-900 shadow-2xl z-[60] transform transition-transform duration-300 border-l border-gray-700 ${showNotif ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
          <h3 className="text-white font-bold flex items-center gap-2">
             <Bell size={16} className="text-blue-400" /> 
             {t.notifications}
          </h3>
          <button 
            onClick={() => setShowNotif(false)} 
            className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3 h-[calc(100%-60px)] overflow-y-auto custom-scrollbar pb-20">
          {user.notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
               <Bell size={32} className="opacity-20" />
               <p className="text-xs">Tudo limpo por aqui.</p>
            </div>
          ) : (
            user.notifications.map(n => (
              <div key={n.id} className={`bg-gray-800/50 p-3 rounded-lg border-l-4 ${n.type === 'error' ? 'border-red-500' : n.type === 'success' ? 'border-green-500' : 'border-blue-500'} hover:bg-gray-800 transition`}>
                <div className="flex justify-between items-start mb-1">
                   <h4 className="text-gray-200 text-sm font-bold">{n.title}</h4>
                   <span className="text-[10px] text-gray-500">{n.time}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{n.msg}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  const MenuView = () => (
    <div className="px-4 pb-24 pt-4 animate-fadeIn">
      <h2 className="text-2xl font-bold text-white mb-6">Menu</h2>
      
      <div className="grid grid-cols-1 gap-4">
        <button onClick={() => setView('settings')} className="bg-gray-800 hover:bg-gray-700 p-5 rounded-xl flex items-center gap-4 transition border border-gray-700">
          <div className="bg-blue-500/20 p-3 rounded-full text-blue-400">
            <Settings size={24} />
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold text-lg">{t.settings}</h3>
            <p className="text-gray-400 text-xs">Perfil, Segurança e Carteiras</p>
          </div>
          <ChevronRight className="ml-auto text-gray-500" />
        </button>

        <button onClick={() => setView('team')} className="bg-gray-800 hover:bg-gray-700 p-5 rounded-xl flex items-center gap-4 transition border border-gray-700">
          <div className="bg-purple-500/20 p-3 rounded-full text-purple-400">
            <Users size={24} />
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold text-lg">{t.team}</h3>
            <p className="text-gray-400 text-xs">Visualize sua rede e comissões</p>
          </div>
          <ChevronRight className="ml-auto text-gray-500" />
        </button>

        <button onClick={() => setView('reports')} className="bg-gray-800 hover:bg-gray-700 p-5 rounded-xl flex items-center gap-4 transition border border-gray-700">
          <div className="bg-green-500/20 p-3 rounded-full text-green-400">
            <FileText size={24} />
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold text-lg">{t.reports}</h3>
            <p className="text-gray-400 text-xs">{t.transactions}, {t.botOps}</p>
          </div>
          <ChevronRight className="ml-auto text-gray-500" />
        </button>

        <button onClick={() => setView('support')} className="bg-gray-800 hover:bg-gray-700 p-5 rounded-xl flex items-center gap-4 transition border border-gray-700">
          <div className="bg-indigo-500/20 p-3 rounded-full text-indigo-400">
            <ShieldCheck size={24} />
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold text-lg">{t.support}</h3>
            <p className="text-gray-400 text-xs">Fale com a equipe oficial</p>
          </div>
          <ChevronRight className="ml-auto text-gray-500" />
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-900 rounded-xl border border-gray-800 text-center">
        <p className="text-gray-500 text-xs">App Version: 1.6.0 (HFT Live)</p>
        <p className="text-gray-600 text-[10px] mt-1">ID: {user.name}</p>
      </div>
    </div>
  );

  const SettingsView = () => {
    // Estado local para o formulário
    const [localWallets, setLocalWallets] = useState(user.wallets);
    const [localFinPass, setLocalFinPass] = useState('');
    
    // Simulação simples de troca de foto (apenas alterna entre 2 URLs ou placeholder)
    const togglePhoto = () => {
        const dummyPhoto = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60';
        handleSaveSettings({
            wallets: localWallets,
            financialPassword: localFinPass,
            photoUrl: user.photoUrl ? null : dummyPhoto
        });
    };

    const handleSave = () => {
        handleSaveSettings({
            wallets: localWallets,
            financialPassword: localFinPass
        });
    };

    return (
      <div className="px-4 pb-24 pt-4 animate-fadeIn">
        <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setView('menu')} className="text-gray-400 hover:text-white"><ChevronRight className="rotate-180" /></button>
            <h2 className="text-2xl font-bold text-white">{t.settings}</h2>
        </div>

        {/* Perfil Section */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6 flex flex-col items-center">
            <div className="relative mb-4 group cursor-pointer" onClick={togglePhoto}>
                <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-blue-500 flex items-center justify-center overflow-hidden">
                    {user.photoUrl ? (
                        <img src={user.photoUrl} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <User size={48} className="text-gray-400" />
                    )}
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-gray-800">
                    <Camera size={14} className="text-white" />
                </div>
            </div>
            <h3 className="text-xl font-bold text-white">{user.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{user.email}</p>
            <button onClick={togglePhoto} className="text-xs text-blue-400 hover:text-blue-300 underline">
                {t.changePhoto}
            </button>
        </div>

        {/* Segurança Section */}
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 mb-6">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
                <Lock size={18} className="text-yellow-400" />
                <h3 className="text-white font-bold">{t.security}</h3>
            </div>
            <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase font-bold">{t.finPassword}</label>
                <div className="flex gap-2">
                    <input 
                        type="password" 
                        placeholder={user.financialPassword ? "********" : "Cadastrar Senha"}
                        className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white w-full text-sm focus:border-blue-500 focus:outline-none"
                        value={localFinPass}
                        onChange={(e) => setLocalFinPass(e.target.value)}
                    />
                </div>
                <p className="text-[10px] text-gray-500">Usada para confirmar saques e trocas.</p>
            </div>
        </div>

        {/* Carteiras Section */}
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 mb-6">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
                <CreditCard size={18} className="text-green-400" />
                <h3 className="text-white font-bold">{t.wallets}</h3>
            </div>
            
            <div className="space-y-4">
                {/* USDT BEP-20 */}
                <div>
                    <label className="text-xs text-gray-400 block mb-1">USDT (BEP-20)</label>
                    <input 
                        type="text" 
                        placeholder="0x..." 
                        className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white w-full text-xs font-mono focus:border-green-500 focus:outline-none"
                        value={localWallets.usdt_bep20}
                        onChange={(e) => setLocalWallets({...localWallets, usdt_bep20: e.target.value})}
                    />
                </div>
                 {/* USDT TRC-20 */}
                 <div>
                    <label className="text-xs text-gray-400 block mb-1">USDT (TRC-20)</label>
                    <input 
                        type="text" 
                        placeholder="T..." 
                        className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white w-full text-xs font-mono focus:border-green-500 focus:outline-none"
                        value={localWallets.usdt_trc20}
                        onChange={(e) => setLocalWallets({...localWallets, usdt_trc20: e.target.value})}
                    />
                </div>
                 {/* USDT POLYGON */}
                 <div>
                    <label className="text-xs text-gray-400 block mb-1">USDT (POLYGON)</label>
                    <input 
                        type="text" 
                        placeholder="0x..." 
                        className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white w-full text-xs font-mono focus:border-green-500 focus:outline-none"
                        value={localWallets.usdt_polygon}
                        onChange={(e) => setLocalWallets({...localWallets, usdt_polygon: e.target.value})}
                    />
                </div>
                 {/* USDT ARBITRUM */}
                 <div>
                    <label className="text-xs text-gray-400 block mb-1">USDT (ARBITRUM)</label>
                    <input 
                        type="text" 
                        placeholder="0x..." 
                        className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-white w-full text-xs font-mono focus:border-green-500 focus:outline-none"
                        value={localWallets.usdt_arbitrum}
                        onChange={(e) => setLocalWallets({...localWallets, usdt_arbitrum: e.target.value})}
                    />
                </div>
                 {/* USDC ARBITRUM */}
                 <div>
                    <label className="text-xs text-blue-400 block mb-1 font-bold">USDC (ARBITRUM)</label>
                    <input 
                        type="text" 
                        placeholder="0x..." 
                        className="bg-gray-900 border border-blue-900 rounded-lg p-3 text-white w-full text-xs font-mono focus:border-blue-500 focus:outline-none"
                        value={localWallets.usdc_arbitrum}
                        onChange={(e) => setLocalWallets({...localWallets, usdc_arbitrum: e.target.value})}
                    />
                </div>
            </div>
        </div>

        {/* Zona de Perigo - Reset de Dados */}
        <div className="bg-red-900/10 p-5 rounded-xl border border-red-900/30 mb-6">
            <div className="flex items-center gap-2 mb-4 border-b border-red-900/30 pb-2">
                <LogOut size={18} className="text-red-500" />
                <h3 className="text-white font-bold">Zona de Perigo</h3>
            </div>
            
            <p className="text-xs text-gray-400 mb-4">
                Deseja reiniciar a aplicação? Isso apagará todo o histórico, saldo simulado e configurações locais.
            </p>

            <button 
                onClick={() => {
                    if (window.confirm('TEM CERTEZA? Isso apagará todos os dados e reiniciará a aplicação para o estado inicial.')) {
                        localStorage.removeItem('vdex_current_session');
                        localStorage.removeItem('app_mvp_data_v8');
                        window.location.reload();
                    }
                }}
                className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold py-3 rounded-lg border border-red-600/50 transition flex items-center justify-center gap-2"
            >
                <LogOut size={16} /> Resetar Dados
            </button>
        </div>

        <button 
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg border-b-4 border-blue-800 active:border-b-0 active:mt-1 transition-all flex items-center justify-center gap-2"
        >
            <Save size={18} /> {t.save}
        </button>
      </div>
    );
  };

  const TeamView = () => (
    <div className="px-4 pb-24 pt-4 animate-fadeIn">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setView('menu')} className="text-gray-400 hover:text-white"><ChevronRight className="rotate-180" /></button>
        <h2 className="text-2xl font-bold text-white">{t.team}</h2>
      </div>

      <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-6 rounded-2xl border border-purple-500/30 mb-6 relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 opacity-20"><Users size={100} /></div>
        <p className="text-purple-200 text-sm">{t.totalDistributed}</p>
        <h3 className="text-3xl font-bold text-white mb-4">23%</h3>
        <div className="flex gap-4">
            <div className="bg-black/30 px-3 py-1 rounded-lg flex-1">
                <span className="text-xs text-gray-300 block">{t.unilevel}</span>
                <span className="font-bold text-white">11.5%</span>
            </div>
            <div className="bg-black/30 px-3 py-1 rounded-lg flex-1">
                <span className="text-xs text-gray-300 block">{t.residual}</span>
                <span className="font-bold text-white">11.5%</span>
            </div>
        </div>
      </div>

      <h3 className="text-gray-400 text-sm mb-3 uppercase tracking-wider">{t.commissionPlan}</h3>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-6">
          <div className="grid grid-cols-4 bg-gray-900 p-2 text-xs text-gray-400 font-bold border-b border-gray-700">
              <span className="col-span-1 text-center">Nível</span>
              <span className="col-span-1 text-center text-blue-400">Unilevel</span>
              <span className="col-span-1 text-center text-green-400">Residual</span>
              <span className="col-span-1 text-center">Status</span>
          </div>
          {NETWORK_PLAN.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 p-3 border-b border-gray-700/50 last:border-0 text-sm items-center">
                  <div className="col-span-1 flex justify-center">
                      <span className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {item.level}
                      </span>
                  </div>
                  <span className="col-span-1 text-center text-blue-300 font-mono">{item.percent}%</span>
                  <span className="col-span-1 text-center text-green-300 font-mono">{item.percent}%</span>
                  <span className="col-span-1 text-center">
                      {idx < 3 ? <span className="text-green-500 text-[10px] border border-green-500 px-1 rounded">ATIVO</span> : <Lock size={12} className="mx-auto text-gray-600" />}
                  </span>
              </div>
          ))}
      </div>

      <h3 className="text-gray-400 text-sm mb-3 uppercase tracking-wider mt-6">Bônus Qualificador</h3>
      <div className="space-y-4 mb-6">
          <div className="bg-gradient-to-r from-orange-800 to-orange-900 p-4 rounded-xl border border-orange-500/30">
              <div className="flex justify-between items-center mb-2">
                  <h4 className="text-orange-300 font-bold text-lg flex items-center gap-2">BRONZE</h4>
                  <span className="text-green-400 font-bold">+$100.00</span>
              </div>
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Progresso: $0.00</span>
                  <span>Meta: $1,000.00</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: '0%'}}></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Apenas comissões no nível 1. A cada nível atingido o progresso é zerado.</p>
          </div>

          <div className="bg-gradient-to-r from-gray-500 to-gray-700 p-4 rounded-xl border border-gray-400/30">
              <div className="flex justify-between items-center mb-2">
                  <h4 className="text-gray-100 font-bold text-lg flex items-center gap-2">PRATA</h4>
                  <span className="text-green-400 font-bold">+$200.00</span>
              </div>
              <div className="flex justify-between text-xs text-gray-200 mb-1">
                  <span>Progresso: $0.00</span>
                  <span>Meta: $10,000.00</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2">
                  <div className="bg-gray-300 h-2 rounded-full" style={{width: '0%'}}></div>
              </div>
              <p className="text-[10px] text-gray-300 mt-2">Apenas comissões no nível 1. A cada nível atingido o progresso é zerado.</p>
          </div>

          <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 p-4 rounded-xl border border-yellow-500/30">
              <div className="flex justify-between items-center mb-2">
                  <h4 className="text-yellow-300 font-bold text-lg flex items-center gap-2">OURO</h4>
                  <span className="text-green-400 font-bold">+$300.00</span>
              </div>
              <div className="flex justify-between text-xs text-gray-200 mb-1">
                  <span>Progresso: $0.00</span>
                  <span>Meta: $20,000.00</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{width: '0%'}}></div>
              </div>
              <p className="text-[10px] text-gray-300 mt-2">Apenas comissões no nível 1. A cada nível atingido o progresso é zerado.</p>
          </div>

          <div className="bg-gradient-to-r from-cyan-700 to-cyan-900 p-4 rounded-xl border border-cyan-500/30">
              <div className="flex justify-between items-center mb-2">
                  <h4 className="text-cyan-300 font-bold text-lg flex items-center gap-2">DIAMANTE</h4>
                  <span className="text-green-400 font-bold">+$500.00</span>
              </div>
              <div className="flex justify-between text-xs text-gray-200 mb-1">
                  <span>Progresso: $0.00</span>
                  <span>Meta: $50,000.00</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2">
                  <div className="bg-cyan-400 h-2 rounded-full" style={{width: '0%'}}></div>
              </div>
              <p className="text-[10px] text-gray-300 mt-2">Apenas comissões no nível 1. A cada nível atingido o progresso é zerado.</p>
          </div>
      </div>

      <h3 className="text-gray-400 text-sm mb-3 uppercase tracking-wider">Histórico Recente</h3>
      <div className="space-y-3">
        {user.history.filter(h => h.type === 'unilevel' || h.type === 'residual').length === 0 ? (
            <div className="text-center text-gray-600 py-4 text-sm">Nenhuma comissão recente.</div>
        ) : (
            user.history.filter(h => h.type === 'unilevel' || h.type === 'residual').slice(0, 5).map((h, i) => (
                <div key={i} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center border border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${h.type === 'unilevel' ? 'bg-blue-900 text-blue-400' : 'bg-green-900 text-green-400'}`}>
                            {h.type === 'unilevel' ? 'U' : 'R'}
                        </div>
                        <div>
                            <p className="text-white text-sm capitalize">{h.type} Bonus</p>
                            <p className="text-gray-500 text-[10px]">{h.desc}</p>
                        </div>
                    </div>
                    <span className="text-green-400 text-xs font-mono">+ ${h.amount}</span>
                </div>
            ))
        )}
      </div>
    </div>
  );

  const ReportsView = () => {
    const tabs = [
      { id: 'all', label: 'Todas' },
      { id: 'entries', label: 'Entradas' },
      { id: 'exits', label: 'Saídas' },
      { id: 'bots', label: 'Bots' }
    ];

    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const isBotTx = (tx) => tx?.type?.startsWith('plan_') || tx?.type === 'hft_profit';
    const isEntryTx = (tx) => {
      const type = tx?.type;
      if (!type) return false;
      if (type === 'hft_profit') return num(tx.amount) > 0;
      return type === 'deposit' || type === 'unilevel' || type === 'residual' || type.includes('bonus') || type === 'game_win' || type === 'swap';
    };
    const isExitTx = (tx) => {
      const type = tx?.type;
      if (!type) return false;
      if (type === 'hft_profit') return num(tx.amount) < 0;
      return type === 'withdraw' || type === 'plan_activation' || type === 'plan_upgrade' || type === 'game_loss';
    };

    const filtered = user.history.filter((tx) => {
      if (reportsTab === 'entries') return isEntryTx(tx);
      if (reportsTab === 'exits') return isExitTx(tx);
      if (reportsTab === 'bots') return isBotTx(tx);
      return true;
    });

    const getTitle = (tx) => {
      if (tx.type === 'plan_activation') return 'Plan Activation';
      if (tx.type === 'plan_upgrade') return 'Plan Upgrade';
      if (tx.type === 'hft_profit') return 'HFT Profit';
      if (tx.type === 'bot_pause') return 'Bot Pause';
      if (tx.type === 'bot_resume') return 'Bot Resume';
      if (tx.type === 'deposit') return 'Deposit';
      if (tx.type === 'withdraw') return 'Withdraw';
      if (tx.type === 'swap') return 'Swap';
      if (tx.type === 'unilevel') return 'Unilevel Bonus';
      if (tx.type === 'residual') return 'Residual Bonus';
      if (tx.type === 'game_win') return 'Game Win';
      if (tx.type === 'game_loss') return 'Game Loss';
      return (tx.type || '').replaceAll('_', ' ');
    };

    const getMeta = (tx) => {
      if (tx.desc) return tx.desc;
      return tx.date || '';
    };

    const getFlow = (tx) => {
      if (tx.type === 'hft_profit') return num(tx.amount) >= 0 ? 'in' : 'out';
      if (isExitTx(tx)) return 'out';
      if (isEntryTx(tx)) return 'in';
      return 'neutral';
    };

    const formatAmount = (tx) => {
      const n = num(tx.amount);
      const flow = getFlow(tx);
      const abs = Math.abs(n);
      const fixed = tx.type === 'hft_profit' ? abs.toFixed(4) : abs.toFixed(2);
      if (flow === 'out') return `-$${fixed}`;
      if (flow === 'in') return `+$${fixed}`;
      return `$${fixed}`;
    };

    const iconFor = (tx) => {
      if (tx.type === 'deposit') return <Plus size={14} />;
      if (tx.type === 'withdraw') return <Minus size={14} />;
      if (tx.type === 'swap') return <ArrowRightLeft size={14} />;
      if (tx.type === 'unilevel' || tx.type === 'residual' || (tx.type || '').includes('bonus')) return <Users size={14} />;
      if ((tx.type || '').startsWith('plan_')) return <Zap size={14} />;
      if (tx.type === 'hft_profit') return <TrendingUp size={14} />;
      if (tx.type === 'game_win' || tx.type === 'game_loss') return <Gamepad2 size={14} />;
      return <Activity size={14} />;
    };

    const iconClass = (tx) => {
      if (tx.type === 'deposit') return 'bg-green-500/20 text-green-400';
      if (tx.type === 'withdraw') return 'bg-red-500/20 text-red-400';
      if (tx.type === 'swap') return 'bg-cyan-500/20 text-cyan-300';
      if (tx.type === 'unilevel' || tx.type === 'residual' || (tx.type || '').includes('bonus')) return 'bg-purple-500/20 text-purple-300';
      if ((tx.type || '').startsWith('plan_')) return 'bg-yellow-500/20 text-yellow-300';
      if (tx.type === 'hft_profit') return num(tx.amount) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
      return 'bg-gray-500/10 text-gray-300';
    };

    const amountClass = (tx) => {
      const flow = getFlow(tx);
      if (flow === 'in') return 'text-green-400';
      if (flow === 'out') return 'text-red-400';
      return 'text-white';
    };

    return (
      <div className="px-4 pb-24 pt-4 animate-fadeIn">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setView('menu')} className="text-gray-400 hover:text-white"><ChevronRight className="rotate-180" /></button>
          <h2 className="text-2xl font-bold text-white">{t.reports}</h2>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportsTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap border transition ${reportsTab === tab.id ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-black border-yellow-500/30' : 'bg-gray-800/60 text-gray-300 border-gray-700 hover:bg-gray-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">Nenhuma transação nesta aba.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tx, idx) => (
              <div key={tx.id || idx} className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center border border-gray-700/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconClass(tx)}`}>
                    {iconFor(tx)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">{getTitle(tx)}</p>
                    <p className="text-gray-500 text-xs truncate">{getMeta(tx)}</p>
                  </div>
                </div>
                <span className={`font-mono font-bold ${amountClass(tx)}`}>{formatAmount(tx)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const BottomNav = () => (
    <div className="w-full bg-gray-950/40 backdrop-blur-2xl border-t border-gray-800/50 p-2 pb-[env(safe-area-inset-bottom,20px)] shrink-0 fixed bottom-0 left-0 right-0 z-[60] md:hidden">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <NavBtn icon={TrendingUp} id="home" label="Home" active={view === 'home'} />
        <NavBtn icon={Gamepad2} id="game" label="Game" active={view === 'game'} />
        
        {/* Botão Central Destacado BOTS */}
        <div className="relative -top-6">
          <button 
            onClick={() => setView('plans')}
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center border-4 border-gray-900 shadow-[0_0_20px_#2563eb] transform hover:scale-110 transition text-white"
          >
            <Zap size={32} className="fill-current" />
          </button>
          <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[10px] font-bold text-blue-400">BOTS</span>
        </div>

        <NavBtn icon={Wallet} id="wallet" label="Wallet" active={view === 'wallet'} />
        <NavBtn icon={MenuIcon} id="menu" label="Menu" active={view === 'menu' || view === 'support' || view === 'team' || view === 'reports' || view === 'settings'} />
      </div>
    </div>
  );

  const NavBtn = ({ icon: Icon, id, label, active }) => (
    <button 
      onClick={() => setView(id)}
      className={`flex flex-col items-center p-2 transition ${active ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}
    >
      <Icon size={20} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );

  const SidebarBtn = ({ icon: Icon, id, label, active }) => (
    <button 
      onClick={() => setView(id)}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
    >
      <Icon size={20} />
      <span className="font-bold">{label}</span>
    </button>
  );

  return (
    <div className="h-[100dvh] w-full text-gray-100 font-sans selection:bg-yellow-500/30 flex justify-center md:justify-start fixed inset-0 overflow-hidden md:bg-app-desktop bg-app-mobile bg-fixed">
      {/* OVERLAY DE SOMBRA PARA O BACKOFFICE */}
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-scan { animation: scan 3s linear infinite; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
      `}</style>

      {/* Sidebar Desktop/Tablet */}
      <div className="hidden md:flex flex-col w-64 bg-gray-950/40 backdrop-blur-xl border-r border-gray-800/50 z-50 p-4 shrink-0 shadow-2xl h-[100dvh] sticky top-0 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]">
         <div className="mb-6 mt-2 text-center h-32 relative overflow-hidden">
             <img src="/logo/logoVdex.png" alt="VDexTrading" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 md:h-36 w-auto max-w-none select-none pointer-events-none drop-shadow-[0_0_12px_rgba(234,179,8,0.35)]" />
         </div>
         <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2">
             <SidebarBtn icon={TrendingUp} id="home" label="Home" active={view === 'home'} />
             <SidebarBtn icon={Gamepad2} id="game" label="Game" active={view === 'game'} />
             <SidebarBtn icon={Zap} id="plans" label="Bots" active={view === 'plans'} />
             <SidebarBtn icon={Wallet} id="wallet" label="Wallet" active={view === 'wallet'} />
             <div className="my-2 border-b border-gray-800"></div>
             <SidebarBtn icon={Users} id="team" label="Rede" active={view === 'team'} />
             <SidebarBtn icon={FileText} id="reports" label="Relatórios" active={view === 'reports'} />
             <SidebarBtn icon={Settings} id="settings" label="Configurações" active={view === 'settings'} />
             <SidebarBtn icon={ShieldCheck} id="support" label="Suporte" active={view === 'support'} />
         </div>
         <button onClick={onLogout} className="mt-6 shrink-0 flex items-center justify-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition border border-red-500/20">
             <LogOut size={20} /> <span className="font-bold">Sair</span>
         </button>
      </div>
      
      <div className="w-full md:flex-1 lg:max-w-6xl mx-auto bg-gray-950/40 backdrop-blur-md relative shadow-2xl h-[100dvh] flex flex-col md:border-x border-gray-900/50 overflow-hidden pb-[5rem] md:pb-0 z-0">
        <Header />
        
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden custom-scrollbar relative pt-[env(safe-area-inset-top)] z-10 pb-[env(safe-area-inset-bottom,20px)]">
            <div className={view === 'home' ? '' : 'hidden'}>
              <HomeView />
            </div>
            
            {view === 'game' && (
            <GameView 
                t={t} 
                user={user} 
                handleGamePlay={handleGamePlay} 
                handleQuantumGameOver={handleQuantumGameOver}
                handleVaultResult={handleVaultResult}
                handleBuyCredits={handleBuyCredits}
                formatVDT={formatVDT}
            />
            )}
            
            {view === 'plans' && <PlansView t={t} handleActivatePlan={handleActivatePlan} user={user} userBalance={user.balances.usdt} />}
            
            {view === 'wallet' && (
            <WalletView 
           t={t} 
           user={user} 
           formatCurrency={formatCurrency}
           formatVDT={formatVDT} 
           handleDepositAction={handleDepositAction}
           handleWithdrawAction={handleWithdrawAction}
           handleSwapAction={handleSwapAction}
        />
            )}
            
            {view === 'menu' && <MenuView />}
            {view === 'team' && <TeamView />}
            {view === 'reports' && <ReportsView />}
            {view === 'support' && <SupportView />}
            {view === 'settings' && <SettingsView />}
        </main>

        <div className="md:hidden">
            <BottomNav />
        </div>
        <NotificationsPanel />

        {/* Toast Notification */}
        {toast && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[70] animate-slideDown w-[90%] max-w-sm pointer-events-none">
            {(() => {
                const type = toast.type || 'info';
                const styles = {
                    success: {
                        bg: 'bg-green-950/95 border-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.2)]',
                        iconBg: 'bg-green-500/20 border-green-500/30',
                        iconColor: 'text-green-400',
                        titleColor: 'text-green-400',
                        dotColor: 'bg-green-400 shadow-[0_0_8px_#4ade80]',
                        label: toast.title || 'PROFIT REPORT',
                        Icon: TrendingUp
                    },
                    error: {
                        bg: 'bg-red-950/95 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]',
                        iconBg: 'bg-red-500/20 border-red-500/30',
                        iconColor: 'text-red-400',
                        titleColor: 'text-red-400',
                        dotColor: 'bg-red-400 shadow-[0_0_8px_#f87171]',
                        label: toast.title || 'SYSTEM ALERT',
                        Icon: AlertTriangle
                    },
                    info: {
                        bg: 'bg-gray-900/95 border-blue-500/40 shadow-[0_0_30px_rgba(37,99,235,0.2)]',
                        iconBg: 'bg-blue-500/20 border-blue-500/30',
                        iconColor: 'text-blue-400',
                        titleColor: 'text-blue-400',
                        dotColor: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]',
                        label: toast.title || 'SYSTEM UPDATE',
                        Icon: Zap
                    }
                }[type] || {
                        bg: 'bg-gray-900/95 border-blue-500/40 shadow-[0_0_30px_rgba(37,99,235,0.2)]',
                        iconBg: 'bg-blue-500/20 border-blue-500/30',
                        iconColor: 'text-blue-400',
                        titleColor: 'text-blue-400',
                        dotColor: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]',
                        label: toast.title || 'SYSTEM UPDATE',
                        Icon: Zap
                };

                const { Icon } = styles;

                return (
                    <div className={`${styles.bg} backdrop-blur-xl border px-5 py-4 rounded-2xl flex items-center gap-4 transition-all duration-300 pointer-events-auto`}>
                    <div className={`shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center border shadow-inner`}>
                        <Icon size={24} className={styles.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-[10px] ${styles.titleColor} font-bold uppercase tracking-widest mb-1 flex items-center gap-2`}>
                            <span className={`w-2 h-2 ${styles.dotColor} rounded-full animate-pulse`}></span>
                            {styles.label}
                        </p>
                        <p className="text-sm font-medium text-white leading-tight break-words drop-shadow-sm">
                            {toast.msg}
                        </p>
                    </div>
                    </div>
                );
            })()}
            </div>
        )}
      </div>
    </div>
  );
}

/**
 * COMPONENTE PRINCIPAL (CONTROLLER)
 * Gerencia o fluxo entre Landing Page, Auth e Dashboard
 */
export default function App() {
  // Estados de Roteamento
  const [currentView, setCurrentView] = useState('landing'); // landing, auth, dashboard
  const [currentUser, setCurrentUser] = useState(null);

  // Inicialização: Verifica se já existe sessão ativa
  useEffect(() => {
    const session = localStorage.getItem('vdex_current_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        // Garante que o usuário da sessão tenha todos os campos necessários
        const safeUser = { ...SAFE_USER_DEFAULTS, ...parsed };
        setCurrentUser(safeUser);
        setCurrentView('dashboard');
      } catch (e) {
        console.error("Sessão corrompida:", e);
        localStorage.removeItem('vdex_current_session');
      }
    }
  }, []);

  const handleNavigateToAuth = () => {
    setCurrentView('auth');
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('vdex_current_session', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('vdex_current_session');
    setCurrentUser(null);
    setCurrentView('landing'); // Volta para a Landing Page ao sair
  };

  // Renderização Condicional
  if (currentView === 'landing') {
    return <LandingPage onNavigate={handleNavigateToAuth} />;
  }

  if (currentView === 'auth') {
    return <AuthView onLogin={handleLoginSuccess} />;
  }

  if (currentView === 'dashboard' && currentUser) {
    return <Dashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  return <div className="bg-black min-h-screen"></div>;
}

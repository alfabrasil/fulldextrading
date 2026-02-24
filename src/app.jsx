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
  CheckCircle
} from 'lucide-react';

// Importações Refatoradas
import { CONFIG, NETWORK_PLAN, PLANS } from './data/config';
import { TRANSLATIONS } from './data/translations';
import { GameView } from './components/GameView';
import { PlansView } from './components/PlansView';
import { WalletView } from './components/WalletView';
import { TradingTerminal } from './components/TradingTerminal';

/**
 * COMPONENTE PRINCIPAL
 */
export default function App() {
  // --- ESTADO GERAL ---
  const [view, setView] = useState('home'); 
  const [lang, setLang] = useState('pt');
  const [loading, setLoading] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [toast, setToast] = useState(null);

  // --- DADOS DO USUÁRIO (Persistidos) ---
  const [user, setUser] = useState({
    name: 'Trader Alpha',
    email: 'trader@alpha.com',
    photoUrl: null, 
    financialPassword: '',
    wallets: {
      usdt_bep20: '',
      usdt_trc20: '',
      usdt_polygon: '',
      usdt_arbitrum: '',
      usdc_arbitrum: ''
    },
    balances: { usdt: 0, usdc: 0, fdt: 0 }, 
    activePlan: null, 
    history: [],
    notifications: [],
    gameCredits: { daily: 3, lastReset: Date.now() },
    quantumStats: { highScore: 0, totalSparks: 0 },
    lastLogin: Date.now()
  });

  const t = TRANSLATIONS[lang];

  // --- EFEITOS DE INICIALIZAÇÃO E LOOP ---
  useEffect(() => {
    const savedData = localStorage.getItem('app_mvp_data_v8'); // Bump to v8 for Zero Balance
    if (savedData) {
      const parsed = JSON.parse(savedData);
      
      // Reset Diário de Créditos do Jogo
      const now = Date.now();
      const lastReset = parsed.gameCredits?.lastReset || 0;
      const isNewDay = new Date(now).toDateString() !== new Date(lastReset).toDateString();
      
      let currentCredits = parsed.gameCredits || { daily: 3, lastReset: now };
      
      if (isNewDay) {
          currentCredits = { daily: 3, lastReset: now };
          parsed.notifications.unshift({
            id: Date.now(),
            title: 'Daily Energy',
            msg: 'Sua energia diária foi recarregada! (3/3)',
            read: false,
            time: new Date().toLocaleTimeString()
          });
      }

      // Cálculo de lucro offline (simplificado, já que agora o HFT sincroniza)
      // Mantendo lógica de segurança caso o user fique dias fora
      if (parsed.activePlan) {
        const now = Date.now();
        const lastTime = parsed.lastLogin || now;
        const diffSeconds = (now - lastTime) / 1000;
        
        // Se ficou mais de 1 min fora, calcula um lucro médio
        if (diffSeconds > 60) {
            const plan = PLANS.find(p => p.id === parsed.activePlan.planId);
            if (plan) {
              const dailyRoi = plan.roiTotal / plan.duration; 
              const dailyProfit = parsed.activePlan.amount * (dailyRoi / 100);
              const offlineProfit = dailyProfit * (diffSeconds / 86400);
              
              parsed.activePlan.accumulated += offlineProfit;
              parsed.notifications.unshift({
                id: Date.now(),
                title: 'HFT Offline Report',
                msg: `Lucro gerado em background: $${offlineProfit.toFixed(4)}`,
                read: false,
                time: new Date().toLocaleTimeString()
              });
            }
        }
      }
      
      const mergedUser = {
        ...user,
        ...parsed,
        wallets: parsed.wallets || user.wallets,
        email: parsed.email || user.email,
        gameCredits: currentCredits,
        quantumStats: parsed.quantumStats || { highScore: 0, totalSparks: 0 }
      };
      
      setUser({ ...mergedUser, lastLogin: Date.now() });
      setLang(parsed.lang || 'pt');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('app_mvp_data_v8', JSON.stringify({ ...user, lang }));
    }
  }, [user, lang, loading]);

  // Main Background Ticker (Financial Logic) - NETWORK ONLY
  // A lógica de lucro do plano agora é controlada pelo TradingTerminal (a cada 5 min)
  // Mas mantemos a rede aqui pois independe do terminal estar aberto
  useEffect(() => {
    const interval = setInterval(() => {
      if (!user.activePlan) return;

      // Network Simulation
      if (Math.random() < 0.002) { 
         const levelIndex = Math.floor(Math.random() * 10); 
         const networkLevel = NETWORK_PLAN[levelIndex];
         const type = Math.random() > 0.5 ? 'Unilevel' : 'Residual';
         const amount = (Math.random() * 100 * (networkLevel.percent / 100)).toFixed(2); 

         triggerNotification(
             'Rede', 
             `Bônus ${type} Nível ${networkLevel.level}: +$${amount}`,
             'success'
         );
         
         setUser(prev => ({
             ...prev,
             history: [{ 
                 type: type.toLowerCase(), 
                 amount: amount, 
                 date: new Date().toLocaleTimeString(),
                 desc: `Nível ${networkLevel.level} (${networkLevel.percent}%)`
             }, ...prev.history]
         }));
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [user.activePlan]);

  // --- FUNÇÕES AUXILIARES ---

  const triggerNotification = (title, msg, type = 'info') => {
    const newNotif = { id: Date.now(), title, msg, read: false, time: new Date().toLocaleTimeString(), type };
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

  const formatFDT = (val) => {
    return `${Math.floor(val).toLocaleString()} FDT`;
  };

  // --- SYNC HFT (A cada 1 min) ---
  const handleHftSync = (profit, opsCount) => {
     if (profit === 0 && opsCount === 0) return;

     const now = new Date();
     const timeString = now.toLocaleTimeString();

     setUser(prev => {
         // Evitar duplicidade de registros no mesmo segundo (React StrictMode ou Timer Glitch)
         const lastEntry = prev.history[0];
         if (lastEntry && 
             lastEntry.type === 'hft_profit' && 
             lastEntry.date === timeString &&
             lastEntry.amount === profit.toFixed(4)) {
             return prev;
         }

         return {
            ...prev,
            activePlan: {
                ...prev.activePlan,
                accumulated: (prev.activePlan?.accumulated || 0) + profit
            },
            history: [
                { 
                    id: Date.now(),
                    type: 'hft_profit', 
                    amount: profit.toFixed(4), 
                    date: timeString, 
                    desc: `Ciclo 1min (${opsCount} ops)` 
                }, 
                ...prev.history
            ]
         };
     });

     const sign = profit >= 0 ? '+' : '';
     triggerNotification(
         'HFT Report', 
         `Ciclo finalizado: ${opsCount} operações. Lucro: ${sign}$${profit.toFixed(4)}`,
         profit >= 0 ? 'success' : 'error'
     );
  };

  // --- AÇÕES DO USUÁRIO ---

  const handleActivatePlan = (plan, customAmount) => {
    const amount = customAmount || plan.min;
    
    if (user.balances.usdt < amount) {
      triggerNotification('Erro', 'Saldo USDT insuficiente.', 'error');
      return;
    }

    if (user.activePlan) {
        // UPGRADE LOGIC
        setUser(prev => ({
            ...prev,
            balances: { ...prev.balances, usdt: prev.balances.usdt - amount },
            activePlan: {
                ...prev.activePlan,
                planId: plan.id, // Switch to new plan tier if applicable
                amount: prev.activePlan.amount + amount
            },
            history: [{ 
                type: 'plan_upgrade', 
                amount: amount, 
                date: new Date().toLocaleTimeString(), 
                desc: `Upgrade ${plan.name} (Total: $${(prev.activePlan.amount + amount).toFixed(2)})` 
            }, ...prev.history]
        }));
        triggerNotification('Sucesso', `Upgrade realizado! Novo capital: $${(user.activePlan.amount + amount).toFixed(2)}`, 'success');
    } else {
        // NEW ACTIVATION
        setUser(prev => ({
            ...prev,
            balances: { ...prev.balances, usdt: prev.balances.usdt - amount },
            activePlan: {
                planId: plan.id,
                amount: amount,
                startAt: Date.now(),
                accumulated: 0
            },
            history: [{ type: 'plan_activation', amount: amount, date: new Date().toLocaleTimeString(), desc: plan.name }, ...prev.history]
        }));
        triggerNotification('Sucesso', `${plan.name} ativado com $${amount}!`, 'success');
    }
    setView('home');
  };

  const handleGamePlay = () => {
    if (user.balances.fdt < CONFIG.gameCost) {
      triggerNotification('Game', 'FDT Insuficiente.', 'error');
      return;
    }

    const win = Math.random() > 0.5;
    const reward = win ? CONFIG.gameCost * 2 : 0;

    setUser(prev => ({
      ...prev,
      balances: { ...prev.balances, fdt: prev.balances.fdt - CONFIG.gameCost + reward }
    }));

    if (win) triggerNotification('Game', `${t.win} ${CONFIG.gameCost * 2} FDT!`, 'success');
    else triggerNotification('Game', t.lose, 'error');
  };

  const handleVaultResult = (win, amount) => {
    setUser(prev => {
      let newBalance = prev.balances.fdt;
      let historyItem = null;

      if (win) {
         // Ganhou: Recebe o dobro do valor apostado (lucro líquido = amount)
         // Como o custo foi "apostado", se ele já foi debitado antes, aqui creditamos 2x.
         // Se não foi debitado antes (estratégia atual), aqui creditamos apenas o lucro (amount).
         // Vamos assumir que o débito ocorre no momento do resultado para simplificar (ou seja, se perder, debita amount).
         // Se ganhar, ganha amount (o saldo original se mantém + lucro).
         
         // Lógica simplificada:
         // Se Win: Saldo += amount (Lucro)
         // Se Loss: Saldo -= amount (Prejuízo)
         
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
        balances: { ...prev.balances, fdt: newBalance },
        history: [historyItem, ...prev.history]
      };
    });

    if (win) triggerNotification('Vault Hacker', `SYSTEM HACKED! +${amount} FDT`, 'success');
    else triggerNotification('Vault Hacker', `ACCESS DENIED! -${amount} FDT`, 'error');
  };

  const handleQuantumGameOver = (score, sparks) => {
    setUser(prev => {
      const newHighScore = Math.max(prev.quantumStats?.highScore || 0, score);
      const newTotalSparks = (prev.quantumStats?.totalSparks || 0) + sparks;
      
      // Consumir 1 crédito ao terminar (ou ao iniciar, mas aqui garante que jogou)
      // Ajuste: Melhor consumir ao iniciar, mas como o estado é local no GameView, 
      // vamos deduzir aqui para simplificar a integração sem callbacks complexos de start.
      // Se quiséssemos ser estritos, deduziríamos no Start. 
      // Vamos deduzir aqui considerando que "Game Over" implica que uma partida ocorreu.
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
    const COST = 50; // 50 FDT por recarga
    if (user.balances.fdt < COST) {
       triggerNotification('Loja', 'Saldo FDT insuficiente (Req: 50 FDT)', 'error');
       return;
    }
    
    setUser(prev => ({
       ...prev,
       balances: { ...prev.balances, fdt: prev.balances.fdt - COST },
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

  const handleSwapAction = (amount, direction = 'fdtToUsd') => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;
    
    const rate = CONFIG.fdtRate;

    if (direction === 'fdtToUsd') {
      if (user.balances.fdt < numAmount) {
        triggerNotification('Erro', 'Saldo FDT insuficiente.', 'error');
        return;
      }

      const usdAmount = numAmount / rate;

      setUser(prev => ({
        ...prev,
        balances: { 
          ...prev.balances, 
          fdt: prev.balances.fdt - numAmount,
          usdt: prev.balances.usdt + usdAmount
        },
        history: [{ type: 'swap', amount: usdAmount, date: new Date().toLocaleTimeString(), desc: `${numAmount} FDT -> USD` }, ...prev.history]
      }));
      triggerNotification('Sucesso', `Troca realizada: +$${usdAmount.toFixed(2)}`, 'success');
      return;
    }

    if (user.balances.usdt < numAmount) {
      triggerNotification('Erro', 'Saldo USDT insuficiente.', 'error');
      return;
    }

    const fdtAmount = numAmount * rate;

    setUser(prev => ({
      ...prev,
      balances: { 
        ...prev.balances, 
        usdt: prev.balances.usdt - numAmount,
        fdt: prev.balances.fdt + fdtAmount
      },
      history: [{ type: 'swap', amount: fdtAmount, date: new Date().toLocaleTimeString(), desc: `$${numAmount.toFixed(2)} USD -> ${fdtAmount} FDT` }, ...prev.history]
    }));
    triggerNotification('Sucesso', `Troca realizada: +${fdtAmount} FDT`, 'success');
  };


  // --- SUB-COMPONENTES (Renderização) ---

  const Header = () => (
    <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_10px_#3b82f6] overflow-hidden">
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

  const HomeView = () => (
    <div className="space-y-6 animate-fadeIn pb-24">
      <div className="text-center mt-4">
        <p className="text-gray-400 text-sm">{t.balance}</p>
        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
          {formatCurrency(user.balances.usdt + user.balances.usdc + (user.activePlan?.accumulated || 0))}
        </h1>
        {user.activePlan && (
          <div className="text-green-400 text-sm mt-1 animate-pulse">
            +{formatCurrency(user.activePlan.accumulated)} {t.profit}
          </div>
        )}
      </div>

      {/* Condicional: Se tiver plano ativo, mostra Terminal HFT, senão, visual padrão */}
      {/* Passamos o onSync para que o terminal atualize o saldo a cada 5 min */}
      {user.activePlan ? <TradingTerminal activePlan={user.activePlan} onSync={handleHftSync} /> : <RobotVisual />}

      <div className="flex justify-center">
        <button 
          onClick={() => setView('plans')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.6)] transform hover:scale-105 transition active:scale-95 border-b-4 border-blue-800"
        >
          {user.activePlan ? 'UPGRADE PLAN' : t.choosePlan}
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 gap-4 px-4 mb-6">
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center">
           <Activity className="text-blue-400 mb-2" size={24} />
           <span className="text-xs text-gray-400">Yield Today</span>
           <span className="text-white font-bold text-lg">
             {user.activePlan ? '+2.41%' : '0.00%'}
           </span>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex flex-col items-center">
           <Users className="text-purple-400 mb-2" size={24} />
           <span className="text-xs text-gray-400">Active Directs</span>
           <span className="text-white font-bold text-lg">12</span>
        </div>
      </div>

      {/* Latest Activity Feed */}
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
    <div className={`fixed inset-y-0 right-0 w-80 bg-gray-900 shadow-2xl z-[60] transform transition-transform duration-300 border-l border-gray-700 ${showNotif ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-white font-bold">{t.notifications}</h3>
        <button onClick={() => setShowNotif(false)} className="text-gray-400 hover:text-white"><Minus size={20} className="rotate-45" /></button>
      </div>
      <div className="p-4 space-y-3 h-full overflow-y-auto pb-20">
        {user.notifications.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">Tudo limpo por aqui.</p>
        ) : (
          user.notifications.map(n => (
            <div key={n.id} className="bg-gray-800 p-3 rounded-lg border-l-4 border-blue-500">
              <h4 className="text-gray-200 text-sm font-bold">{n.title}</h4>
              <p className="text-gray-400 text-xs mt-1">{n.msg}</p>
              <span className="text-gray-600 text-[10px] mt-2 block text-right">{n.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
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
                        localStorage.removeItem('app_mvp_data_v8');
                        localStorage.removeItem('hft_cycle_state_v2');
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

  const ReportsView = () => (
    <div className="px-4 pb-24 pt-4 animate-fadeIn">
       <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setView('menu')} className="text-gray-400 hover:text-white"><ChevronRight className="rotate-180" /></button>
        <h2 className="text-2xl font-bold text-white">{t.reports}</h2>
      </div>

      {/* Mock Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap">Todas</button>
        <button className="bg-gray-800 text-gray-400 px-4 py-2 rounded-lg text-sm whitespace-nowrap">Entradas</button>
        <button className="bg-gray-800 text-gray-400 px-4 py-2 rounded-lg text-sm whitespace-nowrap">Saídas</button>
        <button className="bg-gray-800 text-gray-400 px-4 py-2 rounded-lg text-sm whitespace-nowrap">Bots</button>
      </div>

      <div className="space-y-3">
          {user.history.map((tx, idx) => (
              <div key={idx} className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' : tx.type.includes('bonus') || tx.type === 'unilevel' || tx.type === 'residual' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {tx.type === 'deposit' ? <Plus size={14} /> : (tx.type === 'unilevel' || tx.type === 'residual') ? <Users size={14} /> : <Activity size={14} />}
                  </div>
                  <div>
                    <p className="text-white text-sm capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-gray-500 text-xs">{tx.date}</p>
                  </div>
                </div>
                <span className={`font-mono ${tx.type === 'deposit' || tx.type === 'unilevel' || tx.type === 'residual' ? 'text-green-400' : 'text-white'}`}>
                  {tx.type === 'deposit' || tx.type === 'unilevel' || tx.type === 'residual' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
      </div>
    </div>
  );

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 p-2 z-40">
      <div className="flex justify-around items-center">
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
      className={`flex flex-col items-center p-2 transition ${active ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
    >
      <Icon size={20} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-mono">INITIALIZING SYSTEM...</div>;

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30 overflow-hidden relative">
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
      
      <Header />
      
      <main className="max-w-md mx-auto h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar relative">
        {view === 'home' && <HomeView />}
        
        {view === 'game' && (
          <GameView 
            t={t} 
            user={user} 
            handleGamePlay={handleGamePlay} 
            handleQuantumGameOver={handleQuantumGameOver}
            handleVaultResult={handleVaultResult}
            handleBuyCredits={handleBuyCredits}
            formatFDT={formatFDT}
          />
        )}
        
        {view === 'plans' && <PlansView t={t} handleActivatePlan={handleActivatePlan} user={user} userBalance={user.balances.usdt} />}
        
        {view === 'wallet' && (
          <WalletView 
            t={t} 
            user={user} 
            formatCurrency={formatCurrency} 
            formatFDT={formatFDT}
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

      <BottomNav />
      <NotificationsPanel />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[70] animate-slideDown w-[90%] max-w-sm pointer-events-none">
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
  );
}

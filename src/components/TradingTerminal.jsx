'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Activity, ShieldCheck, Zap, ArrowUp, ArrowDown, Clock } from 'lucide-react';

export const TradingTerminal = ({ activePlan, onSync }) => {
  const [price, setPrice] = useState(1.0542);
  const [history, setHistory] = useState(Array(40).fill(1.0542));
  const [ops, setOps] = useState([]);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [opsCount, setOpsCount] = useState(0);
  const [trend, setTrend] = useState('bull');
  const [minuteTimeLeft, setMinuteTimeLeft] = useState(60);
  const [minuteReport, setMinuteReport] = useState(null);
  const [currentMinuteStats, setCurrentMinuteStats] = useState({ wins: 0, losses: 0, profit: 0, ops: 0 });
  
  const priceRef = useRef(1.0542);
  const profitBufferRef = useRef(0); // Para acumular lucro sem re-renderizar tudo
  const opsCountRef = useRef(0); // Ref para acesso síncrono no timer
  const cycleStartRef = useRef(Date.now()); // Para rastrear início do ciclo
  const currentMinuteStatsRef = useRef({ wins: 0, losses: 0, profit: 0, ops: 0 }); // Ref para evitar dependências circulares

  // Recuperar estado ao montar ou iniciar
  useEffect(() => {
    const savedState = localStorage.getItem('hft_cycle_state_v2');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        
        // Validar se o estado salvo pertence ao plano atual
        if (parsed.planId !== activePlan.planId) {
            // Se mudou de plano, descarta o estado anterior e inicia novo
            localStorage.removeItem('hft_cycle_state_v2');
            cycleStartRef.current = Date.now();
            return;
        }

        const now = Date.now();
        const elapsed = (now - parsed.startTime) / 1000;
        
        if (elapsed < 60) {
           // Ciclo ainda válido
           const remaining = Math.max(0, 60 - Math.floor(elapsed));
           setMinuteTimeLeft(remaining);
           cycleStartRef.current = parsed.startTime;
           
           // Restore lastSimTimeRef to ensure catch-up works on reload
           if (parsed.lastUpdate) {
               lastSimTimeRef.current = parsed.lastUpdate;
           }
           
           // Restaurar acumulados visuais
           if (parsed.profit) {
             setSessionProfit(parsed.profit);
             profitBufferRef.current = parsed.profit;
           }
           if (parsed.ops) {
             setOpsCount(parsed.ops);
             opsCountRef.current = parsed.ops;
             // Se tiver operações salvas, restaurar (opcional, mas bom para UX)
             if (parsed.opsList) setOps(parsed.opsList);
           }
        } else {
           // Ciclo expirou enquanto estava fora
           // Processar o que tinha acumulado no storage
           if (parsed.profit !== 0 || parsed.ops > 0) {
              onSync(parsed.profit, parsed.ops);
           }
           // Iniciar novo ciclo
           cycleStartRef.current = now;
           localStorage.removeItem('hft_cycle_state_v2');
        }
      } catch (e) {
        console.error("Erro ao recuperar estado HFT", e);
        cycleStartRef.current = Date.now();
      }
    } else {
      cycleStartRef.current = Date.now();
    }
  }, [activePlan.planId]); // Executa na montagem ou se mudar o plano

  // Salvar estado periodicamente
  useEffect(() => {
    const saveInterval = setInterval(() => {
       const state = {
         planId: activePlan.planId, // Salva ID do plano para validação
         startTime: cycleStartRef.current,
         profit: profitBufferRef.current,
         ops: opsCountRef.current,
         opsList: ops.slice(0, 10), // Salvar últimas ops para restaurar visual
         lastUpdate: Date.now()
       };
       localStorage.setItem('hft_cycle_state_v2', JSON.stringify(state));
    }, 2000); // Salva a cada 2s

    return () => clearInterval(saveInterval);
  }, [ops, activePlan.planId]);

  const trendRef = useRef('bull');
  const lastSimTimeRef = useRef(Date.now());

  // Main HFT Engine Loop (Timer + Simulation + Catch-up)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const cycleStart = cycleStartRef.current;
      const elapsed = (now - cycleStart) / 1000;
      
      // --- 1. Cycle Management ---
      if (elapsed >= 60) {
        // End of Cycle
        const stats = currentMinuteStatsRef.current;
        setMinuteReport({
            ...stats,
            timestamp: new Date().toLocaleTimeString(),
            id: now
        });
        
        if (profitBufferRef.current !== 0 || opsCountRef.current > 0) {
             onSync(profitBufferRef.current, opsCountRef.current);
             profitBufferRef.current = 0;
             opsCountRef.current = 0;
        }

        // Reset
        cycleStartRef.current = now;
        lastSimTimeRef.current = now; 
        currentMinuteStatsRef.current = { wins: 0, losses: 0, profit: 0, ops: 0 };
        setCurrentMinuteStats({ wins: 0, losses: 0, profit: 0, ops: 0 });
        setMinuteTimeLeft(60);
        return; 
      }
      
      setMinuteTimeLeft(Math.max(0, 60 - Math.floor(elapsed)));

      // --- 2. Simulation Catch-up ---
      const timeSinceLastSim = now - lastSimTimeRef.current;
      // We target ~1 step per 1000ms
      const stepDuration = 1000; 
      const stepsToCatchUp = Math.floor(timeSinceLastSim / stepDuration);
      
      if (stepsToCatchUp > 0) {
         for (let i = 0; i < stepsToCatchUp; i++) {
             simulateStep();
         }
         lastSimTimeRef.current += stepsToCatchUp * stepDuration;
      }
      
    }, 1000); 

    return () => clearInterval(interval);
  }, [activePlan, onSync]);

  const simulateStep = () => {
      // 1. Simulação de Preço
      const volatility = 0.0005;
      const trendBias = trendRef.current === 'bull' ? 0.0002 : -0.0002;
      const change = priceRef.current * (volatility * (Math.random() - 0.5) + trendBias);
      const newPrice = priceRef.current + change;
      
      priceRef.current = newPrice;
      setPrice(newPrice);
      setHistory(prev => [...prev.slice(1), newPrice]);

      // Mudar tendência
      if (Math.random() < 0.05) {
          trendRef.current = trendRef.current === 'bull' ? 'bear' : 'bull';
          setTrend(trendRef.current);
      }

      // 2. Execução de Ordens
      if (Math.random() < 0.35) { 
        const exchange = Math.random() > 0.5 ? 'CASATRADE' : 'EXNOVA';
        const randType = Math.random();
        let pair, type, side;
        
        if (randType < 0.80) {
            const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/CAD', 'EUR/JPY', 'USD/CHF', 'NZD/USD'];
            pair = pairs[Math.floor(Math.random() * pairs.length)];
            type = 'BINARY';
        } else if (randType < 0.90) {
            const cryptos = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'DOGE/USD'];
            pair = cryptos[Math.floor(Math.random() * cryptos.length)];
            type = 'CRYPTO';
        } else {
            const stocks = ['AAPL', 'TSLA', 'AMZN', 'GOOGL', 'NVDA', 'MSFT', 'META'];
            pair = stocks[Math.floor(Math.random() * stocks.length)];
            type = 'STOCK';
        }

        const dailyRoiPercent = activePlan.roiTotal / activePlan.duration;
        const targetDailyProfit = activePlan.amount * (dailyRoiPercent / 100);
        const targetMinuteProfit = targetDailyProfit / 1440; 
        
        const entryAmount = activePlan.amount * 0.001; 
        const payout = 0.90; 

        const currentMinuteProfit = currentMinuteStatsRef.current.profit;
        
        const now = new Date();
        const secondsInMinute = now.getSeconds();
        const expectedProfitNow = (targetMinuteProfit / 60) * secondsInMinute;

        let isWin;
        
        if (currentMinuteProfit < expectedProfitNow - (entryAmount * 2)) {
             isWin = true;
        } 
        else if (currentMinuteProfit > expectedProfitNow + (entryAmount * 3)) {
             isWin = false;
        } 
        else {
             const baseWinRate = 0.58; 
             const noise = (Math.random() - 0.5) * 0.10; 
             isWin = Math.random() < (baseWinRate + noise);
        }

        side = trendRef.current === 'bull' ? 'CALL' : 'PUT';
        
        const pnl = isWin ? (entryAmount * payout) : -entryAmount;

        const newOp = {
          id: Date.now() + Math.random(), // Ensure unique ID in fast loop
          exchange,
          pair,
          type,
          side,
          pnl: pnl,
          time: new Date().toLocaleTimeString()
        };

        setOps(prev => [newOp, ...prev.slice(0, 6)]); 
        
        setSessionProfit(p => p + pnl);
        profitBufferRef.current += pnl;
        
        opsCountRef.current += 1;
        setOpsCount(c => c + 1);

        currentMinuteStatsRef.current.ops += 1;
        currentMinuteStatsRef.current.profit += pnl;
        if (isWin) currentMinuteStatsRef.current.wins += 1;
        else currentMinuteStatsRef.current.losses += 1;
        
        setCurrentMinuteStats(prev => ({
            ...prev,
            ops: prev.ops + 1,
            profit: prev.profit + pnl,
            wins: isWin ? prev.wins + 1 : prev.wins,
            losses: isWin ? prev.losses : prev.losses + 1
        }));
      }
  };

  // SVG Chart Logic
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = (max - min) || 1; // Evita divisão por zero
  const points = history.length > 1 
    ? history.map((p, i) => {
        const x = (i / (history.length - 1)) * 300;
        const y = 100 - ((p - min) / range) * 80;
        return `${x},${y}`;
      }).join(' ')
    : "0,100 300,100"; // Fallback para gráfico vazio


  const formatTime = (seconds) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-md mx-auto my-6 animate-fadeIn px-2 sm:px-0">
      {/* Container Principal com Efeito Glassmorphism e Borda Neon */}
      <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.15)] overflow-hidden relative">
        
        {/* Header do Terminal */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 animate-pulse"></div>
              <Cpu className="text-blue-400 relative z-10" size={20} />
            </div>
            <div>
              <h3 className="text-white font-black font-mono text-sm tracking-widest">HFT ENGINE V4.0</h3>
              <p className="text-[10px] text-blue-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                RUNNING
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-gray-500 font-mono mb-1">REPORT IN</span>
             <div className="bg-gray-800 border border-gray-600 rounded px-2 py-1 flex items-center gap-2">
                <Clock size={12} className="text-yellow-400" />
                <span className={`text-xs font-mono font-bold ${minuteTimeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {Math.floor(minuteTimeLeft)}s
                </span>
             </div>
          </div>
        </div>

        {/* Display Principal (Preço e PnL Sessão) */}
        <div className="p-5 relative">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-gray-400 text-[10px] font-mono mb-1 flex items-center gap-1">
                <Activity size={10} /> EUR/USD (OTC)
              </p>
              <h2 className={`text-4xl font-mono font-black tracking-tighter ${history[history.length-1] > history[history.length-2] ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]'}`}>
                {price.toFixed(5)}
              </h2>
            </div>
            <div className="text-right bg-gray-800/50 p-2 rounded-lg border border-gray-700/50 backdrop-blur-sm">
               <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Total Equity</p>
               <p className="text-xl font-bold font-mono text-white">
                 ${(activePlan.amount + (activePlan.accumulated || 0) + sessionProfit).toFixed(2)}
               </p>
               <p className="text-[9px] text-gray-500 mt-1">
                 Invested: <span className="text-blue-400">${activePlan.amount.toFixed(2)}</span>
               </p>
            </div>
          </div>

          {/* Gráfico Dinâmico */}
          <div className="h-32 w-full bg-gradient-to-b from-gray-800/20 to-transparent rounded-xl border border-gray-800/50 relative overflow-hidden mb-5 shadow-inner">
             {/* Grid */}
             <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-5 pointer-events-none">
                {[...Array(24)].map((_, i) => <div key={i} className="border border-gray-500"></div>)}
             </div>
             
             <svg viewBox="0 0 300 100" className="w-full h-full relative z-10" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={trend === 'bull' ? '#4ade80' : '#f87171'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={trend === 'bull' ? '#4ade80' : '#f87171'} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon 
                   fill="url(#chartGradient)" 
                   points={`${points} 300,100 0,100`} 
                />
                <polyline 
                   fill="none" 
                   stroke={trend === 'bull' ? '#4ade80' : '#f87171'} 
                   strokeWidth="2" 
                   points={points} 
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   className="drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]"
                />
             </svg>
             
             {/* Ping Indicador */}
             <div className={`absolute right-0 top-1/2 w-1.5 h-1.5 rounded-full ${trend === 'bull' ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-red-400 shadow-[0_0_10px_#f87171]'} animate-ping`}></div>
          </div>

          {/* Relatório do Último Minuto */}
          {minuteReport && (
            <div className="mb-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-2 flex justify-between items-center animate-fadeIn shadow-lg backdrop-blur-md">
                <div className="flex flex-col">
                    <span className="text-[9px] text-blue-300 font-bold uppercase tracking-wider">Minute Report</span>
                    <span className="text-[9px] text-gray-400 font-mono">{minuteReport.timestamp}</span>
                </div>
                <div className="flex gap-4 text-xs font-mono bg-black/20 px-3 py-1 rounded-md">
                    <div className="text-center">
                        <span className="text-[8px] text-gray-500 block uppercase">Wins</span>
                        <span className="text-green-400 font-bold">{minuteReport.wins}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-[8px] text-gray-500 block uppercase">Loss</span>
                        <span className="text-red-400 font-bold">{minuteReport.losses}</span>
                    </div>
                    <div className="text-center pl-2 border-l border-gray-700">
                        <span className="text-[8px] text-gray-500 block uppercase">Net P&L</span>
                        <span className={`${minuteReport.profit >= 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>
                            {minuteReport.profit >= 0 ? '+' : ''}{minuteReport.profit.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
          )}

          {/* Lista de Operações (Scrollável e Responsiva) */}
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] text-gray-500 uppercase font-bold px-3 py-1 bg-gray-800/50 rounded">
              <span>Pair / Exchange</span>
              <span className="text-center">Side / Type</span>
              <span className="text-right">P&L (USDT)</span>
            </div>
            
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {ops.map(op => (
                <div key={op.id} className="bg-gray-800/40 hover:bg-gray-800/80 p-2 rounded flex justify-between items-center text-xs font-mono border-l-2 transition-all duration-300" 
                     style={{ borderColor: Number(op.pnl) > 0 ? '#4ade80' : '#f87171' }}>
                   <div className="flex flex-col">
                      <span className="text-gray-200 font-bold">{op.pair}</span>
                      <span className="text-[9px] text-gray-500">{op.exchange}</span>
                   </div>
                   <div className="text-center">
                      <div className={`flex items-center justify-center gap-1 font-bold ${op.side === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                         {op.side === 'LONG' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                         {op.side}
                      </div>
                      <span className="text-[9px] text-blue-300 bg-blue-900/20 px-1 rounded">{op.type}</span>
                   </div>
                   <span className={`${Number(op.pnl) > 0 ? 'text-green-400' : 'text-red-400'} font-bold bg-gray-900/50 px-2 py-1 rounded min-w-[60px] text-right`}>
                     {Number(op.pnl) > 0 ? '+' : ''}{Number(op.pnl).toFixed(4)}
                   </span>
                </div>
              ))}
              {ops.length === 0 && (
                <div className="text-center text-gray-600 text-xs py-4 font-mono">
                   Aguardando entrada de ordens...
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="bg-black/40 backdrop-blur p-3 flex justify-between text-[9px] text-gray-400 font-mono border-t border-gray-800">
           <span className="flex items-center gap-1.5">
             <ShieldCheck size={12} className="text-yellow-500"/> 
             PROTECTION: <span className="text-white">AI-GUARD V2</span>
           </span>
           <span className="flex items-center gap-1.5">
             <Zap size={12} className="text-blue-500"/> 
             LATENCY: <span className="text-green-400">12ms</span>
           </span>
           <span className="flex items-center gap-1.5">
             <Activity size={12} className="text-purple-500"/> 
             OPS: <span className="text-white">{opsCount}</span>
           </span>
        </div>
      </div>
    </div>
  );
};

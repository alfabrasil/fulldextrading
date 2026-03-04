import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowRight, 
  Menu, 
  X, 
  Activity, 
  BarChart3, 
  Coins, 
  Users, 
  Gamepad2, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export function LandingPage({ onNavigate }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Efeito para navbar mudar de cor ao rolar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (e) => {
    e.preventDefault();
    onNavigate();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* --- NAVBAR --- */}
      <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${isScrolled ? 'bg-black/80 backdrop-blur-md border-gray-800 py-3' : 'bg-transparent border-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">
              VDEX<span className="text-blue-500">TRADING</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#sobre" className="text-sm font-medium text-gray-400 hover:text-white transition">Quem Somos</a>
            <a href="#como-funciona" className="text-sm font-medium text-gray-400 hover:text-white transition">Como Funciona</a>
            <a href="#robos" className="text-sm font-medium text-gray-400 hover:text-white transition">Nossos Robôs</a>
            <a href="#rede" className="text-sm font-medium text-gray-400 hover:text-white transition">Plano de Negócios</a>
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex">
            <button 
              onClick={handleNav}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition transform hover:scale-105 flex items-center gap-2"
            >
              Acessar Sistema <ArrowRight size={16} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-300 hover:text-white">
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-gray-900 border-b border-gray-800 p-4 flex flex-col gap-4 shadow-2xl animate-fade-in">
            <a href="#sobre" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 font-medium py-2 border-b border-gray-800">Quem Somos</a>
            <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 font-medium py-2 border-b border-gray-800">Como Funciona</a>
            <a href="#robos" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 font-medium py-2 border-b border-gray-800">Nossos Robôs</a>
            <a href="#rede" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 font-medium py-2 border-b border-gray-800">Plano de Negócios</a>
            <button 
              onClick={(e) => { setMobileMenuOpen(false); handleNav(e); }}
              className="mt-2 bg-blue-600 text-white font-bold py-3 rounded-xl text-center shadow-lg flex justify-center items-center gap-2"
            >
              Criar Conta Grátis <ArrowRight size={18} />
            </button>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Texto Hero */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Tecnologia + Estratégia = Oportunidade
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter mb-6">
                O Futuro do <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Trading Automatizado
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                A Vdextrading une tecnologia, inteligência artificial e o mercado financeiro em um único ecossistema automatizado. Deixe nossos robôs operarem 24/7 para você.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={handleNav}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg py-4 px-8 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.4)] transition transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Começar a Lucrar <ChevronRight size={20} />
                </button>
                <a 
                  href="#robos" 
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg py-4 px-8 rounded-full border border-gray-700 transition flex items-center justify-center"
                >
                  Ver Estratégias
                </a>
              </div>
            </div>

            {/* Ilustração / Abstract Visual MVP */}
            <div className="relative hidden md:block mt-10 lg:mt-0">
              <div className="w-full aspect-square max-w-[450px] mx-auto relative scale-105">
                {/* Rings / Radar */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full border-[0.5px] border-blue-900/40 animate-[spin_50s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] h-[95%] rounded-full border-[1px] border-teal-500/20 border-dashed animate-[spin_40s_linear_infinite_reverse]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full border-[0.5px] border-blue-700/30 animate-[spin_30s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45%] h-[45%] rounded-full border-[1px] border-cyan-500/30 border-dotted animate-pulse"></div>
                
                {/* Center Core */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="w-40 h-40 bg-gradient-to-bl from-[#1e293b] to-[#0b1120] rounded-[2rem] border border-gray-700/50 shadow-[0_0_80px_rgba(37,99,235,0.2)] flex items-center justify-center transform -rotate-12 relative overflow-hidden transition-transform duration-700 hover:rotate-0 hover:scale-105">
                    <div className="absolute inset-0 bg-blue-500/10"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent"></div>
                    <Cpu size={64} className="text-blue-400 relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Floating Cards */}
                <div className="absolute top-[5%] right-[-15%] z-30 bg-[#0f172a] border border-gray-700/60 px-6 py-4 rounded-2xl shadow-2xl animate-[bounce_5s_infinite]" style={{ animationDuration: '5s' }}>
                  <p className="text-xs text-gray-400 font-medium mb-1 tracking-wide">Lucro Estimado</p>
                  <p className="text-3xl font-black text-[#4ade80] drop-shadow-[0_0_8px_rgba(74,222,128,0.2)]">+210%</p>
                </div>
                
                <div className="absolute bottom-[10%] left-[-15%] z-30 bg-[#0f172a] border border-gray-700/60 px-6 py-4 rounded-2xl shadow-2xl animate-[bounce_6s_infinite]" style={{ animationDuration: '6s', animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <Activity className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" size={24} strokeWidth={2} />
                    <span className="text-base font-bold text-white tracking-wide">100% Automação</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- STATS / TRUST BAR --- */}
      <div className="border-y border-gray-800 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-black text-white">24/7</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Operação Contínua</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">3</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Mercados Globais</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">100%</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Automatizado</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white flex justify-center items-center"><Zap size={28} className="text-yellow-400 mr-1" /> Instantâneo</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Saques Diários</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- QUEM SOMOS & COMO FUNCIONA --- */}
      <section id="sobre" className="py-20 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Texto História */}
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                Reduzindo o Fator Emocional nas Operações
              </h2>
              <div className="space-y-6 text-gray-400 leading-relaxed">
                <p>
                  A <strong className="text-white">Vdextrading</strong> foi criada por um grupo de programadores e analistas de mercado que enxergaram a necessidade urgente de evolução. Surgimos após anos de estudos e testes no mercado financeiro digital.
                </p>
                <p>
                  Com o crescimento da automação, estruturamos um sistema que integra inteligência artificial com análise técnica. Nosso propósito é oferecer tecnologia aplicada, reduzindo o estresse e a necessidade de acompanhamento manual constante.
                </p>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  <ShieldCheck className="text-blue-500" size={24} />
                  <span className="text-sm text-gray-300 font-medium">Algoritmos avançados sem viés emocional</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  <Activity className="text-blue-500" size={24} />
                  <span className="text-sm text-gray-300 font-medium">Análise de volatilidade em tempo real</span>
                </div>
              </div>
            </div>

            {/* Como Funcionamos (Cards) */}
            <div id="como-funciona" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-blue-900/20 to-transparent p-6 rounded-2xl border border-blue-500/20">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Globe className="text-blue-400" /> Atuação Global
                  </h3>
                  <p className="text-sm text-gray-400">Atuamos em três grandes eixos do mercado financeiro de forma 100% automatizada e ininterrupta.</p>
               </div>
               
               <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                  <Coins className="text-yellow-500 mb-4" size={32} />
                  <h4 className="text-white font-bold mb-1">Criptomoedas</h4>
                  <p className="text-xs text-gray-500">Alta volatilidade e operações 24/7 focadas em precisão.</p>
               </div>
               
               <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                  <BarChart3 className="text-green-500 mb-4" size={32} />
                  <h4 className="text-white font-bold mb-1">Bolsa de Valores</h4>
                  <p className="text-xs text-gray-500">Acompanhamento de tendências e ativos consolidados.</p>
               </div>
               
               <div className="col-span-1 sm:col-span-2 bg-gray-900 p-6 rounded-2xl border border-gray-800 flex items-center gap-4">
                  <Zap className="text-purple-500 shrink-0" size={32} />
                  <div>
                    <h4 className="text-white font-bold mb-1">Opções Binárias</h4>
                    <p className="text-xs text-gray-500">Modelo preditivo aplicado a micro variações de curtíssimo prazo.</p>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- ROBÔS / PLANOS --- */}
      <section id="robos" className="py-20 relative bg-gray-900/20 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Escolha seu Robô</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Nossa frota de IAs foi desenhada para diferentes perfis e mercados. Escolha a estratégia que melhor se adequa ao seu capital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* PLANO 1 */}
            <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden flex flex-col transition hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] relative">
              <div className="p-8 flex-1">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl border border-blue-500/30 flex items-center justify-center mb-6">
                  <Cpu className="text-blue-400" size={28} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Quantum Pulse AI</h3>
                <p className="text-sm text-gray-400 mb-6 min-h-[40px]">Focado em estratégias de alta volatilidade no mercado de Criptomoedas.</p>
                
                <div className="bg-black/50 rounded-xl p-4 mb-6 border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Lucro Estimado</p>
                  <p className="text-4xl font-black text-blue-400">40% <span className="text-sm text-gray-500 font-medium">/ 30 dias</span></p>
                </div>

                <ul className="space-y-3 text-sm text-gray-300 mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> 30% lucro do capital p/ Investidor</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-gray-600" /> 10% lucro do capital p/ Sistema</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Mínimo: $10 USDT</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Máximo: $1.000 USDT</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-800/50 border-t border-gray-800">
                <button onClick={handleNav} className="block w-full text-center bg-gray-800 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition">
                  Ativar Quantum
                </button>
              </div>
            </div>

            {/* PLANO 2 */}
            <div className="bg-gray-900 rounded-3xl border border-cyan-500/50 overflow-hidden flex flex-col transition shadow-[0_0_30px_rgba(6,182,212,0.1)] relative transform md:-translate-y-4">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
              <div className="absolute top-4 right-4 bg-cyan-500/20 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/30">
                POPULAR
              </div>
              
              <div className="p-8 flex-1">
                <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 flex items-center justify-center mb-6">
                  <TrendingUp className="text-cyan-400" size={28} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Alpha Trend Pro</h3>
                <p className="text-sm text-gray-400 mb-6 min-h-[40px]">Especialista em acompanhar tendências na Bolsa de Valores.</p>
                
                <div className="bg-black/50 rounded-xl p-4 mb-6 border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Lucro Estimado</p>
                  <p className="text-4xl font-black text-cyan-400">120% <span className="text-sm text-gray-500 font-medium">/ 60 dias</span></p>
                </div>

                <ul className="space-y-3 text-sm text-gray-300 mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> 100% lucro do capital p/ Investidor</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-gray-600" /> 20% lucro do capital p/ Sistema</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-500" /> Mínimo: $10 USDT</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-cyan-500" /> Máximo: $5.000 USDT</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-800/50 border-t border-gray-800">
                <button onClick={handleNav} className="block w-full text-center bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg transition">
                  Ativar Alpha
                </button>
              </div>
            </div>

            {/* PLANO 3 */}
            <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden flex flex-col transition hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] relative">
              <div className="p-8 flex-1">
                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl border border-purple-500/30 flex items-center justify-center mb-6">
                  <Zap className="text-purple-400" size={28} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Binary Storm X</h3>
                <p className="text-sm text-gray-400 mb-6 min-h-[40px]">Modelo preditivo para micro variações em Opções Binárias.</p>
                
                <div className="bg-black/50 rounded-xl p-4 mb-6 border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Lucro Estimado</p>
                  <p className="text-4xl font-black text-purple-400">210% <span className="text-sm text-gray-500 font-medium">/ 90 dias</span></p>
                </div>

                <ul className="space-y-3 text-sm text-gray-300 mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> 180% lucro do capital p/ Investidor</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-gray-600" /> 30% lucro do capital p/ Sistema</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-500" /> Mínimo: $10 USDT</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-500" /> Máximo: $10.000 USDT</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-800/50 border-t border-gray-800">
                <button onClick={handleNav} className="block w-full text-center bg-gray-800 hover:bg-purple-600 text-white font-bold py-3 rounded-xl transition">
                  Ativar Binary
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- ECOSSISTEMA E REDE --- */}
      <section id="rede" className="py-20 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-gray-800 p-8 md:p-12 shadow-2xl overflow-hidden relative">
            {/* Bg effect */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h2 className="text-3xl font-black text-white mb-4">Plano de Afiliados Exclusivo</h2>
                <p className="text-gray-400 mb-6">
                  Reconhecemos o seu trabalho de expansão. Nossa estrutura oferece ganhos profundos em até 10 níveis, tanto na indicação direta quanto no residual.
                </p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <Users className="text-blue-400 mb-2" size={24} />
                    <h4 className="text-white font-bold">Unilevel</h4>
                    <p className="text-xs text-gray-400 mt-1">Ganhos de Indicação</p>
                    <ul className="mt-3 space-y-1 text-xs text-gray-300 font-mono">
                      <li className="flex justify-between border-b border-gray-700 pb-1"><span>1º Nível:</span> <span className="text-blue-400">5%</span></li>
                      <li className="flex justify-between border-b border-gray-700 pb-1"><span>2º Nível:</span> <span className="text-blue-400">2%</span></li>
                      <li className="flex justify-between border-b border-gray-700 pb-1"><span>3º ao 4º:</span> <span className="text-blue-400">1%</span></li>
                      <li className="flex justify-between"><span>5º ao 10º:</span> <span className="text-blue-400">0.5%</span></li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <TrendingUp className="text-green-400 mb-2" size={24} />
                    <h4 className="text-white font-bold">Residual</h4>
                    <p className="text-xs text-gray-400 mt-1">Lucro da sua equipe</p>
                    <ul className="mt-3 space-y-1 text-xs text-gray-300 font-mono">
                      <li className="flex justify-between border-b border-gray-700 pb-1"><span>1º Nível:</span> <span className="text-green-400">5%</span></li>
                      <li className="flex justify-between border-b border-gray-700 pb-1"><span>2º Nível:</span> <span className="text-green-400">2%</span></li>
                      <li className="flex justify-between border-b border-gray-700 pb-1"><span>3º ao 4º:</span> <span className="text-green-400">1%</span></li>
                      <li className="flex justify-between"><span>5º ao 10º:</span> <span className="text-green-400">0.5%</span></li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Taxas do Sistema 📉</h5>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <span className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded border border-gray-700">Saque Rendimento: 3%</span>
                    <span className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded border border-gray-700">Saque Rede: 5%</span>
                    <span className="bg-gray-800 text-red-400 px-3 py-1.5 rounded border border-red-900/50">Saque Capital Antes: 30%</span>
                  </div>
                </div>
              </div>

              {/* Promo Crypto / Games */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-yellow-500/30 shadow-2xl">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                  <Gamepad2 className="text-yellow-500" size={32} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Diversão e Cripto Própria</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Divirta-se com os jogos oficiais da Vdextrading dentro do nosso app. Prepare-se para mudar de vida com o nosso Token utilitário pareado no dólar.
                </p>
                <div className="bg-black/50 p-4 rounded-xl border border-gray-800 text-center">
                  <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Valor Fixo Oficial</span>
                  <span className="text-2xl font-black text-yellow-400 tracking-widest font-mono">$1 = 1000 VDT</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/10"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            O futuro pertence a quem se automatiza hoje.
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Cadastre-se gratuitamente, escolha sua estratégia e veja a Inteligência Artificial trabalhar para o seu capital. Depósitos e saques 100% automatizados e instantâneos.
          </p>
          <button 
            onClick={handleNav}
            className="inline-flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xl py-5 px-10 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.6)] transition transform hover:scale-105 whitespace-nowrap"
          >
            Acessar Plataforma Agora <ArrowRight size={24} />
          </button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-black border-t border-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-blue-500" />
            <span className="text-xl font-black tracking-tighter text-white">
              VDEX<span className="text-blue-500">TRADING</span>
            </span>
          </div>
          <p className="text-xs text-gray-600 text-center md:text-left max-w-lg">
            Aviso de Risco: O mercado financeiro envolve riscos. A Vdextrading fornece ferramentas tecnológicas automatizadas baseadas em probabilidades, não garantindo lucros fixos infalíveis. Opere com responsabilidade.
          </p>
          <div className="text-xs text-gray-500 font-mono">
            © {new Date().getFullYear()} Vdextrading. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

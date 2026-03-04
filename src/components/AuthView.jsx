import React, { useState } from 'react';
import { 
  Zap, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  Globe
} from 'lucide-react';

export function AuthView({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form States
  const [sponsor, setSponsor] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lang, setLang] = useState('pt');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Default User State Structure
    const defaultUserState = {
        balances: { usdt: 0, usdc: 0, vdt: 0 },
        activePlan: null,
        history: [],
        notifications: [],
        wallets: {},
        gameCredits: { daily: 3 },
        quantumStats: { highScore: 0, totalSparks: 0 }
    };
    
    if (isLogin) {
      // Simulação de Login
      if (!email || !password) {
        alert('Preencha todos os campos!');
        return;
      }
      
      const storedUsers = JSON.parse(localStorage.getItem('vdex_users') || '[]');
      const user = storedUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Merge with default state to prevent crashes if user is old/broken
        onLogin({ ...defaultUserState, ...user });
      } else {
        // Fallback para MVP sem cadastro real (usuário padrão)
        if (email === 'trader@alpha.com' && password === '123456') {
           onLogin({ 
               ...defaultUserState,
               name: 'Trader Alpha', 
               email, 
               username: 'traderalpha',
               balances: { usdt: 1000, usdc: 500, vdt: 100 } // Bonus for demo user
            });
        } else {
           alert('Credenciais inválidas!');
        }
      }
    } else {
      // Cadastro
      if (!name || !username || !email || !password || !confirmPassword) {
        alert('Preencha todos os campos obrigatórios!');
        return;
      }
      
      if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
      }

      const newUser = {
        ...defaultUserState,
        name,
        username,
        email,
        password, // Em produção, nunca salvar senha em texto plano!
        sponsor: sponsor || 'VDEX_OFFICIAL',
        lang,
        createdAt: new Date().toISOString()
      };

      // Salvar no LocalStorage
      const storedUsers = JSON.parse(localStorage.getItem('vdex_users') || '[]');
      storedUsers.push(newUser);
      localStorage.setItem('vdex_users', JSON.stringify(storedUsers));

      alert('Cadastro realizado com sucesso! Faça login.');
      setIsLogin(true);
    }
  };

  const handleForgotPassword = () => {
    alert('Função de recuperação simulada: Verifique seu e-mail (mock).');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] mb-4">
            <Zap size={32} className="text-white fill-current" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            VDEX<span className="text-blue-500">TRADING</span>
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            {isLogin ? 'Acesse seu painel de controle' : 'Inicie sua jornada automatizada'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <>
              {/* Sponsor Field */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3 mb-4">
                 <ShieldCheck className="text-blue-400" size={20} />
                 <div className="flex-1">
                    <label className="text-[10px] text-blue-300 uppercase font-bold block">Patrocinador</label>
                    <input 
                      type="text" 
                      placeholder="ID do Patrocinador"
                      className="bg-transparent text-white text-sm font-bold w-full focus:outline-none"
                      value={sponsor}
                      onChange={(e) => setSponsor(e.target.value)}
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-blue-500 focus:outline-none transition"
                      placeholder="Seu Nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 ml-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-blue-500 focus:outline-none transition"
                      placeholder="@usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs text-gray-400 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input 
                type="email" 
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-blue-500 focus:outline-none transition"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-10 pr-10 text-white text-sm focus:border-blue-500 focus:outline-none transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                className="absolute right-3 top-3 text-gray-500 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 pl-10 pr-10 text-white text-sm focus:border-blue-500 focus:outline-none transition"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button 
                  type="button"
                  className="absolute right-3 top-3 text-gray-500 hover:text-white"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Lang Selector */}
          {!isLogin && (
             <div className="flex items-center gap-2 justify-end">
                <Globe size={14} className="text-gray-500" />
                <select 
                  value={lang} 
                  onChange={(e) => setLang(e.target.value)}
                  className="bg-transparent text-gray-400 text-xs focus:outline-none cursor-pointer"
                >
                   <option value="pt">Português</option>
                   <option value="en">English</option>
                   <option value="es">Español</option>
                </select>
             </div>
          )}

          {isLogin && (
            <div className="flex justify-end">
              <button type="button" onClick={handleForgotPassword} className="text-xs text-blue-400 hover:text-blue-300">
                Esqueceu a senha?
              </button>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isLogin ? 'Entrar no Sistema' : 'Criar Minha Conta'} <ArrowRight size={18} />
          </button>

        </form>

        {/* Footer Toggle */}
        <div className="mt-6 text-center border-t border-gray-800 pt-4">
          <p className="text-sm text-gray-400">
            {isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-blue-400 hover:text-white font-bold transition"
            >
              {isLogin ? 'Cadastre-se' : 'Fazer Login'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

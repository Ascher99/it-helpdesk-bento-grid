import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Headphones, Key, Shield, UserCheck, AlertCircle, ArrowRight, Check } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Dział Finansów i Księgowości');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.login(email, password);
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Nieprawidłowy e-mail lub hasło');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.register({
        email,
        password,
        full_name: fullName,
        department,
      });
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Błąd rejestracji konta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.login(demoEmail, 'Password123!');
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto text-white mb-3 shadow-md">
            <Headphones className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">IT Helpdesk Ticketing System</h2>
          <p className="text-xs text-slate-400 mt-1">Uwierzytelnianie tokenem JWT (FastAPI / Express & MySQL)</p>
        </div>

        {/* Demo Fast Login Shortcuts */}
        <div className="bg-slate-50 border-b border-slate-200 p-5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Szybkie logowanie jednym kliknięciem (Konta demonstracyjne):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('admin@helpdesk.it')}
              disabled={isLoading}
              className="p-2.5 bg-white border border-slate-200 hover:border-red-400 rounded-xl text-left transition-all hover:shadow-xs group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                  ADMIN
                </span>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-red-600 transition-colors" />
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">Tomasz L.</div>
              <div className="text-[10px] text-slate-500 truncate">Pełne uprawnienia</div>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('agent@helpdesk.it')}
              disabled={isLoading}
              className="p-2.5 bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all hover:shadow-xs group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  AGENT L2
                </span>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">Anna W.</div>
              <div className="text-[10px] text-slate-500 truncate">Obsługa spraw IT</div>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('user@firma.pl')}
              disabled={isLoading}
              className="p-2.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-left transition-all hover:shadow-xs group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                  PRACOWNIK
                </span>
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">Jan K.</div>
              <div className="text-[10px] text-slate-500 truncate">Zgłaszanie awarii</div>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login or Register Form */}
        <div className="p-6">
          <div className="flex border-b border-slate-200 mb-5">
            <button
              onClick={() => setIsRegisterMode(false)}
              className={`pb-2 px-4 text-xs font-bold border-b-2 transition-colors ${
                !isRegisterMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'
              }`}
            >
              Logowanie hasłem
            </button>
            <button
              onClick={() => setIsRegisterMode(true)}
              className={`pb-2 px-4 text-xs font-bold border-b-2 transition-colors ${
                isRegisterMode ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'
              }`}
            >
              Rejestracja pracownika
            </button>
          </div>

          {!isRegisterMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adres e-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="np. admin@helpdesk.it lub user@firma.pl"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hasło</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Hasło konta (demo: Password123!)"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>{isLoading ? 'Weryfikacja tokenu JWT...' : 'Zaloguj się (Generuj JWT)'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Imię i nazwisko</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="np. Piotr Wiśniewski"
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adres e-mail firmowy</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="np. piotr.wisniewski@firma.pl"
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dział w firmie</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="np. Dział Logistyki / Dział Sprzedaży"
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hasło</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 znaków"
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isLoading ? 'Rejestracja...' : 'Zarejestruj pracownika'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { authStorage } from '../services/api';
import { X, Key, Copy, Check, Shield, Clock, UserCheck } from 'lucide-react';

interface JwtInspectorModalProps {
  onClose: () => void;
}

export const JwtInspectorModal: React.FC<JwtInspectorModalProps> = ({ onClose }) => {
  const token = authStorage.getToken() || '';
  const decoded = token ? authStorage.decodeToken(token) : null;
  const [copied, setCopied] = useState(false);

  // Split token parts
  const parts = token.split('.');
  const headerPart = parts[0] || '';
  const payloadPart = parts[1] || '';
  const signaturePart = parts[2] || '';

  const handleCopyHeader = () => {
    navigator.clipboard.writeText(`Authorization: Bearer ${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTtlRemaining = () => {
    if (!decoded?.exp) return null;
    const expMs = decoded.exp * 1000;
    const now = Date.now();
    const diffMs = expMs - now;
    if (diffMs <= 0) return 'Wygasł';
    const hours = Math.floor(diffMs / (3600 * 1000));
    const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
    return `${hours} godz. ${mins} min.`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold">Inspektor & Dekoder Tokenu JWT (FastAPI / Express)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Status summary banner */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-700" />
              <span className="font-semibold text-indigo-900">
                Podpis kryptograficzny: <span className="font-mono">HS256 (HMAC-SHA256)</span>
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-indigo-800">
              <Clock className="w-3.5 h-3.5" />
              <span>Ważność tokenu: <strong>{getTtlRemaining()}</strong></span>
            </div>
          </div>

          {/* Raw Encoded Token Visual */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Zaszyfrowany ciąg JWT (Compact Serialization)
              </span>
              <button
                onClick={handleCopyHeader}
                className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Skopiowano nagłówek!' : 'Kopiuj Bearer Header'}</span>
              </button>
            </div>
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] break-all leading-relaxed max-h-28 overflow-y-auto">
              <span className="text-rose-400">{headerPart}</span>
              <span className="text-slate-400">.</span>
              <span className="text-purple-400">{payloadPart}</span>
              <span className="text-slate-400">.</span>
              <span className="text-emerald-400">{signaturePart}</span>
            </div>
            <div className="flex items-center space-x-4 mt-1 text-[10px] text-slate-500 font-mono">
              <span className="text-rose-600 font-semibold">■ Nagłówek (Header)</span>
              <span className="text-purple-600 font-semibold">■ Ładunek (Payload/Claims)</span>
              <span className="text-emerald-600 font-semibold">■ Podpis (Signature)</span>
            </div>
          </div>

          {/* Decoded Payload Claims */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Header info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="font-bold text-slate-700 block mb-2 uppercase tracking-wider text-[11px]">
                1. Nagłówek (Header)
              </span>
              <pre className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] overflow-x-auto">
{JSON.stringify(
  {
    alg: 'HS256',
    typ: 'JWT'
  },
  null,
  2
)}
              </pre>
            </div>

            {/* Claims info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="font-bold text-slate-700 block mb-2 uppercase tracking-wider text-[11px]">
                2. Zdekodowane roszczenia (Claims)
              </span>
              <pre className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] overflow-x-auto">
{decoded ? JSON.stringify(decoded, null, 2) : '// Brak zalogowanego tokenu'}
              </pre>
            </div>
          </div>

          {/* Role and Permissions explanation */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="font-bold text-slate-800 block text-xs">
              Rola użytkownika weryfikowana w backendzie:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className={`p-2.5 rounded-lg border text-xs ${
                decoded?.role === 'ADMIN' ? 'bg-red-50 border-red-200 text-red-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <div className="font-bold">ADMIN</div>
                <div className="text-[10px] text-slate-500">Pełne uprawnienia, usuwanie zgłoszeń, audyt</div>
              </div>
              <div className={`p-2.5 rounded-lg border text-xs ${
                decoded?.role === 'AGENT' ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <div className="font-bold">AGENT</div>
                <div className="text-[10px] text-slate-500">Zarządzanie sprawami, zmiana statusów, notatki IT</div>
              </div>
              <div className={`p-2.5 rounded-lg border text-xs ${
                decoded?.role === 'USER' ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <div className="font-bold">USER</div>
                <div className="text-[10px] text-slate-500">Zgłaszanie awarii, śledzenie własnych ticketów</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

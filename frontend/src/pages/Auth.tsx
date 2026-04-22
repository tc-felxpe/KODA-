import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, signIn } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';

export function Auth() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) { const { error: err } = await signUp(email, password); if (err) throw err; }
      else { const { data, error: err } = await signIn(email, password); if (err) throw err; if (data.user) setUser(data.user as any); }
      navigate('/dashboard');
    } catch (err: any) { setError(err.message || 'Ocurrió un error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-lg shadow-lg border">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">KODA</h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">{isSignUp ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300" 
              placeholder="tu@ejemplo.com" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300" 
              placeholder="••••••••" 
              required 
              minLength={6} 
            />
          </div>
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 text-sm sm:text-base"
          >
            {loading ? 'Cargando...' : isSignUp ? 'Registrarse' : 'Iniciar sesión'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : "¿No tienes una cuenta? Regístrate"}
          </button>
        </div>
      </div>
    </div>
  );
}

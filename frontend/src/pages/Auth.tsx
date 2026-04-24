import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signUp, signIn } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';
import { Button, Input } from '@/components/ui';
import { Eye, EyeOff, ArrowRight, CheckCircle, Mail, Lock } from 'lucide-react';

const features = [
  'Organiza tus ideas en un solo lugar',
  'Crea espacios de trabajo ilimitados',
  'Accede desde cualquier dispositivo',
];

export function Auth() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error: err } = await signUp(email, password);
        if (err) throw err;
        // If email confirmation is disabled, signUp returns a session immediately
        if (data.user) setUser(data.user as any);
        if (data.session) setUser(data.session.user as any);
      } else {
        const { data, error: err } = await signIn(email, password);
        if (err) throw err;
        if (data.user) setUser(data.user as any);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-koda-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-purple-subtle" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-koda-purple/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-koda-purple-light/30 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="mb-6">
              <img
                src="/img/LOGO-KODA-PRINCIPAL.png"
                alt="KODA"
                className="h-14 w-auto"
              />
            </div>
            <h1 className="text-display text-koda-black mb-6">
              Organiza tu trabajo<br />
              <span className="text-koda-purple">de forma inteligente</span>
            </h1>
            <p className="text-lg text-koda-gray-purple max-w-md leading-relaxed">
              Crea espacios de trabajo, gestiona tareas y colabora con tu equipo en una plataforma diseñada para la productividad.
            </p>
            <div className="mt-10 space-y-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-koda-purple/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-koda-purple" />
                  </div>
                  <p className="text-sm text-koda-gray-purple">{feature}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Mobile branding - visible only below lg */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:hidden text-center mb-6"
        >
          <img
            src="/img/LOGO-KODA-PRINCIPAL.png"
            alt="KODA"
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-koda-black">
            Organiza tu trabajo<br />
            <span className="text-koda-purple">de forma inteligente</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md px-4 sm:px-0"
        >
          <div className="bg-white rounded-2xl border border-koda-border-soft shadow-card p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? 'signup' : 'signin'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-center mb-6">
                  <img
                    src="/img/LOGO-KODA-PNG.png"
                    alt="KODA"
                    className="h-20 w-auto"
                  />
                </div>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-koda-black">
                    {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
                  </h2>
                  <p className="mt-1.5 text-sm text-koda-gray-purple">
                    {isSignUp ? 'Únete a KODA hoy' : 'Bienvenido de nuevo'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Correo electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@ejemplo.com"
                    required
                    leftIcon={<Mail className="w-4 h-4 text-koda-gray-light" />}
                  />

                  <div className="relative">
                    <Input
                      label="Contraseña"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      helperText={isSignUp ? 'Mínimo 6 caracteres' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[2.1rem] text-koda-gray-light hover:text-koda-gray-purple transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-koda-error flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-koda-error flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    isLoading={loading}
                    fullWidth
                    className="mt-2"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                    className="text-sm text-koda-gray-purple hover:text-koda-purple transition-colors"
                  >
                    {isSignUp ? (
                      <>¿Ya tienes una cuenta? <span className="font-medium text-koda-purple">Inicia sesión</span></>
                    ) : (
                      <>¿No tienes una cuenta? <span className="font-medium text-koda-purple">Regístrate</span></>
                    )}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="mt-6 text-center text-xs text-koda-gray-light">
            KODA | © 2026 Todos los derechos reservados. | Realizado por Andrés Felipe Castillo
          </p>
        </motion.div>
      </div>
    </div>
  );
}

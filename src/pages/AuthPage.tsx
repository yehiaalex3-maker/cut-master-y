import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, UserPlus, Mail, ArrowLeft } from 'lucide-react';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import SiteLogo from '../components/SiteLogo';

interface AuthPageProps {
  onAuth: () => void;
}

type Mode = 'login' | 'register' | 'forgot';

// Translate Supabase English errors to Arabic
function translateError(msg: string): string {
  if (!msg) return 'حدث خطأ غير متوقع';
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials'))
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (msg.includes('Email not confirmed'))
    return 'يرجى تأكيد بريدك الإلكتروني أولاً';
  if (msg.includes('User already registered') || msg.includes('already been registered'))
    return 'هذا البريد الإلكتروني مسجل بالفعل';
  if (msg.includes('Password should be at least'))
    return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  if (msg.includes('Unable to validate email'))
    return 'صيغة البريد الإلكتروني غير صحيحة';
  if (msg.includes('rate limit') || msg.includes('too many requests'))
    return 'محاولات كثيرة جداً، انتظر قليلاً ثم حاول مجدداً';
  if (msg.includes('التسجيل مغلق') || msg.includes('Registration'))
    return msg; // Already Arabic from our API
  return msg;
}

export default function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    onAuth();
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError('يرجى إدخال اسمك الكامل');
      return;
    }
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    // Use Supabase directly (profile created automatically in App.tsx on session)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });

    if (error) throw error;

    // If user returned with a session it means email confirmation is disabled
    if (data.session) {
      // Create profile immediately
      await supabase.from('users_profile').upsert({
        id: data.user!.id,
        email: email.trim(),
        full_name: fullName.trim(),
        role: 'user',
        is_active: true,
      }, { onConflict: 'id' });
      onAuth();
    } else {
      setSuccess('✅ تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني ثم تسجيل الدخول.');
      switchMode('login');
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('يرجى إدخال بريدك الإلكتروني أولاً');
      return;
    }
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    // Always show success for security (don't reveal if email exists)
    setSuccess('📧 إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور خلال دقائق.');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') await handleLogin();
      else if (mode === 'register') await handleRegister();
      else await handleForgotPassword();
    } catch (err: any) {
      setError(translateError(err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-pattern"></div>
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="auth-logo">
          <SiteLogo size={52} showText={false} />
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.5px' }}>MASTER Y</h1>
            <p style={{ fontSize: 12, color: '#9b9990', margin: 0 }}>نظام تفريغ مقاسات القطع الخشبية</p>
          </div>
        </div>

        {/* Tabs — only show when not in forgot mode */}
        <AnimatePresence mode="wait">
          {mode !== 'forgot' && (
            <motion.div
              className="auth-tabs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => switchMode('login')}
              >
                <LogIn size={16} />
                <span>تسجيل الدخول</span>
              </button>
              <button
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => switchMode('register')}
              >
                <UserPlus size={16} />
                <span>حساب جديد</span>
              </button>
            </motion.div>
          )}

          {mode === 'forgot' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}
            >
              <button
                onClick={() => switchMode('login')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#00b5a3', fontSize: 14, fontFamily: 'inherit',
                  padding: '4px 0'
                }}
              >
                <ArrowLeft size={16} />
                <span>العودة لتسجيل الدخول</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forgot Password Header */}
        {mode === 'forgot' && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔑</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>نسيت كلمة المرور؟</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
            </p>
          </div>
        )}

        {error && (
          <motion.div
            className="auth-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ⚠️ {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            className="auth-success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label>الاسم الكامل</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="ادخل اسمك الكامل"
                required
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              dir="ltr"
              autoFocus={mode !== 'register'}
            />
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ margin: 0 }}>كلمة المرور</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, color: '#00b5a3', fontFamily: 'inherit'
                    }}
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="password-input">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  minLength={6}
                  dir="ltr"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="pass-toggle">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span className="btn-spinner" />
                جاري...
              </span>
            ) : mode === 'login' ? (
              <><LogIn size={16} /> دخول</>
            ) : mode === 'register' ? (
              <><UserPlus size={16} /> إنشاء حساب</>
            ) : (
              <><Mail size={16} /> إرسال رابط الاستعادة</>
            )}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="auth-divider"><span>أو</span></div>
            <button className="google-btn" onClick={() => signInWithGoogle()}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
              </svg>
              <span>تسجيل بواسطة Google</span>
            </button>
          </>
        )}

        <p className="auth-footer-note">
          بتسجيل الدخول توافق على <a href="#">شروط الاستخدام</a>
        </p>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { authRequest } from '../api';

export const LoginPage = () => {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        const res = await authRequest('POST', '/auth/login', {
          email: form.email,
          password: form.password,
        });
        login(res.user, res.token);
        navigate('/products', { replace: true });
      } else {
        if (!form.name.trim()) {
          setError('이름을 입력해주세요.');
          setLoading(false);
          return;
        }
        const res = await authRequest('POST', '/auth/register', {
          email: form.email,
          password: form.password,
          name: form.name,
        });
        login(res.user, res.token);
        navigate('/products', { replace: true });
      }
    } catch (err) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">PLASK</div>
        <p className="auth-sub">한정 수량 주문 플랫폼</p>

        <div className="auth-tabs">
          <button
            className={'auth-tab' + (tab === 'login' ? ' active' : '')}
            onClick={() => { setTab('login'); setError(''); setForm({ email: '', password: '', name: '' }); }}
            type="button"
          >
            로그인
          </button>
          <button
            className={'auth-tab' + (tab === 'register' ? ' active' : '')}
            onClick={() => { setTab('register'); setError(''); setForm({ email: '', password: '', name: '' }); }}
            type="button"
          >
            회원가입
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="field">
              <label className="field-label">이름</label>
              <input
                className="field-input"
                type="text"
                name="name"
                placeholder="홍길동"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="field">
            <label className="field-label">이메일</label>
            <input
              className="field-input"
              type="email"
              name="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="field-label">비밀번호</label>
            <input
              className="field-input"
              type="password"
              name="password"
              placeholder={tab === 'register' ? '6자 이상 입력해주세요' : '비밀번호'}
              value={form.password}
              onChange={handleChange}
              required
              minLength={tab === 'register' ? 6 : undefined}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn btn-black btn-full" disabled={loading}>
            {loading
              ? '처리 중...'
              : tab === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
};

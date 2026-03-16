import { NavLink } from 'react-router-dom';
import { useAuth } from '../../store/authStore';

export const Header = () => {
  const { isLoggedIn, isAdmin, userEmail, userName, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="logo">PLASK</NavLink>

        {isLoggedIn && (
          <nav className="nav">
            <NavLink
              to="/products"
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              상품
            </NavLink>
            <NavLink
              to="/my/orders"
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              내 주문
            </NavLink>
          </nav>
        )}

        <div className="header-right">
          {isLoggedIn ? (
            <>
              <span className="header-user">{userName || userEmail}</span>
              {isAdmin && (
                <NavLink to="/admin" className="btn btn-sm btn-header btn-header-admin">
                  관리자
                </NavLink>
              )}
              <button className="btn-header btn btn-sm" onClick={logout}>
                로그아웃
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-sm btn-header">
              로그인
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    PENDING: { label: '처리 중', cls: 'badge-pending' },
    SUCCESS: { label: '주문 완료', cls: 'badge-success' },
    FAILED: { label: '실패', cls: 'badge-failed' },
  };
  const { label, cls } = map[status] || { label: status, cls: '' };
  return <span className={`product-status-badge ${cls}`}>{label}</span>;
};

export const LoadingSpinner = ({ text = '로딩 중...' }) => (
  <div className="loading-wrap">
    <div className="spinner" />
    <p className="loading-text">{text}</p>
  </div>
);

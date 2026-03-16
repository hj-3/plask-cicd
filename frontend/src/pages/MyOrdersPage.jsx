import { useState, useEffect } from 'react';
import { api } from '../api';
import { LoadingSpinner, StatusBadge } from '../components/common';

export const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/my/orders');
        setOrders(res.data || []);
      } catch (err) {
        setError('주문 내역을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-sm">
      <div className="page-header">
        <h1 className="page-title">내 주문 내역</h1>
        <p className="page-sub">주문 완료된 상품 목록입니다.</p>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <p className="empty-title">주문 내역이 없습니다</p>
          <p className="empty-sub">상품을 주문하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-img">
                {order.image_url ? (
                  <img src={order.image_url} alt={order.product_name} />
                ) : (
                  <div className="order-card-img-placeholder">📦</div>
                )}
              </div>
              <div className="order-card-info">
                <p className="order-card-name">{order.product_name}</p>
                <p className="order-card-date">
                  {new Date(order.created_at).toLocaleString('ko-KR')}
                </p>
                {order.product_url && (
                  <a
                    href={order.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="order-card-link"
                  >
                    🔗 상품 페이지
                  </a>
                )}
              </div>
              <StatusBadge status={order.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

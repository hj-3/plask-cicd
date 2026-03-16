import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../store/authStore';
import { LoadingSpinner } from '../components/common';
import { CountdownTimer } from '../components/CountdownBadge';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, userId } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const [ordering, setOrdering] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null); // null | 'pending' | 'success' | 'failed' | 'already'
  const [orderMsg, setOrderMsg] = useState('');
  const [queuePos, setQueuePos] = useState(null);
  const pollingRef = useRef(null);

  const loadProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
      setIsOpen(new Date() >= new Date(res.data.open_time));
    } catch {
      setError('상품을 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
    return () => stopPolling();
  }, [id]);

  // Re-check open status every second
  useEffect(() => {
    if (!product || isOpen) return;
    const timer = setInterval(() => {
      if (new Date() >= new Date(product.open_time)) {
        setIsOpen(true);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [product, isOpen]);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleOrder = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    setOrdering(true);
    setOrderStatus('pending');
    setOrderMsg('');

    try {
      const res = await api.post('/orders', { product_id: parseInt(id) });
      const requestId = res.request_id;
      setQueuePos(res.queue_position);

      // Poll for order status
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await api.get(`/orders/status/${requestId}`);
          const { status, message, queue_position } = statusRes.data;
          setQueuePos(queue_position);

          if (status === 'SUCCESS') {
            stopPolling();
            setOrderStatus('success');
            setOrderMsg('주문이 완료되었습니다! 확인 이메일이 발송됩니다.');
            loadProduct();
          } else if (status === 'FAILED') {
            stopPolling();
            setOrderStatus('failed');
            setOrderMsg(message || '주문에 실패했습니다.');
            setOrdering(false);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 1500);
    } catch (err) {
      stopPolling();
      if (err.status === 409) {
        setOrderStatus('already');
        setOrderMsg('이미 주문한 상품입니다.');
      } else {
        setOrderStatus('failed');
        setOrderMsg(err.message || '주문 요청 중 오류가 발생했습니다.');
      }
      setOrdering(false);
    }
  };

  const closeModal = () => {
    stopPolling();
    setOrderStatus(null);
    setOrdering(false);
    setOrderMsg('');
    setQueuePos(null);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="container-sm">
      <div className="error-msg" style={{ marginTop: 32 }}>{error}</div>
    </div>
  );

  const isSoldOut = product.ordered_count >= product.quantity;
  const remaining = product.quantity - product.ordered_count;
  const pct = Math.min((product.ordered_count / product.quantity) * 100, 100);

  const getFillClass = () => {
    if (pct >= 100) return 'stock-fill-gray';
    if (pct >= 80) return 'stock-fill-red';
    if (pct >= 50) return 'stock-fill-yellow';
    return 'stock-fill-green';
  };

  const renderOrderButton = () => {
    if (orderStatus === 'success') {
      return <button className="btn btn-order btn-order-done" disabled>✓ 주문 완료</button>;
    }
    if (orderStatus === 'already') {
      return <button className="btn btn-order btn-order-done" disabled>이미 주문한 상품</button>;
    }
    if (isSoldOut) {
      return <button className="btn btn-order btn-order-sold" disabled>품절</button>;
    }
    if (!isOpen) {
      return <button className="btn btn-order btn-order-disabled" disabled>오픈 전</button>;
    }
    return (
      <button
        className="btn btn-order btn-order-active"
        onClick={handleOrder}
        disabled={ordering}
      >
        {ordering ? '처리 중...' : '지금 주문하기'}
      </button>
    );
  };

  return (
    <div className="container">
      <button className="btn-back" onClick={() => navigate('/products')}>
        ← 목록으로
      </button>

      <div className="product-detail">
        {/* Image */}
        <div className="product-detail-img">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <div className="product-detail-placeholder">📦</div>
          )}
        </div>

        {/* Info */}
        <div className="product-detail-info">
          <h1 className="product-detail-name">{product.name}</h1>

          {product.description && (
            <p className="product-detail-desc">{product.description}</p>
          )}

          {/* Stats */}
          <div className="product-detail-stats">
            <div className="stat-item">
              <span className="stat-label">총 수량</span>
              <span className="stat-value">{product.quantity}개</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">남은 수량</span>
              <span className={`stat-value ${isSoldOut ? 'text-red' : remaining <= 5 ? 'text-red' : 'text-green'}`}>
                {isSoldOut ? '품절' : `${remaining}개`}
              </span>
            </div>
          </div>

          {/* Stock bar */}
          <div className="stock-bar-wrap">
            <div className="stock-bar-label">
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>재고 현황</span>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                {product.ordered_count} / {product.quantity}
              </span>
            </div>
            <div className="stock-bar" style={{ height: 8 }}>
              <div className={`stock-fill ${getFillClass()}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Product link */}
          {product.product_url && (
            <a
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="product-detail-link"
            >
              🔗 원본 상품 페이지
            </a>
          )}

          {/* Order area */}
          <div className="order-area">
            {!isOpen && !isSoldOut && (
              <CountdownTimer openTime={new Date(product.open_time)} />
            )}
            <div style={{ marginTop: !isOpen && !isSoldOut ? 12 : 0 }}>
              {renderOrderButton()}
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Modal */}
      {orderStatus && orderStatus !== 'already' && (
        <div className="modal-overlay" onClick={orderStatus !== 'pending' ? closeModal : undefined}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {orderStatus === 'pending' && (
              <>
                <div className="modal-icon">
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
                <h3 className="modal-title">주문 처리 중</h3>
                <p className="modal-desc">선착순으로 처리되고 있습니다.</p>
                {queuePos > 0 && (
                  <p className="modal-queue">
                    대기열 위치: <strong>{queuePos}번째</strong>
                  </p>
                )}
              </>
            )}
            {orderStatus === 'success' && (
              <>
                <div className="modal-icon">✅</div>
                <h3 className="modal-title">주문 완료!</h3>
                <p className="modal-desc">{orderMsg}</p>
                <div className="modal-actions">
                  <button className="btn btn-black btn-full" onClick={closeModal}>확인</button>
                </div>
              </>
            )}
            {orderStatus === 'failed' && (
              <>
                <div className="modal-icon">❌</div>
                <h3 className="modal-title">주문 실패</h3>
                <p className="modal-desc">{orderMsg}</p>
                <div className="modal-actions">
                  <button className="btn btn-outline btn-full" onClick={closeModal}>닫기</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { LoadingSpinner } from '../components/common';
import { CountdownBadge } from '../components/CountdownBadge';

export const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data || []);
      } catch (err) {
        setError('상품 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();

    // Refresh every 30 seconds to update stock
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner text="상품 불러오는 중..." />;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">한정 수량 주문</h1>
        <p className="page-sub">오픈 시간에 맞춰 주문하세요. 선착순으로 처리됩니다.</p>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p className="empty-title">등록된 상품이 없습니다</p>
          <p className="empty-sub">새로운 상품이 곧 업로드될 예정입니다.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product }) => {
  const now = new Date();
  const openTime = new Date(product.open_time);
  const isSoldOut = product.ordered_count >= product.quantity;
  const isOpen = now >= openTime;
  const remaining = product.quantity - product.ordered_count;
  const pct = Math.min((product.ordered_count / product.quantity) * 100, 100);

  const getStatusBadge = () => {
    if (isSoldOut) return <span className="product-status-badge badge-sold">품절</span>;
    if (isOpen) return <span className="product-status-badge badge-open">● 주문 가능</span>;
    return <span className="product-status-badge badge-soon">오픈 예정</span>;
  };

  const getFillClass = () => {
    if (pct >= 100) return 'stock-fill-gray';
    if (pct >= 80) return 'stock-fill-red';
    if (pct >= 50) return 'stock-fill-yellow';
    return 'stock-fill-green';
  };

  return (
    <Link to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
      <div className="product-card">
        {product.image_url ? (
          <img className="product-img" src={product.image_url} alt={product.name} />
        ) : (
          <div className="product-img-placeholder">
            <span className="product-img-placeholder-text">📦</span>
          </div>
        )}

        <div className="product-body">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <h3 className="product-name" style={{ margin: 0 }}>{product.name}</h3>
            {getStatusBadge()}
          </div>

          <div className="stock-bar-wrap" style={{ marginBottom: 10 }}>
            <div className="stock-bar-label">
              <span>재고 현황</span>
              <span>{isSoldOut ? '품절' : `${remaining}개 남음`}</span>
            </div>
            <div className="stock-bar">
              <div
                className={`stock-fill ${getFillClass()}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {!isOpen && !isSoldOut && (
            <CountdownBadge openTime={openTime} />
          )}
        </div>
      </div>
    </Link>
  );
};

import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'add', label: '상품 추가' },
  { id: 'products', label: '상품 관리' },
  { id: 'orders', label: '주문 현황' },
];

// datetime-local format: YYYY-MM-DDTHH:mm
const toLocalInput = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const fromLocalInput = (localStr) => {
  if (!localStr) return '';
  return new Date(localStr).toISOString();
};

export const AdminPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('add');

  useEffect(() => {
    if (!isAdmin) navigate('/', { replace: true });
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">관리자 페이지</h1>
      </div>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={'admin-nav-item' + (activeTab === tab.id ? ' active' : '')}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <div className="admin-content">
          {activeTab === 'add' && <AddProductForm onSuccess={() => setActiveTab('products')} />}
          {activeTab === 'products' && <ProductManagement />}
          {activeTab === 'orders' && <OrderManagement />}
        </div>
      </div>
    </div>
  );
};

// ── Add Product Form ────────────────────────────────────
const AddProductForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    image_url: '',
    product_url: '',
    quantity: '',
    open_time: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.quantity || !form.open_time) {
      setError('상품명, 수량, 오픈 시간은 필수입니다.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/products', {
        ...form,
        quantity: parseInt(form.quantity),
        open_time: fromLocalInput(form.open_time),
      });
      setSuccess('상품이 추가되었습니다!');
      setForm({ name: '', description: '', image_url: '', product_url: '', quantity: '', open_time: '' });
      setTimeout(onSuccess, 1200);
    } catch (err) {
      setError(err.message || '상품 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">상품 추가</h2>
      <div className="product-form">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field form-grid-full">
              <label className="field-label">상품명 *</label>
              <input
                className="field-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="상품명을 입력하세요"
                required
              />
            </div>

            <div className="field form-grid-full">
              <label className="field-label">설명</label>
              <textarea
                className="field-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="상품 설명 (선택사항)"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="field">
              <label className="field-label">이미지 URL</label>
              <input
                className="field-input"
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="field">
              <label className="field-label">상품 링크 URL</label>
              <input
                className="field-input"
                name="product_url"
                value={form.product_url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="field">
              <label className="field-label">수량 *</label>
              <input
                className="field-input"
                name="quantity"
                type="number"
                min={1}
                value={form.quantity}
                onChange={handleChange}
                placeholder="예) 100"
                required
              />
            </div>

            <div className="field">
              <label className="field-label">주문 오픈 시간 *</label>
              <input
                className="field-input"
                name="open_time"
                type="datetime-local"
                value={form.open_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {error && <div className="error-msg" style={{ marginTop: 16 }}>{error}</div>}
          {success && <div className="success-msg" style={{ marginTop: 16 }}>{success}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-black" disabled={loading}>
              {loading ? '추가 중...' : '상품 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Product Management ──────────────────────────────────
const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/admin/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      description: product.description || '',
      image_url: product.image_url || '',
      product_url: product.product_url || '',
      quantity: product.quantity,
      open_time: toLocalInput(product.open_time),
      is_active: product.is_active,
    });
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/admin/products/${id}`, {
        ...editForm,
        quantity: parseInt(editForm.quantity),
        open_time: fromLocalInput(editForm.open_time),
      });
      setEditingId(null);
      load();
    } catch (err) {
      alert(err.message || '수정에 실패했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('이 상품을 삭제하시겠습니까?')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/products/${id}`);
      load();
    } catch (err) {
      alert(err.message || '삭제에 실패했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (product) => {
    try {
      await api.put(`/admin/products/${product.id}`, { is_active: !product.is_active });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="admin-section-title" style={{ margin: 0 }}>상품 관리</h2>
        <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>총 {products.length}개</span>
      </div>

      {products.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 40 }}>
          <p className="empty-title">등록된 상품이 없습니다</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>상품명</th>
                <th>수량</th>
                <th>주문수</th>
                <th>오픈 시간</th>
                <th>활성</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  {editingId === p.id ? (
                    <EditRow
                      form={editForm}
                      setForm={setEditForm}
                      onSave={() => saveEdit(p.id)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <td>
                        <div className="td-name">{p.name}</div>
                        {p.product_url && (
                          <a href={p.product_url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: 'var(--blue)' }}>링크</a>
                        )}
                      </td>
                      <td>{p.quantity}</td>
                      <td>{p.ordered_count}</td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(p.open_time).toLocaleString('ko-KR', {
                          month: 'numeric', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <label className="toggle-wrap">
                          <input
                            type="checkbox"
                            className="toggle"
                            checked={p.is_active}
                            onChange={() => toggleActive(p)}
                          />
                        </label>
                      </td>
                      <td>
                        <div className="td-actions">
                          <button className="btn btn-sm btn-outline" onClick={() => startEdit(p)}>수정</button>
                          <button
                            className="btn btn-sm btn-accent"
                            onClick={() => handleDelete(p.id)}
                            disabled={deleting === p.id}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const EditRow = ({ form, setForm, onSave, onCancel }) => {
  const ch = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  return (
    <>
      <td colSpan={4}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 160px', gap: 8 }}>
          <input className="field-input" name="name" value={form.name} onChange={ch} placeholder="상품명" style={{ padding: '6px 10px', fontSize: 13 }} />
          <input className="field-input" name="quantity" type="number" value={form.quantity} onChange={ch} style={{ padding: '6px 10px', fontSize: 13 }} />
          <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--gray-400)' }}>—</span>
          <input className="field-input" name="open_time" type="datetime-local" value={form.open_time} onChange={ch} style={{ padding: '6px 10px', fontSize: 13 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
          <input className="field-input" name="image_url" value={form.image_url} onChange={ch} placeholder="이미지 URL" style={{ padding: '6px 10px', fontSize: 13 }} />
          <input className="field-input" name="product_url" value={form.product_url} onChange={ch} placeholder="상품 링크 URL" style={{ padding: '6px 10px', fontSize: 13 }} />
        </div>
      </td>
      <td>
        <label className="toggle-wrap">
          <input type="checkbox" className="toggle" checked={form.is_active}
            onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} />
        </label>
      </td>
      <td>
        <div className="td-actions">
          <button className="btn btn-sm btn-black" onClick={onSave}>저장</button>
          <button className="btn btn-sm btn-outline" onClick={onCancel}>취소</button>
        </div>
      </td>
    </>
  );
};

// ── Order Management ────────────────────────────────────
const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/orders');
        setOrders(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="admin-section-title" style={{ margin: 0 }}>주문 현황</h2>
        <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>총 {orders.length}건</span>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 40 }}>
          <p className="empty-title">주문 내역이 없습니다</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>이메일</th>
                <th>이름</th>
                <th>상품</th>
                <th>상태</th>
                <th>주문 시간</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.email}</td>
                  <td>{o.user_name}</td>
                  <td className="td-name">{o.product_name}</td>
                  <td>
                    <span className={`product-status-badge badge-${o.status.toLowerCase()}`}>
                      {o.status === 'SUCCESS' ? '완료' : o.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {new Date(o.created_at).toLocaleString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

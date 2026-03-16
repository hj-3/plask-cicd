import { useState, useEffect } from 'react';

function getTimeLeft(openTime) {
  const diff = openTime - new Date();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, diff };
}

// Small badge version for product cards
export const CountdownBadge = ({ openTime }) => {
  const [left, setLeft] = useState(() => getTimeLeft(openTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setLeft(getTimeLeft(openTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [openTime]);

  if (!left) return null;

  const parts = [];
  if (left.h > 0) parts.push(`${left.h}시간`);
  if (left.m > 0 || left.h > 0) parts.push(`${left.m}분`);
  parts.push(`${left.s}초 후 오픈`);

  return (
    <p style={{ fontSize: 12, color: '#d97706', fontWeight: 600, margin: 0 }}>
      🕐 {parts.join(' ')}
    </p>
  );
};

// Full countdown timer for product detail page
export const CountdownTimer = ({ openTime }) => {
  const [left, setLeft] = useState(() => getTimeLeft(openTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setLeft(getTimeLeft(openTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [openTime]);

  const pad = (n) => String(n).padStart(2, '0');

  const openStr = new Date(openTime).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!left) return null;

  return (
    <div className="countdown-block">
      <p className="countdown-label">주문 오픈까지</p>
      <div className="countdown-timer">
        {left.h > 0 && (
          <>
            <div className="countdown-seg">
              <span className="countdown-num">{pad(left.h)}</span>
              <span className="countdown-unit">시간</span>
            </div>
            <span className="countdown-sep">:</span>
          </>
        )}
        <div className="countdown-seg">
          <span className="countdown-num">{pad(left.m)}</span>
          <span className="countdown-unit">분</span>
        </div>
        <span className="countdown-sep">:</span>
        <div className="countdown-seg">
          <span className="countdown-num">{pad(left.s)}</span>
          <span className="countdown-unit">초</span>
        </div>
      </div>
      <p className="countdown-open">{openStr} 오픈</p>
    </div>
  );
};

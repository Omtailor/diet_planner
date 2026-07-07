import GlobalStyles from './GlobalStyles';
import { S } from '../../utils/training/constants';

/**
 * Full-page skeleton shown while the training plan is loading
 * and no cached plan is available yet.
 */
export default function LoadingSkeleton() {
  return (
    <div style={S.page}>
      <div style={S.body}>
        <div style={{ display: 'flex', gap: 8, padding: '10px 0' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ width: 44, height: 76, borderRadius: 20 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 80, borderRadius: 20 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 20 }} />
      </div>
      <GlobalStyles />
    </div>
  );
}

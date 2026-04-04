import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import TopBar from './TopBar'

function AppLayout() {
  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100dvh',
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <TopBar />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: '80px',
        paddingTop: '60px',
      }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

export default AppLayout
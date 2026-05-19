import { useLocation } from 'react-router-dom'
import { useRecitationStore } from './hooks/useRecitationStore.js'
import AppShell from './layout/AppShell.jsx'
import SidebarPage from './pages/SidebarPage.jsx'

function App() {
  const store = useRecitationStore()
  const location = useLocation()

  if (location.pathname === '/sidebar') {
    return <SidebarPage store={store} />
  }

  return <AppShell store={store} />
}

export default App

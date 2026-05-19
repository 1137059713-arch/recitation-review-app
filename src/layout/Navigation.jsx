import { NavLink } from 'react-router-dom'
import AppIcon from './AppIcon.jsx'

export const navigationItems = [
  { to: '/', label: '今日任务', icon: 'today' },
  { to: '/overdue', label: '逾期任务', icon: 'clock' },
  { to: '/overview', label: '全部总览', icon: 'grid' },
  { to: '/calendar', label: '背诵日程', icon: 'calendar' },
  { to: '/books', label: '书籍章节', icon: 'book', separated: true },
  { to: '/weak', label: '薄弱章节', icon: 'weak' },
  { to: '/other', label: '其他任务', icon: 'list' },
  { to: '/settings', label: '设置中心', icon: 'settings', separated: true },
]

function NavigationItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition',
          isActive
            ? 'bg-red-50 text-red-600 shadow-sm shadow-red-100/70'
            : 'text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <AppIcon name={item.icon} className={isActive ? 'text-red-500' : 'text-slate-400'} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function Navigation() {
  return (
    <nav className="space-y-2">
      {navigationItems.map((item) => (
        <div key={item.to} className={item.separated ? 'border-t border-slate-200 pt-4' : undefined}>
          <NavigationItem item={item} />
        </div>
      ))}
    </nav>
  )
}

export default Navigation

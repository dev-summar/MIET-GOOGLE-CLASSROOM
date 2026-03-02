import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserSquare2,
  FileText,
  MessageSquareOff,
  AlertTriangle,
} from 'lucide-react';
import '../../styles/sidebar.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/teachers', icon: UserSquare2, label: 'Teachers' },
  { to: '/assignments', icon: FileText, label: 'Assignments' },
  { to: '/silent-students', icon: MessageSquareOff, label: 'Silent Students' },
  { to: '/at-risk-students', icon: AlertTriangle, label: 'At-Risk Students' },
];

const academicItems = [
  { to: '/tlc-courses', icon: BookOpen, label: 'TLC Courses' },
];

function Sidebar({ open, onClose }) {
  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="sidebar-section-label">Academic Content</div>
        {academicItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;

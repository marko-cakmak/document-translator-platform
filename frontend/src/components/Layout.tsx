import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import './Layout.css';

function Layout() {
    const [collapsed, setCollapsed] = useState(false);

    const layoutClassName = collapsed
        ? 'admin-layout sidebar-collapsed'
        : 'admin-layout';

    return (
        <div className={layoutClassName}>
            <aside className="sidebar">
                <div className="sidebar-top">
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">DT</div>

                        {!collapsed && (
                            <div>
                                <h2 className="sidebar-logo">DocTranslator</h2>
                                <p className="sidebar-subtitle">Translation platform</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        className="collapse-button"
                        onClick={() => setCollapsed((current) => !current)}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>

                <nav className="sidebar-nav" aria-label="Main navigation">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            isActive ? 'sidebar-link active' : 'sidebar-link'
                        }
                        title="Dashboard"
                    >
                        <span className="sidebar-link-icon" aria-hidden="true">
                            <DashboardIcon />
                        </span>
                        {!collapsed && <span>Dashboard</span>}
                    </NavLink>

                    <NavLink
                        to="/documents"
                        className={({ isActive }) =>
                            isActive ? 'sidebar-link active' : 'sidebar-link'
                        }
                        title="Documents"
                    >
                        <span className="sidebar-link-icon" aria-hidden="true">
                            <DocumentsIcon />
                        </span>
                        {!collapsed && <span>Documents</span>}
                    </NavLink>
                </nav>

            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <strong>Admin Panel</strong>
                        <p>Manage documents and translations</p>
                    </div>

                    <span className="admin-user">Marko</span>
                </header>

                <section className="admin-content">
                    <Outlet />
                </section>
            </main>
        </div>
    );
}

function DashboardIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v5A1.5 1.5 0 0 1 9.5 12h-4A1.5 1.5 0 0 1 4 10.5v-5Z"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d="M13 5.5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v2A1.5 1.5 0 0 1 18.5 9h-4A1.5 1.5 0 0 1 13 7.5v-2Z"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d="M13 13.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-5Z"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d="M4 16.5A1.5 1.5 0 0 1 5.5 15h4a1.5 1.5 0 0 1 1.5 1.5v2A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5v-2Z"
                stroke="currentColor"
                strokeWidth="1.8"
            />
        </svg>
    );
}

function DocumentsIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M7 3.75h6.25L18 8.5v11.75H7V3.75Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            <path
                d="M13 3.75V8.5h5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            <path
                d="M9.75 13h4.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M9.75 16.5h4.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default Layout;
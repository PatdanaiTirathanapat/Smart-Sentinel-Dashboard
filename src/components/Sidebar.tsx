import React from 'react';

interface SidebarProps {
    activePath: string; 
}

export default function Sidebar({ activePath }: SidebarProps) {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <i className="sidebar-logo-icon">👁️</i>
                <span className="sidebar-logo-text">Smart Sentinel</span>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <a href="/" className={`nav-link ${activePath === '/' ? 'active' : ''}`}>
                            <i>📊</i> Dashboard
                        </a>
                    </li>

                    <li>
                        <a href="/logs" className={`nav-link ${activePath === '/logs' ? 'active' : ''}`}>
                            <i>📁</i> Logs
                        </a>
                    </li>
                </ul>
            </nav>

            <footer className="sidebar-footer">Smart Sentinel © 2025</footer>
        </aside>
    );
}
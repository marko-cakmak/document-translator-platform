import DashboardStatCard from '../../components/dashboard/DashboardStatCard';

import { dashboardStats } from './dashboardStats';

import './Dashboard.css';

function Dashboard() {
    return (
        <div>
            <header className="dashboard-header">
                <h1 className="dashboard-title">Dashboard</h1>
                <p className="dashboard-description">
                    Overview of the document translation platform.
                </p>
            </header>

            <section className="dashboard-stats-grid">
                {dashboardStats.map((stat) => (
                    <DashboardStatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                    />
                ))}
            </section>
        </div>
    );
}

export default Dashboard;

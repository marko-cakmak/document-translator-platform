import DashboardStatCard from '../components/dashboard/DashboardStatCard';

import './Dashboard.css';

type DashboardStat = {
    label: string;
    value: number;
};

const dashboardStats: DashboardStat[] = [
    { label: 'Documents', value: 0 },
    { label: 'Translations', value: 0 },
    { label: 'Completed', value: 0 },
];

function Dashboard() {
    return (
        <div>
            <header className="dashboard-header">
                <h1 className="dashboard-title">Dashboard</h1>
                <p className="dashboard-description">
                    Pregled platforme za prevod dokumenata.
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
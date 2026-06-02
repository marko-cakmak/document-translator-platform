type DashboardStatCardProps = {
    label: string;
    value: number;
};

function DashboardStatCard({ label, value }: DashboardStatCardProps) {
    return (
        <article className="dashboard-stat-card">
            <p className="dashboard-stat-label">{label}</p>
            <h2 className="dashboard-stat-value">{value}</h2>
        </article>
    );
}

export default DashboardStatCard;
export type DashboardStat = {
    label: string;
    value: number;
};

export const dashboardStats: DashboardStat[] = [
    { label: 'Documents', value: 0 },
    { label: 'Translations', value: 0 },
    { label: 'Completed', value: 0 },
];

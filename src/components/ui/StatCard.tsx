import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  return (
    <div className={`card p-4 ${colorClasses[color as keyof typeof colorClasses]} text-white rounded-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="opacity-80">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
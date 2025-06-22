import {
  FaUsers,
  FaBoxes,
  FaUtensils,
  FaExchangeAlt,
  FaChartLine,
  FaCalendarAlt,
} from "react-icons/fa";

function Dashboard() {
  // Mock data for dashboard
  const stats = [
    {
      id: 1,
      name: "Total Users",
      value: "24",
      icon: <FaUsers size={24} className="text-primary-800" />,
    },
    {
      id: 2,
      name: "Stock Items",
      value: "156",
      unit: "items",
      icon: <FaBoxes size={24} className="text-secondary" />,
    },
    {
      id: 3,
      name: "Meals",
      value: "48",
      icon: <FaUtensils size={24} className="text-accent" />,
    },
    {
      id: 4,
      name: "Stock Outflows",
      value: "38",
      icon: <FaExchangeAlt size={24} className="text-danger-800" />,
    },
  ];

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      action: "New user registered",
      user: "John Doe",
      time: "2 hours ago",
      icon: <FaUsers size={14} />,
    },
    {
      id: 2,
      action: "Stock updated",
      user: "Jane Smith",
      time: "4 hours ago",
      icon: <FaBoxes size={14} />,
    },
    {
      id: 3,
      action: "New meal added",
      user: "Mike Johnson",
      time: "6 hours ago",
      icon: <FaUtensils size={14} />,
    },
    {
      id: 4,
      action: "Stock outflow recorded",
      user: "Sarah Wilson",
      time: "1 day ago",
      icon: <FaExchangeAlt size={14} />,
    },
  ];

  return (
    <div className="animate-fade-in p-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="card flex items-center p-4 transition-all hover:shadow-lg"
          >
            <div className="p-3 rounded-full bg-gray-100 mr-4">{stat.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Sales Overview</h2>
            <select className="input text-sm py-1">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="h-60 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-center">
              <FaChartLine size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">
                Sales chart will be displayed here
              </p>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Calendar</h2>
            <span className="text-sm text-gray-500">June 2023</span>
          </div>
          <div className="flex items-center justify-center h-60 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-center">
              <FaCalendarAlt size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">Calendar will be displayed here</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                  {activity.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <div className="flex text-xs text-gray-500">
                    <span>{activity.user}</span>
                    <span className="mx-2">•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="btn-primary flex items-center justify-center">
              <FaUsers className="mr-2" /> Add User
            </button>
            <button className="btn-secondary flex items-center justify-center">
              <FaBoxes className="mr-2" /> Add Stock
            </button>
            <button className="btn-accent flex items-center justify-center">
              <FaUtensils className="mr-2" /> Add Meal
            </button>
            <button className="btn-outline flex items-center justify-center">
              <FaExchangeAlt className="mr-2" /> View Outflows
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

import { Home, Globe, Users, ShoppingBag, User } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'cuisines', icon: Globe, label: 'Cuisines' },
    { id: 'community', icon: Users, label: 'Community' },
    { id: 'shop', icon: ShoppingBag, label: 'Grocery List' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex items-center justify-around px-6 py-3 bg-white/95 backdrop-blur-md border-t border-gray-200">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === id
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
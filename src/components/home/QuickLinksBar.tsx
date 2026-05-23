import { Link } from 'react-router-dom';
import { Briefcase, Truck, Tag, Ticket } from 'lucide-react';

const quickLinks = [
  { path: '/jobs', icon: Briefcase, label: 'Jobs', color: 'bg-blue-50 text-blue-600' },
  { path: '/deals', icon: Tag, label: 'Deals', color: 'bg-green-50 text-green-600' },
  { path: '/events', icon: Ticket, label: 'Events', color: 'bg-purple-50 text-purple-600' },
  { path: '/food-today', icon: Truck, label: 'Food Trucks', color: 'bg-orange-50 text-orange-600' },
];

export function QuickLinksBar() {
  return (
    <section className="px-4 py-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full ${link.color} whitespace-nowrap transition-transform hover:scale-105`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

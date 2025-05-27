'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import dynamic from 'next/dynamic';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { FiUsers, FiTrendingUp, FiCheckCircle, FiAlertCircle, FiPieChart, FiFileText, FiShoppingCart, FiCalendar, FiDownload, FiFilter } from 'react-icons/fi';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Dynamically import ApexCharts components with no SSR
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Color palette constants
const COLORS = {
  primary: '#663399', // Purple from logo
  secondary: '#DAA520', // Gold from logo
  success: '#34D399', // Bright green
  gradient: {
    from: '#34D399',
    to: '#059669',
  },
  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
  },
  background: {
    light: '#F3F4F6',
    card: '#FFFFFF',
  },
  chart: {
    primary: ['#663399', '#8B4FB5', '#B07CD6', '#DAA520', '#34D399'],
    green: ['#34D399', '#059669', '#047857', '#065F46', '#064E3B'],
  }
};

// Date range options
const DATE_RANGES = {
  '7D': '7 Days',
  '30D': '30 Days',
  '90D': '90 Days',
  'ALL': 'All Time'
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, description }) => (
  <div className="transform rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-lg">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <span className={`text-xs ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-600">vs last period</span>
          </div>
        )}
      </div>
      <div className={`rounded-lg ${trend?.isPositive ? 'bg-emerald-100' : 'bg-purple-100'} p-3`}>
        <Icon className={`h-6 w-6 ${trend?.isPositive ? 'text-emerald-600' : 'text-purple-600'}`} />
      </div>
    </div>
    {description && <p className="mt-2 text-xs text-gray-600">{description}</p>}
  </div>
);

interface ChartHeaderProps {
  title: string;
  subtitle: string;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  onExport?: () => void;
}

const ChartHeader: React.FC<ChartHeaderProps> = ({ 
  title, 
  subtitle, 
  dateRange, 
  onDateRangeChange,
  onExport 
}) => (
  <div className="mb-6 flex items-start justify-between">
    <div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
    <div className="flex items-center gap-2">
      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center gap-2 rounded-lg border border-[#E8EEE8] px-3 py-1.5 text-sm text-gray-600 hover:bg-[#E8EEE8]">
          <FiFilter className="h-4 w-4" />
          {DATE_RANGES[dateRange as keyof typeof DATE_RANGES]}
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-40 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {Object.entries(DATE_RANGES).map(([key, label]) => (
              <Menu.Item key={key}>
                {({ active }) => (
                  <button
                    onClick={() => onDateRangeChange(key)}
                    className={`${
                      active ? 'bg-[#E8EEE8]' : ''
                    } block w-full px-4 py-2 text-left text-sm text-gray-900`}
                  >
                    {label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>
      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-2 rounded-lg border border-[#E8EEE8] px-3 py-1.5 text-sm text-gray-600 hover:bg-[#E8EEE8]"
        >
          <FiDownload className="h-4 w-4" />
          Export
        </button>
      )}
    </div>
  </div>
);

type LeadMetrics = {
  total: number;
  new: number;
  assigned: number;
  followUp: number;
  closed: number;
};

type LeadsBySource = {
  [key: string]: number;
};

type OrderMetrics = {
  total: number;
  revenue: number;
  avgOrderValue: number;
};

type TopProduct = {
  name: string;
  revenue: number;
  quantity: number;
};

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState('30D');
  const [metrics, setMetrics] = useState<LeadMetrics>({
    total: 0,
    new: 0,
    assigned: 0,
    followUp: 0,
    closed: 0,
  });
  const [orderMetrics, setOrderMetrics] = useState<OrderMetrics>({
    total: 0,
    revenue: 0,
    avgOrderValue: 0,
  });
  const [leadsBySource, setLeadsBySource] = useState<LeadsBySource>({});
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch leads data
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('status, source_site');

      if (leadsError) throw leadsError;

      // Fetch orders data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          created_at,
          order_items (
            quantity,
            price_per_unit_at_time_of_order,
            products (
              name
            )
          )
        `);

      if (ordersError) throw ordersError;

      // Process leads metrics
      const newMetrics: LeadMetrics = {
        total: leadsData.length,
        new: leadsData.filter((lead) => lead.status === 'new').length,
        assigned: leadsData.filter((lead) => lead.status === 'assigned').length,
        followUp: leadsData.filter((lead) => lead.status === 'follow_up').length,
        closed: leadsData.filter((lead) => lead.status === 'closed').length,
      };

      // Process leads by source
      const sourceMetrics: LeadsBySource = {};
      leadsData.forEach((lead) => {
        sourceMetrics[lead.source_site] = (sourceMetrics[lead.source_site] || 0) + 1;
      });

      // Process order metrics
      const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const newOrderMetrics: OrderMetrics = {
        total: ordersData.length,
        revenue: totalRevenue,
        avgOrderValue: ordersData.length ? totalRevenue / ordersData.length : 0,
      };

      // Process top products
      const productMetrics: { [key: string]: { revenue: number; quantity: number } } = {};
      ordersData.forEach(order => {
        order.order_items?.forEach(item => {
          const productName = item.products?.name || 'Unknown Product';
          if (!productMetrics[productName]) {
            productMetrics[productName] = { revenue: 0, quantity: 0 };
          }
          productMetrics[productName].revenue += (item.price_per_unit_at_time_of_order || 0) * (item.quantity || 0);
          productMetrics[productName].quantity += item.quantity || 0;
        });
      });

      const newTopProducts = Object.entries(productMetrics)
        .map(([name, metrics]) => ({
          name,
          revenue: metrics.revenue,
          quantity: metrics.quantity,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setMetrics(newMetrics);
      setLeadsBySource(sourceMetrics);
      setOrderMetrics(newOrderMetrics);
      setTopProducts(newTopProducts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Implementation for exporting data
    console.log('Exporting data...');
  };

  const leadSourcesChart = {
    series: Object.values(leadsBySource),
    options: {
      chart: {
        type: 'donut',
        background: 'transparent',
      },
      labels: Object.keys(leadsBySource),
      colors: COLORS.chart.primary,
      legend: {
        position: 'bottom',
        fontSize: '14px',
        labels: {
          colors: COLORS.text.secondary,
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value: number) => `${value} leads`,
        },
      },
    },
  };

  const revenueChart = {
    series: [{
      name: 'Revenue',
      data: [30000, 40000, 35000, 50000, 49000, 60000, 70000, 91000, 80000],
    }],
    options: {
      chart: {
        type: 'area',
        background: 'transparent',
        toolbar: {
          show: false,
        },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: [COLORS.primary],
      },
      colors: [COLORS.primary],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: COLORS.gradient.from,
              opacity: 0.7
            },
            {
              offset: 100,
              color: COLORS.gradient.to,
              opacity: 0.2
            }
          ]
        },
      },
      dataLabels: {
        enabled: false,
      },
      grid: {
        borderColor: '#E8EEE8',
        strokeDashArray: 5,
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        labels: {
          style: {
            colors: COLORS.text.secondary,
        },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: COLORS.text.secondary,
          },
          formatter: (value: number) => `₹${value.toLocaleString()}`,
        },
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value: number) => `₹${value.toLocaleString()}`,
        },
      },
    },
  };

  const topProductsChart = {
    series: [{
      name: 'Revenue',
      data: topProducts.map(p => p.revenue),
    }],
    options: {
      chart: {
        type: 'bar',
        background: 'transparent',
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true,
          barHeight: '70%',
          distributed: true,
        },
      },
      colors: COLORS.chart.green,
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: topProducts.map(p => p.name),
        labels: {
          style: {
            colors: COLORS.text.secondary,
          },
          formatter: (value: number) => `₹${value.toLocaleString()}`,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: COLORS.text.secondary,
          },
        },
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value: number) => `₹${value.toLocaleString()}`,
        },
      },
    },
  };

  const leadStatusChart = {
    series: [metrics.new, metrics.assigned, metrics.followUp, metrics.closed],
    options: {
      chart: {
        type: 'donut',
        background: 'transparent',
      },
      labels: ['New', 'Assigned', 'Follow Up', 'Closed'],
      colors: [COLORS.secondary, COLORS.primary, COLORS.gradient.from, COLORS.gradient.to],
      legend: {
        position: 'bottom',
        fontSize: '14px',
        labels: {
          colors: COLORS.text.secondary,
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
          },
        },
      },
      dataLabels: {
        enabled: false,
        },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (value: number) => `${value} leads`,
        },
      },
    },
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Overview">
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
          <div className="text-center">
            <FiTrendingUp className="mx-auto mb-4 h-12 w-12 animate-pulse text-purple-600" />
            <p className="text-lg text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard Overview">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics Overview</h1>
          <div className="text-sm text-gray-600">
          Last updated: {formatDateTime(new Date())}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard
            title="Total Leads"
            value={metrics.total}
            icon={FiUsers}
            trend={{ value: 12, isPositive: true }}
            description="All time leads"
          />
          <StatCard
            title="New Orders"
            value={orderMetrics.total}
            icon={FiShoppingCart}
            trend={{ value: 8, isPositive: true }}
            description="Total orders received"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(orderMetrics.revenue)}
            icon={FiTrendingUp}
            trend={{ value: 15, isPositive: true }}
            description="Total revenue generated"
          />
          <StatCard
            title="Avg. Order Value"
            value={formatCurrency(orderMetrics.avgOrderValue)}
            icon={FiPieChart}
            trend={{ value: 5, isPositive: false }}
            description="Average order value"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-8">
            <ChartHeader
              title="Revenue Trend"
              subtitle="Monthly revenue analysis"
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onExport={handleExport}
            />
            <div className="h-80">
              <ReactApexChart
                options={revenueChart.options}
                series={revenueChart.series}
                type="area"
                height="100%"
              />
            </div>
          </div>
          
          <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-4">
            <ChartHeader
              title="Lead Sources"
              subtitle="Distribution by channel"
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <div className="h-80">
              {Object.keys(leadsBySource).length > 0 ? (
                <ReactApexChart
                  options={leadSourcesChart.options}
                  series={leadSourcesChart.series}
                  type="donut"
                  height="100%"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <FiPieChart className="h-16 w-16 text-[#B7BAC0]" />
                  <p className="mt-4 text-[#7C887C]">No lead source data available</p>
                  <p className="text-xs text-[#B7BAC0]">Start generating leads to see analytics</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-8">
            <ChartHeader
              title="Top Products"
              subtitle="Best performing products by revenue"
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onExport={handleExport}
            />
            <div className="h-80">
              <ReactApexChart
                options={topProductsChart.options}
                series={topProductsChart.series}
                type="bar"
                height="100%"
              />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-4">
            <ChartHeader
              title="Lead Status"
              subtitle="Current lead distribution"
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <div className="h-80">
              <ReactApexChart
                options={leadStatusChart.options}
                series={leadStatusChart.series}
                type="donut"
                height="100%"
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 
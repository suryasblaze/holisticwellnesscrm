import { useState } from 'react';
import { FunnelIcon, PlusIcon, ChatBubbleLeftIcon, GlobeAltIcon, BriefcaseIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { formatDateTime, formatPhone } from '@/lib/utils';

interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  products?: { name?: string; image_url?: string };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  users?: { full_name?: string };
  lead_id?: string;
  leads?: { name?: string };
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  status: string;
  total_amount: number;
  payment_method?: string;
  payment_id?: string;
  payment_status: string;
  shipping_address?: string;
  billing_address?: string;
  source_platform?: string;
  source?: 'whatsapp' | 'website' | 'crm' | string;
  external_order_id?: string;
  shipping_provider_name?: string;
  shipping_tracking_number?: string;
  notes?: string;
  order_items: OrderItem[];
}

interface OrdersListProps {
  orders: Order[];
  onOpenDetailModal: (order: Order) => void;
}

const getStatusColor = (status: string, type: 'order' | 'payment') => {
  const lowerStatus = status?.toLowerCase();
  if (type === 'order') {
    if (lowerStatus === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (lowerStatus === 'processing') return 'bg-blue-100 text-blue-700';
    if (lowerStatus === 'shipped') return 'bg-indigo-100 text-indigo-700';
    if (lowerStatus === 'delivered') return 'bg-green-100 text-green-700';
    if (lowerStatus === 'cancelled' || lowerStatus === 'refunded') return 'bg-red-100 text-red-700';
  } else if (type === 'payment') {
    if (lowerStatus === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (lowerStatus === 'paid') return 'bg-green-100 text-green-700';
    if (lowerStatus === 'failed' || lowerStatus === 'refunded') return 'bg-red-100 text-red-700';
  }
  return 'bg-gray-100 text-gray-700';
};

const NoOrdersForSource: React.FC<{ sourceName: string }> = ({ sourceName }) => (
  <div className="col-span-full py-8 text-center text-sm text-gray-500 bg-white rounded-lg shadow-sm">
    <ArchiveBoxIcon className="mx-auto h-10 w-10 text-gray-400" />
    <p className="mt-2">No {sourceName} orders found.</p>
  </div>
);

export default function OrdersList({ orders, onOpenDetailModal }: OrdersListProps) {
  const whatsappOrders = orders.filter(o => o.source === 'whatsapp');
  const websiteOrders = orders.filter(o => o.source === 'website');
  const crmOrders = orders.filter(o => o.source === 'crm');

  const OrderCard = ({ order }: { order: Order }) => (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col justify-between h-full">
      <div> 
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-medium text-orbitly-charcoal">Order #{order.external_order_id || order.id.substring(0, 8)}</h3>
            <p className="text-sm text-gray-600 mt-1 truncate" title={order.customer_name || order.leads?.name || order.users?.full_name || 'N/A'}>{order.customer_name || order.leads?.name || order.users?.full_name || 'N/A'}</p>
          </div>
          <div className="flex flex-col items-end space-y-1 flex-shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status, 'order')}`}>
              {order.status}
            </span>
            {order.payment_status !== order.status && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.payment_status, 'payment')}`}>
                {order.payment_status}
              </span>
            )}
          </div>
        </div>

        {order.order_items && order.order_items.length > 0 && (
          <div className="bg-gray-50 rounded-md p-3 mb-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Order Items:</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {order.order_items.map((item, index) => (
                <div key={item.id || `item-${index}`} className="flex justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1 mr-2" title={item.products?.name || 'Product Name'}>{item.quantity}x {item.products?.name || 'Product Name'}</span>
                  <span className="font-medium text-gray-800">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className="text-lg font-semibold text-orbitly-charcoal">₹{order.total_amount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div> 

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          {formatDateTime(order.created_at)}
        </span>
        <div className="flex space-x-2">
          <button onClick={() => onOpenDetailModal(order)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">View Details</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-gradient-to-br from-green-50 via-green-100 to-white rounded-xl shadow-lg p-1 flex flex-col">
            <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-green-200 rounded-t-lg">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <ChatBubbleLeftIcon className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" />
                        <h2 className="text-lg font-semibold text-gray-800">WhatsApp Orders</h2>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                        {whatsappOrders.length} Total
                    </span>
                </div>
            </div>
            <div className="overflow-y-auto p-4 space-y-4 flex-grow" style={{maxHeight: '700px'}}>
                {whatsappOrders.length > 0 ? (
                    whatsappOrders.map((order) => <OrderCard key={order.id} order={order} />)
                ) : (
                    <NoOrdersForSource sourceName="WhatsApp" />
                )}
            </div>
        </section>

        <section className="bg-gradient-to-br from-blue-50 via-blue-100 to-white rounded-xl shadow-lg p-1 flex flex-col">
            <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-blue-200 rounded-t-lg">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <GlobeAltIcon className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" />
                        <h2 className="text-lg font-semibold text-gray-800">Website Orders</h2>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                        {websiteOrders.length} Total
                    </span>
                </div>
            </div>
            <div className="overflow-y-auto p-4 space-y-4 flex-grow" style={{maxHeight: '700px'}}>
                {websiteOrders.length > 0 ? (
                    websiteOrders.map((order) => <OrderCard key={order.id} order={order} />)
                ) : (
                    <NoOrdersForSource sourceName="Website" />
                )}
            </div>
        </section>
      </div>

      <section className="bg-gradient-to-br from-purple-50 via-purple-100 to-white rounded-xl shadow-lg p-1 mt-8 flex flex-col">
          <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-purple-200 rounded-t-lg">
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                      <BriefcaseIcon className="h-6 w-6 text-purple-600 mr-2 flex-shrink-0" />
                      <h2 className="text-lg font-semibold text-gray-800">CRM Orders</h2>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full">
                      {crmOrders.length} Total
                  </span>
              </div>
          </div>
          <div className="overflow-y-auto p-4 space-y-4 flex-grow" style={{maxHeight: '700px'}}>
              {crmOrders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {crmOrders.map((order) => <OrderCard key={order.id} order={order} />)}
                  </div>
              ) : (
                  <NoOrdersForSource sourceName="CRM" />
              )}
          </div>
      </section>
    </div>
  );
} 
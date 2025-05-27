import { useState } from 'react';
import { FunnelIcon, PlusIcon, ChatBubbleLeftIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  orderDate: Date;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  source: 'whatsapp' | 'website';
  paymentStatus: 'pending' | 'paid' | 'failed';
}

interface OrdersListProps {
  orders: Order[];
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function OrdersList({ orders }: OrdersListProps) {
  const whatsappOrders = orders.filter(o => o.source === 'whatsapp');
  const websiteOrders = orders.filter(o => o.source === 'website');

  const OrderCard = ({ order }: { order: Order }) => (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">#{order.id}</h3>
          <p className="text-sm text-gray-600 mt-1">{order.customerName}</p>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[order.paymentStatus]}`}>
            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-md p-3 mb-3">
        <p className="text-xs font-medium text-gray-500 mb-2">Order Items:</p>
        <div className="space-y-1">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.quantity}x {item.productName}</span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Total:</span>
          <span className="text-lg font-semibold text-gray-900">₹{order.totalAmount}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {new Date(order.orderDate).toLocaleDateString()}
        </span>
        <div className="flex space-x-2">
          <button className="text-gray-600 hover:text-gray-800 text-sm">View</button>
          {order.status === 'pending' && (
            <button className="text-green-600 hover:text-green-800 text-sm">Process</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Orders Management</h1>
          <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center">
            <PlusIcon className="w-4 h-4 mr-2" />
            New Order
          </button>
        </div>
        <p className="text-sm text-gray-600">Track and manage customer orders across platforms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Orders Section */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-white/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">WhatsApp Orders</h2>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {whatsappOrders.length} Total
              </span>
            </div>
          </div>
          
          <div className="overflow-auto max-h-[700px] p-4">
            {whatsappOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No WhatsApp orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {whatsappOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Website Orders Section */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-white/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Website Orders</h2>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {websiteOrders.length} Total
              </span>
            </div>
          </div>
          
          <div className="overflow-auto max-h-[700px] p-4">
            {websiteOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No website orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {websiteOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
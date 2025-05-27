'use client';

import { useState, useEffect, Fragment } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiFilter, FiSearch, FiEye, FiArchive, FiLoader, FiChevronDown, FiX } from 'react-icons/fi';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { formatDateTime, formatPhone } from '@/lib/utils'; // Assuming you have these
import OrdersList from '@/components/orders/OrdersList';

// Interfaces (align with your schema.sql)
interface OrderItem {
  id: string;
  product_id: string; 
  products?: { name?: string; image_url?: string }; // Denormalized product name & image
  quantity: number;
  price: number; // Price at the time of order
}

interface Order {
  id: string;
  created_at: string;
  user_id?: string;
  users?: { full_name?: string }; // Denormalized user name
  lead_id?: string;
  leads?: { name?: string }; // Denormalized lead name
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  status: string; // e.g., pending, processing, shipped, delivered, cancelled, refunded
  total_amount: number;
  payment_method?: string;
  payment_id?: string;
  payment_status: string; // e.g., pending, paid, failed, refunded
  shipping_address?: string;
  billing_address?: string;
  source_platform?: string; 
  external_order_id?: string;
  shipping_provider_name?: string;
  shipping_tracking_number?: string;
  notes?: string;
  order_items: OrderItem[];
}

const orderStatusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const paymentStatusOptions = ['pending', 'paid', 'failed', 'refunded'];
const sourcePlatformOptions = ['Website1', 'Website2', 'Website3', 'Website4', 'WhatsApp', 'CRM_Manual'];

// Helper to get status color (can be moved to utils)
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '', payment_status: '', source_platform: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Sample data for testing
  const sampleOrders = [
    {
      id: '1',
      customerName: 'John Doe',
      orderDate: new Date(),
      items: [
        { id: '1', productName: 'Healing Crystal Set', quantity: 2, price: 1500 },
        { id: '2', productName: 'Meditation Guide', quantity: 1, price: 800 }
      ],
      totalAmount: 3800,
      status: 'pending' as const,
      source: 'whatsapp' as const,
      paymentStatus: 'pending' as const
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      orderDate: new Date(),
      items: [
        { id: '3', productName: 'Wellness Package', quantity: 1, price: 5000 }
      ],
      totalAmount: 5000,
      status: 'processing' as const,
      source: 'website' as const,
      paymentStatus: 'paid' as const
    }
  ];

  useEffect(() => {
    // For now, use sample data
    setOrders(sampleOrders);
    setLoading(false);
  }, []);

  const handleOpenOrderDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailModalOpen(true);
  };

 const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  // TODO: Add functions for updating order status, payment status, tracking, etc. (will require a modal or inline editing)

  return (
    <DashboardLayout title="Manage Orders">
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-white p-6 shadow-lg sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-orbitly-charcoal">Order Management</h2>
            <p className="mt-1 text-sm text-orbitly-dark-sage">View, track, and manage all customer orders.</p>
          </div>
           <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border border-orbitly-soft-gray bg-white px-4 py-2 text-sm font-medium text-orbitly-charcoal shadow-sm hover:bg-orbitly-light-green focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              <FiFilter className="h-4 w-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          {/* Add New Order button can be added later if manual order creation is needed from CRM */}
        </div>

        <Transition
          show={showFilters}
          enter="transition-all ease-in-out duration-300"
          enterFrom="opacity-0 max-h-0"
          enterTo="opacity-100 max-h-screen"
          leave="transition-all ease-in-out duration-200"
          leaveFrom="opacity-100 max-h-screen"
          leaveTo="opacity-0 max-h-0"
        >
            <div className="rounded-xl bg-white p-6 shadow-lg overflow-hidden">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label htmlFor="searchTerm" className="block text-xs font-medium text-orbitly-dark-sage">Search Orders</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><FiSearch className="h-4 w-4 text-orbitly-soft-gray" /></div>
                        <input type="text" name="searchTerm" id="searchTerm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ID, Customer, Phone, Email..." className="block w-full rounded-lg border-orbitly-soft-gray bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="status" className="block text-xs font-medium text-orbitly-dark-sage">Order Status</label>
                    <select id="status" name="status" value={filters.status} onChange={handleFilterChange} className="mt-1 block w-full rounded-lg border-orbitly-soft-gray bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="">All Statuses</option>
                        {orderStatusOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="payment_status" className="block text-xs font-medium text-orbitly-dark-sage">Payment Status</label>
                    <select id="payment_status" name="payment_status" value={filters.payment_status} onChange={handleFilterChange} className="mt-1 block w-full rounded-lg border-orbitly-soft-gray bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="">All Payments</option>
                        {paymentStatusOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="source_platform" className="block text-xs font-medium text-orbitly-dark-sage">Source Platform</label>
                    <select id="source_platform" name="source_platform" value={filters.source_platform} onChange={handleFilterChange} className="mt-1 block w-full rounded-lg border-orbitly-soft-gray bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        <option value="">All Platforms</option>
                        {sourcePlatformOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                </div>
            </div>
        </Transition>

        <div className="overflow-x-auto rounded-xl bg-white shadow-lg">
          {loading && orders.length === 0 && <div className="p-8 text-center text-orbitly-dark-sage"><FiLoader className="mx-auto h-12 w-12 animate-pulse text-primary-500" />Loading orders...</div>}
          {!loading && orders.length === 0 && (
            <div className="p-12 text-center">
              <FiArchive className="mx-auto h-16 w-16 text-orbitly-soft-gray" />
              <h3 className="mt-4 text-lg font-medium text-orbitly-charcoal">No Orders Found</h3>
              <p className="mt-1 text-sm text-orbitly-dark-sage">No orders match your current filters or no orders have been placed yet.</p>
            </div>
          )}
          {orders.length > 0 && (
            <OrdersList orders={orders} />
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Transition appear show={isOrderDetailModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsOrderDetailModalOpen(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30" /></Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-orbitly-charcoal flex justify-between items-center">
                      Order Details: #{selectedOrder.external_order_id || selectedOrder.id.substring(0,8)}
                      <button onClick={() => setIsOrderDetailModalOpen(false)} className="text-orbitly-soft-gray hover:text-orbitly-charcoal"><FiX size={20}/></button>
                    </Dialog.Title>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <h4 className="text-md font-semibold text-orbitly-charcoal border-b pb-2">Items Ordered ({selectedOrder.order_items?.length || 0})</h4>
                            {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                                <ul className="divide-y divide-orbitly-light-green max-h-60 overflow-y-auto">
                                    {selectedOrder.order_items.map(item => (
                                        <li key={item.id} className="flex items-center py-3">
                                            <img src={item.products?.image_url || 'https://via.placeholder.com/100'} alt={item.products?.name} className="h-16 w-16 rounded-md object-cover mr-4"/>
                                            <div className="flex-grow">
                                                <p className="font-medium text-orbitly-charcoal">{item.products?.name || 'Product name missing'}</p>
                                                <p className="text-sm text-orbitly-dark-sage">Qty: {item.quantity} @ ₹{item.price.toFixed(2)}</p>
                                            </div>
                                            <p className="text-sm font-medium text-orbitly-charcoal">₹{(item.quantity * item.price).toFixed(2)}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-orbitly-dark-sage">No items found for this order.</p>}
                            
                            <div className="text-right">
                                <p className="text-lg font-semibold text-orbitly-charcoal">Total: ₹{selectedOrder.total_amount.toFixed(2)}</p>
                            </div>

                            {selectedOrder.notes && (
                                <div>
                                    <h4 className="text-md font-semibold text-orbitly-charcoal mt-4 border-b pb-2">Admin Notes</h4>
                                    <p className="text-sm text-orbitly-dark-sage mt-2 p-3 bg-orbitly-light-green/50 rounded-md whitespace-pre-wrap">{selectedOrder.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 text-sm">
                            <h4 className="text-md font-semibold text-orbitly-charcoal border-b pb-2">Customer & Order Info</h4>
                            <p><strong>Customer:</strong> {selectedOrder.customer_name || selectedOrder.users?.full_name || selectedOrder.leads?.name || 'N/A'}</p>
                            <p><strong>Phone:</strong> {formatPhone(selectedOrder.customer_phone || '')}</p>
                            <p><strong>Email:</strong> {selectedOrder.customer_email || 'N/A'}</p>
                            <p><strong>Date:</strong> {formatDateTime(selectedOrder.created_at)}</p>
                            <p><strong>Source:</strong> <span className="capitalize">{selectedOrder.source_platform || 'N/A'}</span></p>
                            <p><strong>Order Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedOrder.status, 'order')}`}>{selectedOrder.status}</span></p>
                            <p><strong>Payment Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedOrder.payment_status, 'payment')}`}>{selectedOrder.payment_status}</span></p>
                            {selectedOrder.payment_method && <p><strong>Payment Method:</strong> {selectedOrder.payment_method}</p>}
                            {selectedOrder.payment_id && <p><strong>Payment ID:</strong> {selectedOrder.payment_id}</p>}
                            
                            <h4 className="text-md font-semibold text-orbitly-charcoal pt-3 border-b pb-2">Shipping</h4>
                            <p className="whitespace-pre-wrap">{selectedOrder.shipping_address || 'No shipping address provided.'}</p>
                            {selectedOrder.shipping_provider_name && <p><strong>Provider:</strong> {selectedOrder.shipping_provider_name}</p>}
                            {selectedOrder.shipping_tracking_number && <p><strong>Tracking #:</strong> {selectedOrder.shipping_tracking_number}</p>}
                            {/* TODO: Edit Order Status, Payment, Tracking buttons/forms */}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="button" onClick={() => setIsOrderDetailModalOpen(false)} className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm font-medium text-orbitly-dark-sage hover:bg-orbitly-light-green focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">
                            Close
                        </button>
                        {/* TODO: Button to update order? */}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </DashboardLayout>
  );
} 
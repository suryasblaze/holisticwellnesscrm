'use client';

import { useState, useEffect, Fragment } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiFilter, FiSearch, FiEye, FiArchive, FiLoader, FiChevronDown, FiX, FiPlusCircle, FiUser, FiBox, FiTrash2 } from 'react-icons/fi';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { formatDateTime, formatPhone } from '@/lib/utils';
import OrdersList from '@/components/orders/OrdersList';

// Interfaces
interface ProductStub {
  id: string;
  name: string;
  price: number;
  stock?: number; // For checking availability
}

interface LeadStub {
  id: string;
  name: string;
}

interface NewOrderItem {
  product_id: string;
  quantity: number;
  price: number; // Price at the time of adding to order
  product_name?: string; // For display in modal
}

interface OrderItem {
  id?: string; // Optional for new items not yet in DB
  order_id?: string;
  product_id: string; 
  products?: { name?: string; image_url?: string };
  quantity: number;
  price: number; // Price at the time of order
}

interface Order {
  id: string;
  created_at: string;
  updated_at?: string; // Added
  user_id?: string;
  users?: { full_name?: string };
  lead_id?: string;
  leads?: { name?: string }; 
  customer_name?: string; // Can be manually entered if no lead
  customer_phone?: string;
  customer_email?: string;
  status: string; 
  total_amount: number;
  payment_method?: string;
  payment_id?: string;
  payment_status: string; 
  shipping_address?: string;
  billing_address?: string;
  source_platform?: string; // Raw DB value
  source?: 'whatsapp' | 'website' | 'crm' | string; // Mapped frontend value
  external_order_id?: string;
  shipping_provider_name?: string;
  shipping_tracking_number?: string;
  notes?: string;
  order_items: OrderItem[];
}

const initialNewOrderState: Partial<Order & { order_items: NewOrderItem[] }> = {
  lead_id: '',
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  status: 'pending', 
  payment_status: 'pending',
  source_platform: 'CRM_Manual', // Default for CRM orders
  source: 'crm', 
  order_items: [],
  total_amount: 0,
  notes: '',
};

const orderStatusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const paymentStatusOptions = ['pending', 'paid', 'failed', 'refunded'];
// Assuming sourcePlatformOptions from your file are the actual DB values
const sourcePlatformFilterOptions = [
    { value: 'Website1', label: 'Website1'}, // Example, adjust to your actual values
    { value: 'WhatsApp', label: 'WhatsApp'},
    { value: 'CRM_Manual', label: 'CRM'}
];

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
  const [isUpdating, setIsUpdating] = useState(false); // For save operations

  // Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);

  // New Order Modal State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState<Partial<Order & { order_items: NewOrderItem[] }>>(initialNewOrderState);
  const [availableProducts, setAvailableProducts] = useState<ProductStub[]>([]);
  const [availableLeads, setAvailableLeads] = useState<LeadStub[]>([]);
  const [selectedProductForNewItem, setSelectedProductForNewItem] = useState<string>('');
  const [quantityForNewItem, setQuantityForNewItem] = useState<number>(1);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '', payment_status: '', source_platform: '' });
  const [showFiltersBar, setShowFiltersBar] = useState(false); // Renamed from showFilters for clarity

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          leads ( id, name ),
          users ( id, full_name ),
          order_items ( *, products (id, name, image_url) )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,id.eq.${searchTerm},external_order_id.ilike.%${searchTerm}%`);
      }
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.payment_status) query = query.eq('payment_status', filters.payment_status);
      if (filters.source_platform) query = query.eq('source_platform', filters.source_platform);

      const { data, error } = await query;
      if (error) throw error;

      const formattedOrders = data?.map(o => {
        let mappedSource: string | undefined = undefined;
        if (o.source_platform === 'CRM_Manual') mappedSource = 'crm';
        else if (o.source_platform === 'whatsapp_channel') mappedSource = 'whatsapp'; // Updated to 'whatsapp_channel'
        else if (o.source_platform === 'main_website') mappedSource = 'website';     // Updated to 'main_website'
        else mappedSource = o.source_platform; // Fallback for any other sources

        return {
          ...o,
          source: mappedSource,
          order_items: o.order_items || [], 
        } as Order;
      }) || [];
      setOrders(formattedOrders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error(`Failed to fetch orders: ${error.message}`);
    } finally {
    setLoading(false);
    }
  };

  const fetchDataForNewOrderModal = async () => {
    try {
      const [productsRes, leadsRes] = await Promise.all([
        supabase.from('products').select('id, name, price, stock').order('name'),
        supabase.from('leads').select('id, name').order('name')
      ]);
      if (productsRes.error) throw productsRes.error;
      if (leadsRes.error) throw leadsRes.error;
      setAvailableProducts(productsRes.data as ProductStub[]);
      setAvailableLeads(leadsRes.data as LeadStub[]);
    } catch (error: any) {
      toast.error(`Failed to load data for new order: ${error.message}`);
    }
  };

  const handleOpenNewOrderModal = () => {
    setNewOrderData(initialNewOrderState);
    setSelectedProductForNewItem('');
    setQuantityForNewItem(1);
    fetchDataForNewOrderModal(); // Fetch products/leads when modal opens
    setIsNewOrderModalOpen(true);
  };

  // Functions for New Order Modal Item Management
  const handleAddNewItemToOrder = () => {
    if (!selectedProductForNewItem || quantityForNewItem <= 0) {
      toast.error('Please select a product and enter a valid quantity.');
      return;
    }
    const product = availableProducts.find(p => p.id === selectedProductForNewItem);
    if (!product) {
      toast.error('Selected product not found.');
      return;
    }
    if (product.stock !== undefined && product.stock < quantityForNewItem) {
        toast.error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
        return;
    }

    setNewOrderData(prev => {
      const existingItems = prev?.order_items || [];
      const newItems = [...existingItems, { 
        product_id: product.id, 
        product_name: product.name, 
        quantity: quantityForNewItem, 
        price: product.price 
      }];
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { ...prev, order_items: newItems, total_amount: newTotal } as Partial<Order & { order_items: NewOrderItem[] }>;
    });
    setSelectedProductForNewItem(''); 
    setQuantityForNewItem(1);
  };

  const handleRemoveItemFromOrder = (index: number) => {
    setNewOrderData(prev => {
      if (!prev || !prev.order_items) return prev;
      const newItems = prev.order_items.filter((_, i) => i !== index);
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { ...prev, order_items: newItems, total_amount: newTotal };
    });
  };

  const handleNewOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewOrderData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'lead_id' && value) {
        const selectedLead = availableLeads.find(l => l.id === value);
        if (selectedLead) {
            setNewOrderData(prev => ({ ...prev, customer_name: selectedLead.name })); // Auto-fill customer name
        }
    }
  };

  const handleSaveNewOrder = async () => {
    if (!newOrderData || !newOrderData.order_items || newOrderData.order_items.length === 0) {
      toast.error('Please add at least one item to the order.');
      return;
    }
    if (!newOrderData.lead_id && !newOrderData.customer_name) {
        toast.error('Please select a lead or enter a customer name.');
        return;
    }

    setIsUpdating(true);
    const toastId = toast.loading('Creating new order...');
    try {
      const { order_items, total_amount, lead_id, customer_name, customer_phone, customer_email, status, payment_status, notes } = newOrderData;
      
      const orderPayload: Omit<Order, 'id' | 'created_at' | 'order_items' | 'source'> & { order_items?: Omit<OrderItem, 'id' | 'order_id'>[] } = {
        lead_id: lead_id || null,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        customer_email: customer_email || null,
        status: status || 'pending',
        payment_status: payment_status || 'pending',
        total_amount: total_amount || 0,
        source_platform: 'CRM_Manual', // Hardcoded for CRM orders
        notes: notes || null,
        // user_id: could be current logged in user if needed
      };

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id')
        .single();

      if (orderError) throw orderError;
      if (!newOrder || !newOrder.id) throw new Error('Failed to create order, ID not returned.');

      const orderItemsPayload = order_items.map(item => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_per_unit_at_time_of_order: item.price,
        subtotal: item.price * item.quantity, // Add subtotal for DB
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsError) {
        // Attempt to delete the order if items fail to insert (basic rollback)
        await supabase.from('orders').delete().eq('id', newOrder.id);
        throw itemsError;
      }

      toast.success('New order created successfully!', { id: toastId });
      setIsNewOrderModalOpen(false);
      fetchOrders(); 
    } catch (error: any) {
      toast.error(`Failed to create order: ${error.message}`, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  // Order Detail Modal handler (already present, ensure it uses mapped source)
  const handleOpenOrderDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailModalOpen(true);
  };

 const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <DashboardLayout title="Manage Orders">
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-white p-6 shadow-lg sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-orbitly-charcoal">Order Management</h2>
            <p className="mt-1 text-sm text-orbitly-dark-sage">View, track, and manage all customer orders.</p>
          </div>
          <div className="flex items-center gap-3">
           <button 
                onClick={() => setShowFiltersBar(!showFiltersBar)}
              className="flex items-center gap-2 rounded-lg border border-orbitly-soft-gray bg-white px-4 py-2 text-sm font-medium text-orbitly-charcoal shadow-sm hover:bg-orbitly-light-green focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              <FiFilter className="h-4 w-4" />
                {showFiltersBar ? 'Hide' : 'Show'} Filters
            </button>
            <button 
              onClick={handleOpenNewOrderModal} 
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              <FiPlusCircle className="h-4 w-4" /> New Order
            </button>
          </div>
        </div>

        <Transition
          show={showFiltersBar}
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
                        {sourcePlatformFilterOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
                </div>
            </div>
        </Transition>

        <div className="overflow-x-auto rounded-xl bg-white shadow-lg min-h-[300px]">
          {loading && orders.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <FiLoader className="mx-auto h-12 w-12 animate-spin text-primary-500" />
              <p className="mt-4 text-orbitly-dark-sage">Loading orders...</p>
            </div>
          )}

          {!(loading && orders.length === 0) && (
            <OrdersList orders={orders} onOpenDetailModal={handleOpenOrderDetailModal} />
          )}
        </div>
      </div>

      {/* New Order Modal */}
      <Transition appear show={isNewOrderModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsNewOrderModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/50" /></Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-orbitly-charcoal">Create New CRM Order</Dialog.Title>
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveNewOrder(); }} className="mt-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="lead_id" className="block text-sm font-medium text-orbitly-dark-sage">Select Customer (Lead)</label>
                            <select name="lead_id" id="lead_id" value={newOrderData.lead_id || ''} onChange={handleNewOrderInputChange} className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                                <option value="">-- Select Lead --</option>
                                {availableLeads.map(lead => <option key={lead.id} value={lead.id}>{lead.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="customer_name" className="block text-sm font-medium text-orbitly-dark-sage">Or Enter Customer Name</label>
                            <input type="text" name="customer_name" id="customer_name" value={newOrderData.customer_name || ''} onChange={handleNewOrderInputChange} placeholder="Manual Customer Name" className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                        </div>
                    </div>
                    {/* Customer Phone and Email inputs can be added here if needed */}
                    
                    <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-orbitly-charcoal mb-2">Order Items</h4>
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                            {newOrderData.order_items?.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-orbitly-light-green/30 rounded-md">
                                    <div>
                                        <p className="font-medium">{item.product_name || 'Product Name'}</p>
                                        <p className="text-xs text-orbitly-dark-sage">Qty: {item.quantity} @ ₹{(item.price ?? item.price_per_unit_at_time_of_order ?? 0).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <p className="font-semibold mr-3">₹{(item.quantity * (item.price ?? item.price_per_unit_at_time_of_order ?? 0)).toFixed(2)}</p>
                                        <button type="button" onClick={() => handleRemoveItemFromOrder(index)} className="text-red-500 hover:text-red-700"><FiTrash2 /></button>
                                    </div>
                                </div>
                            ))}
                            {newOrderData.order_items?.length === 0 && <p className="text-sm text-center text-orbitly-dark-sage py-3">No items added yet.</p>}
                        </div>
                        <div className="flex items-end gap-3 border-t pt-3">
                            <div className="flex-grow">
                                <label htmlFor="selectedProductForNewItem" className="block text-xs font-medium text-orbitly-dark-sage">Add Product</label>
                                <select id="selectedProductForNewItem" value={selectedProductForNewItem} onChange={(e) => setSelectedProductForNewItem(e.target.value)} className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                                    <option value="">-- Select Product --</option>
                                    {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price.toFixed(2)}) {p.stock !== undefined ? ` - Stock: ${p.stock}` : ''}</option>)}
                                </select>
                            </div>
                            <div className="w-24">
                                <label htmlFor="quantityForNewItem" className="block text-xs font-medium text-orbitly-dark-sage">Quantity</label>
                                <input type="number" id="quantityForNewItem" value={quantityForNewItem} onChange={(e) => setQuantityForNewItem(Math.max(1, parseInt(e.target.value,10)))} min="1" className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                            </div>
                            <button type="button" onClick={handleAddNewItemToOrder} className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 self-end">Add Item</button>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-orbitly-dark-sage">Order Notes</label>
                        <textarea name="notes" id="notes" value={newOrderData.notes || ''} onChange={handleNewOrderInputChange} rows={2} className="mt-1 block w-full rounded-lg border-orbitly-soft-gray p-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    </div>

                    <div className="text-right mt-4">
                        <p className="text-xl font-semibold">Total: ₹{newOrderData.total_amount?.toFixed(2) || '0.00'}</p>
                    </div>

                    <div className="mt-8 flex justify-end space-x-3">
                      <button type="button" onClick={() => setIsNewOrderModalOpen(false)} disabled={isUpdating} className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm font-medium text-orbitly-dark-sage hover:bg-orbitly-light-green focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">Cancel</button>
                      <button type="submit" disabled={isUpdating} className="flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-70">
                        {isUpdating && <FiLoader className="animate-spin mr-2" />} 
                        Create Order
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

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
                                                <p className="text-sm text-orbitly-dark-sage">Qty: {item.quantity} @ ₹{(item.price ?? item.price_per_unit_at_time_of_order ?? 0).toFixed(2)}</p>
                                            </div>
                                            <p className="text-sm font-medium text-orbitly-charcoal">₹{(item.quantity * (item.price ?? item.price_per_unit_at_time_of_order ?? 0)).toFixed(2)}</p>
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
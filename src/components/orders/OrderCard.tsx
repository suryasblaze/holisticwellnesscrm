import { ChatIcon, GlobeIcon, TruckIcon, CashIcon } from '@heroicons/react/outline';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface OrderCardProps {
  id: string;
  customerName: string;
  orderDate: Date;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  source: 'whatsapp' | 'website';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress?: string;
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

export default function OrderCard({
  id,
  customerName,
  orderDate,
  items,
  totalAmount,
  status,
  source,
  paymentStatus,
  shippingAddress,
}: OrderCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2">
            {source === 'whatsapp' ? (
              <ChatIcon className="h-5 w-5 text-green-500" title="WhatsApp Order" />
            ) : (
              <GlobeIcon className="h-5 w-5 text-blue-500" title="Website Order" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{customerName}</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">Order #{id}</p>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColors[paymentStatus]}`}>
            Payment: {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center text-gray-600 text-sm">
          <CashIcon className="h-5 w-5 mr-2" />
          <span className="font-medium">Order Date:</span>
          <span className="ml-2">{format(orderDate, 'MMM d, yyyy')}</span>
        </div>
        
        <div className="bg-gray-50 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items:</h4>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.productName}
                </span>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span className="text-indigo-600">₹{totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
        
        {shippingAddress && (
          <div className="flex items-start space-x-2 text-sm">
            <TruckIcon className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-700">Shipping Address:</p>
              <p className="text-gray-600 mt-1">{shippingAddress}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-end space-x-2">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
          View Details
        </button>
        {status === 'pending' && (
          <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
            Process Order
          </button>
        )}
      </div>
    </div>
  );
} 
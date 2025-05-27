import { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, ChatBubbleLeftIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  source: string;
  onWhatsApp: boolean;
}

interface ProductsListProps {
  products: Product[];
}

export default function ProductsList({ products }: ProductsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const whatsappProducts = products.filter(p => p.source === 'whatsapp');
  const websiteProducts = products.filter(p => p.source === 'website');

  const filterProducts = (productList: Product[]) => {
    if (!searchQuery) return productList;
    const query = searchQuery.toLowerCase();
    return productList.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-600 flex-1">Manage your product catalog across platforms.</p>
          <div className="relative w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Products Section */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-white/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">WhatsApp Products</h2>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {whatsappProducts.length} Products
              </span>
            </div>
          </div>
          
          <div className="overflow-auto max-h-[600px] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filterProducts(whatsappProducts).map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
                  <div className="relative h-40 mb-4 rounded-md overflow-hidden">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-semibold text-green-600">₹{product.price}</span>
                      <span className="text-sm text-gray-500">{product.stock} in stock</span>
                    </div>
                    <div className="flex justify-end mt-3 space-x-2">
                      <button className="text-gray-600 hover:text-gray-800 text-sm">Edit</button>
                      <button className="text-green-600 hover:text-green-800 text-sm">Share</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Website Products Section */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-white/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Website Products</h2>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {websiteProducts.length} Products
              </span>
            </div>
          </div>
          
          <div className="overflow-auto max-h-[600px] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filterProducts(websiteProducts).map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
                  <div className="relative h-40 mb-4 rounded-md overflow-hidden">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-semibold text-blue-600">₹{product.price}</span>
                      <span className="text-sm text-gray-500">{product.stock} in stock</span>
                    </div>
                    <div className="flex justify-end mt-3 space-x-2">
                      <button className="text-gray-600 hover:text-gray-800 text-sm">Edit</button>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
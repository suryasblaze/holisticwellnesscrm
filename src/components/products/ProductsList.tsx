import { useState } from 'react';
import { ChatBubbleLeftIcon, GlobeAltIcon, BriefcaseIcon, PencilSquareIcon, QuestionMarkCircleIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: string;
  stock: number;
  source?: 'whatsapp' | 'website' | 'crm' | string;
  is_published_on_whatsapp?: boolean;
  created_at?: string;
  updated_at?: string;
  image_urls?: string[];
  tags?: string[];
  weight?: number;
  dimensions?: { l?: number; w?: number; h?: number; unit?: string };
  external_ids?: any;
  last_whatsapp_sync_at?: string;
}

interface ProductsListProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
}

const NoProductsForSource: React.FC<{ sourceName: string }> = ({ sourceName }) => (
  <div className="col-span-full py-8 text-center text-sm text-gray-500 bg-white rounded-lg shadow-sm">
    <ArchiveBoxIcon className="mx-auto h-10 w-10 text-gray-400" />
    <p className="mt-2">No {sourceName} products found.</p>
  </div>
);

export default function ProductsList({ products, onEditProduct }: ProductsListProps) {
  // const [searchQuery, setSearchQuery] = useState(''); // Removed

  // Directly use the products prop, filtering is done in parent
  // const filteredProducts = products.filter(product => // Removed
  //   product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  // );

  const whatsappProducts = products.filter(p => p.source === 'whatsapp');
  const websiteProducts = products.filter(p => p.source === 'website');
  const crmProducts = products.filter(p => p.source === 'crm');
  const otherSourceProducts = products.filter(
    p => p.source !== 'crm' && p.source !== 'website' && p.source !== 'whatsapp'
  );

  const renderProductCard = (product: Product) => (
    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all hover:shadow-xl hover:-translate-y-1">
      <div className="relative h-40 w-full">
        <Image
          src={product.image_url || '/images/placeholder-image.png'}
          alt={product.name}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
        {product.source === 'crm' && <BriefcaseIcon className="absolute top-2 right-2 h-6 w-6 text-purple-500 bg-white rounded-full p-1 shadow" title="CRM Product"/>}
        {product.source === 'website' && <GlobeAltIcon className="absolute top-2 right-2 h-6 w-6 text-blue-500 bg-white rounded-full p-1 shadow" title="Website Product"/>}
        {product.source === 'whatsapp' && <ChatBubbleLeftIcon className="absolute top-2 right-2 h-6 w-6 text-green-500 bg-white rounded-full p-1 shadow" title="WhatsApp Product"/>}
        {product.source !== 'crm' && product.source !== 'website' && product.source !== 'whatsapp' && 
          <QuestionMarkCircleIcon className="absolute top-2 right-2 h-6 w-6 text-gray-500 bg-white rounded-full p-1 shadow" title={`Source: ${product.source || 'Unknown'}`}/>
        }
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-orbitly-charcoal truncate" title={product.name}>{product.name}</h3>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{product.category}</p>
        <p className="text-sm text-orbitly-sage mt-1 h-10 overflow-hidden text-ellipsis" title={product.description}>{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xl font-bold text-primary-600">₹{product.price.toLocaleString()}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
          </span>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
          <button 
            onClick={() => onEditProduct(product)} 
            className="p-2 text-gray-500 hover:text-primary-600 transition-colors rounded-full hover:bg-primary-50"
            title="Edit Product"
          >
            <PencilSquareIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* Search Bar Removed From Here */}
      {/* 
      <div className="mb-6 sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4 px-2 -mx-2 rounded-lg">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products by name, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-orbitly-soft-gray rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm shadow-sm"
          />
        </div>
      </div>
      */}

      {products.length === 0 && (
        // Updated empty state message since internal search is removed
        <p className="text-center text-orbitly-sage py-10">No products found matching your criteria, or no products have been added yet.</p>
      )}

      {/* WhatsApp Products Section - Always Rendered */}
      <section>
        <div className="flex items-center mb-4">
          <ChatBubbleLeftIcon className="h-6 w-6 text-green-600 mr-2" />
          <h2 className="text-xl font-semibold text-orbitly-charcoal">WhatsApp Products ({whatsappProducts.length})</h2>
        </div>
        {whatsappProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {whatsappProducts.map(renderProductCard)}
          </div>
        ) : (
          <NoProductsForSource sourceName="WhatsApp" />
        )}
      </section>

      {/* Website Products Section - Always Rendered */}
      <section>
        <div className="flex items-center mb-4">
          <GlobeAltIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-orbitly-charcoal">Website Products ({websiteProducts.length})</h2>
        </div>
        {websiteProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {websiteProducts.map(renderProductCard)}
          </div>
        ) : (
          <NoProductsForSource sourceName="Website" />
        )}
      </section>

      {/* CRM Products Section - Always Rendered */}
      <section>
        <div className="flex items-center mb-4">
          <BriefcaseIcon className="h-6 w-6 text-purple-600 mr-2" />
          <h2 className="text-xl font-semibold text-orbitly-charcoal">CRM Products ({crmProducts.length})</h2>
        </div>
        {crmProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {crmProducts.map(renderProductCard)}
          </div>
        ) : (
          <NoProductsForSource sourceName="CRM" />
        )}
      </section>

      {/* Other Products Section - Rendered only if there are such products */} 
      {otherSourceProducts.length > 0 && (
        <section>
          <div className="flex items-center mb-4">
            <QuestionMarkCircleIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-orbitly-charcoal">Other Products ({otherSourceProducts.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {otherSourceProducts.map(renderProductCard)}
          </div>
        </section>
      )}
    </div>
  );
} 
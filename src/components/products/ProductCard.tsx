import { ShoppingCartIcon, BadgeCheckIcon } from '@heroicons/react/outline';
import Image from 'next/image';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  availableOn: ('whatsapp' | 'website')[];
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  imageUrl,
  category,
  inStock,
  availableOn,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 w-full">
        <Image
          src={imageUrl}
          alt={name}
          layout="fill"
          objectFit="cover"
          className="transform hover:scale-105 transition-transform duration-200"
        />
        {availableOn.length === 2 && (
          <div className="absolute top-2 right-2 bg-indigo-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            Available Everywhere
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
            <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
              {category}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-indigo-600">₹{price}</span>
            <div className="flex items-center mt-1">
              {availableOn.includes('website') && (
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-1">
                  Web
                </span>
              )}
              {availableOn.includes('whatsapp') && (
                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  WhatsApp
                </span>
              )}
            </div>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {inStock ? (
              <BadgeCheckIcon className="h-5 w-5 text-green-500 mr-1" />
            ) : (
              <BadgeCheckIcon className="h-5 w-5 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${inStock ? 'text-green-600' : 'text-red-600'}`}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          
          <button
            disabled={!inStock}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              inStock
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } transition-colors`}
          >
            <ShoppingCartIcon className="h-4 w-4 mr-2" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
} 
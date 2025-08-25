"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { VendorItem } from "@/types/api";

interface EventFoodTrucksProps {
  vendors: VendorItem[];
  eventId?: string;
}

export default function EventFoodTrucks({ 
  vendors, 
  eventId = 'default-event'
}: EventFoodTrucksProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const displayVendors = vendors.filter(vendor => vendor.id);

  if (!displayVendors || displayVendors.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto mb-12 scrollbar-hide px-4"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {displayVendors.map((vendor) => (
          <div
            key={vendor.id}
            className="flex-shrink-0 w-80 rounded-xl overflow-hidden cursor-pointer flex flex-col"
            style={{ 
              scrollSnapAlign: 'start',
              backgroundColor: 'white',
            }}
            onClick={() => {
              const url = `/foodtrucks/${vendor.id}?eventId=${eventId}`;
              router.push(url);
            }}
          >
            <div className="w-full aspect-[5/3] overflow-hidden relative p-3">
              {vendor.thumbImageUrl ? (
                <img 
                  src={vendor.thumbImageUrl} 
                  alt={vendor.name || '푸드트럭 이미지'} 
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
            </div>
            
            <div className="px-4 flex-1 flex flex-col">
              <h3 className="text-black font-bold text-md text-left">
                {vendor.name || '푸드트럭'}
              </h3>
              
              {vendor.description && (
                <p className="text-sm text-black text-left mb-4" style={{ opacity: 0.8 }}>
                  {vendor.description}
                </p>
              )}
              
              <div className="mt-auto mb-4">
                {vendor.location && (
                  <div className="flex items-center justify-start mb-1">
                    <svg className={`w-4 h-4 dark:text-white mr-2`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm text-black">
                      {vendor.location}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-start mt-1">
                <svg className="w-4 h-4 text-gray-800 dark:text-white mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z" clipRule="evenodd"/>
                </svg>
                  <span className="text-sm text-black">
                    {vendor.operationTime || '10:00-18:00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
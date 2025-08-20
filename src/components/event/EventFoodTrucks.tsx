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
        className="flex space-x-4 overflow-x-auto mb-12 scrollbar-hide"
        style={{ 
          paddingLeft: '16px',
          paddingRight: '16px',
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
            <div className=" w-full aspect-[5/3] overflow-hidden relative p-3" style={{ backgroundColor: "white" }}>
              {vendor.thumbImageUrl ? (
                <img 
                  src={vendor.thumbImageUrl} 
                  alt={vendor.name || '푸드트럭 이미지'} 
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
            </div>
            
            <div className="px-4 flex-1 flex flex-col">
              <h3 className="text-black font-bold text-lg text-left">
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
                    <img 
                      src="/images/icon_pin.png" 
                      alt="위치 아이콘" 
                      className="w-6 h-6 mr-1 object-contain mt-0.5"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-sm text-black" style={{ opacity: 0.7 }}>
                      {vendor.location}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-start mt-1">
                <img 
                      src="/images/icon_time.png" 
                      alt="위치 아이콘" 
                      className="w-6 h-6 mr-1 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />

                  <span className="text-sm text-black" style={{ opacity: 0.7 }}>
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
"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { partnerCafes } from "@/components/partnerCafes/partnerCafes";
import {useForCustomersStore} from "@/stores/for-customer-store";

export default function shopPage({ params }: { params: { shopName: string } }) {
    const decodedShopName = decodeURIComponent(params.shopName)
    const foundShop = partnerCafes.find((partnerCafe)=>{return (partnerCafe.shopName.replaceAll(" ", "-") + "-" + partnerCafe.id) == decodedShopName})
    const {updateShopSelected} = useForCustomersStore();

  useEffect(()=>{if (foundShop) {updateShopSelected(foundShop)}},[foundShop])
    


  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] items-center justify-start container pt-[72px] px-8">
      {foundShop.id}
    </div>
  );
}

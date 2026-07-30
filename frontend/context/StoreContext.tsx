import React, { createContext, useContext, useState, ReactNode } from "react";
import { StoreProduct } from "../lib/types";
import { BACKEND } from "../lib/constants";
import { useDashboard } from "./DashboardContext";

interface StoreContextType {
  storeProducts: any;
  storeLoading: any;
  storeSearch: any;
  storeCategory: any;
  isListingModalOpen: any;
  listingForm: any;
  listingSubmitting: any;
  setStoreProducts: any;
  setStoreLoading: any;
  setStoreSearch: any;
  setStoreCategory: any;
  setIsListingModalOpen: any;
  setListingForm: any;
  setListingSubmitting: any;
  fetchStoreProducts: any;
  handleListProduct: any;
  handleBuyProduct: any;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { email } = useDashboard();

  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  const [storeCategory, setStoreCategory] = useState("All");
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [listingForm, setListingForm] = useState({
    title: "", description: "", price: "", category: "Jerseys", image_url: ""
  });
  const [listingSubmitting, setListingSubmitting] = useState(false);

  const fetchStoreProducts = async () => {
    setStoreLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/store/products`);
      if (res.ok) {
        const data = await res.json();
        setStoreProducts(data);
      }
    } catch (err) {
      console.error("Failed to load store products", err);
    } finally {
      setStoreLoading(false);
    }
  };

  const handleListProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setListingSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/store/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_email: email,
          title: listingForm.title,
          description: listingForm.description,
          price: parseFloat(listingForm.price),
          category: listingForm.category,
          image_url: listingForm.image_url
        })
      });
      if (res.ok) {
        setIsListingModalOpen(false);
        setListingForm({ title: "", description: "", price: "", category: "Jerseys", image_url: "" });
        fetchStoreProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setListingSubmitting(false);
    }
  };

  const handleBuyProduct = async (productId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/store/products/${productId}/buy`, {
        method: "POST"
      });
      if (res.ok) fetchStoreProducts();
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <StoreContext.Provider value={{
      storeProducts, storeLoading, storeSearch, storeCategory, isListingModalOpen, listingForm, listingSubmitting, setStoreProducts, setStoreLoading, setStoreSearch, setStoreCategory, setIsListingModalOpen, setListingForm, setListingSubmitting, fetchStoreProducts, handleListProduct, handleBuyProduct
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}

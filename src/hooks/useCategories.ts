import { useState, useEffect } from "react";

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  displayOrder: number;
  subCategories: SubCategory[];
}

let cachedCategories: Category[] | null = null;

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cachedCategories || []);
  const [isLoading, setIsLoading] = useState(!cachedCategories);

  useEffect(() => {
    if (cachedCategories) {
      setCategories(cachedCategories);
      setIsLoading(false);
      return;
    }

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          cachedCategories = data;
          setCategories(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch categories", err);
        setIsLoading(false);
      });
  }, []);

  return { categories, isLoading };
}

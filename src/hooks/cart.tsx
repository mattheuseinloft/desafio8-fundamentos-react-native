import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadedProductsString = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (loadedProductsString) {
        const loadedProducts = JSON.parse(loadedProductsString);
        setProducts([...loadedProducts]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const newProductIndex = products.findIndex(
        newProduct => newProduct.id === product.id,
      );

      if (newProductIndex !== -1) {
        const newProducts = [...products];

        newProducts[newProductIndex].quantity += 1;

        setProducts(newProducts);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(newProducts),
        );

        return;
      }

      const newProduct: Product = {
        ...product,
        quantity: 1,
      };

      setProducts([...products, newProduct]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify([...products, newProduct]),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      if (productIndex !== -1) {
        const newProducts = [...products];
        newProducts[productIndex].quantity += 1;

        setProducts(newProducts);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(newProducts),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      if (productIndex !== -1 && products[productIndex].quantity > 0) {
        products[productIndex].quantity -= 1;

        const newProducts = products.filter(product => product.quantity > 0);

        setProducts([...newProducts]);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(newProducts),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

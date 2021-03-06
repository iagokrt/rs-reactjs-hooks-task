import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];

      // find for product on storage method
      const foundProduct = updatedCart.find(
        (product) => product.id === productId
      );

      // stock data
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      // amount
      const currentAmount = foundProduct ? foundProduct.amount : 0;
      const amount = currentAmount + 1;

      // verify amount
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      // verify for product
      if (foundProduct) {
        // just changes the amount of the current product found
        foundProduct.amount = amount;
      } else {
        // find the product and add it
        const product = await api.get(`/products/${productId}`);

        const productItem = {
          ...product.data,
          amount: 1
        };

        updatedCart.push(productItem);
      }

      // set it to state
      setCart(updatedCart);
      // and set it to localstorage (parse the Object to string)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];

      const productIndex = updatedCart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart); // immutable principle
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)); // updated cart on localstorage
      } else {
        throw Error(); // un-sucessfully get product using its id
      }
    } catch {
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else  {
        throw Error();
      }
    } catch {
      toast.error("Erro na altera????o de quantidade do produto");
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

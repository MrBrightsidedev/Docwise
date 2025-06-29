export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SaWZEFRUkxvZlt',
    priceId: 'price_1RfLWW2cKms2tazUxzjrznUQ',
    name: 'Test subscription pro',
    description: 'test subscription',
    mode: 'subscription',
    price: 9.00,
    currency: 'EUR'
  },
  {
    id: 'prod_SaWaMypIboiteZ',
    priceId: 'price_1RfLXW2cKms2tazUSxzTlOW1',
    name: 'Enterprise test subscription',
    description: 'test sub',
    mode: 'subscription',
    price: 29.00,
    currency: 'EUR'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};
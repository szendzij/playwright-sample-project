import { test, expect } from '../../../setup/api/fixtures.js';

test.describe('API Koszyk', () => {
  test('tworzenie koszyka i dodawanie produktu', async ({ cartHelper, productHelper }) => {
    // 1. Utworzenie koszyka
    const createCartResponse = await cartHelper.createCartResponse();
    expect(createCartResponse.status()).toBe(201);

    const cart = await createCartResponse.json();
    expect(cart).toHaveProperty('id');
    const cartId = cart.id;
    expect(typeof cartId).toBe('string');

    // 2. Pobranie przykładowego produktu do dodania
    const productsData = await productHelper.getProducts();
    expect(productsData.data.length).toBeGreaterThan(0);
    const targetProduct = productsData.data[0];
    const quantity = 2;

    // 3. Dodanie produktu do koszyka
    const addItemResponse = await cartHelper.addItemToCartResponse(cartId, targetProduct.id, quantity);
    expect(addItemResponse.status()).toBe(200);

    // 4. Pobranie zawartości koszyka i weryfikacja
    const getCartResponse = await cartHelper.getCartResponse(cartId);
    expect(getCartResponse.status()).toBe(200);

    const cartDetails = await getCartResponse.json();
    expect(cartDetails.id).toBe(cartId);
    expect(Array.isArray(cartDetails.cart_items)).toBe(true);
    expect(cartDetails.cart_items.length).toBeGreaterThanOrEqual(1);

    const item = cartDetails.cart_items.find((ci: any) => ci.product_id === targetProduct.id);
    expect(item).toBeDefined();
    expect(item.quantity).toBe(quantity);
  });
});

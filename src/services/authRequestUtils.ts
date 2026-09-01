export const isMarketplaceIntegrationRequest = (url: string | undefined) =>
  Boolean(
    url?.includes('/api/v1/ecommerce/allegro/') ||
      url?.includes('/api/v1/ecommerce/erli/') ||
      url?.includes('/api/v1/ecommerce/woocommerce/'),
  );

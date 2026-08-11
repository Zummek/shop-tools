export const ORDER_CHANNELS = [
  { source: 'allegro', label: 'Allegro', color: '#FF5A00' },
  { source: 'woocommerce', label: 'WooCommerce', color: '#96588A' },
  { source: 'erli', label: 'Erli', color: '#00A651' },
] as const;

export type OrderChannelSource = (typeof ORDER_CHANNELS)[number]['source'];

export const orderChannelLabel = (source: string): string => {
  const channel = ORDER_CHANNELS.find((item) => item.source === source);
  return channel?.label ?? source;
};

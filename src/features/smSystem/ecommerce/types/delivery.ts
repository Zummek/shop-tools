export type DeliveryFilterKind = 'group' | 'method';

export interface DeliveryFilterOption {
  id: string;
  name: string;
  kind: DeliveryFilterKind;
  groupId: number | null;
  deliveryId: string | null;
}

export interface DeliveryGroupMethod {
  source: string;
  deliveryId: string;
  deliveryName: string;
}

export interface DeliveryGroup {
  id: number;
  name: string;
  methods: DeliveryGroupMethod[];
}

export interface DeliveryGroupCatalog {
  groups: DeliveryGroup[];
  unmapped: DeliveryGroupMethod[];
}

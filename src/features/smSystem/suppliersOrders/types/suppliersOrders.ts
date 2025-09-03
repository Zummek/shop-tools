export interface SimpleSupplier {
  id: number;
  name: string;
}

export interface SimpleBranch {
  id: number;
  name: string;
}

interface SimpleUser {
  id: number;
  name: string;
}

export interface Order {
  id: number;
  supplier: SimpleSupplier;
  selectedBranches: SimpleBranch[];
  createdAt: string;
  updatedAt: string;
}

export type OrdersList = Order[];

export interface Supplier {
  id: number;
  name: string;
  branches: SimpleBranch[];
}

export type SuppliersList = Supplier[];

export interface Branch {
  id: number;
  name: string;
  createdAt: string;
  createdBy: SimpleUser;
  updatedAt: string;
  updatedBy: SimpleUser;
}

export interface OrdersPerBranch {
  id: number;
  branch: SimpleBranch;
  toOrderProposalAmount: number;
  toOrderAmount: number;
  previousOrderAmount: number;
  stock: number;
  stockUpdatedAt: string;
  soldQuantity: number;
}

interface NotSelectedBranches {
  branch: SimpleBranch;
  previousOrderAmount: number;
  stock: number;
  stockUpdatedAt: string;
  soldQuantity: number;
}

export interface ProductsToOrder {
  id: number;
  name: string;
  ordersPerBranch: OrdersPerBranch[];
  notSelectedBranches: NotSelectedBranches[];
}

export interface OrderDetails {
  id: number;
  supplier: Supplier;
  selectedBranches: SimpleBranch[];
  productsToOrder: ProductsToOrder[];
  createdAt: string;
  updatedAt: string;
  saleStartDate: string;
  saleEndDate: string;
  detail?: string;
}

export interface CreateOrderInput {
  supplierId: number;
  selectedBranchesIds: number[];
  saleStartDate: string;
  saleEndDate: string;
}

interface OrderConditions {
  id: number;
  lowerBound: number;
  upperBound: number;
  toOrderAmount: number;
}

interface OrderConditionsPerBranch {
  branch: SimpleBranch;
  orderConditions: OrderConditions[];
}

export interface ProductConditions {
  id: number;
  name: string;
  orderConditionsPerBranch: OrderConditionsPerBranch[];
}

export interface SupplierDetails {
  id: number;
  name: string;
  branches: SimpleBranch[];
  products: ProductConditions[];
  detail?: string;
}

export interface ProductBranch {
  branch: SimpleBranch[];
  stock: number;
  stockUpdatedAt: string | null;
  netPrice: number;
  netPriceUpdatedAt: string | null;
  grossPrice: number;
}

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

interface OrdersPerBranch {
  id: number;
  branch: SimpleBranch;
  toOrderProposalAmount: number;
  toOrderAmount: number;
  previousOrderAmount: number;
  stock: number;
  stockUpdatedAt: string;
}

interface NotSelectedBranches {
  branch: SimpleBranch;
  previousOrderAmount: number;
  stock: number;
  stockUpdatedAt: string;
}

interface ProductsToOrder {
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
  detail?: string;
}

export interface CreateOrderInput {
  supplierId: number;
  selectedBranchesIds: number[];
}
export interface ProductInOrder {
  id: number;
  name: string;
  totalToOrder: number;
}

export interface ProductsInOrderTableProps {
  products: ProductInOrder[];
  selectedProductId: number;
  setSelectedProductId: React.Dispatch<React.SetStateAction<number>>;
}

export interface ProductDetailsInOrderTableProps {
  orderDetails: OrderDetails;
  selectedProductId: number;
  setSelectedProductId: React.Dispatch<React.SetStateAction<number>>;
}

export interface ProductDetailsInBranchesTableProps {
  orderDetails: OrderDetails;
  selectedProductId: number;
}

export interface BasicModalProps {
  open: boolean;
  handleClose: () => void;
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
  stockIpdatedAt: string | null;
  netPrice: number;
  netPriceUpdatedAt: string | null;
}

export interface Product {
  id: number;
  name: string;
  internalId: string;
  barcodes: string[];
  vat: number | null;
  branches: ProductBranch[];
  createdAt: string;
  updatedAt: string;
}

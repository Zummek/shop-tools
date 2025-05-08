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
  selected_branches: SimpleBranch[];
  created_at: string;
  updated_at: string;
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
  created_at: string;
  created_by: SimpleUser;
  updated_at: string;
  updated_by: SimpleUser;
}

interface OrdersPerBranch {
  id: number;
  branch: SimpleBranch;
  to_order_proposal_amount: number;
  to_order_amount: number;
  previous_order_amount: number;
  stock: number;
  stock_updated_at: string;
}

interface NotSelectedBranches {
  branch: SimpleBranch;
  previous_order_amount: number;
  stock: number;
  stock_updated_at: string;
}

interface ProductsToOrder {
  id: number;
  name: string;
  orders_per_branch: OrdersPerBranch[];
  not_selected_branches: NotSelectedBranches[];
}

export interface OrderDetails {
  id: number;
  supplier: Supplier;
  selected_branches: SimpleBranch[];
  products_to_order: ProductsToOrder[];
  created_at: string;
  updated_at: string;
  detail?: string;
}

export interface CreateOrderInput {
  supplier_id: number;
  selected_branches_ids: number[];
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
  lower_bound: number;
  upper_bound: number;
  to_order_amount: number;
}

interface OrderConditionsPerBranch {
  branch: SimpleBranch;
  order_conditions: OrderConditions[];
}

export interface ProductConditions {
  id: number;
  name: string;
  order_conditions_per_branch: OrderConditionsPerBranch[];
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
  stock_updated_at: string | null;
  net_price: number;
  net_price_updated_at: string | null;
}

export interface Product {
  id: number;
  name: string;
  internal_id: string;
  barcodes: string[];
  vat: number | null;
  branches: ProductBranch[];
  created_at: string;
  updated_at: string;
}
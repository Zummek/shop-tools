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
  product: number;
  to_order_proposal_amount: number;
  to_order_amount: number;
}

interface ProductsToOrder {
  id: number;
  name: string;
  orders_per_branch: OrdersPerBranch[];
}

export interface OrderDetails {
  id: number;
  supplier: Supplier;
  selected_branches: SimpleBranch[];
  products_to_order: ProductsToOrder[]
  created_at: string;
  updated_at: string
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
  selectedProductId: number ;
  setSelectedProductId: React.Dispatch<React.SetStateAction<number>>;
}

export interface ProductDetailsInOrderTableProps {
  editableOrderDetails: OrderDetails;
  selectedProductId: number;
  setSelectedProductId: React.Dispatch<React.SetStateAction<number>>;
}

export interface BasicModalProps {
  open: boolean;
  handleClose: () => void;
}

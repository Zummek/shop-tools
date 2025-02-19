import { IdName } from "../types/index"

export const branches: IdName[] = [
  {
    id: 1,
    name: 'Wały',
  },
  {
    id: 2,
    name: 'Jagielony',
  },
  {
    id: 3,
    name: 'Myszków',
  }
]

const products = [
  {
    id: 1,
    name: 'Chleb biały',
    price: 100,
    stock: [ // ta informacja to bardziej po uzyskaniu szczegolow produktu niz prosto z listy
      {branch: branches[0], amount: 10},
      {branch: branches[1], amount: 20},
      {branch: branches[2], amount: 30}
    ],
    conditionsPerBranch: [
      {
        id: 1,
        branch: branches[0],
        conditions: [
          {
            id: 1,
            lowerBound: 0,
            upperBound: 10,
            toOrder: 20,
          },
          {
            id: 2,
            lowerBound: 10,
            upperBound: 20,
            toOrder: 10,
          },
        ]
      },
      {
        id: 2,
        branch: branches[1],
        conditions: [
          {
            id: 1,
            lowerBound: 0,
            upperBound: 20,
            toOrder: 30,
          }
        ]
      },
      {
        id: 2,
        branch: branches[2],
        conditions: [
        ]
      },
    ]
  },
  {
    id: 2,
    name: 'Mąka',
    price: 200,
    stock: [
      {branch: branches[0], amount: 20},
      {branch: branches[1], amount: 30},
      {branch: branches[2], amount: 40}
    ],
    conditionsPerBranch: [
      {
        id: 1,
        branch: branches[0],
        conditions: [

        ]
      },
    ]
  },
  {
    id: 3,
    name: 'Olej',
    price: 300,
    stock: [
      {branch: branches[0], amount: 0},
      {branch: branches[1], amount: 70},
      {branch: branches[2], amount: 15}
    ],
    conditionsPerBranch: [
      {
        id: 1,
        branch: branches[0],
        conditions: [
          
        ]
      },
    ]
  }
]

export const suppliers: IdName[] = [
{
  id: 1,
  name: 'Bezgluten',
},
{
  id: 2,
  name: 'Supplier B',
},
{
  id: 3,
  name: 'Supplier C',
}
]

export const orders = [
  {
    id: 1,
    supplier: suppliers[0],
    branches: [branches[0], branches[2]],
  },
]

export const orderDetailsMock = [
  {
    id: 1,
    supplier: suppliers[0],
    createdAt: '2025-02-14T17:17:37.814Z',  // data w standardowym formacie ISO
    createdBy: 'User 1',                    // realnie obiekt User
    updatedAt: '2025-02-14T17:17:37.814Z',
    updatedBy: 'User 2',
    branches: [branches[0], branches[2]],
    productsInOrder: [
      {
        id: 1,
        product: products[0],
        ordersPerBranch: [
          {
            branch: branches[0],
            toOrder: 10,
            originalToOrder: 10,
            stockAmountAtOrderTime: 10
          },
          {
            branch: branches[1],
            toOrder: 20,
            originalToOrder: 15,
            stockAmountAtOrderTime: 20
          },
          {
            branch: branches[2],
            toOrder: 30,
            originalToOrder: 25,
            stockAmountAtOrderTime: 50
          }
        ]
      },
      {
        id: 3,
        product: products[1],
        ordersPerBranch: [
          {
            branch: branches[0],
            toOrder: 20,
            originalToOrder: 20,
            stockAmountAtOrderTime: 20
          },
          {
            branch: branches[1],
            toOrder: 30,
            originalToOrder: 25,
            stockAmountAtOrderTime: 30
          },
          {
            branch: branches[2],
            toOrder: 30,
            originalToOrder: 25,
            stockAmountAtOrderTime: 5
          }
        ]
      },
      {
        id: 4,
        product: products[2],
        ordersPerBranch: [
          {
            branch: branches[0],
            toOrder: 0,
            originalToOrder: 50,
            stockAmountAtOrderTime: 0
          },
          {
            branch: branches[1],
            toOrder: 30,
            originalToOrder: 0,
            stockAmountAtOrderTime: 70
          },
          {
            branch: branches[2],
            toOrder: 70,
            originalToOrder: 0,
            stockAmountAtOrderTime: 80
          }
        ]
      },
      {
        id: 5,
        product: products[2],
        ordersPerBranch: [
          {
            branch: branches[0],
            toOrder: 0,
            originalToOrder: 50,
            stockAmountAtOrderTime: 0
          },
          {
            branch: branches[1],
            toOrder: 30,
            originalToOrder: 0,
            stockAmountAtOrderTime: 70
          },
          {
            branch: branches[2],
            toOrder: 70,
            originalToOrder: 0,
            stockAmountAtOrderTime: 80
          }
        ]
      },
      {
        id: 10,
        product: products[2],
        ordersPerBranch: [
          {
            branch: branches[0],
            toOrder: 0,
            originalToOrder: 50,
            stockAmountAtOrderTime: 0
          },
          {
            branch: branches[1],
            toOrder: 30,
            originalToOrder: 0,
            stockAmountAtOrderTime: 70
          },
          {
            branch: branches[2],
            toOrder: 70,
            originalToOrder: 0,
            stockAmountAtOrderTime: 80
          }
        ]
      },
      {
        id: 11,
        product: products[2],
        ordersPerBranch: [
          {
            branch: branches[0],
            toOrder: 0,
            originalToOrder: 50,
            stockAmountAtOrderTime: 0
          },
          {
            branch: branches[1],
            toOrder: 30,
            originalToOrder: 0,
            stockAmountAtOrderTime: 70
          },
          {
            branch: branches[2],
            toOrder: 70,
            originalToOrder: 0,
            stockAmountAtOrderTime: 80
          }
        ]
      },
      {
        id: 12,
        product: products[2],
        ordersPerBranch: [
          {
            branch: branches[0],
            toOrder: 0,
            originalToOrder: 50,
            stockAmountAtOrderTime: 0
          },
          {
            branch: branches[1],
            toOrder: 30,
            originalToOrder: 0,
            stockAmountAtOrderTime: 70
          },
          {
            branch: branches[2],
            toOrder: 70,
            originalToOrder: 0,
            stockAmountAtOrderTime: 80
          }
        ]
      }
    ]
  }
]
export const updateProductsDocumentStatusGraphqlMutation = (
  ids: string[],
  status: string
) => ({
  query: `mutation updateProductsDocumentStatus($ids: [ID!]!, $status: String!) {
    productsDocument {
      updateStatuses(
        input: {
          ids: $ids,
          data: {
            status: $status
          }
        }
      )
    }
  }`,
  variables: {
    ids,
    status,
  },
});

export const getProductsDocumentsGraphqlQuery = (
  offset = 0,
  limit?: number
) => ({
  query: `{
      productsDocuments(offset: ${offset} ${limit ? `limit:${limit}` : ''}) {
        node {
          id
          name
          status
          comment
          sourceBranch {
            id
            name
          }
          productsDocumentProducts { 
            id
            amount
          }
          createdAt
          createdBy {
            id
            firstName
            lastName
          }
          updatedAt
          updatedBy {
            id
            firstName
            lastName
          }
        }
        pageInfo {
          endCursor
          totalCount
          hasNextPage
        }
      }
    }`,
});

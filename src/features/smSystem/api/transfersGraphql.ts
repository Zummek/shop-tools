export const getTransfersGraphqlQuery = (offset = 0, limit?: number) => ({
  query: `{
      transfers(offset: ${offset} ${limit ? `limit:${limit}` : ''}) {
        node {
          id
          status
          sourceBranch {
            id
            name
          }
          destinationBranch {
            id
            name
          }
          sender {
            id
            firstName
            lastName
          }
          recipient {
            id
            firstName
            lastName
          }
          comment
          transferProducts { 
            id
            amount
            receivedAmount
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

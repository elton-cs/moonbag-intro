import { gql } from "@apollo/client";

export const PURCHASE_ORB = gql`
  mutation PurchaseOrb($account: String!, $orb_type: String!) {
    createBurnerTransaction(
      account: $account
      calls: [
        {
          contractAddress: "0x75d7552f40a3a24c2a701e3c03ef52a2bbcc9eceab8bdc5cca5c430bf4ad8ad"
          entrypoint: "purchase_orb"
          calldata: [$orb_type]
        }
      ]
    ) {
      transactionHash
    }
  }
`;
